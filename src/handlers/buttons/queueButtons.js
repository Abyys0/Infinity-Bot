// Handler de botões de confirmação de fila

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { EMOJIS, COLORS } = require('../../config/constants');
const db = require('../../database');
const logger = require('../../utils/logger');
const { getActiveMediadores } = require('../../services/mediadorService');

/**
 * Processa a confirmação completa da fila quando todos confirmam
 */
async function processarFilaConfirmada(interaction, fila, filaId) {
  // Selecionar mediador ativo
  const mediadores = await getActiveMediadores();
  const mediadoresOnDuty = mediadores.filter(m => m.onDuty);
  const mediadorSelecionado = mediadoresOnDuty.length > 0 
    ? mediadoresOnDuty[Math.floor(Math.random() * mediadoresOnDuty.length)]
    : null;

  // Atualizar status da fila
  await db.updateItem('filas',
    f => f.id === filaId,
    f => ({
      ...f,
      status: 'confirmada',
      confirmadaEm: Date.now(),
      mediadorId: mediadorSelecionado?.userId || null
    })
  );

  // Buscar dados do PIX
  const pixData = await db.readData('pix');
  const pixInfo = pixData && pixData.length > 0 ? pixData[0] : null;

  // Calcular valores
  const valorPorJogador = fila.valor;
  const totalTime = valorPorJogador * fila.time1.length;
  const valorReceber = totalTime * 2; // Total que será recebido após ganhar
  const taxaMediador = Math.ceil(totalTime * 0.10); // 10% para mediador
  const valorFinal = totalTime - taxaMediador;

  // Atualizar mensagem original
  const confirmadaEmbed = new EmbedBuilder()
    .setTitle(`${EMOJIS.SUCCESS} Fila Confirmada`)
    .setDescription(
      `**Fila ID:** \`${filaId}\`\n` +
      `**Tipo:** ${fila.tipo} ${fila.plataforma}\n` +
      `**Jogadores:** ${fila.time1.length + fila.time2.length}\n\n` +
      `${EMOJIS.SUCCESS} Todos os jogadores confirmaram!\n` +
      `**Status:** Aguardando pagamento...`
    )
    .addFields(
      { 
        name: '🔥 Time 1 (Gelo Infinito)', 
        value: fila.time1.map(id => `<@${id}>`).join('\n'), 
        inline: true 
      },
      { 
        name: '❄️ Time 2 (Gelo Normal)', 
        value: fila.time2.map(id => `<@${id}>`).join('\n'), 
        inline: true 
      },
      {
        name: `${EMOJIS.MONEY} Informações de Pagamento`,
        value: 
          `**Valor por jogador:** R$ ${valorPorJogador.toFixed(2)}\n` +
          `**Total do time:** R$ ${totalTime.toFixed(2)}\n` +
          `**Valor a receber (se ganhar):** R$ ${valorReceber.toFixed(2)}\n` +
          `**Taxa mediador:** R$ ${taxaMediador.toFixed(2)}\n` +
          `**Valor final (cada time):** R$ ${valorFinal.toFixed(2)}`,
        inline: false
      }
    )
    .setColor(COLORS.SUCCESS)
    .setTimestamp();

  // Se houver mediador, adicionar informação
  if (mediadorSelecionado) {
    confirmadaEmbed.addFields({
      name: `${EMOJIS.MEDIATOR} Mediador Responsável`,
      value: `<@${mediadorSelecionado.userId}>`,
      inline: false
    });
  }

  // Adicionar informações do PIX se disponível
  if (pixInfo) {
    const pixEmbed = new EmbedBuilder()
      .setTitle(`${EMOJIS.MONEY} Informações de Pagamento PIX`)
      .setDescription('**Envie o comprovante após realizar o pagamento!**')
      .addFields(
        { name: '📝 Tipo de Chave', value: pixInfo.tipoChave || 'Não configurado', inline: true },
        { name: '🔑 Chave PIX', value: `\`${pixInfo.chave || 'Não configurado'}\``, inline: true },
        { name: '👤 Nome', value: pixInfo.nome || 'Não configurado', inline: true },
        { name: `${EMOJIS.MONEY} Valor a Pagar (cada time)`, value: `**R$ ${valorFinal.toFixed(2)}**`, inline: false }
      )
      .setColor(COLORS.PRIMARY)
      .setTimestamp();

    // Se houver imagem QR Code
    if (pixInfo.imagemUrl) {
      pixEmbed.setImage(pixInfo.imagemUrl);
    }

    // Botão para mediador confirmar pagamento
    const mediadorRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`confirmar_pagamento_${filaId}`)
          .setLabel('Confirmar Pagamento Recebido')
          .setStyle(ButtonStyle.Success)
          .setEmoji(EMOJIS.MONEY)
      );

    // Enviar informações do PIX no canal
    const channel = await interaction.guild.channels.fetch(filaId);
    await channel.send({
      content: mediadorSelecionado ? `<@${mediadorSelecionado.userId}> - Mediador responsável por esta fila` : '⚠️ Nenhum mediador ativo disponível',
      embeds: [pixEmbed],
      components: [mediadorRow]
    });
  }

  await interaction.message.edit({
    embeds: [confirmadaEmbed],
    components: [] // Remove os botões de confirmação
  });

  return {
    success: true,
    pixInfo: pixInfo !== null
  };
}

