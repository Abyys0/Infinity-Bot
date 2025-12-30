// Sistema de logs melhorado

const db = require('../database');
const { EMOJIS } = require('../config/constants');

/**
 * Envia log para o canal configurado e arquivo
 */
async function sendLog(client, message, mediadorTag = null) {
  try {
    // Salva no arquivo
    await db.appendLog(message, mediadorTag);

    // Envia para o canal de logs (se configurado)
    const config = await db.readData('config');
    if (config.channels?.logs) {
      const logChannel = client.channels.cache.get(config.channels.logs);
      if (logChannel) {
        const timestamp = new Date().toLocaleString('pt-BR');
        let logMessage = `\`[${timestamp}]\` ${message}`;
        if (mediadorTag) {
          logMessage += `\n**Mediador:** ${mediadorTag}`;
        }
        await logChannel.send(logMessage);
      }
    }
  } catch (error) {
    console.error('Erro ao enviar log:', error);
  }
}

/**
 * Log de fila criada
 */
async function logQueueCreated(client, queueId, tipo, plataforma, criadorTag, jogadores) {
  const message = `${EMOJIS.GAME} Fila criada: ${tipo} ${plataforma} | ID: ${queueId} | Jogadores: ${jogadores.length} | Criador: ${criadorTag}`;
  await sendLog(client, message);
}

/**
 * Log de fila finalizada
 */
async function logQueueFinished(client, queueId, tipo, vencedor, resultado, mediadorTag) {
  const message = `${EMOJIS.SUCCESS} Fila finalizada: ${tipo} | ID: ${queueId} | Vencedor: ${vencedor} | Resultado: ${resultado}`;
  await sendLog(client, message, mediadorTag);
}

/**
 * Log de ticket criado
 */
async function logTicketCreated(client, ticketId, tipo, userTag) {
  const message = `${EMOJIS.TICKET} Ticket criado: ${tipo} | ID: ${ticketId} | Usuário: ${userTag}`;
  await sendLog(client, message);
}

/**
 * Log de ticket fechado
 */
async function logTicketClosed(client, ticketId, userTag, closedByTag) {
  const message = `${EMOJIS.TICKET} Ticket fechado: ID: ${ticketId} | Usuário: ${userTag} | Fechado por: ${closedByTag}`;
  await sendLog(client, message);
}

/**
 * Log de blacklist
 */
async function logBlacklist(client, action, userId, userTag, motivo, executorTag) {
  const emoji = action === 'add' ? EMOJIS.BLACKLIST : EMOJIS.SUCCESS;
  const actionText = action === 'add' ? 'adicionado à' : 'removido da';
  const message = `${emoji} Usuário ${actionText} blacklist: ${userTag} (${userId}) | Motivo: ${motivo || 'N/A'} | Executor: ${executorTag}`;
  await sendLog(client, message);
}

/**
 * Log de mediador
 */
async function logMediador(client, action, userId, userTag, executorTag) {
  const emoji = action === 'add' ? EMOJIS.SUCCESS : EMOJIS.WARNING;
  const actionText = action === 'add' ? 'adicionado' : action === 'remove' ? 'removido' : 'renovado';
  const message = `${emoji} Mediador ${actionText}: ${userTag} (${userId}) | Executor: ${executorTag}`;
  await sendLog(client, message);
}

/**
 * Log de analista
 */
async function logAnalista(client, action, userId, userTag, tipo, executorTag) {
  let emoji, actionText;
  
  if (action === 'enter') {
    emoji = EMOJIS.ONLINE;
    actionText = 'entrou em serviço';
  } else if (action === 'exit') {
    emoji = EMOJIS.OFFLINE;
    actionText = 'saiu de serviço';
  } else if (action === 'add') {
    emoji = EMOJIS.SUCCESS;
    actionText = 'adicionado ao sistema';
  } else if (action === 'remove') {
    emoji = EMOJIS.ERROR;
    actionText = 'removido do sistema';
  } else {
    emoji = EMOJIS.WARNING;
    actionText = action;
  }
  
  const message = `${emoji} Analista ${actionText}: ${userTag} (${userId}) | Tipo: ${tipo} | Executor: ${executorTag}`;
  await sendLog(client, message);
}

/**
 * Log de PIX configurado
 */
async function logPixConfigured(client, mediadorTag, nome, chave) {
  const message = `${EMOJIS.PIX} PIX configurado: ${mediadorTag} | Nome: ${nome} | Chave: ${chave}`;
  await sendLog(client, message, mediadorTag);
}

/**
 * Log de SS (chamado de analista)
 */
async function logSS(client, action, solicitanteId, solicitanteTag, analistaId, analistaTag, tipo) {
  const emoji = EMOJIS.WARNING;
  const message = `${emoji} SS chamada: Tipo ${tipo} | Analista: ${analistaTag} (${analistaId}) | Solicitante: ${solicitanteTag} (${solicitanteId})`;
  await sendLog(client, message);
}

/**
 * Log de erro
 */
async function logError(client, error, context = '') {
  const message = `${EMOJIS.ERROR} ERRO: ${context} | ${error.message}`;
  await sendLog(client, message);
  console.error(`[ERRO] ${context}:`, error);
}

module.exports = {
  sendLog,
  logQueueCreated,
  logQueueFinished,
  logTicketCreated,
  logTicketClosed,
  logBlacklist,
  logMediador,
  logAnalista,
  logPixConfigured,
  logSS,
  logError
};
