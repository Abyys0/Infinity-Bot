// Comando: /ticket - Abrir ticket de suporte ou vagas

const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../utils/embeds');
const { TICKET_TYPES, EMOJIS } = require('../config/constants');
const permissions = require('../config/permissions');
const { createTicket } = require('../services/ticketService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Abrir um ticket')
    .addStringOption(option =>
      option.setName('tipo')
        .setDescription('Tipo do ticket')
        .setRequired(true)
        .addChoices(
          { name: '🆘 Suporte', value: TICKET_TYPES.SUPPORT },
          { name: '💼 Vagas', value: TICKET_TYPES.VACANCIES }
        ))
    .addStringOption(option =>
      option.setName('assunto')
        .setDescription('Assunto do ticket (opcional)')
        .setRequired(false)),

  async execute(interaction) {
    // Verificar blacklist
    if (await permissions.isBlacklisted(interaction.user.id)) {
      const entry = await permissions.getBlacklistEntry(interaction.user.id);
      return interaction.reply({
        embeds: [createErrorEmbed(
          'Blacklist',
          `${EMOJIS.BLACKLIST} Você está na blacklist e não pode abrir tickets.\n\n**Motivo:** ${entry.reason}\n**Adicionado por:** <@${entry.addedBy}>\n**Data:** ${new Date(entry.addedAt).toLocaleString('pt-BR')}`
        )],
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const tipo = interaction.options.getString('tipo');
    const assunto = interaction.options.getString('assunto') || 'Não informado';

    try {
      const ticket = await createTicket(interaction, tipo, assunto);

      if (!ticket.success) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Erro', ticket.message)]
        });
      }

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Ticket Criado',
          `${EMOJIS.TICKET} **Ticket criado com sucesso!**\n\n**Tipo:** ${tipo === TICKET_TYPES.SUPPORT ? 'Suporte' : 'Vagas'}\n**Canal:** <#${ticket.channel.id}>\n\nAguarde atendimento!`
        )]
      });

    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao criar o ticket. Tente novamente.')]
      });
    }
  }
};
