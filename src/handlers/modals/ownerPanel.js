// Handler de modals do painel do dono

const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { addMediador } = require('../../services/mediadorService');
const { isValidDiscordId, areValidBetValues } = require('../../utils/validators');
const permissions = require('../../config/permissions');
const db = require('../../database');
const logger = require('../../utils/logger');
const { COLORS, EMOJIS, DISABLED_FEATURES, DISABLED_MESSAGE } = require('../../config/constants');

async function handle(interaction) {
  const customId = interaction.customId;

  // Verificar se o painel do dono está desativado
  if (DISABLED_FEATURES.PAINEL_DONO) {
    return interaction.reply({
      embeds: [createErrorEmbed('Sistema Desativado', DISABLED_MESSAGE)],
      flags: 64
    });
  }

  // Verificar se é o dono
  if (!await permissions.isOwner(interaction.user.id, interaction.member)) {
    return interaction.reply({
      embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode usar este painel.')],
      flags: 64
    });
  }

  // modal_owner_add_mediador
  if (customId === 'modal_owner_add_mediador') {
    const userId = interaction.fields.getTextInputValue('user_id').trim();
    const roleId = interaction.fields.getTextInputValue('role_id').trim();

    // Validar IDs
    if (!isValidDiscordId(userId)) {
      return interaction.reply({
        embeds: [createErrorEmbed('ID Inválido', 'O ID do usuário é inválido.')],
        flags: 64
      });
    }

    if (!isValidDiscordId(roleId)) {
      return interaction.reply({
        embeds: [createErrorEmbed('ID Inválido', 'O ID do cargo é inválido.')],
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      // Verificar se usuário existe
      const user = await interaction.client.users.fetch(userId).catch(() => null);
      if (!user) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Usuário Não Encontrado', 'Não foi possível encontrar o usuário com este ID.')]
        });
      }

      // Verificar se cargo existe
      const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
      if (!role) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Cargo Não Encontrado', 'Não foi possível encontrar o cargo com este ID.')]
        });
      }

      // Adicionar mediador
      const result = await addMediador(interaction.guild, userId, roleId, interaction.user.id);

      if (!result.success) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Erro', result.message)]
        });
      }

      // Log
      await logger.logMediador(interaction.client, 'add', userId, user.tag, interaction.user.tag);

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Mediador Adicionado',
          `${EMOJIS.SUCCESS} **${user.tag}** foi adicionado como mediador!\n\n**Cargo:** ${role.name}\n**Duração:** 7 dias\n**Expira em:** ${new Date(result.mediador.expiresAt).toLocaleString('pt-BR')}`
        )]
      });

    } catch (error) {
      console.error('Erro ao adicionar mediador:', error);
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao adicionar o mediador.')]
      });
    }
  }

  // modal_owner_add_analista
  if (customId === 'modal_owner_add_analista') {
    const userId = interaction.fields.getTextInputValue('user_id').trim();
    const tipo = interaction.fields.getTextInputValue('tipo').trim().toLowerCase();

    // Validar ID
    if (!isValidDiscordId(userId)) {
      return interaction.reply({
        embeds: [createErrorEmbed('ID Inválido', 'O ID do usuário é inválido.')],
        flags: 64
      });
    }

    // Validar tipo
    if (tipo !== 'mobile' && tipo !== 'emulador') {
      return interaction.reply({
        embeds: [createErrorEmbed('Tipo Inválido', 'O tipo deve ser "mobile" ou "emulador".')],
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      // Verificar se usuário existe
      const user = await interaction.client.users.fetch(userId).catch(() => null);
      if (!user) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Usuário Não Encontrado', 'Não foi possível encontrar o usuário com este ID.')]
        });
      }

      // Verificar se já existe
      const analistas = await db.readData('analistas');
      const existente = analistas.find(a => a.userId === userId && a.active);

      if (existente) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Já Registrado', `${user.tag} já está registrado como analista.`)]
        });
      }

      // Adicionar analista
      const novoAnalista = {
        userId,
        tipo,
        active: true,
        onDuty: false,
        addedAt: Date.now(),
        addedBy: interaction.user.id
      };

      await db.addItem('analistas', novoAnalista);

      // Log
      await logger.logAnalista(interaction.client, 'add', userId, user.tag, tipo, interaction.user.tag);

      const tipoEmoji = tipo === 'mobile' ? '📱' : '💻';
      const tipoNome = tipo === 'mobile' ? 'Mobile' : 'Emulador';

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Analista Adicionado',
          `${EMOJIS.SUCCESS} **${user.tag}** foi adicionado como analista!\n\n${tipoEmoji} **Tipo:** ${tipoNome}`
        )]
      });

    } catch (error) {
      console.error('Erro ao adicionar analista:', error);
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao adicionar o analista.')]
      });
    }
  }

  // modal_owner_remove_analista
  if (customId === 'modal_owner_remove_analista') {
    const userId = interaction.fields.getTextInputValue('user_id').trim();

    // Validar ID
    if (!isValidDiscordId(userId)) {
      return interaction.reply({
        embeds: [createErrorEmbed('ID Inválido', 'O ID do usuário é inválido.')],
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      // Verificar se usuário existe
      const user = await interaction.client.users.fetch(userId).catch(() => null);
      if (!user) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Usuário Não Encontrado', 'Não foi possível encontrar o usuário com este ID.')]
        });
      }

      // Remover analista
      const analistas = await db.readData('analistas');
      const analista = analistas.find(a => a.userId === userId && a.active);

      if (!analista) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Não Encontrado', `${user.tag} não está registrado como analista.`)]
        });
      }

      await db.updateItem('analistas',
        a => a.userId === userId,
        a => ({ ...a, active: false, removedAt: Date.now(), removedBy: interaction.user.id })
      );

      // Log
      await logger.logAnalista(interaction.client, 'remove', userId, user.tag, analista.tipo, interaction.user.tag);

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Analista Removido',
          `${EMOJIS.SUCCESS} **${user.tag}** foi removido dos analistas!`
        )]
      });

    } catch (error) {
      console.error('Erro ao remover analista:', error);
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao remover o analista.')]
      });
    }
  }

  // modal_owner_config_taxes
  if (customId === 'modal_owner_config_taxes') {
    const mediadorTax = interaction.fields.getTextInputValue('mediador_tax').trim();
    const analistaTax = interaction.fields.getTextInputValue('analista_tax').trim();

    // Validar valores
    const mediadorValue = parseFloat(mediadorTax);
    const analistaValue = parseFloat(analistaTax);

    if (isNaN(mediadorValue) || mediadorValue < 0 || mediadorValue > 100) {
      return interaction.reply({
        embeds: [createErrorEmbed('Valor Inválido', 'A taxa do mediador deve ser entre 0 e 100.')],
        flags: 64
      });
    }

    if (isNaN(analistaValue) || analistaValue < 0 || analistaValue > 100) {
      return interaction.reply({
        embeds: [createErrorEmbed('Valor Inválido', 'A taxa do analista deve ser entre 0 e 100.')],
        flags: 64
      });
    }

    // Salvar configurações
    const config = await db.readData('config');
    config.taxes = {
      mediador: mediadorValue,
      analista: analistaValue
    };
    await db.writeData('config', config);

    await logger.sendLog(interaction.client, `Taxas configuradas: Mediador ${mediadorValue}%, Analista ${analistaValue}%`, interaction.user.tag);

    return interaction.reply({
      embeds: [createSuccessEmbed(
        'Taxas Configuradas',
        `${EMOJIS.SUCCESS} **Taxas atualizadas com sucesso!**\n\n**Mediador:** ${mediadorValue}%\n**Analista:** ${analistaValue}%`
      )],
      flags: 64
    });
  }

  // modal_owner_config_roles
  if (customId === 'modal_owner_config_roles') {
    const mediadorRoles = interaction.fields.getTextInputValue('mediador_roles').trim();
    const analistaRoles = interaction.fields.getTextInputValue('analista_roles').trim();
    const staffRoles = interaction.fields.getTextInputValue('staff_roles').trim();
    const suporteRoles = interaction.fields.getTextInputValue('suporte_roles').trim();

    // Processar arrays de IDs
    const parseRoleIds = (input) => {
      if (!input) return [];
      return input.split(',').map(id => id.trim()).filter(id => isValidDiscordId(id));
    };

    const config = await db.readData('config');
    config.roles = {
      mediador: parseRoleIds(mediadorRoles),
      analista: parseRoleIds(analistaRoles),
      staff: parseRoleIds(staffRoles),
      suporte: parseRoleIds(suporteRoles),
      ss: config.roles?.ss || [], // Manter cargos SS existentes
      ticketAttendants: config.roles?.ticketAttendants || [] // Manter atendentes existentes
    };

    await db.writeData('config', config);

    await logger.sendLog(interaction.client, 'Cargos do sistema configurados', interaction.user.tag);

    return interaction.reply({
      embeds: [createSuccessEmbed(
        'Cargos Configurados',
        `${EMOJIS.SUCCESS} **Cargos atualizados com sucesso!**\n\n**Mediador:** ${config.roles.mediador.length} cargo(s)\n**Analista:** ${config.roles.analista.length} cargo(s)\n**Staff:** ${config.roles.staff.length} cargo(s)\n**Suporte:** ${config.roles.suporte.length} cargo(s)`
      )],
      flags: 64
    });
  }

  // modal_owner_config_channels
  if (customId === 'modal_owner_config_channels') {
    const queuesChannel = interaction.fields.getTextInputValue('queues_channel').trim();
    const ticketsChannel = interaction.fields.getTextInputValue('tickets_channel').trim();
    const logsChannel = interaction.fields.getTextInputValue('logs_channel').trim();
    const pixChannel = interaction.fields.getTextInputValue('pix_channel').trim();

    // Validar IDs
    const validateChannelId = (id) => !id || isValidDiscordId(id);

    if (!validateChannelId(queuesChannel) || !validateChannelId(ticketsChannel) || 
        !validateChannelId(logsChannel) || !validateChannelId(pixChannel)) {
      return interaction.reply({
        embeds: [createErrorEmbed('ID Inválido', 'Um ou mais IDs de canal são inválidos.')],
        flags: 64
      });
    }

    const config = await db.readData('config');
    config.channels = {
      queues: queuesChannel || null,
      tickets: ticketsChannel || null,
      logs: logsChannel || null,
      pix: pixChannel || null
    };

    await db.writeData('config', config);

    await logger.sendLog(interaction.client, 'Canais do sistema configurados', interaction.user.tag);

    return interaction.reply({
      embeds: [createSuccessEmbed(
        'Canais Configurados',
        `${EMOJIS.SUCCESS} **Canais atualizados com sucesso!**\n\n**Filas:** ${queuesChannel ? `<#${queuesChannel}>` : 'Não configurado'}\n**Tickets:** ${ticketsChannel ? `<#${ticketsChannel}>` : 'Não configurado'}\n**Logs:** ${logsChannel ? `<#${logsChannel}>` : 'Não configurado'}\n**PIX:** ${pixChannel ? `<#${pixChannel}>` : 'Não configurado'}`
      )],
      flags: 64
    });
  }

  // modal_owner_send_message
  if (customId === 'modal_owner_send_message') {
    const channelId = interaction.fields.getTextInputValue('channel_id').trim();
    const messageContent = interaction.fields.getTextInputValue('message_content').trim();

    if (!isValidDiscordId(channelId)) {
      return interaction.reply({
        embeds: [createErrorEmbed('ID Inválido', 'O ID do canal é inválido.')],
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      const channel = await interaction.client.channels.fetch(channelId);
      if (!channel) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Canal Não Encontrado', 'Não foi possível encontrar o canal com este ID.')]
        });
      }

      // Criar embed estiloso para a mensagem
      const messageEmbed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setDescription(messageContent)
        .setTimestamp()
        .setFooter({ text: 'INFINITY BOT • Sistema de Apostado Free Fire' });

      await channel.send({ embeds: [messageEmbed] });

      await logger.sendLog(interaction.client, `Mensagem enviada para #${channel.name}`, interaction.user.tag);

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Mensagem Enviada',
          `${EMOJIS.SUCCESS} Mensagem enviada com sucesso para <#${channelId}>!\n\n**Preview:**\n${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}`
        )]
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Não foi possível enviar a mensagem. Verifique as permissões do bot.')]
      });
    }
  }

  // modal_owner_create_ticket_panel
  if (customId === 'modal_owner_create_ticket_panel') {
    const channelId = interaction.fields.getTextInputValue('channel_id').trim();
    const panelTitle = interaction.fields.getTextInputValue('panel_title').trim();
    const panelDescription = interaction.fields.getTextInputValue('panel_description').trim();

    if (!isValidDiscordId(channelId)) {
      return interaction.reply({
        embeds: [createErrorEmbed('ID Inválido', 'O ID do canal é inválido.')],
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      const channel = await interaction.client.channels.fetch(channelId);
      if (!channel) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Canal Não Encontrado', 'Não foi possível encontrar o canal com este ID.')]
        });
      }

      // Criar embed do painel
      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(panelTitle)
        .setDescription(panelDescription)
        .setTimestamp()
        .setFooter({ text: 'INFINITY BOT • Sistema de Tickets' });

      // Criar botões
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_open_suporte')
            .setLabel('Suporte')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🆘'),
          new ButtonBuilder()
            .setCustomId('ticket_open_vagas')
            .setLabel('Vagas')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💼')
        );

      await channel.send({
        embeds: [embed],
        components: [row]
      });

      await logger.sendLog(interaction.client, `Painel de tickets criado em #${channel.name}`, interaction.user.tag);

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Painel Criado',
          `${EMOJIS.SUCCESS} Painel de tickets criado com sucesso em <#${channelId}>!`
        )]
      });

    } catch (error) {
      console.error('Erro ao criar painel de tickets:', error);
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Não foi possível criar o painel. Verifique as permissões do bot.')]
      });
    }
  }

  // modal_owner_config_queue_values
  if (customId === 'modal_owner_config_queue_values') {
    const queueValuesInput = interaction.fields.getTextInputValue('queue_values').trim();

    // Processar valores
    const values = queueValuesInput.split(',')
      .map(v => parseFloat(v.trim()))
      .filter(v => !isNaN(v) && v > 0)
      .sort((a, b) => a - b);

    if (!areValidBetValues(values)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Valores Inválidos', 'Os valores informados são inválidos. Use números positivos separados por vírgula.')],
        flags: 64
      });
    }

    const config = await db.readData('config');
    config.defaultQueueValues = values;
    await db.writeData('config', config);

    await logger.sendLog(interaction.client, `Valores de filas configurados: ${values.join(', ')}`, interaction.user.tag);

    return interaction.reply({
      embeds: [createSuccessEmbed(
        'Valores Configurados',
        `${EMOJIS.SUCCESS} **Valores de aposta configurados com sucesso!**\n\n**Valores:** R$ ${values.join(', R$ ')}`
      )],
      flags: 64
    });
  }

  // modal_owner_config_ss_roles
  if (customId === 'modal_owner_config_ss_roles') {
    const ssRolesInput = interaction.fields.getTextInputValue('ss_roles').trim();

    // Processar IDs
    const roleIds = ssRolesInput ? ssRolesInput.split(',')
      .map(id => id.trim())
      .filter(id => isValidDiscordId(id)) : [];

    const config = await db.readData('config');
    if (!config.roles) config.roles = {};
    config.roles.ss = roleIds;
    await db.writeData('config', config);

    await logger.sendLog(interaction.client, `Cargos SS configurados: ${roleIds.length} cargo(s)`, interaction.user.tag);

    return interaction.reply({
      embeds: [createSuccessEmbed(
        'Cargos SS Configurados',
        `${EMOJIS.SUCCESS} **Cargos que podem chamar SS atualizados!**\n\n**Total:** ${roleIds.length} cargo(s)\n\n*Mediadores, Staff e Suporte já têm essa permissão por padrão.*`
      )],
      flags: 64
    });
  }

  // modal_owner_config_ticket_roles
  if (customId === 'modal_owner_config_ticket_roles') {
    const ticketRolesInput = interaction.fields.getTextInputValue('ticket_roles').trim();

    // Processar IDs
    const roleIds = ticketRolesInput ? ticketRolesInput.split(',')
      .map(id => id.trim())
      .filter(id => isValidDiscordId(id)) : [];

    const config = await db.readData('config');
    if (!config.roles) config.roles = {};
    config.roles.ticketAttendants = roleIds;
    await db.writeData('config', config);

    await logger.sendLog(interaction.client, `Atendentes de ticket configurados: ${roleIds.length} cargo(s)`, interaction.user.tag);

    return interaction.reply({
      embeds: [createSuccessEmbed(
        'Atendentes Configurados',
        `${EMOJIS.SUCCESS} **Atendentes de ticket atualizados!**\n\n**Total:** ${roleIds.length} cargo(s)`
      )],
      flags: 64
    });
  }

  // modal_owner_remove_mediador
  if (customId === 'modal_owner_remove_mediador') {
    const userId = interaction.fields.getTextInputValue('user_id').trim();

    if (!isValidDiscordId(userId)) {
      return interaction.reply({
        embeds: [createErrorEmbed('ID Inválido', 'O ID do usuário é inválido.')],
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      const { removeMediador } = require('../../services/mediadorService');
      
      // Buscar usuário
      const user = await interaction.client.users.fetch(userId).catch(() => null);
      const userName = user ? user.tag : userId;

      const result = await removeMediador(interaction.guild, userId);

      if (!result.success) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Erro', result.message)]
        });
      }

      await logger.logMediador(interaction.client, 'remove', userId, userName, interaction.user.tag);

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Mediador Removido',
          `${EMOJIS.SUCCESS} **${userName}** foi removido da lista de mediadores!`
        )]
      });

    } catch (error) {
      console.error('Erro ao remover mediador:', error);
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao remover o mediador.')]
      });
    }
  }

  // modal_owner_config_pix
  if (customId === 'modal_owner_config_pix') {
    const nome = interaction.fields.getTextInputValue('pix_nome').trim();
    const tipoChave = interaction.fields.getTextInputValue('pix_tipo_chave').trim();
    const chave = interaction.fields.getTextInputValue('pix_chave').trim();
    const imagemUrl = interaction.fields.getTextInputValue('pix_imagem_url')?.trim() || '';

    // Validar campos
    if (!nome || !tipoChave || !chave) {
      return interaction.reply({
        embeds: [createErrorEmbed('Campos Obrigatórios', 'Nome, tipo de chave e chave PIX são obrigatórios.')],
        flags: 64
      });
    }

    // Validar tipo de chave
    const tiposValidos = ['cpf', 'cnpj', 'email', 'telefone', 'aleatoria'];
    if (!tiposValidos.includes(tipoChave.toLowerCase())) {
      return interaction.reply({
        embeds: [createErrorEmbed('Tipo Inválido', `Tipo de chave deve ser: ${tiposValidos.join(', ')}.`)],
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      // Salvar configuração do PIX
      const pixData = {
        nome,
        tipoChave: tipoChave.toLowerCase(),
        chave,
        imagemUrl
      };

      // Salvar no banco de dados (sobrescreve configuração anterior)
      await db.writeData('pix', [pixData]);

      await logger.logAction(
        interaction.client,
        'PIX_CONFIG',
        `${interaction.user.tag} configurou o PIX: ${nome} (${tipoChave})`
      );

      const embed = new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle(`${EMOJIS.SUCCESS} PIX Configurado`)
        .setDescription('As informações do PIX foram salvas com sucesso!')
        .addFields(
          { name: '👤 Beneficiário', value: nome, inline: false },
          { name: '🔑 Tipo de Chave', value: tipoChave.toUpperCase(), inline: true },
          { name: '📝 Chave', value: `\`${chave}\``, inline: true }
        )
        .setTimestamp();

      if (imagemUrl) {
        embed.addFields({ name: '🖼️ QR Code', value: 'URL configurada', inline: false });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Erro ao configurar PIX:', error);
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao salvar a configuração do PIX.')]
      });
    }
  }

  // modal_owner_multar_mediador
  if (customId === 'modal_owner_multar_mediador') {
    const userId = interaction.fields.getTextInputValue('user_id').trim();
    const valor = parseFloat(interaction.fields.getTextInputValue('valor').trim());
    const motivo = interaction.fields.getTextInputValue('motivo').trim();

    const { isValidDiscordId } = require('../../utils/validators');

    // Validar ID
    if (!isValidDiscordId(userId)) {
      return interaction.reply({
        embeds: [createErrorEmbed('ID Inválido', 'O ID do usuário é inválido.')],
        flags: 64
      });
    }

    // Validar valor
    if (isNaN(valor) || valor <= 0) {
      return interaction.reply({
        embeds: [createErrorEmbed('Valor Inválido', 'O valor da multa deve ser um número positivo.')],
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      // Buscar usuário
      const user = await interaction.client.users.fetch(userId).catch(() => null);
      if (!user) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Usuário Não Encontrado', 'Não foi possível encontrar o usuário com este ID.')]
        });
      }

      // Verificar se já tem multa pendente
      const multas = await db.readData('multas');
      const multaPendente = multas.find(m => m.userId === userId && m.status === 'pendente');

      if (multaPendente) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Multa Pendente', `${user.tag} já possui uma multa pendente de R$ ${multaPendente.valor}.`)]
        });
      }

      // Criar canal privado de multa
      const { PermissionFlagsBits, ChannelType } = require('discord.js');
      const canalMulta = await interaction.guild.channels.create({
        name: `multa-${user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: userId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles]
          },
          ...process.env.OWNER_ID.split(',').map(roleId => roleId.trim()).filter(id => id).map(roleId => ({
            id: roleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels]
          }))
        ]
      });

      // Criar registro da multa
      const multaId = `multa_${Date.now()}_${userId}`;
      const novaMulta = {
        id: multaId,
        userId,
        valor,
        motivo,
        status: 'pendente',
        canalId: canalMulta.id,
        criadaEm: Date.now(),
        criadaPor: interaction.user.id
      };

      multas.push(novaMulta);
      await db.writeData('multas', multas);

      // Remover mediador da fila de trabalho se estiver
      const mediadores = await db.readData('mediadores');
      const mediador = mediadores.find(m => m.userId === userId);
      if (mediador && mediador.onDuty) {
        await db.updateItem('mediadores',
          m => m.userId === userId,
          m => ({ ...m, onDuty: false })
        );
      }

      // Enviar mensagem no canal de multa
      const embedMulta = new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setTitle('💸 Multa Aplicada')
        .setDescription(
          `**${user}**, você recebeu uma multa e precisa pagá-la para voltar a trabalhar.\n\n` +
          `**💰 Valor:** R$ ${valor}\n` +
          `**📝 Motivo:** ${motivo}\n\n` +
          `⚠️ **Restrições ativas:**\n` +
          `• Não pode atender tickets\n` +
          `• Não pode entrar na fila de trabalho\n` +
          `• Não pode participar de filas\n\n` +
          `💳 **Como pagar:**\n` +
          `Envie o comprovante de pagamento neste canal e aguarde a confirmação do dono.\n\n` +
          `**Aplicada por:** ${interaction.user}\n` +
          `**Data:** ${new Date().toLocaleString('pt-BR')}`
        )
        .setTimestamp();

      const botaoConfirmar = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`confirmar_pagamento_multa_${multaId}`)
            .setLabel('Confirmar Pagamento')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅')
        );

      await canalMulta.send({
        content: `${user}`,
        embeds: [embedMulta],
        components: [botaoConfirmar]
      });

      // Notificar usuário via DM
      try {
        await user.send({
          embeds: [new EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setTitle('💸 Você Recebeu uma Multa')
            .setDescription(
              `**Valor:** R$ ${valor}\n` +
              `**Motivo:** ${motivo}\n\n` +
              `Acesse o canal <#${canalMulta.id}> para pagar.`
            )]
        });
      } catch (error) {
        console.log('Não foi possível enviar DM para o usuário.');
      }

      // Log
      await logger.logAction(
        interaction.client,
        'MULTA_APLICADA',
        `${interaction.user.tag} multou ${user.tag} em R$ ${valor} - Motivo: ${motivo}`
      );

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Multa Aplicada',
          `${EMOJIS.SUCCESS} **${user.tag}** foi multado em **R$ ${valor}**!\n\n` +
          `📝 Canal criado: <#${canalMulta.id}>\n` +
          `🚫 O usuário está bloqueado de trabalhar até pagar a multa.`
        )]
      });

    } catch (error) {
      console.error('Erro ao aplicar multa:', error);
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao aplicar a multa.')]
      });
    }
  }

  // Se chegou aqui, modal não reconhecido
  return interaction.reply({
    embeds: [createErrorEmbed('Modal Desconhecido', 'Este modal não é reconhecido.')],
    flags: 64
  });
}

module.exports = { handle };
