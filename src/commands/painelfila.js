// Comando: /painelfila - Cria painel fixo de criação de filas

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../utils/embeds');
const permissions = require('../config/permissions');
const { EMOJIS, COLORS } = require('../config/constants');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painelfila')
    .setDescription('[DONO] Cria painel fixo para criação de filas')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal onde o painel será criado')
        .setRequired(true)),

  async execute(interaction) {
    // Defer IMEDIATAMENTE antes de qualquer operação
    await interaction.deferReply({ flags: 64 });

    // Verificar se é dono (sem await inline)
    const ehDono = await permissions.isOwner(interaction.user.id, interaction.member);
    if (!ehDono) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode criar este painel.')]
      });
    }

    const canal = interaction.options.getChannel('canal');

    // Buscar valores configurados
    const config = await db.readData('config');
    const valores = config.defaultQueueValues || [];

    if (valores.length === 0) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Sem Valores', 'Configure valores de fila primeiro com /painel → Configurar Valores de Fila.')]
      });
    }

    // Criar embed do painel
    const embed = new EmbedBuilder()
      .setTitle(`${EMOJIS.FIRE} Sistema de Filas - Apostado Free Fire`)
      .setDescription(
        '**Crie sua fila de apostado rapidamente!**\n\n' +
        `${EMOJIS.TROPHY} **Como funciona?**\n` +
        '• Escolha o valor da aposta abaixo\n' +
        '• Selecione o modo de jogo\n' +
        '• Monte seu time\n' +
        '• Aguarde adversários\n\n' +
        `${EMOJIS.MONEY} **Valores disponíveis:**\n` +
        valores.map(v => `• **R$ ${v}** - Aposta individual`).join('\n') + '\n\n' +
        `${EMOJIS.WARNING} **Importante:**\n` +
        '• Respeite as regras do servidor\n' +
        '• Não crie filas duplicadas\n' +
        '• Aguarde a confirmação dos times\n\n' +
        `${EMOJIS.SHIELD} **Segurança:**\n` +
        '• Pagamento via PIX após confirmação\n' +
        '• Mediadores verificam todas as partidas\n' +
        '• Sistema anti-fraude ativo\n\n' +
        'Clique no botão do valor desejado para começar:'
      )
      .setColor(COLORS.PRIMARY)
      .setTimestamp()
      .setFooter({ text: 'INFINITY BOT • Sistema de Filas' });

    // Criar botões (máximo 5 por linha, 5 linhas = 25 botões)
    const rows = [];
    for (let i = 0; i < valores.length; i += 5) {
      const row = new ActionRowBuilder();
      const chunk = valores.slice(i, i + 5);
      
      chunk.forEach(valor => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`criar_fila_${valor}`)
            .setLabel(`R$ ${valor}`)
            .setStyle(ButtonStyle.Success)
            .setEmoji(EMOJIS.MONEY)
        );
      });
      
      rows.push(row);
    }

    try {
      await canal.send({
        embeds: [embed],
        components: rows
      });

      await interaction.editReply({
        content: `✅ Painel de filas criado em ${canal} com ${valores.length} valor(es)!`
      });
    } catch (error) {
      console.error('Erro ao criar painel de filas:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Não foi possível criar o painel. Verifique as permissões do bot.')]
      });
    }
  }
};
