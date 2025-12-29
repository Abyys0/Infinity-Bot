// Constantes do INFINITY BOT

// Cores dos embeds
const COLORS = {
  PRIMARY: '#00CED1',      // Ciano INFINITY
  SUCCESS: '#00FF00',      // Verde
  ERROR: '#FF0000',        // Vermelho
  WARNING: '#FFAA00',      // Amarelo
  INFO: '#0099FF',         // Azul
  BLACKLIST: '#000000'     // Preto
};

// Emojis
const EMOJIS = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  LOADING: '⏳',
  MONEY: '💰',
  TROPHY: '🏆',
  FIRE: '🔥',
  SHIELD: '🛡️',
  STAR: '⭐',
  CLOCK: '⏰',
  USER: '👤',
  TEAM: '👥',
  GAME: '🎮',
  MOBILE: '📱',
  PC: '🖥️',
  MIXED: '🔀',
  TICKET: '🎫',
  LOG: '📝',
  PIX: '💳',
  BLACKLIST: '🚫',
  SS: '📸',
  ONLINE: '🟢',
  OFFLINE: '⚪',
  MEDIATOR: '👔',
  ANALYST: '🎯',
  SEARCH: '🔍',
  LIST: '📋'
};

// Durações em milissegundos
const DURATIONS = {
  MEDIATOR_ROLE: 7 * 24 * 60 * 60 * 1000, // 7 dias
  RENEWAL_CHECK: 10 * 60 * 1000,           // 10 minutos
  WARNING_BEFORE_EXPIRY: 24 * 60 * 60 * 1000 // 1 dia antes
};

// Limites
const LIMITS = {
  MAX_CHANNEL_NAME: 90,
  MAX_EMBED_FIELDS: 25,
  MAX_EMBED_DESCRIPTION: 4096
};

// Tipos de fila
const QUEUE_TYPES = {
  '1x1': { players: 2, label: '1v1' },
  '2x2': { players: 4, label: '2v2' },
  '3x3': { players: 6, label: '3v3' },
  '4x4': { players: 8, label: '4v4' }
};

// Plataformas
const PLATFORMS = {
  MOBILE: 'mobile',
  EMULATOR: 'emulador',
  MIXED: 'misto',
  TACTICAL: 'tatico'
};

// Tipos de analista
const ANALYST_TYPES = {
  MOBILE: 'mobile',
  EMULATOR: 'emulador'
};

// Tipos de ticket
const TICKET_TYPES = {
  SUPPORT: 'suporte',
  VACANCIES: 'vagas'
};

// Status de fila
const QUEUE_STATUS = {
  WAITING: 'waiting',         // Aguardando confirmação
  CONFIRMED: 'confirmed',     // Confirmado, aguardando creds
  PLAYING: 'playing',         // Jogando
  PAYMENT: 'payment',         // Aguardando pagamento
  COMPLETED: 'completed',     // Finalizado
  CANCELLED: 'cancelled'      // Cancelado
};

// Status de ticket
const TICKET_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed'
};

// Tipos de vitória para ranking
const WIN_TYPES = {
  NORMAL: 'normal',
  WO: 'wo'
};

// Valores padrão de apostas
const DEFAULT_BET_VALUES = [1, 2, 5, 10, 20, 50, 100];

module.exports = {
  COLORS,
  EMOJIS,
  DURATIONS,
  LIMITS,
  QUEUE_TYPES,
  PLATFORMS,
  ANALYST_TYPES,
  TICKET_TYPES,
  QUEUE_STATUS,
  TICKET_STATUS,
  WIN_TYPES,
  DEFAULT_BET_VALUES
};