module.exports = {
  async handle(interaction) {
    const customId = interaction.customId;

    // confirmar_pagamento_FILAID
    if (customId.startsWith('confirmar_pagamento_')) {
      return await this.handleConfirmarPagamento(interaction);
    }

    // gelo_infinito_FILAID
    if (customId.startsWith('gelo_infinito_')) {
      return await this.handleGeloInfinito(interaction);
    }

    // gelo_normal_FILAID
    if (customId.startsWith('gelo_normal_')) {
      return await this.handleGeloNormal(interaction);
    }

    // cancel_queue_FILAID
    if (customId.startsWith('cancel_queue_')) {
      return await this.handleCancelarFila(interaction);
    }

    await interaction.reply({
      content: '❌ Botão não reconhecido.',
      flags: 64
    });
  },

  /**
   * Handler para botão de confirmar gelo infinito
   */
  async handleGeloInfinito(interaction) {
    const filaId = interaction.customId.split('_')[2]; // gelo_infinito_FILAID
    
    const filas = await db.readData('filas');
    const fila = filas.find(f => f.id === filaId);

    if (!fila) {
      return interaction.reply({
        embeds: [createErrorEmbed('Fila Não Encontrada', 'Esta fila não existe mais.')],
        flags: 64
      });
    }

    if (fila.status === 'confirmada') {
      return interaction.reply({
        embeds: [createErrorEmbed('Fila Confirmada', 'Esta fila já foi confirmada!')],
        flags: 64
      });
    }

    if (fila.status === 'cancelada') {
      return interaction.reply({
        embeds: [createErrorEmbed('Fila Cancelada', 'Esta fila foi cancelada.')],
        flags: 64
      });
    }

    // Verificar se usuário é do Time 1 (Gelo Infinito)
    if (!fila.time1.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Não Autorizado', 'Você não faz parte do Time 1 (Gelo Infinito)!')],
        flags: 64
      });
    }

    // Verificar se já confirmou
    if (fila.confirmacoesTime1?.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Já Confirmado', 'Você já confirmou sua participação!')],
        flags: 64
      });
    }

    // Adicionar confirmação
    const confirmacoesTime1 = fila.confirmacoesTime1 || [];
    confirmacoesTime1.push(interaction.user.id);

    await db.updateItem('filas',
      f => f.id === filaId,
      f => ({
        ...f,
        confirmacoesTime1
      })
    );

    // Verificar se todos confirmaram
    const todosConfirmados = 
      confirmacoesTime1.length === fila.time1.length &&
      (fila.confirmacoesTime2?.length || 0) === fila.time2.length;

    if (todosConfirmados) {
      const resultado = await processarFilaConfirmada(interaction, fila, filaId);

      await interaction.reply({
        embeds: [createSuccessEmbed(
          'Confirmado',
          `${EMOJIS.SUCCESS} Você confirmou sua participação!\n\n**Todos confirmaram!** ${resultado.pixInfo ? 'Informações de pagamento enviadas no canal.' : 'Configure o PIX no painel do dono.'}`
        )],
        flags: 64
      });
    } else {
      await interaction.reply({
        embeds: [createSuccessEmbed(
          'Confirmado',
          `${EMOJIS.SUCCESS} Você confirmou sua participação!\n\n**Aguardando:** ${fila.time1.length + fila.time2.length - confirmacoesTime1.length - (fila.confirmacoesTime2?.length || 0)} jogador(es)`
        )],
        flags: 64
      });
    }
  },

  /**
   * Handler para botão de confirmar gelo normal
   */
  async handleGeloNormal(interaction) {
    const filaId = interaction.customId.split('_')[2]; // gelo_normal_FILAID
    
    const filas = await db.readData('filas');
    const fila = filas.find(f => f.id === filaId);

    if (!fila) {
      return interaction.reply({
        embeds: [createErrorEmbed('Fila Não Encontrada', 'Esta fila não existe mais.')],
        flags: 64
      });
    }

    if (fila.status === 'confirmada') {
      return interaction.reply({
        embeds: [createErrorEmbed('Fila Confirmada', 'Esta fila já foi confirmada!')],
        flags: 64
      });
    }

    if (fila.status === 'cancelada') {
      return interaction.reply({
        embeds: [createErrorEmbed('Fila Cancelada', 'Esta fila foi cancelada.')],
        flags: 64
      });
    }

    // Verificar se usuário é do Time 2 (Gelo Normal)
    if (!fila.time2.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Não Autorizado', 'Você não faz parte do Time 2 (Gelo Normal)!')],
        flags: 64
      });
    }

    // Verificar se já confirmou
    if (fila.confirmacoesTime2?.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Já Confirmado', 'Você já confirmou sua participação!')],
        flags: 64
      });
    }

    // Adicionar confirmação
    const confirmacoesTime2 = fila.confirmacoesTime2 || [];
    confirmacoesTime2.push(interaction.user.id);

    await db.updateItem('filas',
      f => f.id === filaId,
      f => ({
        ...f,
        confirmacoesTime2
      })
    );

    // Verificar se todos confirmaram
    const todosConfirmados = 
      (fila.confirmacoesTime1?.length || 0) === fila.time1.length &&
      confirmacoesTime2.length === fila.time2.length;

    if (todosConfirmados) {
      const resultado = await processarFilaConfirmada(interaction, fila, filaId);

      await interaction.reply({
        embeds: [createSuccessEmbed(
          'Confirmado',
          `${EMOJIS.SUCCESS} Você confirmou sua participação!\n\n**Todos confirmaram!** ${resultado.pixInfo ? 'Informações de pagamento enviadas no canal.' : 'Configure o PIX no painel do dono.'}`
        )],
        flags: 64
      });
    } else {
      await interaction.reply({
        embeds: [createSuccessEmbed(
          'Confirmado',
          `${EMOJIS.SUCCESS} Você confirmou sua participação!\n\n**Aguardando:** ${fila.time1.length + fila.time2.length - (fila.confirmacoesTime1?.length || 0) - confirmacoesTime2.length} jogador(es)`
        )],
        flags: 64
      });
    }
  },

  /**   * Handler para mediador confirmar pagamento recebido
   */
  async handleConfirmarPagamento(interaction) {
    const filaId = interaction.customId.split('_')[2]; // confirmar_pagamento_FILAID
    
    const filas = await db.readData('filas');
    const fila = filas.find(f => f.id === filaId);

    if (!fila) {
      return interaction.reply({
        embeds: [createErrorEmbed('Fila Não Encontrada', 'Esta fila não existe mais.')],
        flags: 64
      });
    }

    // Verificar se é mediador
    const permissions = require('../../config/permissions');
    const isMediador = await permissions.isMediadorOrAbove(interaction.member);
    
    if (!isMediador) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas mediadores podem confirmar o pagamento.')],
        flags: 64
      });
    }

    if (fila.pagamentoConfirmado) {
      return interaction.reply({
        embeds: [createErrorEmbed('Já Confirmado', 'O pagamento desta fila já foi confirmado!')],
        flags: 64
      });
    }

    // Calcular valores
    const valorPorJogador = fila.valor;
    const totalTime = valorPorJogador * fila.time1.length;
    const taxaMediador = Math.ceil(totalTime * 0.10);
    const valorFinal = totalTime - taxaMediador;
    const valorReceber = totalTime * 2;

    // Confirmar pagamento
    await db.updateItem('filas',
      f => f.id === filaId,
      f => ({
        ...f,
        pagamentoConfirmado: true,
        pagamentoConfirmadoPor: interaction.user.id,
        pagamentoConfirmadoEm: Date.now()
      })
    );

    // Renomear canal com o valor que será recebido
    try {
      const channel = await interaction.guild.channels.fetch(filaId);
      const novoNome = `apostado-${valorReceber.toFixed(0)}r`;
      await channel.setName(novoNome);
      
      // Enviar confirmação no canal
      const confirmEmbed = new EmbedBuilder()
        .setTitle(`${EMOJIS.SUCCESS} Pagamento Confirmado`)
        .setDescription(
          `**Mediador:** ${interaction.user}\n` +
          `**Status:** Pagamento recebido e conferido\n\n` +
          `${EMOJIS.MONEY} **Informações:**\n` +
          `**Valor pago por time:** R$ ${valorFinal.toFixed(2)}\n` +
          `**Valor total a receber (time vencedor):** R$ ${valorReceber.toFixed(2)}\n\n` +
          `${EMOJIS.FIRE} **A partida pode começar!**\n` +
          `Boa sorte e bom jogo!`
        )
        .setColor(COLORS.SUCCESS)
        .setTimestamp();

      await channel.send({
        content: `${fila.time1.map(id => `<@${id}>`).join(' ')} ${fila.time2.map(id => `<@${id}>`).join(' ')}`,
        embeds: [confirmEmbed]
      });

      // Desabilitar botão
      await interaction.message.edit({
        components: []
      });

      await interaction.reply({
        embeds: [createSuccessEmbed(
          'Pagamento Confirmado',
          `${EMOJIS.SUCCESS} Pagamento confirmado e canal renomeado para **${novoNome}**`
        )],
        flags: 64
      });

    } catch (error) {
      console.error('Erro ao renomear canal:', error);
      await interaction.reply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao processar a confirmação.')],
        flags: 64
      });
    }
  },

  /**   * Handler para botão de cancelar fila
   */
  async handleCancelarFila(interaction) {
    const filaId = interaction.customId.split('_')[2]; // cancel_queue_FILAID
    
    const filas = await db.readData('filas');
    const fila = filas.find(f => f.id === filaId);

    if (!fila) {
      return interaction.reply({
        embeds: [createErrorEmbed('Fila Não Encontrada', 'Esta fila não existe mais.')],
        flags: 64
      });
    }

    if (fila.status === 'confirmada' || fila.status === 'finalizada') {
      return interaction.reply({
        embeds: [createErrorEmbed('Não Cancelável', 'Esta fila já foi confirmada ou finalizada!')],
        flags: 64
      });
    }

    if (fila.status === 'cancelada') {
      return interaction.reply({
        embeds: [createErrorEmbed('Já Cancelada', 'Esta fila já foi cancelada.')],
        flags: 64
      });
    }

    // Apenas criador pode cancelar (ou staff)
    const permissions = require('../../config/permissions');
    const isStaff = await permissions.isMediadorOrAbove(interaction.member);
    
    if (fila.criadoPor !== interaction.user.id && !isStaff) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o criador da fila ou staff pode cancelá-la.')],
        flags: 64
      });
    }

    // Cancelar fila
    await db.updateItem('filas',
      f => f.id === filaId,
      f => ({
        ...f,
        status: 'cancelada',
        canceladoPor: interaction.user.id,
        canceladoEm: Date.now()
      })
    );

    // Atualizar mensagem
    const canceladaEmbed = new EmbedBuilder()
      .setTitle(`${EMOJIS.ERROR} Fila Cancelada`)
      .setDescription(
        `**Fila ID:** \`${filaId}\`\n` +
        `**Tipo:** ${fila.tipo} ${fila.plataforma}\n\n` +
        `${EMOJIS.WARNING} Esta fila foi cancelada por ${interaction.user}`
      )
      .setColor(COLORS.ERROR)
      .setTimestamp();

    await interaction.message.edit({
      embeds: [canceladaEmbed],
      components: []
    });

    // Notificar todos os jogadores
    const todosJogadores = [...fila.time1, ...fila.time2];
    for (const userId of todosJogadores) {
      try {
        const user = await interaction.client.users.fetch(userId);
        await user.send({
          embeds: [createErrorEmbed(
            'Fila Cancelada',
            `A fila **${filaId}** (${fila.tipo} ${fila.plataforma}) foi cancelada por ${interaction.user.tag}.`
          )]
        });
      } catch (error) {
        console.error(`Erro ao notificar jogador ${userId}:`, error);
      }
    }

    await interaction.reply({
      embeds: [createSuccessEmbed('Fila Cancelada', `${EMOJIS.SUCCESS} A fila foi cancelada com sucesso.`)],
      flags: 64
    });
  }
};

/**
 * Cria fila a partir do painel fixo
 */
async function criarFilaPainel(interaction) {
  // Extrair valor do customId (criar_fila_10 -> 10)
  const valor = parseInt(interaction.customId.replace('criar_fila_', ''));

  // Importar comando de fila para reutilizar a lógica
  const filaCommand = require('../../commands/fila');
  
  // Simular execução do comando /fila
  const mockInteraction = {
    ...interaction,
    options: {
      getInteger: (name) => {
        if (name === 'valor') return valor;
        return null;
      },
      getString: () => null
    }
  };

  await filaCommand.execute(mockInteraction);
}

module.exports = { handle, criarFilaPainel };
