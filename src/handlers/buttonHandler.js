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
const multasButtons = require('./buttons/multasButtons');
const analistaButtons = require('./buttons/analistaButtons');
const mediadorButtons = require('./buttons/mediadorButtons');
const rankingButtons = require('./buttons/rankingButtons');

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

    // Botões de ranking
    if (customId.startsWith('ranking_')) {
      return await rankingButtons.handle(interaction);
    }

    // Botões de fila
    if (customId.startsWith('queue_')) {
      return await queueButtons.handle(interaction);
    }

    // Botão de criar fila do painel fixo
    if (customId.startsWith('criar_fila_')) {
      return await queueButtons.criarFilaPainel(interaction);
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
          flags: 64
        });
      }

      // Criar painel de SS
      return await ssButtons.createSSPanel(interaction);
    }

    // Botões novos de analista (Mobile/Emulador)
    if (customId.startsWith('chamar_analista_')) {
      return await analistaButtons.handle(interaction);
    }

    // Botões do painel de analista (Entrar/Sair de Serviço)
    if (customId.startsWith('analista_')) {
      return await analistaButtons.handle(interaction);
    }

    // Botões do painel de mediador
    if (customId.startsWith('mediador_')) {
      return await mediadorButtons.handle(interaction);
    }

    // Botão de criar ticket do painel fixo
    if (customId === 'criar_ticket_painel') {
      return await ticketButtons.criarTicketPainel(interaction);
    }

    // Botão de confirmar pagamento de multa
    if (customId.startsWith('confirmar_pagamento_multa_')) {
      return await multasButtons.confirmarPagamentoMulta(interaction);
    }

    // Botões das filas (entrar/sair)
    if (customId.startsWith('entrar_fila_') || customId.startsWith('sair_fila_')) {
      return await queueButtons.handle(interaction);
    }

    // Botões de confirmação de fila (gelo infinito/normal)
    if (customId.startsWith('gelo_infinito_') || customId.startsWith('gelo_normal_') || customId.startsWith('cancel_queue_') || customId.startsWith('confirmar_pagamento_')) {
      return await queueButtons.handle(interaction);
    }

    // Botão não reconhecido
    await interaction.reply({
      content: '❌ Botão não reconhecido.',
      flags: 64
    });

  } catch (error) {
    console.error('❌ Erro ao processar botão:', error);
    
    // Não tentar responder aqui - deixar o handler principal lidar com isso
    throw error;
  }
}

module.exports = { handleButton };
