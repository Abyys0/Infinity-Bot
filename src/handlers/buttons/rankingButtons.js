// Handler de botões de ranking

const { EmbedBuilder } = require('discord.js');
const { createErrorEmbed, createInfoEmbed } = require('../../utils/embeds');
const { EMOJIS, COLORS } = require('../../config/constants');
const db = require('../../database');

async function handle(interaction) {
  const customId = interaction.customId;

  // ranking_top10
  if (customId === 'ranking_top10') {
    await interaction.deferReply({ flags: 64 });

    try {
      const ranking = await db.readData('ranking') || [];
      
      if (ranking.length === 0) {
        return interaction.editReply({
          embeds: [createInfoEmbed('Ranking Vazio', 'Ainda não há jogadores no ranking.')]
        });
      }

      // Ordenar por vitórias
      const sorted = ranking.sort((a, b) => (b.vitorias || 0) - (a.vitorias || 0));
      const top10 = sorted.slice(0, 10);

      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`${EMOJIS.TROPHY} TOP 10 JOGADORES`)
        .setDescription('**Jogadores com mais vitórias em apostados**\n')
        .setTimestamp()
        .setFooter({ text: 'INFINITY BOT • Ranking' });

      let descricao = '';
      for (let i = 0; i < top10.length; i++) {
        const player = top10[i];
        const posicao = i + 1;
        const emoji = posicao === 1 ? '🥇' : posicao === 2 ? '🥈' : posicao === 3 ? '🥉' : `**${posicao}º**`;
        const vitorias = player.vitorias || 0;
        const derrotas = player.derrotas || 0;
        const total = vitorias + derrotas;
        const winrate = total > 0 ? ((vitorias / total) * 100).toFixed(1) : 0;

        descricao += `${emoji} <@${player.userId}>\n`;
        descricao += `   🏆 ${vitorias} vitórias | ❌ ${derrotas} derrotas | 📊 ${winrate}% WR\n\n`;
      }

      embed.setDescription(descricao);

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao buscar o ranking.')]
      });
    }
  }

  // ranking_meu_perfil
  if (customId === 'ranking_meu_perfil') {
    await interaction.deferReply({ flags: 64 });

    try {
      const ranking = await db.readData('ranking') || [];
      const playerData = ranking.find(p => p.userId === interaction.user.id);

      if (!playerData || !playerData.vitorias) {
        return interaction.editReply({
          embeds: [createInfoEmbed(
            'Sem Estatísticas',
            'Você ainda não possui estatísticas registradas.\n\nParticipe de apostados para aparecer no ranking!'
          )]
        });
      }

      // Calcular posição
      const sorted = ranking.sort((a, b) => (b.vitorias || 0) - (a.vitorias || 0));
      const posicao = sorted.findIndex(p => p.userId === interaction.user.id) + 1;

      const vitorias = playerData.vitorias || 0;
      const derrotas = playerData.derrotas || 0;
      const total = vitorias + derrotas;
      const winrate = total > 0 ? ((vitorias / total) * 100).toFixed(1) : 0;

      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`${EMOJIS.USER} MEU PERFIL`)
        .setDescription(`**Estatísticas de ${interaction.user}**`)
        .addFields(
          { name: '📊 Posição no Ranking', value: `**#${posicao}**`, inline: true },
          { name: '🏆 Vitórias', value: `**${vitorias}**`, inline: true },
          { name: '❌ Derrotas', value: `**${derrotas}**`, inline: true },
          { name: '📈 Total de Partidas', value: `**${total}**`, inline: true },
          { name: '🎯 Winrate', value: `**${winrate}%**`, inline: true },
          { name: '⭐ Status', value: posicao <= 10 ? '🔥 **TOP 10!**' : '💪 Continue jogando!', inline: true }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp()
        .setFooter({ text: 'INFINITY BOT • Meu Perfil' });

      // Se não estiver no top 10, mostrar posição separada
      if (posicao > 10) {
        embed.addFields({
          name: '📍 Sua Posição',
          value: `Você está em **#${posicao}** no ranking geral.\nContinue vencendo para chegar ao TOP 10!`,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao buscar seu perfil.')]
      });
    }
  }
}

module.exports = { handle };
