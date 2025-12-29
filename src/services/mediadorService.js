// Service de Mediadores

const db = require('../database');
const { DURATIONS, EMOJIS } = require('../config/constants');
const { createWarningEmbed, createSuccessEmbed } = require('../utils/embeds');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

/**
 * Adiciona um mediador com prazo de 1 semana
 */
async function addMediador(guild, userId, roleId, addedBy) {
  const mediadores = await db.readData('mediadores');
  
  // Verificar se já é mediador
  const existing = mediadores.find(m => m.userId === userId && m.active);
  if (existing) {
    return { success: false, message: 'Usuário já é mediador ativo' };
  }

  const expiresAt = Date.now() + DURATIONS.MEDIATOR_ROLE;
  
  const mediador = {
    userId,
    roleId,
    addedBy,
    addedAt: Date.now(),
    expiresAt,
    active: true,
    renewalNotified: false
  };

  await db.addItem('mediadores', mediador);

  // Adicionar cargo ao membro
  try {
    const member = await guild.members.fetch(userId);
    await member.roles.add(roleId);
  } catch (error) {
    console.error('Erro ao adicionar cargo de mediador:', error);
    return { success: false, message: 'Erro ao adicionar cargo' };
  }

  return { success: true, mediador };
}

/**
 * Remove mediador
 */
async function removeMediador(guild, userId) {
  const removed = await db.updateItem('mediadores',
    m => m.userId === userId && m.active,
    m => ({ ...m, active: false, removedAt: Date.now() })
  );

  if (!removed) {
    return { success: false, message: 'Mediador não encontrado' };
  }

  // Remover cargo
  try {
    const member = await guild.members.fetch(userId);
    await member.roles.remove(removed.roleId);
  } catch (error) {
    console.error('Erro ao remover cargo de mediador:', error);
  }

  return { success: true };
}

/**
 * Renova mediador por mais 1 semana
 */
async function renewMediador(userId) {
  const renewed = await db.updateItem('mediadores',
    m => m.userId === userId && m.active,
    m => ({
      ...m,
      expiresAt: Date.now() + DURATIONS.MEDIATOR_ROLE,
      renewalNotified: false,
      lastRenewal: Date.now()
    })
  );

  if (!renewed) {
    return { success: false, message: 'Mediador não encontrado' };
  }

  return { success: true, mediador: renewed };
}

/**
 * Cria canal de renovação para mediador
 */
async function createRenewalChannel(client, mediador) {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return null;

  try {
    const member = await guild.members.fetch(mediador.userId);
    const owner = await guild.members.fetch(process.env.OWNER_ID);

    const channelName = `renovacao-${member.user.username}`.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: member.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
        },
        {
          id: owner.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels]
        }
      ]
    });

    // Criar embed e botões
    const embed = createWarningEmbed(
      'Renovação de Mediador',
      `${EMOJIS.CLOCK} **Olá ${member}!**\n\nSeu cargo de mediador expira em breve.\n\n**Data de expiração:** ${new Date(mediador.expiresAt).toLocaleString('pt-BR')}\n\n**Deseja renovar por mais 1 semana?**\n\nClique em um dos botões abaixo:`
    );

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`renew_yes_${mediador.userId}`)
          .setLabel('Sim, renovar')
          .setStyle(ButtonStyle.Success)
          .setEmoji(EMOJIS.SUCCESS),
        new ButtonBuilder()
          .setCustomId(`renew_no_${mediador.userId}`)
          .setLabel('Não, sair')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(EMOJIS.ERROR)
      );

    await channel.send({
      content: `${member} ${owner}`,
      embeds: [embed],
      components: [row]
    });

    // Atualizar mediador com canal de renovação
    await db.updateItem('mediadores',
      m => m.userId === mediador.userId,
      m => ({ ...m, renewalChannelId: channel.id, renewalNotified: true })
    );

    return channel;
  } catch (error) {
    console.error('Erro ao criar canal de renovação:', error);
    return null;
  }
}

/**
 * Verificador automático de renovações (roda a cada 10 minutos)
 */
function startMediatorRenewalChecker(client) {
  console.log('🔄 Verificador de renovação de mediadores iniciado');

  setInterval(async () => {
    try {
      const mediadores = await db.readData('mediadores');
      const now = Date.now();
      const warningTime = DURATIONS.WARNING_BEFORE_EXPIRY; // 1 dia antes

      for (const mediador of mediadores) {
        if (!mediador.active) continue;

        const timeUntilExpiry = mediador.expiresAt - now;

        // Se falta 1 dia ou menos e ainda não foi notificado
        if (timeUntilExpiry <= warningTime && timeUntilExpiry > 0 && !mediador.renewalNotified) {
          await createRenewalChannel(client, mediador);
        }

        // Se já expirou, remover
        if (timeUntilExpiry <= 0) {
          const guild = client.guilds.cache.get(process.env.GUILD_ID);
          if (guild) {
            await removeMediador(guild, mediador.userId);
            
            // Fechar canal de renovação se existir
            if (mediador.renewalChannelId) {
              try {
                const channel = await guild.channels.fetch(mediador.renewalChannelId);
                if (channel) await channel.delete();
              } catch (err) {
                console.error('Erro ao deletar canal de renovação:', err);
              }
            }

            console.log(`⏰ Mediador ${mediador.userId} removido automaticamente (expirou)`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro no verificador de renovação:', error);
    }
  }, DURATIONS.RENEWAL_CHECK);
}

/**
 * Lista mediadores ativos
 */
async function getActiveMediadores() {
  const mediadores = await db.readData('mediadores');
  return mediadores.filter(m => m.active);
}

module.exports = {
  addMediador,
  removeMediador,
  renewMediador,
  createRenewalChannel,
  startMediatorRenewalChecker,
  getActiveMediadores
};
