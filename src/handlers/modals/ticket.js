// Handler de modais de tickets

const { PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { closeTicket } = require('../../services/ticketService');
const { isValidDiscordId } = require('../../utils/validators');
const permissions = require('../../config/permissions');
const db = require('../../database');
const { EMOJIS } = require('../../config/constants');

async function handle(interaction) {
  const customId = interaction.customId;

  // modal_close_ticket_TICKETID
  if (customId.startsWith('modal_close_ticket_')) {
    const ticketId = customId.replace('modal_close_ticket_', '');
    const motivo = interaction.fields.getTextInputValue('motivo').trim();

    await interaction.deferReply();

    const ticket = await db.findItem('tickets', t => t.id === ticketId);

    if (!ticket) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Ticket Não Encontrado', 'Este ticket não existe mais.')]
      });
    }

    // Fechar ticket
    const result = await closeTicket(interaction.channel, interaction.user.id, motivo);

    if (!result.success) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', result.message)]
      });
    }

    // Mensagem já enviada pelo service com o motivo
  }

  // modal_add_member_ticket_TICKETID
  if (customId.startsWith('modal_add_member_ticket_')) {
    const ticketId = customId.replace('modal_add_member_ticket_', '');
    const userId = interaction.fields.getTextInputValue('user_id').trim();

    // Validar ID
    if (!isValidDiscordId(userId)) {
      return interaction.reply({
        embeds: [createErrorEmbed('ID Inválido', 'O ID do usuário é inválido.')],
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    const ticket = await db.findItem('tickets', t => t.id === ticketId);

    if (!ticket) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Ticket Não Encontrado', 'Este ticket não existe mais.')]
      });
    }

    try {
      // Buscar usuário
      const user = await interaction.client.users.fetch(userId).catch(() => null);
      if (!user) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Usuário Não Encontrado', 'Não foi possível encontrar o usuário com este ID.')]
        });
      }

      // Buscar membro no servidor
      const member = await interaction.guild.members.fetch(userId).catch(() => null);
      if (!member) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Membro Não Encontrado', 'Este usuário não está no servidor.')]
        });
      }

      // Adicionar permissões ao canal
      await interaction.channel.permissionOverwrites.create(userId, {
        ViewChannel: true,
        SendMessages: true,
        AttachFiles: true
      });

      // Atualizar ticket no banco
      await db.updateItem('tickets',
        t => t.id === ticketId,
        t => ({
          ...t,
          membrosAdicionados: [...(t.membrosAdicionados || []), userId]
        })
      );

      // Enviar mensagem no canal
      await interaction.channel.send({
        embeds: [createSuccessEmbed(
          'Membro Adicionado',
          `${EMOJIS.SUCCESS} ${member} foi adicionado ao ticket por ${interaction.user}!`
        )]
      });

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Membro Adicionado',
          `${EMOJIS.SUCCESS} **${user.tag}** foi adicionado ao ticket com sucesso!`
        )]
      });

    } catch (error) {
      console.error('Erro ao adicionar membro ao ticket:', error);
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao adicionar o membro.')]
      });
    }
  }
}

module.exports = { handle };
