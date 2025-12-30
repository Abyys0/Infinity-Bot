// Comando: /painelanalista - Cria painel fixo para chamar analista (só mediadores)

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../utils/embeds');
const permissions = require('../config/permissions');
const { EMOJIS, COLORS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painelanalista')
    .setDescription('[MEDIADOR] Cria painel fixo para chamar analista')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal onde o painel será criado')
        .setRequired(true)),

  async execute(interaction) {
    // Defer IMEDIATAMENTE antes de qualquer operação
    await interaction.deferReply({ flags: 64 });

    // Verificar se é mediador ou superior (sem await inline)
    const temPermissao = await permissions.isMediadorOrAbove(interaction.member);
    if (!temPermissao) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas mediadores podem criar este painel.')]
      });
    }

    const canal = interaction.options.getChannel('canal');

    // Criar embed do painel
    const embed = new EmbedBuilder()
      .setTitle(`${EMOJIS.ANALYST} Painel de Analistas`)
      .setDescription(
        '**Sistema de Controle de Analistas**\n\n' +
        `${EMOJIS.ONLINE} **Para Analistas:**\n` +
        '• Entre em serviço para receber chamados\n' +
        '• Saia de serviço quando terminar\n' +
        '• Configure seu PIX para receber pagamentos\n\n' +
        `${EMOJIS.WARNING} **Para Mediadores (Chamar Analista):**\n` +
        '• Suspeita de trapaça\n' +
        '• Verificação de resultado\n' +
        '• Análise de SS (screenshot)\n' +
        '• Disputas de partidas\n\n' +
        `📊 **Analistas em Serviço:** 0`
      )
      .setColor(COLORS.PRIMARY)
      .setTimestamp()
      .setFooter({ text: 'INFINITY BOT • Sistema de Analistas' });

    // Botões para analistas (Entrar/Sair de Serviço)
    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('analista_entrar_servico')
          .setLabel('Entrar em Serviço')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🟢'),
        new ButtonBuilder()
          .setCustomId('analista_sair_servico')
          .setLabel('Sair de Serviço')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('⚪'),
        new ButtonBuilder()
          .setCustomId('analista_ver_lista')
          .setLabel('Ver Analistas')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📊')
      );

    // Botões para chamar analista (Mobile/Emulador)
    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('chamar_analista_mobile')
          .setLabel('Chamar Analista Mobile')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📱'),
        new ButtonBuilder()
          .setCustomId('chamar_analista_emulador')
          .setLabel('Chamar Analista Emulador')
          .setStyle(ButtonStyle.Success)
          .setEmoji('💻')
      );

    const row3 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('analista_configurar_pix')
          .setLabel('Configurar Meu PIX')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('💰')
      );

    try {
      const message = await canal.send({
        embeds: [embed],
        components: [row1, row2, row3]
      });

      // Salvar messageId para atualizar depois
      const db = require('../database');
      const config = await db.readData('config');
      config.painelAnalistaMessageId = message.id;
      config.painelAnalistaChannelId = canal.id;
      await db.writeData('config', config);

      await interaction.editReply({
        content: `✅ Painel de analista criado em ${canal}!`
      });
    } catch (error) {
      console.error('Erro ao criar painel de analista:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Não foi possível criar o painel. Verifique as permissões do bot.')]
      });
    }
  }
};
