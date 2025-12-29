// Comando: /ranking - Ver ranking de apostados

const { SlashCommandBuilder } = require('discord.js');
const { createRankingEmbed } = require('../utils/embeds');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('Ver ranking de apostados'),

  async execute(interaction) {
    const ranking = await db.readData('ranking');

    // Ordenar por total de vitórias
    const sortedRanking = ranking
      .map(entry => ({
        ...entry,
        total: (entry.wins || 0) + (entry.wo || 0)
      }))
      .sort((a, b) => b.total - a.total);

    if (sortedRanking.length === 0) {
      return interaction.reply({
        content: '📊 Nenhum dado de ranking disponível ainda.',
        flags: 64
      });
    }

    const embed = createRankingEmbed(sortedRanking);

    await interaction.reply({
      embeds: [embed]
    });
  }
};
