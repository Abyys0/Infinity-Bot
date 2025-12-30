// Handler de botões de confirmação de fila

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { EMOJIS, COLORS, QUEUE_TYPES } = require('../../config/constants');
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

  // Buscar dados do PIX - priorizar PIX do mediador que está atendendo
  let pixInfo = null;
  let pixTipo = 'dono'; // 'dono' ou 'mediador'
  
  // Se há mediador atendendo, usar o PIX dele
  if (fila.mediadorId && fila.mediadorAtendeu) {
    const mediadores = await db.readData('mediadores');
    const mediadorAtendendo = mediadores.find(m => m.userId === fila.mediadorId && m.active);
    
    if (mediadorAtendendo && mediadorAtendendo.pix) {
      pixInfo = mediadorAtendendo.pix;
      pixTipo = 'mediador';
      console.log(`[FILA] Usando PIX do mediador ${fila.mediadorId}`);
    }
  }
  
  // Se não tem PIX do mediador, usar PIX do dono
  if (!pixInfo) {
    const pixData = await db.readData('pix');
    pixInfo = pixData && pixData.length > 0 ? pixData[0] : null;
    console.log('[FILA] Usando PIX do dono');
  }

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
    const pixDescricao = pixTipo === 'mediador' 
      ? `**Pagamento para o Mediador**\n\nEnvie o comprovante após realizar o pagamento!`
      : `**Pagamento para a Casa**\n\nEnvie o comprovante após realizar o pagamento!`;
    
    const pixEmbed = new EmbedBuilder()
      .setTitle(`${EMOJIS.MONEY} Informações de Pagamento PIX`)
      .setDescription(pixDescricao)
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

    // entrar_fila_FILAID - Novo sistema
    if (customId.startsWith('entrar_fila_')) {
      return await this.handleEntrarFila(interaction);
    }

    // sair_fila_FILAID - Novo sistema
    if (customId.startsWith('sair_fila_')) {
      return await this.handleSairFila(interaction);
    }

    // confirmar_pagamento_FILAID
    if (customId.startsWith('confirmar_pagamento_')) {
      return await this.handleConfirmarPagamento(interaction);
    }

    // atender_fila_FILAID
    if (customId.startsWith('atender_fila_')) {
      return await this.handleAtenderFila(interaction);
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
   * Handler para entrar na fila
   */
  async handleEntrarFila(interaction) {
    const { temMultaPendente, getMultaPendente } = require('../../services/multaService');
    const permissions = require('../../config/permissions');
    
    // Extrair filaId e opção escolhida
    // Pode ser: entrar_fila_{filaId} OU entrar_fila_{opcao}_{filaId}
    const customId = interaction.customId;
    let filaId, opcao;
    
    // Verificar se tem opção no meio
    if (customId.match(/^entrar_fila_[a-z0-9]+_fila_/)) {
      // Formato: entrar_fila_{opcao}_{filaId}
      const parts = customId.split('_');
      // parts = ['entrar', 'fila', 'opcao', 'fila', 'timestamp', 'hash']
      opcao = parts[2]; // geloinfinito, gelonormal, fullump, etc
      filaId = parts.slice(3).join('_'); // fila_timestamp_hash
    } else if (customId.match(/^entrar_fila_misto_\d+emu_fila_/)) {
      // Formato: entrar_fila_misto_1emu_{filaId}
      const match = customId.match(/^entrar_fila_misto_(\d+)emu_(.+)$/);
      opcao = `misto_${match[1]}emu`;
      filaId = match[2];
    } else if (customId.match(/^entrar_fila_tatico_[a-z]+_fila_/)) {
      // Formato: entrar_fila_tatico_mobile_{filaId}
      const match = customId.match(/^entrar_fila_tatico_([a-z]+)_(.+)$/);
      opcao = `tatico_${match[1]}`;
      filaId = match[2];
    } else {
      // Formato antigo: entrar_fila_{filaId}
      filaId = customId.replace('entrar_fila_', '');
      opcao = null;
    }
    
    await interaction.deferReply({ flags: 64 });

    // Verificar multa
    if (await temMultaPendente(interaction.user.id)) {
      const multa = await getMultaPendente(interaction.user.id);
      return interaction.editReply({
        embeds: [createErrorEmbed(
          '💸 Multa Pendente',
          `Você possui uma multa pendente.\n\n` +
          `**Valor:** R$ ${multa.valor}\n` +
          `**Canal:** <#${multa.canalId}>`
        )]
      });
    }

    // Verificar blacklist
    if (await permissions.isBlacklisted(interaction.user.id)) {
      return interaction.editReply({
        embeds: [createErrorEmbed('🚫 Blacklist', 'Você está na blacklist.')]
      });
    }

    const filas = await db.readData('filas');
    const fila = filas.find(f => f.id === filaId);

    if (!fila) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Fila Não Encontrada', 'Esta fila não existe mais.')]
      });
    }

    // Inicializar arrays de preferências se não existirem
    if (!fila.preferencias) fila.preferencias = {};

    // Verificar se já está na fila
    if (fila.jogadores.includes(interaction.user.id)) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Já na Fila', 'Você já está nesta fila!')]
      });
    }

    // Calcular quantos jogadores são necessários
    const maxJogadores = QUEUE_TYPES[fila.tipo]?.players || 2;
    
    if (fila.jogadores.length >= maxJogadores) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Fila Cheia', 'Esta fila já está cheia!')]
      });
    }

    // Adicionar jogador
    fila.jogadores.push(interaction.user.id);
    
    // Salvar preferência do jogador
    if (opcao) {
      fila.preferencias[interaction.user.id] = opcao;
    }
    
    await db.updateItem('filas', f => f.id === filaId, f => ({ 
      ...f, 
      jogadores: fila.jogadores,
      preferencias: fila.preferencias
    }));

    // Atualizar mensagem
    const message = await interaction.channel.messages.fetch(fila.messageId);
    const embed = message.embeds[0];
    
    const newEmbed = new EmbedBuilder(embed.data);
    
    // Montar lista de jogadores com suas preferências
    const jogadoresList = fila.jogadores.length > 0
      ? fila.jogadores.map(id => {
          const pref = fila.preferencias[id];
          let emoji = '';
          if (pref) {
            if (pref.includes('geloinfinito')) emoji = '🔥';
            else if (pref.includes('gelonormal')) emoji = '❄️';
            else if (pref.includes('fullump')) emoji = '🔫';
            else if (pref.includes('emu')) emoji = '💻';
            else if (pref.includes('mobile')) emoji = '📱';
          }
          return `${emoji} <@${id}>`;
        }).join('\n')
      : 'Nenhum jogador na fila.';
    
    newEmbed.spliceFields(2, 1, { name: '👥 JOGADORES', value: jogadoresList, inline: false });
    
    await message.edit({ embeds: [newEmbed], components: message.components });

    // Mensagem de confirmação
    let opcaoTexto = '';
    if (opcao) {
      if (opcao.includes('geloinfinito')) opcaoTexto = ' (Gelo Infinito 🔥)';
      else if (opcao.includes('gelonormal')) opcaoTexto = ' (Gelo Normal ❄️)';
      else if (opcao.includes('fullump')) opcaoTexto = ' (Full UMP XM8 🔫)';
      else if (opcao.match(/misto_(\d+)emu/)) {
        const num = opcao.match(/misto_(\d+)emu/)[1];
        opcaoTexto = ` (${num} Emulador 💻)`;
      }
      else if (opcao.includes('tatico_mobile')) opcaoTexto = ' (Mobile 📱)';
      else if (opcao.includes('tatico_emulador')) opcaoTexto = ' (Emulador 💻)';
      else if (opcao.includes('tatico_misto')) opcaoTexto = ' (Misto 🔀)';
    }

    await interaction.editReply({
      embeds: [createSuccessEmbed('Entrou na Fila', `Você entrou na fila${opcaoTexto}! (${fila.jogadores.length}/${maxJogadores})`)]
    });

    // Se completou, iniciar
    if (fila.jogadores.length === maxJogadores) {
      await this.iniciarFila(interaction, fila, filaId);
    }
  },

  /**
   * Handler para sair da fila
   */
  async handleSairFila(interaction) {
    const filaId = interaction.customId.replace('sair_fila_', '');
    
    await interaction.deferReply({ flags: 64 });

    const filas = await db.readData('filas');
    const fila = filas.find(f => f.id === filaId);

    if (!fila) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Fila Não Encontrada', 'Esta fila não existe mais.')]
      });
    }

    if (!fila.jogadores.includes(interaction.user.id)) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Não na Fila', 'Você não está nesta fila!')]
      });
    }

    // Remover jogador
    fila.jogadores = fila.jogadores.filter(id => id !== interaction.user.id);
    await db.updateItem('filas', f => f.id === filaId, f => ({ ...f, jogadores: fila.jogadores }));

    // Atualizar mensagem
    const message = await interaction.channel.messages.fetch(fila.messageId);
    const embed = message.embeds[0];
    
    const newEmbed = new EmbedBuilder(embed.data);
    const jogadoresList = fila.jogadores.length > 0
      ? fila.jogadores.map(id => `<@${id}>`).join('\n')
      : 'Nenhum jogador na fila.';
    
    newEmbed.spliceFields(2, 1, { name: '👥 JOGADORES', value: jogadoresList, inline: false });
    
    await message.edit({ embeds: [newEmbed], components: message.components });

    await interaction.editReply({
      embeds: [createSuccessEmbed('Saiu da Fila', 'Você saiu da fila.')]
    });
  },

  /**
   * Inicia fila quando completada
   */
  async iniciarFila(interaction, fila, filaId) {
    // Dividir em 2 times
    const metade = fila.jogadores.length / 2;
    const time1 = fila.jogadores.slice(0, metade);
    const time2 = fila.jogadores.slice(metade);

    // Atualizar fila com times
    await db.updateItem('filas', f => f.id === filaId, f => ({
      ...f,
      time1,
      time2,
      status: 'iniciada',
      iniciadaEm: Date.now(),
      mediadorId: null,
      mediadorAtendeu: false,
      confirmacoesTime1: [],
      confirmacoesTime2: []
    }));

    // Atualizar mensagem com botões de confirmação
    const message = await interaction.channel.messages.fetch(fila.messageId);
    const embed = message.embeds[0];
    
    const newEmbed = new EmbedBuilder(embed.data);
    newEmbed.spliceFields(2, 1, {
      name: '👥 TIMES',
      value: `**🔥 Gelo Infinito:**\n${time1.map(id => `<@${id}>`).join('\n')}\n\n**❄️ Gelo Normal:**\n${time2.map(id => `<@${id}>`).join('\n')}`,
      inline: false
    });

    // Adicionar campo de atendimento
    newEmbed.addFields({
      name: '🎯 Atendimento',
      value: '⏳ Aguardando mediador...',
      inline: false
    });

    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`gelo_infinito_${filaId}`)
          .setLabel('Gelo Infinito')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🧊'),
        new ButtonBuilder()
          .setCustomId(`gelo_normal_${filaId}`)
          .setLabel('Gelo Normal')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('❄️')
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`atender_fila_${filaId}`)
          .setLabel('Atender Fila')
          .setStyle(ButtonStyle.Success)
          .setEmoji('👤')
      );

    await message.edit({ 
      content: time1.concat(time2).map(id => `<@${id}>`).join(' '),
      embeds: [newEmbed], 
      components: [row1, row2] 
    });

    // ENVIAR DM PARA TODOS OS JOGADORES
    const todosJogadores = time1.concat(time2);
    const embedDM = new EmbedBuilder()
      .setTitle('🎮 Fila Formada!')
      .setDescription(
        `Sua fila **${fila.tipo} ${fila.plataforma}** está completa!\n\n` +
        `**Valor:** R$ ${fila.valor}\n` +
        `**Canal:** <#${fila.channelId}>\n\n` +
        `${EMOJIS.WARNING} **Confirme sua participação clicando nos botões no canal da fila!**\n\n` +
        `**Seu time:** ${time1.includes(interaction.user.id) ? '🔥 Gelo Infinito' : '❄️ Gelo Normal'}`
      )
      .setColor(COLORS.PRIMARY)
      .setTimestamp();

    for (const userId of todosJogadores) {
      try {
        const user = await interaction.client.users.fetch(userId);
        const time = time1.includes(userId) ? 'Gelo Infinito 🔥' : 'Gelo Normal ❄️';
        
        const dmEmbed = new EmbedBuilder()
          .setTitle('🎮 Fila Formada!')
          .setDescription(
            `Sua fila **${fila.tipo} ${fila.plataforma}** está completa!\n\n` +
            `**Valor:** R$ ${fila.valor}\n` +
            `**Seu time:** ${time}\n` +
            `**Canal:** <#${fila.channelId}>\n\n` +
            `${EMOJIS.WARNING} **IMPORTANTE:**\n` +
            `Vá até o canal da fila e clique no botão do seu time para confirmar!\n\n` +
            `⏰ Aguardando confirmação de todos os jogadores...`
          )
          .setColor(time1.includes(userId) ? COLORS.SUCCESS : COLORS.SECONDARY)
          .setTimestamp();

        await user.send({ embeds: [dmEmbed] });
        logger.log(`DM enviada para ${user.tag} sobre fila ${filaId}`);
      } catch (error) {
        logger.error(`Erro ao enviar DM para ${userId}:`, error);
        // Continuar mesmo se falhar enviar DM
      }
    }

    logger.log(`Fila ${filaId} iniciada. DMs enviadas para ${todosJogadores.length} jogadores.`);
  },

  /**
   * Handler para mediador atender fila
   */
  async handleAtenderFila(interaction) {
    const filaId = interaction.customId.replace('atender_fila_', '');
    
    await interaction.deferReply({ flags: 64 });

    // Verificar se é mediador
    const mediadores = await db.readData('mediadores');
    const mediador = mediadores.find(m => m.userId === interaction.user.id && m.active && m.onDuty);

    if (!mediador) {
      return interaction.editReply({
        embeds: [createErrorEmbed(
          'Sem Permissão',
          'Apenas mediadores em serviço podem atender filas.\n\nUse o painel de mediador para entrar em serviço.'
        )]
      });
    }

    const filas = await db.readData('filas');
    const fila = filas.find(f => f.id === filaId);

    if (!fila) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Fila Não Encontrada', 'Esta fila não existe mais.')]
      });
    }

    // Verificar se já tem mediador
    if (fila.mediadorId && fila.mediadorAtendeu) {
      return interaction.editReply({
        embeds: [createErrorEmbed(
          'Fila Já Atendida',
          `Esta fila já está sendo atendida por <@${fila.mediadorId}>.`
        )]
      });
    }

    // Atribuir mediador à fila
    await db.updateItem('filas',
      f => f.id === filaId,
      f => ({
        ...f,
        mediadorId: interaction.user.id,
        mediadorAtendeu: true,
        mediadorAtendeuEm: Date.now()
      })
    );

    // Atualizar mensagem da fila
    const message = await interaction.channel.messages.fetch(fila.messageId);
    const embed = message.embeds[0];
    const newEmbed = new EmbedBuilder(embed.data);

    // Atualizar campo de atendimento
    const fieldIndex = newEmbed.data.fields.findIndex(f => f.name === '🎯 Atendimento');
    if (fieldIndex !== -1) {
      newEmbed.spliceFields(fieldIndex, 1, {
        name: '🎯 Atendimento',
        value: `✅ Atendido por <@${interaction.user.id}>`,
        inline: false
      });
    }

    // Desabilitar botão de atender
    const components = message.components.map(row => {
      const newRow = new ActionRowBuilder();
      row.components.forEach(button => {
        const newButton = ButtonBuilder.from(button);
        if (button.customId === `atender_fila_${filaId}`) {
          newButton.setDisabled(true);
        }
        newRow.addComponents(newButton);
      });
      return newRow;
    });

    await message.edit({ embeds: [newEmbed], components });

    await interaction.editReply({
      embeds: [createSuccessEmbed(
        'Fila Atendida',
        `${EMOJIS.SUCCESS} Você está agora atendendo esta fila!\n\nAcompanhe o processo até a conclusão.`
      )]
    });

    // Log
    await logger.sendLog(
      interaction.client,
      `Mediador ${interaction.user.tag} assumiu atendimento da fila ${filaId}`,
      interaction.user.tag
    );
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
  },

  /**
   * Cria fila a partir do painel fixo
   */
  async criarFilaPainel(interaction) {
    const {  StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
    
    // Extrair valor do customId (criar_fila_10 -> 10)
    const valor = parseInt(interaction.customId.replace('criar_fila_', ''));

    //Mostrar menu para selecionar tipo e plataforma
    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`fila_select_tipo_${valor}`)
          .setPlaceholder('Escolha o tipo de jogo')
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel('1v1 Mobile')
              .setValue('1x1_mobile')
              .setEmoji('📱'),
            new StringSelectMenuOptionBuilder()
              .setLabel('1v1 Emulador')
              .setValue('1x1_emulador')
              .setEmoji('💻'),
            new StringSelectMenuOptionBuilder()
              .setLabel('1v1 Tático')
              .setValue('1x1_tatico')
              .setEmoji('🎯'),
            new StringSelectMenuOptionBuilder()
              .setLabel('2v2 Mobile')
              .setValue('2x2_mobile')
              .setEmoji('📱'),
            new StringSelectMenuOptionBuilder()
              .setLabel('2v2 Emulador')
              .setValue('2x2_emulador')
              .setEmoji('💻'),
            new StringSelectMenuOptionBuilder()
              .setLabel('2v2 Misto')
              .setValue('2x2_misto')
              .setEmoji('🔀'),
            new StringSelectMenuOptionBuilder()
              .setLabel('2v2 Tático')
              .setValue('2x2_tatico')
              .setEmoji('🎯'),
            new StringSelectMenuOptionBuilder()
              .setLabel('3v3 Mobile')
              .setValue('3x3_mobile')
              .setEmoji('📱'),
            new StringSelectMenuOptionBuilder()
              .setLabel('3v3 Emulador')
              .setValue('3x3_emulador')
              .setEmoji('💻'),
            new StringSelectMenuOptionBuilder()
              .setLabel('3v3 Misto')
              .setValue('3x3_misto')
              .setEmoji('🔀'),
            new StringSelectMenuOptionBuilder()
              .setLabel('3v3 Tático')
              .setValue('3x3_tatico')
              .setEmoji('🎯'),
            new StringSelectMenuOptionBuilder()
              .setLabel('4v4 Mobile')
              .setValue('4x4_mobile')
              .setEmoji('📱'),
            new StringSelectMenuOptionBuilder()
              .setLabel('4v4 Emulador')
              .setValue('4x4_emulador')
              .setEmoji('💻'),
            new StringSelectMenuOptionBuilder()
              .setLabel('4v4 Misto')
              .setValue('4x4_misto')
              .setEmoji('🔀'),
            new StringSelectMenuOptionBuilder()
              .setLabel('4v4 Tático')
              .setValue('4x4_tatico')
              .setEmoji('🎯')
          )
      );

    await interaction.reply({
      content: `Você selecionou **R$ ${valor}**. Escolha o tipo de jogo:`,
      components: [row],
      flags: 64
    });  }
};