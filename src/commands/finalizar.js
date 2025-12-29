// Comando: /finalizar - Finaliza uma fila e registra o vencedor

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../utils/embeds');
const { EMOJIS, EMBED_COLORS, WIN_TYPES } = require('../config/constants');
const permissions = require('../config/permissions');
const db = require('../database');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('finalizar')
    .setDescription('[MEDIADOR+] Finaliza uma fila e registra o vencedor')
    .addStringOption(option =>
      option.setName('fila_id')
        .setDescription('ID da fila a finalizar')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('time_vencedor')
        .setDescription('Qual time venceu?')
        .setRequired(true)
        .addChoices(
          { name: '🔥 Time 1 (Gelo Infinito)', value: 'time1' },
          { name: '❄️ Time 2 (Gelo Normal)', value: 'time2' }
        ))
    .addStringOption(option =>
      option.setName('tipo_vitoria')
        .setDescription('Tipo de vitória')
        .setRequired(true)
        .addChoices(
          { name: '🏆 Vitória Normal', value: WIN_TYPES.NORMAL },
          { name: '⚠️ W.O. (Walk Over)', value: WIN_TYPES.WO }
        ))
    .addAttachmentOption(option =>
      option.setName('print')
        .setDescription('Print da vitória (resultado)')
        .setRequired(false)),

  async execute(interaction) {
    // Apenas mediadores e superiores podem finalizar filas
    if (!await permissions.isMediadorOrAbove(interaction.member)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas mediadores e superiores podem finalizar filas.')],
        flags: 64
      });
    }

    const filaId = interaction.options.getString('fila_id');
    const timeVencedor = interaction.options.getString('time_vencedor');
    const tipoVitoria = interaction.options.getString('tipo_vitoria');
    const print = interaction.options.getAttachment('print');

    // Buscar a fila
    const filas = await db.readData('filas');
    const fila = filas.find(f => f.id === filaId);

    if (!fila) {
      return interaction.reply({
        embeds: [createErrorEmbed('Fila Não Encontrada', `Não foi encontrada nenhuma fila com ID \`${filaId}\`.`)],
        flags: 64
      });
    }

    if (fila.status === 'finalizada') {
      return interaction.reply({
        embeds: [createErrorEmbed('Fila Finalizada', 'Esta fila já foi finalizada!')],
        flags: 64
      });
    }

    if (fila.status !== 'confirmada') {
      return interaction.reply({
        embeds: [createErrorEmbed('Fila Não Confirmada', 'Esta fila ainda não foi confirmada! Aguarde a confirmação antes de finalizar.')],
        flags: 64
      });
    }

    // Determinar vencedores e perdedores
    const vencedores = timeVencedor === 'time1' ? fila.time1 : fila.time2;
    const perdedores = timeVencedor === 'time1' ? fila.time2 : fila.time1;
    const nomeTimeVencedor = timeVencedor === 'time1' ? 'Time 1 (Gelo Infinito)' : 'Time 2 (Gelo Normal)';

    // Atualizar ranking de todos os jogadores
    const ranking = await db.readData('ranking');
    
    // Processar vencedores
    for (const userId of vencedores) {
      const playerRank = ranking.find(r => r.userId === userId);
      if (playerRank) {
        await db.updateItem('ranking',
          r => r.userId === userId,
          r => ({
            ...r,
            wins: r.wins + 1,
            totalGames: r.totalGames + 1
          })
        );
      } else {
        await db.addItem('ranking', {
          userId,
          wins: 1,
          losses: 0,
          totalGames: 1
        });
      }
    }

    // Processar perdedores
    for (const userId of perdedores) {
      const playerRank = ranking.find(r => r.userId === userId);
      if (playerRank) {
        await db.updateItem('ranking',
          r => r.userId === userId,
          r => ({
            ...r,
            losses: r.losses + 1,
            totalGames: r.totalGames + 1
          })
        );
      } else {
        await db.addItem('ranking', {
          userId,
          wins: 0,
          losses: 1,
          totalGames: 1
        });
      }
    }

    // Atualizar status da fila
    await db.updateItem('filas',
      f => f.id === filaId,
      f => ({
        ...f,
        status: 'finalizada',
        vencedor: nomeTimeVencedor,
        tipoVitoria,
        finalizadoPor: interaction.user.id,
        finalizadoEm: Date.now(),
        print: print ? print.url : null
      })
    );

    // Log
    await logger.logQueueFinished(
      interaction.client,
      filaId,
      fila.tipo,
      nomeTimeVencedor,
      tipoVitoria,
      interaction.user.tag
    );

    // Criar embed de resultado
    const resultEmbed = new EmbedBuilder()
      .setTitle(`${EMOJIS.SUCCESS} Fila Finalizada`)
      .setDescription(`**Fila ID:** \`${filaId}\`\n**Tipo:** ${fila.tipo} ${fila.plataforma}`)
      .addFields(
        { name: '🏆 Time Vencedor', value: nomeTimeVencedor, inline: true },
        { name: '📊 Tipo de Vitória', value: tipoVitoria === WIN_TYPES.NORMAL ? 'Vitória Normal' : 'W.O.', inline: true },
        { name: '👨‍⚖️ Finalizado por', value: `${interaction.user}`, inline: true }
      )
      .setColor(EMBED_COLORS.SUCCESS)
      .setTimestamp();

    if (print) {
      resultEmbed.setImage(print.url);
    }

    // Notificar todos os jogadores
    const todosJogadores = [...fila.time1, ...fila.time2];
    for (const userId of todosJogadores) {
      try {
        const user = await interaction.client.users.fetch(userId);
        const isVencedor = vencedores.includes(userId);
        
        const notifEmbed = new EmbedBuilder()
          .setTitle(isVencedor ? `${EMOJIS.SUCCESS} Você Venceu!` : `${EMOJIS.ERROR} Você Perdeu!`)
          .setDescription(
            `**Fila ID:** \`${filaId}\`\n` +
            `**Tipo:** ${fila.tipo} ${fila.plataforma}\n\n` +
            `**Time Vencedor:** ${nomeTimeVencedor}\n` +
            `**Tipo:** ${tipoVitoria === WIN_TYPES.NORMAL ? 'Vitória Normal' : 'W.O.'}`
          )
          .setColor(isVencedor ? EMBED_COLORS.SUCCESS : EMBED_COLORS.ERROR)
          .setTimestamp();

        if (print) {
          notifEmbed.setImage(print.url);
        }

        await user.send({ embeds: [notifEmbed] });
      } catch (error) {
        console.error(`Erro ao notificar jogador ${userId}:`, error);
      }
    }

    await interaction.reply({
      embeds: [resultEmbed]
    });

    // Enviar informações de pagamento se configurado
    const config = await db.readData('config');
    if (config.valores?.fila && config.taxa) {
      const valorFila = config.valores.fila;
      const taxa = config.taxa;
      
      // Calcular valores
      const numJogadores = vencedores.length;
      const valorBruto = valorFila * numJogadores;
      const valorTaxa = valorBruto * (taxa / 100);
      const valorLiquido = valorBruto - valorTaxa;
      const valorPorJogador = valorLiquido / numJogadores;

      const pagamentoEmbed = new EmbedBuilder()
        .setTitle(`${EMOJIS.PIX} Informações de Pagamento`)
        .setDescription(
          `**Valor por jogador:** R$ ${valorFila.toFixed(2)}\n` +
          `**Total jogadores vencedores:** ${numJogadores}\n` +
          `**Valor bruto:** R$ ${valorBruto.toFixed(2)}\n` +
          `**Taxa (${taxa}%):** R$ ${valorTaxa.toFixed(2)}\n` +
          `**Valor líquido:** R$ ${valorLiquido.toFixed(2)}\n` +
          `**Valor por vencedor:** R$ ${valorPorJogador.toFixed(2)}`
        )
        .setColor(EMBED_COLORS.INFO)
        .setFooter({ text: 'Realize os pagamentos aos vencedores' });

      await interaction.followUp({
        embeds: [pagamentoEmbed],
        flags: 64
      });
    }
  }
};
