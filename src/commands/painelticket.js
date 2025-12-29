// Comando: /painelticket - Cria painel fixo de tickets (para todos)

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../utils/embeds');
const permissions = require('../config/permissions');
const { EMOJIS, COLORS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painelticket')
    .setDescription('[DONO] Cria painel fixo de tickets de suporte')
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

    // Criar embed do painel
    const embed = new EmbedBuilder()
      .setTitle(`${EMOJIS.TICKET} Sistema de Tickets - Suporte`)
      .setDescription(
        '**Precisa de ajuda ou suporte?**\n\n' +
        `${EMOJIS.INFO} Clique no botão abaixo para abrir um ticket.\n\n` +
        `${EMOJIS.TICKET} **O que são tickets?**\n` +
        'Tickets são canais privados onde você pode:\n' +
        '• Tirar dúvidas sobre o sistema\n' +
        '• Reportar problemas\n' +
        '• Solicitar ajuda da equipe\n' +
        '• Fazer reclamações ou sugestões\n\n' +
        `${EMOJIS.WARNING} **Importante:**\n` +
        '• Apenas você e a equipe verão o ticket\n' +
        '• Seja claro e objetivo\n' +
        '• Aguarde o atendimento da equipe\n\n' +
        `${EMOJIS.SUCCESS} Nossa equipe responderá o mais rápido possível!`
      )
      .setColor(COLORS.PRIMARY)
      .setTimestamp()
      .setFooter({ text: 'INFINITY BOT • Sistema de Suporte' });

    // Botão para criar ticket
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('criar_ticket_painel')
          .setLabel('Abrir Ticket de Suporte')
          .setStyle(ButtonStyle.Success)
          .setEmoji(EMOJIS.TICKET)
      );

    try {
      await canal.send({
        embeds: [embed],
        components: [row]
      });

      await interaction.editReply({
        content: `✅ Painel de tickets criado em ${canal}!`
      });
    } catch (error) {
      console.error('Erro ao criar painel de tickets:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Não foi possível criar o painel. Verifique as permissões do bot.')]
      });
    }
  }
};
