// Validadores de dados

/**
 * Valida se é um ID do Discord válido
 */
function isValidDiscordId(id) {
  return /^\d{17,19}$/.test(id);
}

/**
 * Valida se é uma chave PIX válida (básico)
 */
function isValidPixKey(key) {
  // CPF/CNPJ (números), Email, Telefone, Chave aleatória
  const cpfCnpj = /^\d{11}$|^\d{14}$/;
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const telefone = /^\+?\d{10,13}$/;
  const aleatoria = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  
  return cpfCnpj.test(key) || email.test(key) || telefone.test(key) || aleatoria.test(key);
}

/**
 * Valida valor de aposta
 */
function isValidBetValue(value) {
  return typeof value === 'number' && value > 0;
}

/**
 * Valida array de valores de aposta
 */
function areValidBetValues(values) {
  return Array.isArray(values) && values.length > 0 && values.every(v => isValidBetValue(v));
}

/**
 * Valida nome de canal (Discord)
 */
function isValidChannelName(name) {
  // Discord permite letras, números, hífens e underscores
  return /^[a-z0-9_-]{1,90}$/.test(name);
}

/**
 * Sanitiza nome de canal
 */
function sanitizeChannelName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);
}

/**
 * Valida se o usuário forneceu ID e Senha separadamente
 */
function parseCredentials(message) {
  const lines = message.trim().split('\n');
  
  if (lines.length < 2) return null;
  
  const idLine = lines[0].trim();
  const senhaLine = lines[1].trim();
  
  // Remove possíveis labels
  const id = idLine.replace(/^(id|ID|Id):?\s*/i, '').trim();
  const senha = senhaLine.replace(/^(senha|SENHA|Senha|password|pass):?\s*/i, '').trim();
  
  if (id && senha) {
    return { id, senha };
  }
  
  return null;
}

/**
 * Valida quantidade de jogadores para tipo de fila
 */
function validatePlayersForQueueType(tipo, playersCount) {
  const expected = {
    '1x1': 2,
    '2x2': 4,
    '3x3': 6,
    '4x4': 8
  }[tipo];
  
  return playersCount === expected;
}

module.exports = {
  isValidDiscordId,
  isValidPixKey,
  isValidBetValue,
  areValidBetValues,
  isValidChannelName,
  sanitizeChannelName,
  parseCredentials,
  validatePlayersForQueueType
};
