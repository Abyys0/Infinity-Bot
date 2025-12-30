// Handler de mensagens (detecta credenciais em filas e registra logs)

const db = require('../database');
const { parseCredentials } = require('../utils/validators');
const { QUEUE_STATUS, EMOJIS } = require('../config/constants');
const { createInfoEmbed } = require('../utils/embeds');

/**
 * Registra mensagem para histórico
 */
async function logMessage(message) {
  try {
    const messageLog = {
      id: message.id,
      channelId: message.channel.id,
      channelName: message.channel.name,
      authorId: message.author.id,
      authorTag: message.author.tag,
      content: message.content,
      timestamp: message.createdTimestamp,
      attachments: message.attachments.map(a => ({ url: a.url, name: a.name })),
      embeds: message.embeds.length > 0 ? message.embeds.map(e => e.toJSON()) : [],
      deleted: false
    };

    await db.addItem('messageLogs', messageLog);
  } catch (error) {
    console.error('Erro ao registrar mensagem:', error);
  }
}

/**
 * Processa mensagens enviadas (detecta ID/Senha em canais de fila)
 */
async function handleMessage(message, client) {
  // Ignorar bots
  if (message.author.bot) return;

  // Verificar se é um canal de fila ou ticket para registrar
  const queues = await db.readData('queues');
  const tickets = await db.readData('tickets');
  
  const isQueueChannel = queues.find(q => q.channelId === message.channel.id);
  const isTicketChannel = tickets.find(t => t.channelId === message.channel.id);

  // Registrar mensagem se for de fila ou ticket
  if (isQueueChannel || isTicketChannel) {
    await logMessage(message);
  }

  // Verificar se é um canal de fila CONFIRMADA
  const queue = queues.find(q => q.channelId === message.channel.id && q.status === QUEUE_STATUS.CONFIRMED);
  
  if (!queue) return;

  // Tentar fazer parse de credenciais
  const credentials = parseCredentials(message.content);
  
  if (credentials) {
    // Credenciais detectadas! Atualizar status da fila
    await db.updateItem('queues', 
      q => q.channelId === message.channel.id,
      q => ({
        ...q,
        status: QUEUE_STATUS.PLAYING,
        credentials: credentials,
        credentialsSentAt: Date.now(),
        credentialsSentBy: message.author.id
      })
    );

    // Deletar mensagem com credenciais por segurança
    try {
      await message.delete();
    } catch (err) {
      console.error('Erro ao deletar mensagem de credenciais:', err);
    }

    // Enviar confirmação
    const embed = createInfoEmbed(
      'Credenciais Recebidas',
      `${EMOJIS.SUCCESS} **ID e Senha recebidos!**\n\n${EMOJIS.GAME} **Partida em andamento**\n${EMOJIS.MONEY} **Valor:** R$ ${queue.value}\n\n${EMOJIS.WARNING} Aguarde o término da partida.\nO mediador finalizará com \`/finalizar\`.`
    );

    await message.channel.send({ embeds: [embed] });

    // Notificar mediador (se houver)
    if (queue.mediadorId) {
      try {
        const mediador = await client.users.fetch(queue.mediadorId);
        await mediador.send(`${EMOJIS.GAME} Credenciais recebidas na fila ${message.channel.name}!\nID: ${credentials.id}\nSenha: ${credentials.senha}`);
      } catch (err) {
        console.error('Erro ao notificar mediador:', err);
      }
    }
  }
}

module.exports = { handleMessage };
