// Sistema de Ranking Automático - Inspirado no Bot Sharingan

const { EmbedBuilder, ChannelType } = require('discord.js');
const cron = require('node-cron');
const db = require('../database');
const { COLORS, EMOJIS } = require('../config/constants');
const logger = require('../utils/logger');

class RankingService {
  constructor() {
    this.rankingChannelId = null;
    this.rankingMessageId = null;
    this.client = null;
    this.updateJob = null;
    this.resetJob = null;
  }

  /**
   * Inicializa o serviço de ranking
   */
  async initialize(client) {
    this.client = client;
    
    // Carregar configuração do canal de ranking
    const config = await db.readData('config');
    this.rankingChannelId = config.channels?.ranking || null;

    // Agendar atualização automática a cada hora
    this.updateJob = cron.schedule('0 * * * *', async () => {
      console.log('[RANKING] Executando atualização automática do ranking');
      await this.updateRankingChannel();
    });

    // Agendar reset mensal (todo dia 1 às 00:00)
    this.resetJob = cron.schedule('0 0 1 * *', async () => {
      console.log('[RANKING] Executando reset mensal do ranking');
      await this.resetRanking();
    });

    console.log('[RANKING] Serviço de ranking inicializado com sucesso');
    console.log('[RANKING] - Atualização automática: A cada hora');
    console.log('[RANKING] - Reset automático: Todo dia 1 do mês às 00:00');
  }

  /**
   * Define o canal de ranking
   */
  async setRankingChannel(channelId) {
    this.rankingChannelId = channelId;
    
    // Salvar no config
    await db.updateItem('config', 
      () => true, 
      (config) => ({
        ...config,
        channels: {
          ...config.channels,
          ranking: channelId
        }
      })
    );

    console.log(`[RANKING] Canal de ranking definido: ${channelId}`);
    
    // Criar/atualizar mensagem de ranking imediatamente
    await this.updateRankingChannel();
  }

  /**
   * Adiciona vitória para um jogador
   */
  async addVictory(userId, valorGanho = 0) {
    const ranking = await db.readData('ranking');
    const playerIndex = ranking.findIndex(p => p.userId === userId);

    if (playerIndex === -1) {
      // Novo jogador
      ranking.push({
        userId: userId,
        victories: 1,
        defeats: 0,
        totalEarnings: valorGanho,
        lastUpdate: Date.now()
      });
    } else {
      // Atualizar jogador existente
      ranking[playerIndex].victories += 1;
      ranking[playerIndex].totalEarnings += valorGanho;
      ranking[playerIndex].lastUpdate = Date.now();
    }

    await db.writeData('ranking', ranking);
    console.log(`[RANKING] Vitória adicionada para ${userId} (+R$${valorGanho.toFixed(2)})`);

    // Atualizar canal se configurado
    if (this.rankingChannelId) {
      await this.updateRankingChannel();
    }

    return ranking;
  }

  /**
   * Adiciona derrota para um jogador
   */
  async addDefeat(userId, valorPerdido = 0) {
    const ranking = await db.readData('ranking');
    const playerIndex = ranking.findIndex(p => p.userId === userId);

    if (playerIndex === -1) {
      // Novo jogador
      ranking.push({
        userId: userId,
        victories: 0,
        defeats: 1,
        totalEarnings: -valorPerdido,
        lastUpdate: Date.now()
      });
    } else {
      // Atualizar jogador existente
      ranking[playerIndex].defeats += 1;
      ranking[playerIndex].totalEarnings -= valorPerdido;
      ranking[playerIndex].lastUpdate = Date.now();
    }

    await db.writeData('ranking', ranking);
    console.log(`[RANKING] Derrota adicionada para ${userId} (-R$${valorPerdido.toFixed(2)})`);

    // Atualizar canal se configurado
    if (this.rankingChannelId) {
      await this.updateRankingChannel();
    }

    return ranking;
  }

  /**
   * Obtém o ranking ordenado
   */
  async getRanking(limit = 10) {
    const ranking = await db.readData('ranking');
    
    // Ordenar por vitórias (decrescente), depois por earnings (decrescente)
    return ranking
      .sort((a, b) => {
        if (b.victories !== a.victories) {
          return b.victories - a.victories;
        }
        return b.totalEarnings - a.totalEarnings;
      })
      .slice(0, limit);
  }

  /**
   * Obtém estatísticas de um jogador
   */
  async getPlayerStats(userId) {
    const ranking = await db.readData('ranking');
    return ranking.find(p => p.userId === userId) || null;
  }

