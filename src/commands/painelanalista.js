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
      .setTitle(`${EMOJIS.ANALYST} Painel de Solicitação de Analista`)
      .setDescription(
        '**Precisa de um analista para verificar uma partida?**\n\n' +
        `${EMOJIS.INFO} Clique no botão abaixo para chamar um analista disponível.\n\n` +
        `${EMOJIS.WARNING} **Quando usar:**\n` +
        '• Suspeita de trapaça\n' +
        '• Verificação de resultado\n' +
        '• Análise de SS (screenshot)\n' +
        '• Disputas de partidas\n\n' +
        `${EMOJIS.SHIELD} Um analista será notificado e entrará em contato.`
      )
      .setColor(COLORS.PRIMARY)
      .setTimestamp()
      .setFooter({ text: 'INFINITY BOT • Sistema de Analistas' });

    // Botão para chamar analista
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('chamar_analista_painel')
          .setLabel('Chamar Analista')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(EMOJIS.ANALYST)
      );

    try {
      await canal.send({
        embeds: [embed],
        components: [row]
      });

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
