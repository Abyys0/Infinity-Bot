// Comando /ranking - Visualizar ranking de jogadores (Sistema Sharingan)

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const rankingService = require('../services/rankingService');
const { COLORS, EMOJIS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('Visualizar o ranking de jogadores')
    .addSubcommand(subcommand =>
      subcommand
        .setName('ver')
        .setDescription('Ver o ranking geral'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('jogador')
        .setDescription('Ver estatísticas de um jogador')
        .addUserOption(option =>
          option
            .setName('usuario')
            .setDescription('Usuário para ver as estatísticas')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('setcanal')
        .setDescription('Definir canal para ranking automático (Admin)')
        .addChannelOption(option =>
          option
            .setName('canal')
            .setDescription('Canal onde o ranking será atualizado')
            .setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'ver') {
      return this.handleVerRanking(interaction);
    } else if (subcommand === 'jogador') {
      return this.handleVerJogador(interaction);
    } else if (subcommand === 'setcanal') {
      return this.handleSetCanal(interaction);
    }
  },

  /**
   * Mostrar ranking geral
   */
  async handleVerRanking(interaction) {
    await interaction.deferReply();

    const topPlayers = await rankingService.getRanking(15);
    const embed = await rankingService.createRankingEmbed(topPlayers);

    await interaction.editReply({ embeds: [embed] });
  },

  /**
   * Ver estatísticas de um jogador específico
   */
  async handleVerJogador(interaction) {
    await interaction.deferReply();

    const user = interaction.options.getUser('usuario') || interaction.user;
    const stats = await rankingService.getPlayerStats(user.id);

    if (!stats) {
      const embed = new EmbedBuilder()
        .setTitle('📊 Estatísticas do Jogador')
        .setDescription(
          `${user} ainda não possui estatísticas.\n\n` +
          `Participe de partidas para aparecer no ranking!`
        )
        .setColor(COLORS.WARNING)
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    // Calcular win rate
    const totalPartidas = stats.victories + stats.defeats;
    const winRate = totalPartidas > 0 
      ? ((stats.victories / totalPartidas) * 100).toFixed(1)
      : '0.0';

    // Buscar posição no ranking
    const allPlayers = await rankingService.getRanking(999);
    const position = allPlayers.findIndex(p => p.userId === user.id) + 1;

    const embed = new EmbedBuilder()
      .setTitle(`📊 Estatísticas - ${user.username}`)
      .setDescription(
        `**🏆 Posição no Ranking:** #${position}\n\n` +
        `**Estatísticas Gerais:**`
      )
      .addFields(
        { 
          name: `${EMOJIS.SUCCESS} Vitórias`, 
          value: `${stats.victories}`, 
          inline: true 
        },
        { 
          name: `${EMOJIS.ERROR} Derrotas`, 
          value: `${stats.defeats}`, 
          inline: true 
        },
        { 
          name: '📊 Win Rate', 
          value: `${winRate}%`, 
          inline: true 
        },
        { 
          name: '📈 Total de Partidas', 
          value: `${totalPartidas}`, 
          inline: true 
        },
        { 
          name: `${EMOJIS.MONEY} Ganhos Totais`, 
          value: `R$ ${stats.totalEarnings.toFixed(2)}`, 
          inline: true 
        },
        {
          name: '🕐 Última Atualização',
          value: `<t:${Math.floor(stats.lastUpdate / 1000)}:R>`,
          inline: true
        }
      )
      .setColor(COLORS.PRIMARY)
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },

  /**
   * Definir canal de ranking automático
   */
  async handleSetCanal(interaction) {
    // Verificar permissão de administrador
    if (!interaction.member.permissions.has('Administrator')) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Sem Permissão')
        .setDescription('Apenas administradores podem definir o canal de ranking.')
        .setColor(COLORS.ERROR);

      return interaction.reply({ embeds: [embed], flags: 64 });
    }

    await interaction.deferReply({ flags: 64 });

    const channel = interaction.options.getChannel('canal');

    // Validar se é um canal de texto
    if (!channel.isTextBased()) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Canal Inválido')
        .setDescription('Por favor, selecione um canal de texto.')
        .setColor(COLORS.ERROR);

      return interaction.editReply({ embeds: [embed] });
    }

    // Definir canal de ranking
    await rankingService.setRankingChannel(channel.id);

    const embed = new EmbedBuilder()
      .setTitle('✅ Canal de Ranking Configurado')
      .setDescription(
        `O canal <#${channel.id}> foi definido como canal de ranking.\n\n` +
        `**Funcionalidades:**\n` +
        `• 🔄 Atualização automática a cada hora\n` +
        `• 📅 Reset automático no dia 1 de cada mês\n` +
        `• 🏆 Top 10 jogadores sempre visíveis`
      )
      .setColor(COLORS.SUCCESS)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};