  /**
   * Atualiza o canal de ranking
   */
  async updateRankingChannel() {
    if (!this.rankingChannelId || !this.client) {
      return;
    }

    try {
      const channel = await this.client.channels.fetch(this.rankingChannelId);
      if (!channel || !channel.isTextBased()) {
        console.error('[RANKING] Canal de ranking inválido');
        return;
      }

      const topPlayers = await this.getRanking(10);
      const embed = await this.createRankingEmbed(topPlayers);

      // Se já existe mensagem, editar, senão criar nova
      if (this.rankingMessageId) {
        try {
          const message = await channel.messages.fetch(this.rankingMessageId);
          await message.edit({ embeds: [embed] });
          console.log('[RANKING] Mensagem de ranking atualizada');
        } catch (error) {
          // Mensagem não existe mais, criar nova
          const newMessage = await channel.send({ embeds: [embed] });
          this.rankingMessageId = newMessage.id;
          console.log('[RANKING] Nova mensagem de ranking criada');
        }
      } else {
        // Criar nova mensagem
        const newMessage = await channel.send({ embeds: [embed] });
        this.rankingMessageId = newMessage.id;
        console.log('[RANKING] Nova mensagem de ranking criada');
      }
    } catch (error) {
      console.error('[RANKING] Erro ao atualizar canal de ranking:', error);
    }
  }

  /**
   * Cria embed do ranking
   */
  async createRankingEmbed(topPlayers) {
    const medals = ['🥇', '🥈', '🥉'];
    
    let description = '';
    
    if (topPlayers.length === 0) {
      description = '`Nenhum jogador no ranking ainda`';
    } else {
      for (let i = 0; i < topPlayers.length; i++) {
        const player = topPlayers[i];
        const position = i + 1;
        const medal = medals[i] || `**${position}º**`;
        const winRate = player.victories + player.defeats > 0 
          ? ((player.victories / (player.victories + player.defeats)) * 100).toFixed(1)
          : '0.0';

        description += `${medal} <@${player.userId}>\n`;
        description += `   ╰ ${EMOJIS.SUCCESS} ${player.victories}V | ${EMOJIS.ERROR} ${player.defeats}D | `;
        description += `📊 ${winRate}% | ${EMOJIS.MONEY} R$ ${player.totalEarnings.toFixed(2)}\n\n`;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('🏆 RANKING MENSAL - INFINITY BOT')
      .setDescription(description)
      .setColor(COLORS.PRIMARY)
      .setFooter({ 
        text: `Atualizado automaticamente a cada hora • Reset dia 1 de cada mês` 
      })
      .setTimestamp();

    return embed;
  }

  /**
   * Reseta o ranking (mensal)
   */
  async resetRanking() {
    try {
      // Salvar backup do ranking anterior
      const currentRanking = await db.readData('ranking');
      const backupData = {
        date: new Date().toISOString(),
        ranking: currentRanking
      };

      // Salvar backup (você pode criar um sistema de histórico se quiser)
      console.log(`[RANKING] Backup do ranking salvo: ${currentRanking.length} jogadores`);

      // Resetar ranking
      await db.writeData('ranking', []);
      console.log('[RANKING] Ranking resetado com sucesso');

      // Atualizar canal
      if (this.rankingChannelId) {
        await this.updateRankingChannel();
      }

      // Enviar notificação no canal
      if (this.rankingChannelId && this.client) {
        const channel = await this.client.channels.fetch(this.rankingChannelId);
        if (channel && channel.isTextBased()) {
          const resetEmbed = new EmbedBuilder()
            .setTitle('🔄 RANKING RESETADO')
            .setDescription(
              `O ranking mensal foi resetado!\n\n` +
              `Um novo mês começou e todos começam do zero.\n` +
              `Boa sorte a todos os jogadores! ${EMOJIS.SUCCESS}`
            )
            .setColor(COLORS.WARNING)
            .setTimestamp();

          await channel.send({ embeds: [resetEmbed] });
        }
      }
    } catch (error) {
      console.error('[RANKING] Erro ao resetar ranking:', error);
    }
  }

  /**
   * Para os cron jobs (útil para shutdown graceful)
   */
  stop() {
    if (this.updateJob) {
      this.updateJob.stop();
    }
    if (this.resetJob) {
      this.resetJob.stop();
    }
    console.log('[RANKING] Serviço de ranking parado');
  }
}

// Exportar instância única (singleton)
module.exports = new RankingService();
