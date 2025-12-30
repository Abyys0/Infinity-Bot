// Comando: /fila - Criar fila de apostado

const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createQueueEmbed, createErrorEmbed, createSuccessEmbed } = require('../utils/embeds');
const { QUEUE_TYPES, PLATFORMS, QUEUE_STATUS, EMOJIS } = require('../config/constants');
const { validatePlayersForQueueType, sanitizeChannelName } = require('../utils/validators');
const permissions = require('../config/permissions');
const db = require('../database');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fila')
    .setDescription('Criar uma fila de apostado')
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
          { name: '🔀 Misto', value: PLATFORMS.MIXED }
        ))
    .addIntegerOption(option =>
      option.setName('valor')
        .setDescription('Valor da aposta em R$')
        .setRequired(true)
        .setMinValue(1))
    .addUserOption(option =>
      option.setName('jogador1')
        .setDescription('Jogador 1')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('jogador2')
        .setDescription('Jogador 2')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('jogador3')
        .setDescription('Jogador 3')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('jogador4')
        .setDescription('Jogador 4')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('jogador5')
        .setDescription('Jogador 5')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('jogador6')
        .setDescription('Jogador 6')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('jogador7')
        .setDescription('Jogador 7')
        .setRequired(false)),

  async execute(interaction) {
    // Responder imediatamente para evitar timeout
    await interaction.deferReply({ flags: 64 });

    const tipo = interaction.options.getString('tipo');
    const plataforma = interaction.options.getString('plataforma');
    const valor = interaction.options.getInteger('valor');

    // Coletar jogadores
    const jogadores = [interaction.user.id];
    for (let i = 1; i <= 7; i++) {
      const user = interaction.options.getUser(`jogador${i}`);
      if (user && !jogadores.includes(user.id)) {
        jogadores.push(user.id);
      }
    }

    // Validar número de jogadores
    const expectedPlayers = QUEUE_TYPES[tipo].players;
    if (!validatePlayersForQueueType(tipo, jogadores.length)) {
      return interaction.editReply({
        embeds: [createErrorEmbed(
          'Número Incorreto de Jogadores',
          `Para uma fila ${tipo} são necessários **${expectedPlayers} jogadores** (incluindo você).\nVocê adicionou: **${jogadores.length}**`
        )]
      });
    }

    // Verificar blacklist
    const blacklistedPlayers = [];
    for (const playerId of jogadores) {
      if (await permissions.isBlacklisted(playerId)) {
        const entry = await permissions.getBlacklistEntry(playerId);
        blacklistedPlayers.push({ id: playerId, entry });
      }
    }

    if (blacklistedPlayers.length > 0) {
      let message = `${EMOJIS.BLACKLIST} **Jogadores na blacklist não podem participar:**\n\n`;
      for (const player of blacklistedPlayers) {
        message += `<@${player.id}>\n**Motivo:** ${player.entry.reason}\n**Adicionado por:** <@${player.entry.addedBy}>\n\n`;
      }
      return interaction.editReply({
        embeds: [createErrorEmbed('Blacklist', message)]
      });
    }

    // Criar canal privado
    const config = await db.readData('config');
    const channelName = sanitizeChannelName(`fila-${tipo}-${plataforma}-${Date.now()}`);

    try {
      const permissionOverwrites = [
        {
          id: interaction.guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        ...jogadores.map(id => ({
          id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
        }))
      ];

      // Adicionar mediadores ativos
      if (config.roles?.mediador) {
        for (const roleId of config.roles.mediador) {
          permissionOverwrites.push({
            id: roleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
          });
        }
      }

      // Adicionar dono
      if (process.env.OWNER_ID) {
        permissionOverwrites.push({
          id: process.env.OWNER_ID,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels]
        });
      }

      const channelOptions = {
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites
      };

      // Se configurado, adicionar categoria
      if (config.channels?.queues) {
        channelOptions.parent = config.channels.queues;
      }

      const channel = await interaction.guild.channels.create(channelOptions);

      // Dividir jogadores em 2 times (metade cada)
      const metade = jogadores.length / 2;
      const time1 = jogadores.slice(0, metade);
      const time2 = jogadores.slice(metade);

      // Salvar fila no banco
      const queue = {
        id: channel.id,
        channelId: channel.id,
        tipo,
        plataforma,
        valor,
        time1,
        time2,
        criadoPor: interaction.user.id,
        criadoEm: Date.now(),
        status: 'aguardando',
        confirmacoesTime1: [],
        confirmacoesTime2: []
      };

      await db.addItem('filas', queue);

      // Criar embed da fila
      const queueEmbed = createQueueEmbed(tipo, plataforma, valor, jogadores);
      queueEmbed.addFields(
        { name: '🔥 Time 1 (Gelo Infinito)', value: time1.map(id => `<@${id}>`).join('\n'), inline: true },
        { name: '❄️ Time 2 (Gelo Normal)', value: time2.map(id => `<@${id}>`).join('\n'), inline: true },
        { name: `${EMOJIS.LOADING} Status`, value: 'Aguardando confirmação dos jogadores', inline: false },
        { name: `${EMOJIS.MONEY} Valor por jogador`, value: `R$ ${valor}`, inline: true }
      );

      // Botões de confirmação
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`gelo_infinito_${channel.id}`)
            .setLabel('Confirmar - Time 1 (Gelo Infinito)')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔥'),
          new ButtonBuilder()
            .setCustomId(`gelo_normal_${channel.id}`)
            .setLabel('Confirmar - Time 2 (Gelo Normal)')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❄️'),
          new ButtonBuilder()
            .setCustomId(`cancel_queue_${channel.id}`)
            .setLabel('Cancelar')
            .setStyle(ButtonStyle.Danger)
            .setEmoji(EMOJIS.ERROR)
        );

      await channel.send({
        content: jogadores.map(id => `<@${id}>`).join(' '),
        embeds: [queueEmbed],
        components: [row]
      });

      // Enviar DM para todos os jogadores
      for (let i = 0; i < jogadores.length; i++) {
        const playerId = jogadores[i];
        const time = i < metade ? 'Time 1 (Gelo Infinito)' : 'Time 2 (Gelo Normal)';
        try {
          const user = await interaction.client.users.fetch(playerId);
          await user.send(`${EMOJIS.GAME} Você foi adicionado a uma fila de apostado!\n**Tipo:** ${tipo} ${plataforma}\n**Valor:** R$ ${valor}\n**Seu Time:** ${time}\n**Canal:** <#${channel.id}>\n\n${EMOJIS.WARNING} Confirme sua participação no canal!`);
        } catch (err) {
          console.error(`Erro ao enviar DM para ${playerId}:`, err);
        }
      }

      // Log
      await logger.logQueueCreated(interaction.client, channel.id, tipo, plataforma, interaction.user.tag, jogadores);

      // Responder
      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Fila Criada',
          `${EMOJIS.SUCCESS} Fila criada com sucesso!\n**Canal:** <#${channel.id}>\n\n${EMOJIS.INFO} Aguardando confirmação de todos os jogadores.`
        )]
      });

    } catch (error) {
      console.error('Erro ao criar fila:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao criar a fila. Tente novamente.')]
      });
    }
  }
};
