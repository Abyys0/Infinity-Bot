// Comando: /fila - Criar fila de apostado no canal atual

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../utils/embeds');
const { PLATFORMS, EMOJIS, COLORS } = require('../config/constants');
const permissions = require('../config/permissions');
const db = require('../database');
const { temMultaPendente, getMultaPendente } = require('../services/multaService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fila')
    .setDescription('Criar uma fila de apostado no canal atual')
    .addStringOption(option =>
      option.setName('tipo')
        .setDescription('Tipo da fila')
        .setRequired(true)
        .addChoices(
          { name: '1x1', value: '1x1' },
          { name: '2x2', value: '2x2' },
          { name: '3x3', value: '3x3' },
          { name: '4x4', value: '4x4' }
        ))
    .addStringOption(option =>
      option.setName('plataforma')
        .setDescription('Plataforma')
        .setRequired(true)
        .addChoices(
          { name: '📱 Mobile', value: PLATFORMS.MOBILE },
          { name: '🖥️ Emulador', value: PLATFORMS.EMULATOR },
          { name: '🔀 Misto', value: PLATFORMS.MIXED },
          { name: '🎯 Tático', value: PLATFORMS.TACTICAL }
        ))
    .addIntegerOption(option =>
      option.setName('valor')
        .setDescription('Valor da aposta em R$')
        .setRequired(true)
        .setMinValue(1)),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    // Verificar se usuário tem multa pendente
    if (await temMultaPendente(interaction.user.id)) {
      const multa = await getMultaPendente(interaction.user.id);
      return interaction.editReply({
        embeds: [createErrorEmbed(
          '💸 Multa Pendente',
          `Você possui uma multa pendente e não pode criar filas até pagar.\n\n` +
          `**Valor:** R$ ${multa.valor}\n` +
          `**Motivo:** ${multa.motivo}\n` +
          `**Canal de pagamento:** <#${multa.canalId}>`
        )]
      });
    }

    // Verificar blacklist
    if (await permissions.isBlacklisted(interaction.user.id)) {
      const entry = await permissions.getBlacklistEntry(interaction.user.id);
      return interaction.editReply({
        embeds: [createErrorEmbed(
          '🚫 Blacklist',
          `Você está na blacklist e não pode criar filas.\n\n` +
          `**Motivo:** ${entry.reason}\n` +
          `**Adicionado por:** <@${entry.addedBy}>`
        )]
      });
    }

    const tipo = interaction.options.getString('tipo');
    const plataforma = interaction.options.getString('plataforma');
    const valor = interaction.options.getInteger('valor');

    try {
      // Gerar ID único para a fila
      const filaId = `fila_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Criar fila no banco
      const queue = {
        id: filaId,
        channelId: interaction.channel.id,
        messageId: null,
        tipo,
        plataforma,
        valor,
        jogadores: [], // Começa vazia
        criadoPor: interaction.user.id,
        criadoEm: Date.now(),
        status: 'aguardando'
      };

      // Criar embed da fila
      const queueEmbed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('🏆 STORM E-SPORTS')
        .addFields(
          { name: '🎮 MODO', value: `${tipo} ${plataforma}`, inline: false },
          { name: '💰 VALOR', value: `R$ ${valor.toFixed(2)}`, inline: false },
          { name: '👥 JOGADORES', value: 'Nenhum jogador na fila.', inline: false }
        )
        .setImage('https://cdn.discordapp.com/attachments/1234567890/banner.png') // Substitua pela URL real
        .setTimestamp();

      // Botões
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`entrar_fila_${filaId}`)
            .setLabel('Entrar na Fila')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅'),
          new ButtonBuilder()
            .setCustomId(`sair_fila_${filaId}`)
            .setLabel('Sair')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('✖️')
        );

      const message = await interaction.channel.send({
        embeds: [queueEmbed],
        components: [row]
      });

      // Atualizar messageId
      queue.messageId = message.id;
      await db.addItem('filas', queue);

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Fila Criada',
          `${EMOJIS.SUCCESS} Fila **${tipo} ${plataforma}** criada!\n**Valor:** R$ ${valor}\n\nOs jogadores podem entrar clicando no botão.`
        )]
      });

    } catch (error) {
      console.error('Erro ao criar fila:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao criar a fila.')]
      });
    }
  }
};
