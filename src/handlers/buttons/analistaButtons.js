// Handler de botões do painel de analista

const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../../utils/embeds');
const { ANALYST_TYPES, EMOJIS, COLORS, DISABLED_FEATURES, DISABLED_MESSAGE } = require('../../config/constants');
const permissions = require('../../config/permissions');
const db = require('../../database');
const logger = require('../../utils/logger');

async function handle(interaction) {
  const customId = interaction.customId;

  // Verificar se o painel de analista está desativado
  if (DISABLED_FEATURES.PAINEL_ANALISTA) {
    return interaction.reply({
      embeds: [createErrorEmbed('Sistema Desativado', DISABLED_MESSAGE)],
      flags: 64
    });
  }

  // analista_entrar_servico_mobile
  if (customId === 'analista_entrar_servico_mobile') {
    await handleEntrarServico(interaction, ANALYST_TYPES.MOBILE);
    return;
  }

  // analista_entrar_servico_emulador
  if (customId === 'analista_entrar_servico_emulador') {
    await handleEntrarServico(interaction, ANALYST_TYPES.EMULATOR);
    return;
  }

  // analista_entrar_servico (legado - perguntar qual tipo)
  if (customId === 'analista_entrar_servico') {
    await handleEntrarServico(interaction, null);
    return;
  }
  // analista_sair_servico
  if (customId === 'analista_sair_servico') {
    await interaction.deferReply({ flags: 64 });

    const analistas = await db.readData('analistas');
    const analista = analistas.find(a => a.userId === interaction.user.id && a.active);

    if (!analista) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Não Registrado', 'Você não está registrado como analista no sistema.')]
      });
    }

    if (!analista.onDuty) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Não em Serviço', 'Você não está em serviço!')]
      });
    }

    // Sair de serviço
    await db.updateItem('analistas',
      a => a.userId === interaction.user.id,
      a => ({ ...a, onDuty: false })
    );

    // Atualizar painel
    await atualizarPainel(interaction.client);

    return interaction.editReply({
      embeds: [createSuccessEmbed(
        'Fora de Serviço',
        `${EMOJIS.OFFLINE} **Você saiu de serviço.**\n\nVocê não receberá mais chamados.`
      )]
    });
  }

  // analista_ver_lista
  if (customId === 'analista_ver_lista') {
    await interaction.deferReply({ flags: 64 });

    const analistas = await db.readData('analistas');
    const analistasAtivos = analistas.filter(a => a.active && a.onDuty);

    if (analistasAtivos.length === 0) {
      return interaction.editReply({
        embeds: [createInfoEmbed(
          'Nenhum Analista em Serviço',
          'Não há analistas em serviço no momento.'
        )]
      });
    }

    // Agrupar por tipo
    const mobile = analistasAtivos.filter(a => a.tipo === ANALYST_TYPES.MOBILE);
    const emulador = analistasAtivos.filter(a => a.tipo === ANALYST_TYPES.EMULATOR);

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.ANALYST} Analistas em Serviço`)
      .setDescription(`**Total:** ${analistasAtivos.length} analista(s)`)
      .setTimestamp();

    if (mobile.length > 0) {
      const listaMobile = mobile.map(a => {
        const tempo = Math.floor((Date.now() - (a.onDutySince || Date.now())) / 1000 / 60);
        return `<@${a.userId}> (${tempo}m)`;
      }).join('\n');
      
      embed.addFields({
        name: '📱 Mobile',
        value: listaMobile,
        inline: false
      });
    }

    if (emulador.length > 0) {
      const listaEmulador = emulador.map(a => {
        const tempo = Math.floor((Date.now() - (a.onDutySince || Date.now())) / 1000 / 60);
        return `<@${a.userId}> (${tempo}m)`;
      }).join('\n');
      
      embed.addFields({
        name: '💻 Emulador',
        value: listaEmulador,
        inline: false
      });
    }

    return interaction.editReply({ embeds: [embed] });
  }

  // Verificar se é mediador
  const temPermissao = await permissions.isMediadorOrAbove(interaction.member);
  if (!temPermissao) {
    return interaction.reply({
      embeds: [createErrorEmbed('Sem Permissão', 'Apenas mediadores podem chamar analistas.')],
      flags: 64
    });
  }

  let tipo;
  if (customId === 'chamar_analista_mobile') {
    tipo = ANALYST_TYPES.MOBILE;
  } else if (customId === 'chamar_analista_emulador') {
    tipo = ANALYST_TYPES.EMULATOR;
  } else {
    return interaction.reply({
      content: '❌ Botão não reconhecido.',
      flags: 64
    });
  }

  await interaction.deferReply({ flags: 64 });

  // Buscar analistas em serviço do tipo solicitado
  const analistas = await db.readData('analistas');
  const analistasDisponiveis = analistas.filter(a => 
    a.onDuty && 
    a.active && 
    a.tipo === tipo
  );

  if (analistasDisponiveis.length === 0) {
    const tipoNome = tipo === ANALYST_TYPES.MOBILE ? 'Mobile' : 'Emulador';
    return interaction.editReply({
      embeds: [createErrorEmbed(
        'Nenhum Analista Disponível',
        `Não há analistas **${tipoNome}** em serviço no momento.\n\n` +
        `${EMOJIS.INFO} Peça para um analista entrar em serviço.`
      )]
    });
  }

  // Selecionar analista aleatório
  const analistaEscolhido = analistasDisponiveis[Math.floor(Math.random() * analistasDisponiveis.length)];
  
  try {
    const analistaMember = await interaction.guild.members.fetch(analistaEscolhido.userId);
    const tipoEmoji = tipo === ANALYST_TYPES.MOBILE ? '📱' : '💻';
    const tipoNome = tipo === ANALYST_TYPES.MOBILE ? 'Mobile' : 'Emulador';

    // Notificar o analista
    try {
      await analistaMember.send({
        embeds: [createInfoEmbed(
          '📢 Chamado de SS',
          `${EMOJIS.WARNING} **Você foi chamado para fazer uma análise!**\n\n` +
          `${tipoEmoji} **Tipo:** ${tipoNome}\n` +
          `👤 **Solicitante:** ${interaction.user}\n` +
          `📍 **Servidor:** ${interaction.guild.name}\n` +
          `📝 **Canal:** ${interaction.channel}`
        )]
      });
    } catch (error) {
      console.error(`Erro ao enviar DM para analista ${analistaMember.user.tag}:`, error);
    }

    await logger.logSS(interaction.client, 'call', interaction.user.id, interaction.user.tag, analistaMember.user.id, analistaMember.user.tag, tipo);

    // Se o analista tem PIX configurado, enviar informações
    if (analistaEscolhido.pix) {
      const pixEmbed = new EmbedBuilder()
        .setTitle(`${EMOJIS.MONEY} PIX do Analista`)
        .setDescription(`**Informações de pagamento para ${analistaMember}**\n\nEnvie o comprovante após realizar o pagamento da análise!`)
        .addFields(
          { name: '📝 Tipo de Chave', value: analistaEscolhido.pix.tipoChave, inline: true },
          { name: '🔑 Chave PIX', value: `\`${analistaEscolhido.pix.chave}\``, inline: true },
          { name: '👤 Nome', value: analistaEscolhido.pix.nome, inline: true }
        )
        .setColor(COLORS.PRIMARY)
        .setTimestamp();

      // Se houver imagem QR Code
      if (analistaEscolhido.pix.imagemUrl) {
        pixEmbed.setImage(analistaEscolhido.pix.imagemUrl);
      }

      // Enviar embed do PIX no canal
      await interaction.channel.send({
        embeds: [pixEmbed]
      });
    }

    // Responder confirmando
    await interaction.editReply({
      embeds: [createSuccessEmbed(
        'Analista Chamado',
        `${EMOJIS.SUCCESS} **Analista chamado com sucesso!**\n\n` +
        `${tipoEmoji} **Tipo:** ${tipoNome}\n` +
        `👨‍💼 **Analista:** ${analistaMember}\n\n` +
        `${EMOJIS.INFO} O analista foi notificado e entrará em contato.` +
        (analistaEscolhido.pix ? `\n\n${EMOJIS.MONEY} Informações de pagamento enviadas no canal.` : '')
      )]
    });
  } catch (error) {
    console.error('Erro ao chamar analista:', error);
    return interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Não foi possível chamar o analista.')]
    });
  }
}

