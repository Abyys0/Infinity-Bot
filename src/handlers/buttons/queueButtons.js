// Handler de botões de confirmação de fila

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { EMOJIS, COLORS, QUEUE_TYPES } = require('../../config/constants');
const db = require('../../database');
const logger = require('../../utils/logger');
const { getActiveMediadores } = require('../../services/mediadorService');
const rankingService = require('../../services/rankingService');

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

    // cancel_queue_FILAID
    if (customId.startsWith('cancel_queue_')) {
      return await this.handleCancelarFila(interaction);
    }

    // vitoria_time1_FILAID
    if (customId.startsWith('vitoria_time1_')) {
      return await this.handleVitoriaTime1(interaction);
    }

    // vitoria_time2_FILAID
    if (customId.startsWith('vitoria_time2_')) {
      return await this.handleVitoriaTime2(interaction);
    }

    // cancelar_partida_FILAID
    if (customId.startsWith('cancelar_partida_')) {
      return await this.handleCancelarPartida(interaction);
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

    // Se completou, iniciar (sem bloquear a resposta da interação)
    if (fila.jogadores.length === maxJogadores) {
      // Executar em background para não bloquear a interação
      this.iniciarFila(interaction, fila, filaId).catch(error => {
        logger.error('[FILA] Erro ao iniciar fila:', error);
      });
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
    try {
      // NÃO dividir em times - os jogadores formam times no jogo
      const todosJogadores = fila.jogadores;

      // Selecionar mediador ativo
      const mediadores = await getActiveMediadores();
      const mediadoresOnDuty = mediadores.filter(m => m.onDuty);
      const mediadorSelecionado = mediadoresOnDuty.length > 0 
        ? mediadoresOnDuty[Math.floor(Math.random() * mediadoresOnDuty.length)]
        : null;

      // ====== CRIAR CANAL PRIVADO IMEDIATAMENTE ======
      const guild = interaction.guild;
      const category = interaction.channel.parent;
      
      // Criar nome do canal baseado na preferência da fila
      let preferenciaNome = '';
      const firstPlayer = fila.jogadores[0];
      const preferencia = fila.preferencias[firstPlayer];
      
      if (preferencia) {
        if (preferencia.includes('geloinfinito')) preferenciaNome = 'geloinf';
        else if (preferencia.includes('gelonormal')) preferenciaNome = 'gelonorm';
        else if (preferencia.includes('fullump')) preferenciaNome = 'fullump';
        else if (preferencia.includes('misto')) preferenciaNome = 'misto';
        else if (preferencia.includes('mobile')) preferenciaNome = 'mobile';
        else if (preferencia.includes('emulador')) preferenciaNome = 'emu';
      }
      
      const channelName = `partida-${fila.tipo.toLowerCase()}-${preferenciaNome}-${fila.valor}`;
      
      // Configurar permissões
      const permissionOverwrites = [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        }
      ];

      // Adicionar permissões para todos os jogadores
      todosJogadores.forEach(playerId => {
        permissionOverwrites.push({
          id: playerId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        });
      });

    // Adicionar permissão para o mediador
    if (mediadorSelecionado) {
      permissionOverwrites.push({
        id: mediadorSelecionado.userId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages
        ]
      });
    }

    // Buscar roles de staff
    const config = await db.readData('config');
    const staffRoles = [...(config.roles?.mediador || []), ...(config.roles?.analista || []), ...(config.roles?.staff || [])];
    staffRoles.forEach(roleId => {
      permissionOverwrites.push({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages
        ]
      });
    });

    // Criar canal privado
    let privateChannel;
    try {
      privateChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category?.id || null,
        permissionOverwrites: permissionOverwrites,
        topic: `Partida ${fila.tipo} - R$ ${fila.valor} | Fila ID: ${filaId}`
      });

      console.log(`[FILA] Canal privado criado: ${privateChannel.name} (${privateChannel.id})`);
    } catch (error) {
      console.error('[FILA] Erro ao criar canal privado:', error);
      privateChannel = null;
    }

    // Atualizar fila: salvar jogadores da partida e resetar lista para novos jogadores
    await db.updateItem('filas', f => f.id === filaId, f => ({
      ...f,
      status: 'aberta', // Voltar para aberta imediatamente
      jogadores: [], // Esvaziar para aceitar novos jogadores
      preferencias: {},
      jogadoresPartida: [...todosJogadores], // Salvar jogadores da partida atual
      iniciadaEm: Date.now(),
      mediadorId: mediadorSelecionado?.userId || null,
      canalPrivadoId: privateChannel?.id || null
    }));

    console.log(`[FILA] Fila ${filaId} resetada - jogadores movidos para partida, painel pronto para novos jogadores`);

    // Atualizar mensagem no canal de filas - MANTER BOTÕES ATIVOS
    const message = await interaction.channel.messages.fetch(fila.messageId);
    const maxJogadores = QUEUE_TYPES[fila.tipo]?.players || 2;
    
    const filaResetadaEmbed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.GAME} ${fila.tipo} ${fila.plataforma}`)
      .setDescription(
        `**Valor:** R$ ${fila.valor}\n` +
        `**Jogadores necessários:** ${maxJogadores}\n\n` +
        `✅ **Última partida:** <#${privateChannel?.id || 'Canal criado'}>`
      )
      .addFields(
        { name: '⚔️ MODO', value: `${fila.tipo}`, inline: true },
        { name: '💵 VALOR', value: `R$ ${fila.valor}`, inline: true },
        { name: '👥 JOGADORES', value: 'Nenhum jogador na fila.', inline: false }
      )
      .setTimestamp();

    // Recriar botões IMEDIATAMENTE
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`entrar_fila_${filaId}`)
          .setLabel('✅ Entrar na Fila')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`sair_fila_${filaId}`)
          .setLabel('❌ Sair da Fila')
          .setStyle(ButtonStyle.Danger)
      );

    await message.edit({ 
      embeds: [filaResetadaEmbed], 
      components: [row]
    });

    // ====== ENVIAR MENSAGENS NO CANAL PRIVADO ======
    if (privateChannel) {
      // Buscar dados do PIX
      let pixInfo = null;
      let pixTipo = 'dono';
      
      if (mediadorSelecionado) {
        const mediadores = await db.readData('mediadores');
        const mediadorData = mediadores.find(m => m.userId === mediadorSelecionado.userId && m.active);
        
        if (mediadorData && mediadorData.pix) {
          pixInfo = mediadorData.pix;
          pixTipo = 'mediador';
        }
      }
      
      if (!pixInfo) {
        const pixData = await db.readData('pix');
        pixInfo = pixData && pixData.length > 0 ? pixData[0] : null;
      }

      // Calcular valores
      const valorPorJogador = fila.valor;
      const metadeJogadores = todosJogadores.length / 2;
      const totalTime = valorPorJogador * metadeJogadores;
      const valorReceber = totalTime * 2;
      const taxaMediador = Math.ceil(totalTime * 0.10);
      const valorFinal = totalTime - taxaMediador;

      // Embed de boas-vindas
      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`🎮 Partida Iniciada - ${fila.tipo} ${fila.plataforma}`)
        .setDescription(
          `Bem-vindos ao canal privado da partida!\n\n` +
          `**📋 Informações da Partida**\n` +
          `**Tipo:** ${fila.tipo} ${fila.plataforma}\n` +
          `**Valor:** R$ ${fila.valor} por jogador\n` +
          `**Total por time:** R$ ${totalTime.toFixed(2)}\n` +
          `**Valor a receber (vencedor):** R$ ${valorReceber.toFixed(2)}\n\n` +
          (mediadorSelecionado ? `**Mediador:** <@${mediadorSelecionado.userId}>\n\n` : '') +
          `${EMOJIS.QUEUE} **Os times serão formados pelos próprios jogadores no jogo.**`
        )
        .addFields({
          name: '👥 Jogadores da Partida',
          value: todosJogadores.map(id => `<@${id}>`).join('\n'),
          inline: false
        })
        .setColor(COLORS.PRIMARY)
        .setTimestamp();

      await privateChannel.send({ 
        content: todosJogadores.map(id => `<@${id}>`).join(' ') + (mediadorSelecionado ? ` <@${mediadorSelecionado.userId}>` : ''),
        embeds: [welcomeEmbed] 
      });

      // Criar botões de gerenciamento da partida
      const matchRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`confirmar_pagamento_${filaId}`)
            .setLabel('Confirmar Pagamento')
            .setStyle(ButtonStyle.Success)
            .setEmoji(EMOJIS.MONEY),
          new ButtonBuilder()
            .setCustomId(`vitoria_time1_${filaId}`)
            .setLabel('Vitória Time 1')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🏆'),
          new ButtonBuilder()
            .setCustomId(`vitoria_time2_${filaId}`)
            .setLabel('Vitória Time 2')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🏆'),
          new ButtonBuilder()
            .setCustomId(`cancelar_partida_${filaId}`)
            .setLabel('Cancelar Partida')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
        );

      // Enviar PIX se disponível
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

        if (pixInfo.imagemUrl) {
          pixEmbed.setImage(pixInfo.imagemUrl);
        }

        await privateChannel.send({
          content: mediadorSelecionado ? `<@${mediadorSelecionado.userId}> - Mediador responsável por esta partida` : '⚠️ Nenhum mediador ativo disponível',
          embeds: [pixEmbed],
          components: [matchRow]
        });
        
        console.log(`[FILA] PIX e botões de gerenciamento enviados no canal ${privateChannel.id}`);
      } else {
        // Mesmo sem PIX, enviar os botões de gerenciamento
        const nPixEmbed = new EmbedBuilder()
          .setTitle('⚠️ PIX Não Configurado')
          .setDescription(
            `O PIX ainda não foi configurado.\n\n` +
            `Entre em contato com a administração para configurar o pagamento.`
          )
          .setColor(COLORS.WARNING)
          .setTimestamp();

        await privateChannel.send({
          content: mediadorSelecionado ? `<@${mediadorSelecionado.userId}> - Mediador responsável por esta partida` : '⚠️ Nenhum mediador ativo disponível',
          embeds: [nPixEmbed],
          components: [matchRow]
        });
        
        console.log(`[FILA] Botões de gerenciamento enviados (sem PIX) no canal ${privateChannel.id}`);
      }
    }

    // NÃO RESETAR A FILA AQUI - só resetar quando a partida terminar

    // ENVIAR DM PARA TODOS OS JOGADORES
    for (const userId of todosJogadores) {
      try {
        const user = await interaction.client.users.fetch(userId);
        
        const dmEmbed = new EmbedBuilder()
          .setTitle('🎮 Fila Completa!')
          .setDescription(
            `Sua fila **${fila.tipo} ${fila.plataforma}** está completa!\n\n` +
            `**Valor:** R$ ${fila.valor}\n` +
            (privateChannel ? `**Canal da Partida:** <#${privateChannel.id}>\n\n` : '\n') +
            `${EMOJIS.SUCCESS} **Acesse o canal privado da partida agora!**\n\n` +
            `⏰ Os times serão formados dentro do jogo.`
          )
          .setColor(COLORS.SUCCESS)
          .setTimestamp();

        await user.send({ embeds: [dmEmbed] });
        console.log(`[DM] DM enviada para ${user.tag} sobre fila ${filaId}`);
      } catch (error) {
        console.error(`[DM] Erro ao enviar DM para ${userId}:`, error);
      }
    }

    console.log(`[FILA] Fila ${filaId} iniciada. DMs enviadas para ${todosJogadores.length} jogadores.`);
    } catch (error) {
      console.error(`[FILA] Erro ao iniciar fila ${filaId}:`, error);
      
      // Tentar notificar no canal sobre o erro
      try {
        const message = await interaction.channel.messages.fetch(fila.messageId);
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Erro ao Iniciar Fila')
          .setDescription(
            `Ocorreu um erro ao processar a fila.\n\n` +
            `**Fila ID:** \`${filaId}\`\n` +
            `**Erro:** ${error.message}\n\n` +
            `Por favor, contate um administrador.`
          )
          .setColor(COLORS.ERROR)
          .setTimestamp();
        
        await message.edit({ embeds: [errorEmbed], components: [] });
        
        // Notificar jogadores sobre o erro
        for (const userId of fila.jogadores) {
          try {
            const user = await interaction.client.users.fetch(userId);
            await user.send({
              embeds: [createErrorEmbed(
                'Erro na Fila',
                `Houve um erro ao iniciar sua fila ${fila.tipo}. Por favor, entre em contato com a equipe.`
              )]
            });
          } catch (dmError) {
            console.error(`[FILA] Não foi possível notificar ${userId} sobre erro da fila`, dmError);
          }
        }
      } catch (notifyError) {
        console.error('[FILA] Erro ao notificar sobre erro da fila:', notifyError);
      }
    }
  },

  /**
   * Limpa dados da partida finalizada (jogadores já foram resetados ao iniciar)
   */
  async resetarFilaAposPartida(filaId, messageId, channelId, client) {
    try {
      const filas = await db.readData('filas');
      const fila = filas.find(f => f.id === filaId);
      
      if (!fila) {
        console.log(`[FILA] Fila ${filaId} não encontrada para limpar dados da partida`);
        return;
      }

      // Limpar apenas dados da partida finalizada (jogadores já foram resetados)
      await db.updateItem('filas', f => f.id === filaId, f => ({
        ...f,
        jogadoresPartida: [], // Limpar jogadores da partida finalizada
        mediadorId: null,
        canalPrivadoId: null,
        iniciadaEm: null
      }));

      console.log(`[FILA] Dados da partida ${filaId} limpos após finalização`);
    } catch (error) {
      console.error(`[FILA] Erro ao limpar dados da partida ${filaId}:`, error);
    }
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
    const todosJogadores = fila.jogadores || [];
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
    });
  },

  /**
   * Handler para vitória do Time 1 (integração com ranking)
   */
  /**
   * Handler para vitória do Time 1
   * Nota: Times são formados pelos jogadores no jogo, não automaticamente
   */
  async handleVitoriaTime1(interaction) {
    const permissions = require('../../config/permissions');
    
    // Verificar permissão
    if (!permissions.isMediador(interaction.member) && !permissions.isAnalista(interaction.member)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas mediadores e analistas podem confirmar vitórias.')],
        flags: 64
      });
    }

    const filaId = interaction.customId.replace('vitoria_time1_', '');
    await interaction.deferReply({ flags: 64 });

    const fila = await db.findItem('filas', f => f.id === filaId);
    if (!fila) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Fila não encontrada.')]
      });
    }

    // Calcular valores (baseado em metade dos jogadores)
    const valorPorJogador = fila.valor;
    const metadeJogadores = fila.jogadores.length / 2;
    const totalTime = valorPorJogador * metadeJogadores;
    const valorReceber = totalTime * 2;

    // Atualizar status da fila
    await db.updateItem('filas',
      f => f.id === filaId,
      f => ({
        ...f,
        status: 'finalizada',
        vencedor: 'time1',
        finalizadaEm: Date.now(),
        finalizadoPor: interaction.user.id
      })
    );

    // Criar embed de vitória
    const vitoriaEmbed = new EmbedBuilder()
      .setTitle('🏆 VITÓRIA - TIME 1')
      .setDescription(
        `**Fila ID:** \`${filaId}\`\n` +
        `**Tipo:** ${fila.tipo} ${fila.plataforma}\n` +
        `**Valor:** R$ ${fila.valor}\n\n` +
        `${EMOJIS.SUCCESS} Time 1 venceu a partida!\n` +
        `**Valor a pagar aos vencedores:** R$ ${valorReceber.toFixed(2)} (total)\n` +
        `**Por jogador (${metadeJogadores}):** R$ ${(valorReceber / metadeJogadores).toFixed(2)}\n\n` +
        `⚠️ **Mediador:** Realize o pagamento aos vencedores do Time 1.`
      )
      .addFields({
        name: '👥 Jogadores da Partida',
        value: fila.jogadores.map(id => `<@${id}>`).join('\n'),
        inline: false
      })
      .setColor(COLORS.SUCCESS)
      .setTimestamp();

    // Deletar canal privado se existir
    if (fila.canalPrivadoId) {
      try {
        const privateChannel = await interaction.guild.channels.fetch(fila.canalPrivadoId);
        if (privateChannel) {
          await privateChannel.send({ embeds: [vitoriaEmbed] });
          
          // Aguardar 30 segundos antes de deletar
          setTimeout(async () => {
            try {
              await privateChannel.delete();
              console.log(`[FILA] Canal privado ${fila.canalPrivadoId} deletado após vitória`);
            } catch (error) {
              console.error('[FILA] Erro ao deletar canal privado:', error);
            }
          }, 30000);
        }
      } catch (error) {
        console.error('[FILA] Erro ao acessar canal privado:', error);
      }
    }

    // Resetar fila após vitória
    await this.resetarFilaAposPartida(filaId, fila.messageId, fila.channelId, interaction.client);

    await interaction.editReply({
      embeds: [createSuccessEmbed('Vitória Registrada', `${EMOJIS.SUCCESS} Vitória do Time 1 confirmada!`)]
    });
  },

  /**
   * Handler para vitória do Time 2
   * Nota: Times são formados pelos jogadores no jogo, não automaticamente
   */
  async handleVitoriaTime2(interaction) {
    const permissions = require('../../config/permissions');
    
    // Verificar permissão
    if (!permissions.isMediador(interaction.member) && !permissions.isAnalista(interaction.member)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas mediadores e analistas podem confirmar vitórias.')],
        flags: 64
      });
    }

    const filaId = interaction.customId.replace('vitoria_time2_', '');
    await interaction.deferReply({ flags: 64 });

    const fila = await db.findItem('filas', f => f.id === filaId);
    if (!fila) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Fila não encontrada.')]
      });
    }

    // Calcular valores (baseado em metade dos jogadores)
    const valorPorJogador = fila.valor;
    const metadeJogadores = fila.jogadores.length / 2;
    const totalTime = valorPorJogador * metadeJogadores;
    const valorReceber = totalTime * 2;

    // Atualizar status da fila
    await db.updateItem('filas',
      f => f.id === filaId,
      f => ({
        ...f,
        status: 'finalizada',
        vencedor: 'time2',
        finalizadaEm: Date.now(),
        finalizadoPor: interaction.user.id
      })
    );

    // Criar embed de vitória
    const vitoriaEmbed = new EmbedBuilder()
      .setTitle('🏆 VITÓRIA - TIME 2')
      .setDescription(
        `**Fila ID:** \`${filaId}\`\n` +
        `**Tipo:** ${fila.tipo} ${fila.plataforma}\n` +
        `**Valor:** R$ ${fila.valor}\n\n` +
        `${EMOJIS.SUCCESS} Time 2 venceu a partida!\n` +
        `**Valor a pagar aos vencedores:** R$ ${valorReceber.toFixed(2)} (total)\n` +
        `**Por jogador (${metadeJogadores}):** R$ ${(valorReceber / metadeJogadores).toFixed(2)}\n\n` +
        `⚠️ **Mediador:** Realize o pagamento aos vencedores do Time 2.`
      )
      .addFields({
        name: '👥 Jogadores da Partida',
        value: fila.jogadores.map(id => `<@${id}>`).join('\n'),
        inline: false
      })
      .setColor(COLORS.SUCCESS)
      .setTimestamp();

    // Deletar canal privado se existir
    if (fila.canalPrivadoId) {
      try {
        const privateChannel = await interaction.guild.channels.fetch(fila.canalPrivadoId);
        if (privateChannel) {
          await privateChannel.send({ embeds: [vitoriaEmbed] });
          
          // Aguardar 30 segundos antes de deletar
          setTimeout(async () => {
            try {
              await privateChannel.delete();
              console.log(`[FILA] Canal privado ${fila.canalPrivadoId} deletado após vitória`);
            } catch (error) {
              console.error('[FILA] Erro ao deletar canal privado:', error);
            }
          }, 30000);
        }
      } catch (error) {
        console.error('[FILA] Erro ao acessar canal privado:', error);
      }
    }

    // Resetar fila após vitória
    await this.resetarFilaAposPartida(filaId, fila.messageId, fila.channelId, interaction.client);

    await interaction.editReply({
      embeds: [createSuccessEmbed('Vitória Registrada', `${EMOJIS.SUCCESS} Vitória do Time 2 confirmada!`)]
    });
  },

  /**
   * Handler para cancelar partida
   */
  async handleCancelarPartida(interaction) {
    const permissions = require('../../config/permissions');
    
    // Verificar permissão
    if (!permissions.isMediador(interaction.member) && !permissions.isAnalista(interaction.member)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas mediadores e analistas podem cancelar partidas.')],
        flags: 64
      });
    }

    const filaId = interaction.customId.replace('cancelar_partida_', '');
    await interaction.deferReply({ flags: 64 });

    const fila = await db.findItem('filas', f => f.id === filaId);
    if (!fila) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Fila não encontrada.')]
      });
    }

    // Atualizar status
    await db.updateItem('filas',
      f => f.id === filaId,
      f => ({
        ...f,
        status: 'cancelada',
        canceladoPor: interaction.user.id,
        canceladoEm: Date.now()
      })
    );

    // Deletar canal privado se existir
    if (fila.canalPrivadoId) {
      try {
        const privateChannel = await interaction.guild.channels.fetch(fila.canalPrivadoId);
        if (privateChannel) {
          const cancelEmbed = new EmbedBuilder()
            .setTitle('❌ PARTIDA CANCELADA')
            .setDescription(
              `Esta partida foi cancelada por ${interaction.user}.\n\n` +
              `Este canal será deletado em 30 segundos.`
            )
            .setColor(COLORS.ERROR)
            .setTimestamp();

          await privateChannel.send({ embeds: [cancelEmbed] });
          
          // Aguardar 30 segundos antes de deletar
          setTimeout(async () => {
            try {
              await privateChannel.delete();
              console.log(`[FILA] Canal privado ${fila.canalPrivadoId} deletado após cancelamento`);
            } catch (error) {
              console.error('[FILA] Erro ao deletar canal privado:', error);
            }
          }, 30000);
        }
      } catch (error) {
        console.error('[FILA] Erro ao acessar canal privado:', error);
      }
    }

    // Resetar fila após cancelamento
    await this.resetarFilaAposPartida(filaId, fila.messageId, fila.channelId, interaction.client);

    await interaction.editReply({
      embeds: [createSuccessEmbed('Partida Cancelada', `${EMOJIS.SUCCESS} A partida foi cancelada com sucesso.`)]
    });
  }
};