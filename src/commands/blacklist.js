// Comando: /blacklist - Gerenciar blacklist

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createBlacklistEmbed } = require('../utils/embeds');
const { COLORS, EMOJIS } = require('../config/constants');
const permissions = require('../config/permissions');
const db = require('../database');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('[ANALISTA] Gerenciar blacklist')
    .addSubcommand(subcommand =>
      subcommand
        .setName('adicionar')
        .setDescription('Adicionar usuário à blacklist')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuário a ser adicionado')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('motivo')
            .setDescription('Motivo da blacklist')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remover')
        .setDescription('Remover usuário da blacklist')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuário a ser removido')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('consultar')
        .setDescription('Consultar usuário na blacklist')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuário a ser consultado')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('listar')
        .setDescription('Listar todos os usuários na blacklist'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('painel')
        .setDescription('Abrir painel de blacklist')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // Verificar permissões (apenas analista pode usar)
    if (!await permissions.isAnalista(interaction.member) && !await permissions.isOwner(interaction.user.id, interaction.member)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas analistas podem gerenciar a blacklist.')],
        flags: 64
      });
    }

    if (subcommand === 'adicionar') {
      const user = interaction.options.getUser('usuario');
      const motivo = interaction.options.getString('motivo');

      // Verificar se já está na blacklist
      if (await permissions.isBlacklisted(user.id)) {
        return interaction.reply({
          embeds: [createErrorEmbed('Já na Blacklist', `${user.tag} já está na blacklist.`)],
          flags: 64
        });
      }

      // Adicionar à blacklist
      const entry = {
        userId: user.id,
        reason: motivo,
        addedBy: interaction.user.id,
        addedAt: Date.now()
      };

      await db.addItem('blacklist', entry);

      // Log
      await logger.logBlacklist(interaction.client, 'add', user.id, user.tag, motivo, interaction.user.tag);

      const embed = createBlacklistEmbed(user, motivo, interaction.user.id, entry.addedAt);

      await interaction.reply({
        embeds: [embed]
      });
    }

    else if (subcommand === 'remover') {
      const user = interaction.options.getUser('usuario');

      // Verificar se está na blacklist
      if (!await permissions.isBlacklisted(user.id)) {
        return interaction.reply({
          embeds: [createErrorEmbed('Não Encontrado', `${user.tag} não está na blacklist.`)],
          flags: 64
        });
      }

      // Remover da blacklist
      await db.removeItem('blacklist', entry => entry.userId === user.id);

      // Log
      await logger.logBlacklist(interaction.client, 'remove', user.id, user.tag, null, interaction.user.tag);

      await interaction.reply({
        embeds: [createSuccessEmbed(
          'Removido da Blacklist',
          `${EMOJIS.SUCCESS} **${user.tag}** foi removido da blacklist!`
        )]
      });
    }

    else if (subcommand === 'consultar') {
      const user = interaction.options.getUser('usuario');

      const entry = await permissions.getBlacklistEntry(user.id);

      if (!entry) {
        return interaction.reply({
          embeds: [createSuccessEmbed(
            'Não Encontrado',
            `${EMOJIS.SUCCESS} **${user.tag}** não está na blacklist.`
          )],
          flags: 64
        });
      }

      const embed = createBlacklistEmbed(user, entry.reason, entry.addedBy, entry.addedAt);

      await interaction.reply({
        embeds: [embed],
        flags: 64
      });
    }

    else if (subcommand === 'listar') {
      const blacklist = await db.readData('blacklist');

      if (blacklist.length === 0) {
        return interaction.reply({
          embeds: [createSuccessEmbed('Blacklist Vazia', 'Não há usuários na blacklist.')],
          flags: 64
        });
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.BLACKLIST)
        .setTitle(`${EMOJIS.BLACKLIST} BLACKLIST`)
        .setDescription(`Total de usuários: ${blacklist.length}`)
        .setTimestamp()
        .setFooter({ text: 'INFINITY BOT • Blacklist' });

      for (const entry of blacklist.slice(0, 10)) {
        try {
          const user = await interaction.client.users.fetch(entry.userId).catch(() => null);
          const userName = user ? user.tag : entry.userId;

          embed.addFields({
            name: userName,
            value: `**Motivo:** ${entry.reason}\n**Por:** <@${entry.addedBy}>\n**Em:** ${new Date(entry.addedAt).toLocaleDateString('pt-BR')}`,
            inline: false
          });
        } catch (err) {
          console.error('Erro ao buscar usuário:', err);
        }
      }

      if (blacklist.length > 10) {
        embed.setDescription(`Total de usuários: ${blacklist.length}\n*Mostrando os 10 primeiros*`);
      }

      await interaction.reply({
        embeds: [embed],
        flags: 64
      });
    }

    else if (subcommand === 'painel') {
      const embed = new EmbedBuilder()
        .setColor(COLORS.BLACKLIST)
        .setTitle(`${EMOJIS.BLACKLIST} PAINEL DE BLACKLIST`)
        .setDescription('Gerencie a blacklist usando os botões abaixo')
        .addFields(
          { name: '➕ Adicionar', value: 'Adicionar usuário à blacklist', inline: true },
          { name: '➖ Remover', value: 'Remover usuário da blacklist', inline: true },
          { name: '🔍 Consultar', value: 'Consultar informações', inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'INFINITY BOT • Painel de Blacklist' });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('blacklist_add')
            .setLabel('Adicionar')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('➕'),
          new ButtonBuilder()
            .setCustomId('blacklist_remove')
            .setLabel('Remover')
            .setStyle(ButtonStyle.Success)
            .setEmoji('➖'),
          new ButtonBuilder()
            .setCustomId('blacklist_search')
            .setLabel('Consultar')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔍'),
          new ButtonBuilder()
            .setCustomId('blacklist_list')
            .setLabel('Listar Todos')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋')
        );

      await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: 64
      });
    }
  }
};