// Função para atualizar o painel de analistas
async function atualizarPainel(client) {
  try {
    const config = await db.readData('config');
    
    if (!config.painelAnalistaMessageId || !config.painelAnalistaChannelId) {
      return;
    }

    const channel = await client.channels.fetch(config.painelAnalistaChannelId);
    if (!channel) return;

    const message = await channel.messages.fetch(config.painelAnalistaMessageId);
    if (!message) return;

    const analistas = await db.readData('analistas');
    const analistasEmServico = analistas.filter(a => a.active && a.onDuty).length;

    const embed = EmbedBuilder.from(message.embeds[0])
      .setDescription(
        `${EMOJIS.ANALYST} **Sistema de Gerenciamento de Analistas**\n\n` +
        `**Em Serviço:** ${analistasEmServico} analista(s)\n\n` +
        `**${EMOJIS.ONLINE} Entrar/Sair:** Controle seu status de serviço\n` +
        `**${EMOJIS.LIST} Ver Analistas:** Lista de analistas em serviço\n` +
        `**📱 Chamar Analista:** Solicite suporte técnico`
      );

    await message.edit({ embeds: [embed] });
  } catch (error) {
    console.error('Erro ao atualizar painel de analistas:', error);
  }
}

// Função auxiliar para entrar em serviço
async function handleEntrarServico(interaction, tipo) {
  await interaction.deferReply({ flags: 64 });

  // Verificar se está registrado como analista
  const analistas = await db.readData('analistas');
  const analista = analistas.find(a => a.userId === interaction.user.id && a.active);

  if (!analista) {
    return interaction.editReply({
      embeds: [createErrorEmbed('Não Registrado', 'Você não está registrado como analista no sistema.\n\nPeça para um dono te adicionar com `/painel`.')]
    });
  }

  // Se não especificou tipo, verificar se analista tem tipo definido
  if (!tipo) {
    if (analista.tipo) {
      tipo = analista.tipo;
    } else {
      return interaction.editReply({
        embeds: [createErrorEmbed('Tipo não definido', 'Você precisa escolher o tipo: Mobile ou Emulador')]
      });
    }
  }

  // Verificar multa
  const { temMultaPendente, getMultaPendente } = require('../../services/multaService');
  const temMulta = await temMultaPendente(interaction.user.id);
  
  if (temMulta) {
    const multa = await getMultaPendente(interaction.user.id);
    return interaction.editReply({
      embeds: [createErrorEmbed(
        '🚫 Multa Pendente',
        `Você não pode entrar em serviço pois tem uma multa pendente!\n\n` +
        `**💰 Valor:** R$ ${multa.valor}\n` +
        `**📝 Motivo:** ${multa.motivo}\n` +
        `**📍 Canal:** <#${multa.canalId}>\n\n` +
        `Pague a multa para voltar a trabalhar.`
      )]
    });
  }

  if (analista.onDuty) {
    const tipoAtualEmoji = analista.tipo === ANALYST_TYPES.MOBILE ? '📱' : '💻';
    const tipoAtualNome = analista.tipo === ANALYST_TYPES.MOBILE ? 'Mobile' : 'Emulador';
    return interaction.editReply({
      embeds: [createErrorEmbed(
        'Já em Serviço', 
        `Você já está em serviço como ${tipoAtualEmoji} **${tipoAtualNome}**!\n\nSaia de serviço antes de trocar de tipo.`
      )]
    });
  }

  // Entrar em serviço
  await db.updateItem('analistas',
    a => a.userId === interaction.user.id,
    a => ({ ...a, onDuty: true, tipo, onDutySince: Date.now() })
  );

  // Atualizar painel
  await atualizarPainel(interaction.client);

  const tipoEmoji = tipo === ANALYST_TYPES.MOBILE ? '📱' : '💻';
  const tipoNome = tipo === ANALYST_TYPES.MOBILE ? 'Mobile' : 'Emulador';

  return interaction.editReply({
    embeds: [createSuccessEmbed(
      'Em Serviço',
      `${EMOJIS.ONLINE} **Você entrou em serviço!**\n\n${tipoEmoji} **Tipo:** Analista ${tipoNome}\n\nAguarde chamados de mediadores.`
    )]
  });
}

module.exports = { handle };
