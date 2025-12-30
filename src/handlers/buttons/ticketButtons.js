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

  // ticket_atender
  if (customId === 'ticket_atender') {
    // Verificar se pode atender tickets
    const canAttend = await permissions.canAttendTickets(interaction.member) || 
                      await permissions.isOwner(interaction.user.id, interaction.member);

    if (!canAttend) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas atendentes podem atender tickets.')],
        flags: 64
      });
    }

    const db = require('../../database');
    const ticket = await db.findItem('tickets', t => t.channelId === interaction.channel.id);

    if (!ticket) {
      return interaction.reply({
        embeds: [createErrorEmbed('Ticket Não Encontrado', 'Este canal não é um ticket válido.')],
        flags: 64
      });
    }

    if (ticket.atendidoPor) {
      const atendente = await interaction.guild.members.fetch(ticket.atendidoPor).catch(() => null);
      return interaction.reply({
        embeds: [createErrorEmbed(
          'Ticket Já Atendido',
          `Este ticket já está sendo atendido por ${atendente || 'um atendente'}.`
        )],
        flags: 64
      });
    }

    // Atualizar ticket
    await db.updateItem('tickets', t => t.channelId === interaction.channel.id, t => ({
      ...t,
      atendidoPor: interaction.user.id,
      atendidoEm: Date.now()
    }));

    // Remover botão de atender
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const message = await interaction.channel.messages.fetch({ limit: 10 });
    const ticketMessage = message.find(m => m.author.bot && m.components.length > 0);

    if (ticketMessage) {
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_close')
            .setLabel('Fechar Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji(EMOJIS.ERROR)
        );

      const embed = ticketMessage.embeds[0];
      const newEmbed = new EmbedBuilder(embed.data)
        .addFields({ name: '✋ Atendido por', value: `${interaction.user}`, inline: true });

      await ticketMessage.edit({ embeds: [newEmbed], components: [row] });
    }

    await interaction.reply({
      embeds: [createSuccessEmbed(
        'Ticket Atendido',
        `${EMOJIS.SUCCESS} Você está atendendo este ticket!\n\nApenas você pode fechá-lo.`
      )]
    });
  }

  // ticket_close
  if (customId === 'ticket_close') {
    const db = require('../../database');
    const ticket = await db.findItem('tickets', t => t.channelId === interaction.channel.id);

    if (!ticket) {
      return interaction.reply({
        embeds: [createErrorEmbed('Ticket Não Encontrado', 'Este canal não é um ticket válido.')],
        flags: 64
      });
    }

    // Verificar se pode fechar
    const isCreator = ticket.userId === interaction.user.id;
    const isAttendant = ticket.atendidoPor === interaction.user.id;
    const isOwner = await permissions.isOwner(interaction.user.id, interaction.member);

    if (!isCreator && !isAttendant && !isOwner) {
      return interaction.reply({
        embeds: [createErrorEmbed(
          'Sem Permissão',
          ticket.atendidoPor
            ? 'Apenas o criador do ticket, o atendente ou donos podem fechá-lo.'
            : 'Apenas o criador do ticket ou donos podem fechá-lo.'
        )],
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
