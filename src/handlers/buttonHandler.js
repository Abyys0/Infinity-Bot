// Handler de botões

const { createErrorEmbed } = require('../utils/embeds');
const permissions = require('../config/permissions');

// Importar handlers de botões específicos
const ownerPanelButtons = require('./buttons/ownerPanel');
const queueButtons = require('./buttons/queueButtons');
const ticketButtons = require('./buttons/ticketButtons');
const ssButtons = require('./buttons/ssButtons');
const renewalButtons = require('./buttons/renewalButtons');
const blacklistButtons = require('./buttons/blacklistButtons');

/**
 * Processa cliques em botões
 */
async function handleButton(interaction) {
  const customId = interaction.customId;

  try {
    // Botões do painel do dono
    if (customId.startsWith('owner_')) {
      return await ownerPanelButtons.handle(interaction);
    }

    // Botões de fila
    if (customId.startsWith('queue_')) {
      return await queueButtons.handle(interaction);
    }

    // Botões de ticket
    if (customId.startsWith('ticket_')) {
      return await ticketButtons.handle(interaction);
    }

    // Botões de SS
    if (customId.startsWith('ss_')) {
      return await ssButtons.handle(interaction);
    }

    // Botões de renovação
    if (customId.startsWith('renew_')) {
      return await renewalButtons.handle(interaction);
    }

    // Botões de blacklist pública
    if (customId.startsWith('blacklist_') && customId.includes('_publico')) {
      return await blacklistButtons.handlePublico(interaction);
    }

    // Botões de blacklist (painel de analista)
    if (customId.startsWith('blacklist_')) {
      return await blacklistButtons.handle(interaction);
    }

    // Botão genérico de chamar analista (dos painéis fixos)
    if (customId === 'chamar_analista' || customId === 'chamar_analista_painel') {
      // Verificar permissões
      if (!await permissions.canCallSS(interaction.member)) {
        return interaction.reply({
          embeds: [createErrorEmbed('Sem Permissão', 'Você não tem permissão para chamar analista.')],
          ephemeral: true
        });
      }

      // Criar painel de SS
      return await ssButtons.createSSPanel(interaction);
    }

    // Botão de criar ticket do painel fixo
    if (customId === 'criar_ticket_painel') {
      return await ticketButtons.criarTicketPainel(interaction);
    }

    // Botão não reconhecido
    await interaction.reply({
      content: '❌ Botão não reconhecido.',
      ephemeral: true
    });

  } catch (error) {
    console.error('❌ Erro ao processar botão:', error);
    
    // Não tentar responder aqui - deixar o handler principal lidar com isso
    throw error;
  }
}

module.exports = { handleButton };
