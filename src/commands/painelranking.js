// Comando: /painelranking - Cria painel fixo de ranking público

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../utils/embeds');
const permissions = require('../config/permissions');
const { EMOJIS, COLORS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painelranking')
    .setDescription('[DONO] Cria painel fixo de ranking público')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal onde o painel será criado')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    // Verificar se é dono
    const temPermissao = await permissions.isOwner(interaction.user.id, interaction.member);
    if (!temPermissao) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode criar este painel.')]
      });
    }

    const canal = interaction.options.getChannel('canal');

    // Criar embed do painel
    const embed = new EmbedBuilder()
      .setTitle(`${EMOJIS.TROPHY} RANKING INFINITY APOSTAS`)
      .setDescription(
        '**Sistema de Ranking de Vitórias**\n\n' +
        '🏆 **Ver Top 10:** Veja os 10 melhores jogadores do servidor\n' +
        '👤 **Meu Perfil:** Veja suas estatísticas e posição no ranking\n\n' +
        '📊 O ranking é atualizado automaticamente a cada vitória!'
      )
      .setColor(COLORS.PRIMARY)
      .setTimestamp()
      .setFooter({ text: 'INFINITY BOT • Sistema de Ranking' });

    const botoes = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ranking_top10')
          .setLabel('Ver Top 10')
          .setStyle(ButtonStyle.Success)
          .setEmoji(EMOJIS.TROPHY),
        new ButtonBuilder()
          .setCustomId('ranking_meu_perfil')
          .setLabel('Meu Perfil')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(EMOJIS.USER)
      );

    try {
      await canal.send({
        embeds: [embed],
        components: [botoes]
      });

      await interaction.editReply({
        content: `✅ Painel de ranking criado em ${canal}!`
      });

    } catch (error) {
      console.error('Erro ao criar painel de ranking:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao criar o painel.')]
      });
    }
  }
};
