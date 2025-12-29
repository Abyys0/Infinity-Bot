// Comando: /painelblacklistpublico - Cria painel fixo da blacklist (todos podem ver/consultar)

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../utils/embeds');
const permissions = require('../config/permissions');
const { EMOJIS, COLORS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painelblacklistpublico')
    .setDescription('[DONO] Cria painel público da blacklist')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal onde o painel será criado')
        .setRequired(true)),

  async execute(interaction) {
    // Defer IMEDIATAMENTE antes de qualquer operação
    await interaction.deferReply({ flags: 64 });

    // Verificar se é dono (sem await inline)
    const ehDono = await permissions.isOwner(interaction.user.id, interaction.member);
    if (!ehDono) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode criar este painel.')]
      });
    }

    const canal = interaction.options.getChannel('canal');

    // Criar embed do painel
    const embed = new EmbedBuilder()
      .setTitle(`${EMOJIS.BLACKLIST} Sistema de Blacklist`)
      .setDescription(
        '**Sistema de Controle de Usuários Banidos**\n\n' +
        `${EMOJIS.INFO} **O que é a Blacklist?**\n` +
        'Lista de usuários que violaram as regras e foram banidos de participar das filas.\n\n' +
        `${EMOJIS.SEARCH} **Consultar Blacklist**\n` +
        'Qualquer usuário pode consultar se um usuário está na blacklist.\n\n' +
        `${EMOJIS.WARNING} **Adicionar à Blacklist**\n` +
        'Apenas analistas podem adicionar usuários à blacklist.\n\n' +
        `${EMOJIS.BLACKLIST} **Motivos comuns:**\n` +
        '• Trapaça comprovada\n' +
        '• Não pagamento de apostas\n' +
        '• Comportamento inadequado\n' +
        '• Tentativa de fraude\n\n' +
        'Clique nos botões abaixo para interagir:'
      )
      .setColor(COLORS.BLACKLIST)
      .setTimestamp()
      .setFooter({ text: 'INFINITY BOT • Sistema de Blacklist' });

    // Botões
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('blacklist_consultar_publico')
          .setLabel('Consultar Usuário')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(EMOJIS.SEARCH),
        new ButtonBuilder()
          .setCustomId('blacklist_adicionar_publico')
          .setLabel('Adicionar à Blacklist')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(EMOJIS.BLACKLIST),
        new ButtonBuilder()
          .setCustomId('blacklist_listar_publico')
          .setLabel('Ver Lista Completa')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJIS.LIST)
      );

    try {
      await canal.send({
        embeds: [embed],
        components: [row]
      });

      await interaction.editReply({
        content: `✅ Painel público de blacklist criado em ${canal}!`
      });
    } catch (error) {
      console.error('Erro ao criar painel de blacklist:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Não foi possível criar o painel. Verifique as permissões do bot.')]
      });
    }
  }
};
