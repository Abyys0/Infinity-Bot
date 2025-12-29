// Service de Tickets

const db = require('../database');
const logger = require('../utils/logger');
const { TICKET_STATUS, EMOJIS, COLORS } = require('../config/constants');
const { sanitizeChannelName } = require('../utils/validators');
const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Cria um novo ticket
 */
async function createTicket(interaction, tipo, assunto) {
  const config = await db.readData('config');
  const guild = interaction.guild;
  const user = interaction.user;

  // Verificar se já tem ticket aberto
  const tickets = await db.readData('tickets');
  const existingTicket = tickets.find(t => 
    t.userId === user.id && 
    t.status === TICKET_STATUS.OPEN
  );

  if (existingTicket) {
    // Verificar se o canal ainda existe
    const channel = await guild.channels.fetch(existingTicket.channelId).catch(() => null);
    
    if (!channel) {
      // Canal não existe mais, remover ticket da base de dados
      const updatedTickets = tickets.filter(t => t.id !== existingTicket.id);
      await db.writeData('tickets', updatedTickets);
      // Continuar criando novo ticket
    } else {
      return {
        success: false,
        message: `Você já tem um ticket aberto: <#${existingTicket.channelId}>`
      };
    }
  }

  try {
    // Criar nome do canal
    const channelName = sanitizeChannelName(`ticket-${tipo}-${user.username}`);

    // Permissões do canal
    const permissionOverwrites = [
      {
        id: guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles]
      }
    ];

    // Adicionar atendentes
    if (config.roles?.ticketAttendants) {
      for (const roleId of config.roles.ticketAttendants) {
        permissionOverwrites.push({
          id: roleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
        });
      }
    }

    // Adicionar cargos de dono (OWNER_ID pode ter múltiplos role IDs separados por vírgula)
    if (process.env.OWNER_ID) {
      const ownerRoleIds = process.env.OWNER_ID.split(',').map(id => id.trim());
      for (const roleId of ownerRoleIds) {
        if (roleId) {
          permissionOverwrites.push({
            id: roleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels]
          });
        }
      }
    }

    // Opções do canal
    const channelOptions = {
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites
    };

    // Se tiver categoria configurada
    if (config.channels?.tickets) {
      channelOptions.parent = config.channels.tickets;
    }

    // Criar canal
    const channel = await guild.channels.create(channelOptions);

    // Criar embed
    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.TICKET} Ticket ${tipo === 'suporte' ? 'de Suporte' : 'de Vagas'}`)
      .setDescription(`**Usuário:** ${user}\n**Assunto:** ${assunto}\n\n**Aguarde**, um membro da equipe irá atendê-lo em breve!`)
      .addFields(
        { name: 'Aberto em', value: new Date().toLocaleString('pt-BR'), inline: true },
        { name: 'Tipo', value: tipo === 'suporte' ? '🆘 Suporte' : '💼 Vagas', inline: true }
      )
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: 'INFINITY BOT • Sistema de Tickets' });

    // Botão de fechar
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Fechar Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(EMOJIS.ERROR)
      );

    await channel.send({
      content: `${user} - Ticket criado!`,
      embeds: [embed],
      components: [row]
    });

    // Mencionar atendentes se configurado
    if (config.roles?.ticketAttendants && config.roles.ticketAttendants.length > 0) {
      const mentions = config.roles.ticketAttendants.map(id => `<@&${id}>`).join(' ');
      await channel.send(`${mentions} - Novo ticket aberto!`);
    }

    // Salvar no banco
    const ticket = {
      id: channel.id,
      channelId: channel.id,
      userId: user.id,
      tipo,
      assunto,
      status: TICKET_STATUS.OPEN,
      createdAt: Date.now(),
      messages: []
    };

    await db.addItem('tickets', ticket);

    // Log
    await logger.logTicketCreated(interaction.client, channel.id, tipo, user.tag);

    return { success: true, channel, ticket };

  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    return { success: false, message: 'Erro ao criar canal de ticket' };
  }
}

/**
 * Fecha um ticket
 */
async function closeTicket(channel, closedBy) {
  try {
    // Atualizar no banco
    await db.updateItem('tickets',
      t => t.channelId === channel.id,
      t => ({
        ...t,
        status: TICKET_STATUS.CLOSED,
        closedAt: Date.now(),
        closedBy
      })
    );

    // Buscar informações do ticket
    const ticket = await db.findItem('tickets', t => t.channelId === channel.id);

    // Log
    if (ticket) {
      const user = await channel.client.users.fetch(ticket.userId).catch(() => null);
      const closer = await channel.client.users.fetch(closedBy).catch(() => null);
      await logger.logTicketClosed(
        channel.client,
        channel.id,
        user ? user.tag : ticket.userId,
        closer ? closer.tag : closedBy
      );
    }

    // Enviar mensagem de fechamento
    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.SUCCESS} Ticket Fechado`)
      .setDescription(`Este ticket foi fechado por <@${closedBy}>.\n\nO canal será deletado em 10 segundos.`)
      .setTimestamp();

    await channel.send({ embeds: [embed] });

    // Deletar canal após 10 segundos
    setTimeout(async () => {
      try {
        await channel.delete();
      } catch (err) {
        console.error('Erro ao deletar canal de ticket:', err);
      }
    }, 10000);

    return { success: true };

  } catch (error) {
    console.error('Erro ao fechar ticket:', error);
    return { success: false, message: 'Erro ao fechar ticket' };
  }
}

/**
 * Lista tickets abertos
 */
async function getOpenTickets() {
  const tickets = await db.readData('tickets');
  return tickets.filter(t => t.status === TICKET_STATUS.OPEN);
}

module.exports = {
  createTicket,
  closeTicket,
  getOpenTickets
};
