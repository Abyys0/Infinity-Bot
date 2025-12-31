// Sistema de permissões

const db = require('../database');

// Cache de configuração (atualiza a cada 30 segundos)
let configCache = null;
let lastConfigFetch = 0;
const CONFIG_CACHE_TTL = 30000; // 30 segundos

async function getConfig() {
  const now = Date.now();
  if (!configCache || (now - lastConfigFetch) > CONFIG_CACHE_TTL) {
    try {
      configCache = await db.readData('config');
      lastConfigFetch = now;
    } catch (error) {
      console.error('Erro ao carregar config:', error);
      configCache = { roles: {}, taxes: {} };
    }
  }
  return configCache;
}

/**
 * Verifica se o usuário tem cargo de dono
 */
async function isOwner(userId, member = null) {
  if (!member) {
    console.log(`❌ isOwner chamado sem member para ${userId}`);
    return false;
  }
  
  try {
    // Verificar se OWNER_ID está definido
    if (!process.env.OWNER_ID) {
      console.error('❌ OWNER_ID não está definido nas variáveis de ambiente');
      return false;
    }
    
    const ownerRoleIds = process.env.OWNER_ID.split(',').map(id => id.trim());
    const hasOwnerRole = member.roles.cache.some(role => ownerRoleIds.includes(role.id));
    
    if (hasOwnerRole) {
      console.log(`✅ ${userId} tem cargo de dono`);
    } else {
      console.log(`❌ ${userId} NÃO tem cargo de dono. Cargos do usuário:`, member.roles.cache.map(r => r.id).join(', '));
      console.log(`   Cargos de dono esperados:`, ownerRoleIds.join(', '));
    }
    
    return hasOwnerRole;
  } catch (error) {
    console.error('❌ Erro ao verificar permissão de dono:', error);
    return false;
  }
}

/**
 * Verifica se o usuário tem um cargo específico
 */
async function hasRole(member, roleIds) {
  if (!roleIds || !Array.isArray(roleIds)) return false;
  return member.roles.cache.some(role => roleIds.includes(role.id));
}

/**
 * Verifica se o usuário tem cargo de mediador
 */
async function isMediador(member) {
  const config = await getConfig();
  const mediadorRoles = config.roles?.mediador || [];
  return hasRole(member, mediadorRoles);
}

/**
 * Verifica se o usuário tem cargo de analista
 */
async function isAnalista(member) {
  const config = await getConfig();
  const analistaRoles = config.roles?.analista || [];
  return hasRole(member, analistaRoles);
}

/**
 * Verifica se o usuário tem cargo de staff
 */
async function isStaff(member) {
  const config = await db.readData('config');
  const staffRoles = config.roles?.staff || [];
  return hasRole(member, staffRoles);
}

/**
 * Verifica se o usuário tem cargo de suporte
 */
async function isSuporte(member) {
  const config = await db.readData('config');
  const suporteRoles = config.roles?.suporte || [];
  return hasRole(member, suporteRoles);
}

/**
 * Verifica se o usuário pode chamar SS
 */
async function canCallSS(member) {
  const config = await db.readData('config');
  const ssRoles = config.roles?.ss || [];
  return hasRole(member, ssRoles) || await isMediador(member) || await isStaff(member) || await isSuporte(member);
}

/**
 * Verifica se o usuário pode atender tickets
 */
async function canAttendTickets(member) {
  const config = await db.readData('config');
  const attendantRoles = config.roles?.ticketAttendants || [];
  return hasRole(member, attendantRoles);
}

/**
 * Verifica se o usuário está na blacklist
 */
async function isBlacklisted(userId) {
  const blacklist = await db.readData('blacklist');
  return blacklist.some(entry => entry.userId === userId);
}

/**
 * Obtém entrada da blacklist de um usuário
 */
async function getBlacklistEntry(userId) {
  const blacklist = await db.readData('blacklist');
  return blacklist.find(entry => entry.userId === userId);
}

/**
 * Verifica se o usuário é mediador ou superior (staff/dono)
 */
async function isMediadorOrAbove(member) {
  if (await isOwner(member.user.id, member)) return true;
  if (await isStaff(member)) return true;
  if (await isMediador(member)) return true;
  return false;
}

module.exports = {
  isOwner,
  hasRole,
  isMediador,
  isAnalista,
  isStaff,
  isSuporte,
  canCallSS,
  canAttendTickets,
  isBlacklisted,
  getBlacklistEntry,
  isMediadorOrAbove
};
