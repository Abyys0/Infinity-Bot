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
      console.error('[PAINEL] Erro ao deferir resposta:', error);
      return;
    }

    try {
      // Verificar se é o dono
      const isOwnerResult = await permissions.isOwner(interaction.user.id, interaction.member);
      
      if (!isOwnerResult) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode usar este comando.')]
        });
      }

      const embed = createOwnerPanelEmbed();

      // Reorganizar botões em 5 rows (máximo permitido pelo Discord)
      // Cada row pode ter até 5 botões
      const row1 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('owner_add_mediador')
            .setLabel('Adicionar Mediador')
            .setStyle(ButtonStyle.Success)
            .setEmoji(EMOJIS.MEDIATOR),
          new ButtonBuilder()
            .setCustomId('owner_remove_mediador')
            .setLabel('Remover Mediador')
            .setStyle(ButtonStyle.Danger)
            .setEmoji(EMOJIS.ERROR),
          new ButtonBuilder()
            .setCustomId('owner_view_mediadores')
            .setLabel('Ver Mediadores')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(EMOJIS.USER),
          new ButtonBuilder()
            .setCustomId('owner_multar_mediador')
            .setLabel('Multar Mediador')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('💸'),
          new ButtonBuilder()
            .setCustomId('owner_ver_faturamento')
            .setLabel('Faturamento')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💰')
        );

      const row2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('owner_add_analista')
            .setLabel('Adicionar Analista')
            .setStyle(ButtonStyle.Success)
            .setEmoji(EMOJIS.ANALYST),
          new ButtonBuilder()
            .setCustomId('owner_remove_analista')
            .setLabel('Remover Analista')
            .setStyle(ButtonStyle.Danger)
            .setEmoji(EMOJIS.ERROR),
          new ButtonBuilder()
            .setCustomId('owner_view_analistas')
            .setLabel('Ver Analistas')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(EMOJIS.LIST),
          new ButtonBuilder()
            .setCustomId('owner_config_ss_roles')
            .setLabel('Cargos SS')
            .setStyle(ButtonStyle.Primary)
            .setEmoji(EMOJIS.SS),
          new ButtonBuilder()
            .setCustomId('owner_ver_multas')
            .setLabel('Ver Multas')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📊')
        );

      const row3 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('owner_config_taxes')
            .setLabel('Configurar Taxas')
            .setStyle(ButtonStyle.Primary)
            .setEmoji(EMOJIS.MONEY),
          new ButtonBuilder()
            .setCustomId('owner_config_roles')
            .setLabel('Configurar Cargos')
            .setStyle(ButtonStyle.Primary)
            .setEmoji(EMOJIS.TEAM),
          new ButtonBuilder()
            .setCustomId('owner_config_channels')
            .setLabel('Configurar Canais')
            .setStyle(ButtonStyle.Primary)
            .setEmoji(EMOJIS.GAME),
          new ButtonBuilder()
            .setCustomId('owner_config_pix')
            .setLabel('Configurar PIX')
            .setStyle(ButtonStyle.Success)
            .setEmoji(EMOJIS.MONEY),
          new ButtonBuilder()
            .setCustomId('owner_config_queue_values')
            .setLabel('Valores Filas')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💵')
        );

      const row4 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('owner_create_ticket_panel')
            .setLabel('Painel Ticket')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(EMOJIS.TICKET),
          new ButtonBuilder()
            .setCustomId('owner_config_ticket_roles')
            .setLabel('Atendentes Ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji(EMOJIS.TICKET),
          new ButtonBuilder()
            .setCustomId('owner_send_message')
            .setLabel('Enviar Mensagem')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(EMOJIS.LOG),
          new ButtonBuilder()
            .setCustomId('owner_view_config')
            .setLabel('Ver Configurações')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋')
        );

      const row5 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('owner_export_queue_logs')
            .setLabel('Logs Filas')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📥'),
          new ButtonBuilder()
            .setCustomId('owner_export_ticket_logs')
            .setLabel('Logs Tickets')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📥'),
          new ButtonBuilder()
            .setCustomId('owner_export_all_logs')
            .setLabel('Todos os Logs')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📦')
        );

      await interaction.editReply({
        embeds: [embed],
        components: [row1, row2, row3, row4, row5]
      });
    } catch (error) {
      console.error('[PAINEL] Erro ao executar comando:', error);
      
      try {
        await interaction.editReply({
          embeds: [createErrorEmbed(
            'Erro ao Abrir Painel',
            `Ocorreu um erro ao abrir o painel.\n\n**Erro:** ${error.message}\n\nPor favor, verifique os logs do servidor.`
          )]
        });
      } catch (replyError) {
        console.error('[PAINEL] Erro ao enviar mensagem de erro:', replyError);
      }
    }
  }
};
