// Comando: /painelmediador - Cria painel fixo para mediadores entrarem/sairem de serviço

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../utils/embeds');
const permissions = require('../config/permissions');
const { EMOJIS, COLORS, DISABLED_FEATURES, DISABLED_MESSAGE } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painelmediador')
    .setDescription('[MEDIADOR] Cria painel fixo para entrada/saída de serviço')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal onde o painel será criado')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    // Verificar se o painel de mediador está desativado
    if (DISABLED_FEATURES.PAINEL_MEDIADOR) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Sistema Desativado', DISABLED_MESSAGE)]
      });
    }

    // Verificar se é mediador ou superior
    const temPermissao = await permissions.isMediadorOrAbove(interaction.member);
    if (!temPermissao) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas mediadores podem criar este painel.')]
      });
    }

    const canal = interaction.options.getChannel('canal');

    // Criar embed do painel
    const embed = new EmbedBuilder()
      .setTitle(`${EMOJIS.MEDIATOR} Painel de Mediadores`)
      .setDescription(
        '**Sistema de Controle de Serviço**\n\n' +
        `${EMOJIS.INFO} Use os botões abaixo para entrar ou sair de serviço.\n\n` +
        `${EMOJIS.ONLINE} **Entrar em Serviço:**\n` +
        '• Você ficará disponível para atender filas\n' +
        '• Seu nome aparecerá na lista de mediadores ativos\n\n' +
        `${EMOJIS.OFFLINE} **Sair de Serviço:**\n` +
        '• Você não receberá mais atendimentos\n' +
        '• Seu nome sairá da lista de mediadores ativos\n\n' +
        `📊 **Mediadores em Serviço:** 0`
      )
      .setColor(COLORS.PRIMARY)
      .setTimestamp()
      .setFooter({ text: 'INFINITY BOT • Sistema de Mediadores' });

    // Botões para entrar/sair
    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('mediador_entrar_painel')
          .setLabel('Entrar em Serviço')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🟢'),
        new ButtonBuilder()
          .setCustomId('mediador_sair_painel')
          .setLabel('Sair de Serviço')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('⚪'),
        new ButtonBuilder()
          .setCustomId('mediador_ver_lista')
          .setLabel('Ver Mediadores')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📊')
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('mediador_configurar_pix')
          .setLabel('Configurar Meu PIX')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('💰')
      );

    try {
      const message = await canal.send({
        embeds: [embed],
        components: [row1, row2]
      });

      // Salvar messageId para atualizar depois
      const db = require('../database');
      const config = await db.readData('config');
      config.painelMediadorMessageId = message.id;
      config.painelMediadorChannelId = canal.id;
      await db.writeData('config', config);

      await interaction.editReply({
        content: `✅ Painel de mediadores criado em ${canal}!`
      });
    } catch (error) {
      console.error('Erro ao criar painel de mediadores:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Não foi possível criar o painel. Verifique as permissões do bot.')]
      });
    }
  }
};
