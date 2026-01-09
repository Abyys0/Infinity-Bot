// Comando: /vendas - Painel de gerenciamento de vendas

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../utils/embeds');
const permissions = require('../config/permissions');
const { EMOJIS, COLORS } = require('../config/constants');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vendas')
    .setDescription('[DONO] Abre o painel de gerenciamento de vendas'),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    // Verificar se é o dono
    if (!await permissions.isOwner(interaction.user.id, interaction.member)) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode usar este comando.')]
      });
    }

    // Criar embed do painel de vendas
    const embed = new EmbedBuilder()
      .setTitle(`${EMOJIS.MONEY} Painel de Vendas`)
      .setDescription(
        '**Gerencie seus produtos e vendas**\n\n' +
        `${EMOJIS.SUCCESS} **Adicionar Produto:** Cadastre novos produtos\n` +
        `📦 **Ver Produtos:** Liste todos os produtos cadastrados\n` +
        `✏️ **Editar Painel:** Altere título e descrição do painel público\n` +
        `💳 **Configurar PIX:** Configure o PIX para pagamentos\n` +
        `📨 **Enviar Painel:** Envie o painel de vendas para um canal\n\n` +
        'Use os botões abaixo para gerenciar:'
      )
      .setColor(COLORS.PRIMARY)
      .setTimestamp()
      .setFooter({ text: 'INFINITY BOT • Sistema de Vendas' });

    // Botões do painel
    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('vendas_add_produto')
          .setLabel('Adicionar Produto')
          .setStyle(ButtonStyle.Success)
          .setEmoji('➕'),
        new ButtonBuilder()
          .setCustomId('vendas_ver_produtos')
          .setLabel('Ver Produtos')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📦'),
        new ButtonBuilder()
          .setCustomId('vendas_remover_produto')
          .setLabel('Remover Produto')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️')
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('vendas_editar_painel')
          .setLabel('Editar Painel')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('✏️'),
        new ButtonBuilder()
          .setCustomId('vendas_config_pix')
          .setLabel('Configurar PIX')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('💳'),
        new ButtonBuilder()
          .setCustomId('vendas_enviar_painel')
          .setLabel('Enviar Painel')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📨')
      );

    await interaction.editReply({
      embeds: [embed],
      components: [row1, row2]
    });
  }
};
