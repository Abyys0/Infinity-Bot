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

    // Verificar se pode fechar - CRIADOR NÃO PODE FECHAR!
    const isAttendant = ticket.atendidoPor === interaction.user.id;
    const isOwner = await permissions.isOwner(interaction.user.id, interaction.member);
    const canAttend = await permissions.canAttendTickets(interaction.member);

    if (!isAttendant && !isOwner && !canAttend) {
      return interaction.reply({
        embeds: [createErrorEmbed(
          'Sem Permissão',
          'Apenas o atendente do ticket, staff ou donos podem fechá-lo.'
        )],
        flags: 64
      });
    }

    // Mostrar modal para pedir motivo
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
    
    const modal = new ModalBuilder()
      .setCustomId(`modal_close_ticket_${ticket.id}`)
      .setTitle('Fechar Ticket');

    const motivoInput = new TextInputBuilder()
      .setCustomId('motivo')
      .setLabel('Motivo do Fechamento')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Descreva o motivo do fechamento...')
      .setRequired(true)
      .setMinLength(10)
      .setMaxLength(500);

    modal.addComponents(
      new ActionRowBuilder().addComponents(motivoInput)
    );

    return await interaction.showModal(modal);
  }

  // ticket_add_member
  if (customId === 'ticket_add_member') {
    const db = require('../../database');
    const ticket = await db.findItem('tickets', t => t.channelId === interaction.channel.id);

    if (!ticket) {
      return interaction.reply({
        embeds: [createErrorEmbed('Ticket Não Encontrado', 'Este canal não é um ticket válido.')],
        flags: 64
      });
    }

    // Verificar permissão
    const canAttend = await permissions.canAttendTickets(interaction.member);
    const isOwner = await permissions.isOwner(interaction.user.id, interaction.member);
    const isAttendant = ticket.atendidoPor === interaction.user.id;

    if (!canAttend && !isOwner && !isAttendant) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas atendentes podem adicionar membros.')],
        flags: 64
      });
    }

    // Mostrar modal
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
    
    const modal = new ModalBuilder()
      .setCustomId(`modal_add_member_ticket_${ticket.id}`)
      .setTitle('Adicionar Membro ao Ticket');

    const userIdInput = new TextInputBuilder()
      .setCustomId('user_id')
      .setLabel('ID do Usuário')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(userIdInput)
    );

    return await interaction.showModal(modal);
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
