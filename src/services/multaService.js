// Service de Multas

const db = require('../database');

/**
 * Verifica se um usuário tem multa pendente
 */
async function temMultaPendente(userId) {
  const multas = await db.readData('multas');
  return multas.some(m => m.userId === userId && m.status === 'pendente');
}

/**
 * Retorna a multa pendente de um usuário
 */
async function getMultaPendente(userId) {
  const multas = await db.readData('multas');
  return multas.find(m => m.userId === userId && m.status === 'pendente');
}

module.exports = {
  temMultaPendente,
  getMultaPendente
};
