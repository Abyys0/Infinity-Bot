// Handler de botões de tickets

const { createTicket, closeTicket } = require('../../services/ticketService');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { TICKET_TYPES, EMOJIS } = require('../../config/constants');
const permissions = require('../../config/permissions');

async function handle(interaction) {
  const customId = interaction.customId;

  // ticket_open_suporte ou ticket_open_vagas
  if (customId.startsWith('ticket_open_')) {
    const tipo = customId === 'ticket_open_suporte' ? TICKET_TYPES.SUPPORT : TICKET_TYPES.VACANCIES;

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
      const ticket = await createTicket(interaction, tipo, 'Aberto pelo painel');

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

  // ticket_close
  if (customId === 'ticket_close') {
    // Verificar se pode fechar (usuário ou atendente)
    const canClose = await permissions.canAttendTickets(interaction.member) || 
                     await permissions.isOwner(interaction.user.id, interaction.member);

    // Verificar se é o dono do ticket
    const db = require('../../database');
    const ticket = await db.findItem('tickets', t => t.channelId === interaction.channel.id);
    
    const isOwner = ticket && ticket.userId === interaction.user.id;

    if (!canClose && !isOwner) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o criador do ticket ou atendentes podem fechá-lo.')],
        flags: 64
      });
    }

    await interaction.deferReply();

    const result = await closeTicket(interaction.channel, interaction.user.id);

    if (!result.success) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', result.message)]
      });
    }

    // Mensagem já enviada pelo service
  }
}

/**
 * Criar ticket a partir do painel fixo (sempre suporte)
 */
async function criarTicketPainel(interaction) {
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
    const ticket = await createTicket(interaction, TICKET_TYPES.SUPPORT, 'Aberto pelo painel fixo');

    if (!ticket.success) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', ticket.message)]
      });
    }

    await interaction.editReply({
      embeds: [createSuccessEmbed(
        'Ticket Criado',
        `${EMOJIS.TICKET} **Ticket de suporte criado com sucesso!**\n\n**Canal:** <#${ticket.channel.id}>\n\n${EMOJIS.INFO} Aguarde o atendimento da equipe!`
      )]
    });

  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao criar o ticket. Tente novamente.')]
    });
  }
}

module.exports = { handle, criarTicketPainel };
