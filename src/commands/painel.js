// Comando: /painel - Painel do Dono

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createOwnerPanelEmbed, createErrorEmbed } = require('../utils/embeds');
const permissions = require('../config/permissions');
const { EMOJIS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painel')
    .setDescription('[DONO] Abre o painel de controle do bot'),

  async execute(interaction) {
    // Responder imediatamente para evitar timeout
    try {
      await interaction.deferReply({ flags: 64 });
    } catch (error) {
      console.error('Erro ao deferir resposta:', error);
      return;
    }

    // Verificar se é o dono
    if (!await permissions.isOwner(interaction.user.id, interaction.member)) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode usar este comando.')]
      });
    }

    const embed = createOwnerPanelEmbed();

    // Criar botões
    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('owner_add_mediador')
          .setLabel('Adicionar Mediador')
          .setStyle(ButtonStyle.Success)
          .setEmoji(EMOJIS.MEDIATOR),
        new ButtonBuilder()
          .setCustomId('owner_config_taxes')
          .setLabel('Configurar Taxas')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(EMOJIS.MONEY),
        new ButtonBuilder()
          .setCustomId('owner_config_roles')
          .setLabel('Configurar Cargos')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(EMOJIS.TEAM)
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('owner_config_channels')
          .setLabel('Configurar Canais')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(EMOJIS.GAME),
        new ButtonBuilder()
          .setCustomId('owner_send_message')
          .setLabel('Enviar Mensagem')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJIS.LOG),
        new ButtonBuilder()
          .setCustomId('owner_create_ticket_panel')
          .setLabel('Criar Painel de Ticket')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJIS.TICKET)
      );

    const row3 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('owner_view_config')
          .setLabel('Ver Configurações')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📋'),
        new ButtonBuilder()
          .setCustomId('owner_view_mediadores')
          .setLabel('Ver Mediadores')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJIS.USER),
        new ButtonBuilder()
          .setCustomId('owner_config_pix')
          .setLabel('Configurar PIX')
          .setStyle(ButtonStyle.Success)
          .setEmoji(EMOJIS.MONEY)
      );

    const row4 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('owner_config_queue_values')
          .setLabel('Valores de Filas')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('💵'),
        new ButtonBuilder()
          .setCustomId('owner_config_ss_roles')
          .setLabel('Cargos SS')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(EMOJIS.SS),
        new ButtonBuilder()
          .setCustomId('owner_config_ticket_roles')
          .setLabel('Atendentes de Ticket')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(EMOJIS.TICKET)
      );

    const row5 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('owner_remove_mediador')
          .setLabel('Remover Mediador')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(EMOJIS.ERROR),
        new ButtonBuilder()
          .setCustomId('owner_multar_mediador')
          .setLabel('Multar Mediador')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('💸'),
        new ButtonBuilder()
          .setCustomId('owner_ver_multas')
          .setLabel('Ver Multas')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📊')
      );

    await interaction.editReply({
      embeds: [embed],
      components: [row1, row2, row3, row4, row5]
    });
  }
};
