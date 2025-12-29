// Utilitários para criar embeds padronizados

const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../config/constants');

/**
 * Cria embed base do INFINITY BOT
 */
function createBaseEmbed(title, description, color = COLORS.PRIMARY) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: 'INFINITY BOT • Sistema de Apostado Free Fire' });
}

/**
 * Cria embed de sucesso
 */
function createSuccessEmbed(title, description) {
  return createBaseEmbed(
    `${EMOJIS.SUCCESS} ${title}`,
    description,
    COLORS.SUCCESS
  );
}

/**
 * Cria embed de erro
 */
function createErrorEmbed(title, description) {
  return createBaseEmbed(
    `${EMOJIS.ERROR} ${title}`,
    description,
    COLORS.ERROR
  );
}

/**
 * Cria embed de aviso
 */
function createWarningEmbed(title, description) {
  return createBaseEmbed(
    `${EMOJIS.WARNING} ${title}`,
    description,
    COLORS.WARNING
  );
}

/**
 * Cria embed de informação
 */
function createInfoEmbed(title, description) {
  return createBaseEmbed(
    `${EMOJIS.LOADING} ${title}`,
    description,
    COLORS.INFO
  );
}

/**
 * Cria embed de blacklist
 */
function createBlacklistEmbed(user, motivo, addedBy, date) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.BLACKLIST)
    .setTitle(`${EMOJIS.BLACKLIST} BLACKLIST`)
    .setDescription(`**Usuário:** ${user.tag} (${user.id})\n**Motivo:** ${motivo}`)
    .addFields(
      { name: 'Adicionado por', value: `<@${addedBy}>`, inline: true },
      { name: 'Data', value: new Date(date).toLocaleString('pt-BR'), inline: true }
    )
    .setThumbnail(user.displayAvatarURL())
    .setTimestamp()
    .setFooter({ text: 'INFINITY BOT • Sistema de Blacklist' });
  
  return embed;
}

/**
 * Cria embed de fila
 */
function createQueueEmbed(tipo, plataforma, valor, jogadores) {
  const platformEmoji = {
    mobile: EMOJIS.MOBILE,
    emulador: EMOJIS.PC,
    misto: EMOJIS.MIXED
  }[plataforma] || EMOJIS.GAME;

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.GAME} Fila ${tipo} ${platformEmoji} ${plataforma.toUpperCase()}`)
    .setDescription(`**Valor:** R$ ${valor}\n**Jogadores:** ${jogadores.map(id => `<@${id}>`).join(', ')}`)
    .setTimestamp()
    .setFooter({ text: 'INFINITY BOT • Sistema de Filas' });
  
  return embed;
}

/**
 * Cria embed de ranking
 */
function createRankingEmbed(rankingData) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.TROPHY} RANKING DE APOSTADOS`)
    .setDescription('Top jogadores por vitórias em apostados')
    .setTimestamp()
    .setFooter({ text: 'INFINITY BOT • Ranking' });

  rankingData.slice(0, 10).forEach((entry, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
    embed.addFields({
      name: `${medal} ${entry.username}`,
      value: `**Vitórias:** ${entry.wins} | **W.O:** ${entry.wo} | **Total:** ${entry.total}`,
      inline: false
    });
  });

  return embed;
}

/**
 * Cria embed do painel do dono
 */
function createOwnerPanelEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.SHIELD} PAINEL DO DONO`)
    .setDescription('Gerencie todas as configurações do INFINITY BOT')
    .addFields(
      { name: `${EMOJIS.USER} Mediadores`, value: 'Adicionar e gerenciar mediadores', inline: true },
      { name: `${EMOJIS.MONEY} Taxas`, value: 'Configurar taxas de mediador e analista', inline: true },
      { name: `${EMOJIS.TEAM} Cargos`, value: 'Configurar cargos do sistema', inline: true },
      { name: `${EMOJIS.GAME} Canais`, value: 'Configurar canais do sistema', inline: true },
      { name: `${EMOJIS.TICKET} Tickets`, value: 'Criar painéis de ticket', inline: true },
      { name: `${EMOJIS.LOG} Mensagens`, value: 'Enviar mensagens customizadas', inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'INFINITY BOT • Painel do Dono' });
}

module.exports = {
  createBaseEmbed,
  createSuccessEmbed,
  createErrorEmbed,
  createWarningEmbed,
  createInfoEmbed,
  createBlacklistEmbed,
  createQueueEmbed,
  createRankingEmbed,
  createOwnerPanelEmbed
};
