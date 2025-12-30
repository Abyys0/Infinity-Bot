// Handler de menus de seleção de tickets

const { createTicket } = require('../../services/ticketService');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { TICKET_TYPES, EMOJIS } = require('../../config/constants');
const permissions = require('../../config/permissions');

async function handle(interaction) {
  const customId = interaction.customId;

  // ticket_select_categoria
  if (customId === 'ticket_select_categoria') {
    const categoria = interaction.values[0]; // 'suporte'

    // Verificar blacklist
    if (await permissions.isBlacklisted(interaction.user.id)) {
      const entry = await permissions.getBlacklistEntry(interaction.user.id);
      return interaction.reply({
        embeds: [createErrorEmbed(
          'Blacklist',
          `${EMOJIS.BLACKLIST} Você está na blacklist e não pode abrir tickets.\n\n**Motivo:** ${entry.reason}\n**Adicionado por:** <@${entry.addedBy}>\n**Data:** ${new Date(entry.addedAt).toLocaleString('pt-BR')}`
        )],
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      const ticket = await createTicket(interaction, TICKET_TYPES.SUPPORT, 'Suporte - Aberto pelo painel');

      if (!ticket.success) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Erro', ticket.message)]
        });
      }

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Ticket Criado',
          `${EMOJIS.TICKET} **Ticket de suporte criado com sucesso!**\n\n**Canal:** <#${ticket.channel.id}>\n\nAguarde atendimento da equipe!`
        )]
      });

    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao criar o ticket. Tente novamente.')]
      });
    }
  }
}

module.exports = { handle };
