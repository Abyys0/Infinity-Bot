// Handler de modais

const { createErrorEmbed } = require('../utils/embeds');

// Importar handlers de modais específicos
const ownerPanelModals = require('./modals/ownerPanel');
const blacklistModals = require('./modals/blacklist');
const pixModals = require('./modals/pix');
const pixPessoalModals = require('./modals/pixPessoal');
const ticketModals = require('./modals/ticket');

/**
 * Processa envios de modais
 */
async function handleModal(interaction) {
  const customId = interaction.customId;

  try {
    // Modais do painel do dono
    if (customId.startsWith('modal_owner_')) {
      return await ownerPanelModals.handle(interaction);
    }

    // Modais de blacklist
    if (customId.startsWith('modal_blacklist_')) {
      return await blacklistModals.handle(interaction);
    }

    // Modais de PIX
    if (customId.startsWith('modal_pix_')) {
      return await pixModals.handle(interaction);
    }

    // Modais de PIX pessoal (mediador e analista)
    if (customId === 'modal_mediador_pix' || customId === 'modal_analista_pix') {
      return await pixPessoalModals.handle(interaction);
    }

    // Modals de ticket
    if (customId.startsWith('modal_close_ticket_') || customId.startsWith('modal_add_member_ticket_')) {
      return await ticketModals.handle(interaction);
    }

    // Modal não reconhecido
    await interaction.reply({
      content: '❌ Modal não reconhecido.',
      flags: 64
    });

  } catch (error) {
    console.error('❌ Erro ao processar modal:', error);
    
    // Não tentar responder aqui - deixar o handler principal lidar com isso
    throw error;
  }
}

module.exports = { handleModal };
