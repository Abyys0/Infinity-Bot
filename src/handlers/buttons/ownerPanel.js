// Handler de botões do painel do dono

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ChannelType, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../../utils/embeds');
const { addMediador, getActiveMediadores } = require('../../services/mediadorService');
const permissions = require('../../config/permissions');
const db = require('../../database');
const logger = require('../../utils/logger');
const { COLORS, EMOJIS } = require('../../config/constants');

async function handle(interaction) {
  const customId = interaction.customId;

  // Verificar se é o dono
  if (!await permissions.isOwner(interaction.user.id, interaction.member)) {
    return interaction.reply({
      embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode usar este painel.')],
      ephemeral: true
    });
  }

  // owner_add_mediador
  if (customId === 'owner_add_mediador') {
    const modal = new ModalBuilder()
      .setCustomId('modal_owner_add_mediador')
      .setTitle('Adicionar Mediador');

    const userInput = new TextInputBuilder()
      .setCustomId('user_id')
      .setLabel('ID do Usuário')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678')
      .setRequired(true);

    const roleInput = new TextInputBuilder()
      .setCustomId('role_id')
      .setLabel('ID do Cargo de Mediador')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(userInput),
      new ActionRowBuilder().addComponents(roleInput)
    );

    return await interaction.showModal(modal);
  }

  // owner_config_taxes
  if (customId === 'owner_config_taxes') {
    let config;
    try {
      config = await Promise.race([
        db.readData('config'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
    } catch (error) {
      config = { taxes: { mediador: 10, analista: 5 } };
    }
    
    const modal = new ModalBuilder()
      .setCustomId('modal_owner_config_taxes')
      .setTitle('Configurar Taxas');

    const mediadorTaxInput = new TextInputBuilder()
      .setCustomId('mediador_tax')
      .setLabel('Taxa do Mediador (em %)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('10')
      .setValue(String(config.taxes?.mediador || 10))
      .setRequired(true);

    const analistaTaxInput = new TextInputBuilder()
      .setCustomId('analista_tax')
      .setLabel('Taxa do Analista (em %)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('5')
      .setValue(String(config.taxes?.analista || 5))
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(mediadorTaxInput),
      new ActionRowBuilder().addComponents(analistaTaxInput)
    );

    return await interaction.showModal(modal);
  }

  // owner_config_roles
  if (customId === 'owner_config_roles') {
    let config;
    try {
      config = await Promise.race([
        db.readData('config'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
    } catch (error) {
      config = { roles: {} };
    }
    
    const modal = new ModalBuilder()
      .setCustomId('modal_owner_config_roles')
      .setTitle('Configurar Cargos');

    const mediadorInput = new TextInputBuilder()
      .setCustomId('mediador_roles')
      .setLabel('IDs dos Cargos de Mediador (vírgula)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789,987654321')
      .setValue((config.roles?.mediador || []).join(','))
      .setRequired(false);

    const analistaInput = new TextInputBuilder()
      .setCustomId('analista_roles')
      .setLabel('IDs dos Cargos de Analista (vírgula)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789,987654321')
      .setValue((config.roles?.analista || []).join(','))
      .setRequired(false);

    const staffInput = new TextInputBuilder()
      .setCustomId('staff_roles')
      .setLabel('IDs dos Cargos de Staff (vírgula)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789,987654321')
      .setValue((config.roles?.staff || []).join(','))
      .setRequired(false);

    const suporteInput = new TextInputBuilder()
      .setCustomId('suporte_roles')
      .setLabel('IDs dos Cargos de Suporte (vírgula)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789,987654321')
      .setValue((config.roles?.suporte || []).join(','))
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(mediadorInput),
      new ActionRowBuilder().addComponents(analistaInput),
      new ActionRowBuilder().addComponents(staffInput),
      new ActionRowBuilder().addComponents(suporteInput)
    );

    return await interaction.showModal(modal);
  }

  // owner_config_channels
  if (customId === 'owner_config_channels') {
    let config;
    try {
      config = await Promise.race([
        db.readData('config'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
    } catch (error) {
      config = { channels: {} };
    }
    
    const modal = new ModalBuilder()
      .setCustomId('modal_owner_config_channels')
      .setTitle('Configurar Canais');

    const queuesInput = new TextInputBuilder()
      .setCustomId('queues_channel')
      .setLabel('ID do Canal/Categoria de Filas')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678')
      .setValue(config.channels?.queues || '')
      .setRequired(false);

    const ticketsInput = new TextInputBuilder()
      .setCustomId('tickets_channel')
      .setLabel('ID do Canal/Categoria de Tickets')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678')
      .setValue(config.channels?.tickets || '')
      .setRequired(false);

    const logsInput = new TextInputBuilder()
      .setCustomId('logs_channel')
      .setLabel('ID do Canal de Logs')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678')
      .setValue(config.channels?.logs || '')
      .setRequired(false);

    const pixInput = new TextInputBuilder()
      .setCustomId('pix_channel')
      .setLabel('ID do Canal de PIX')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678')
      .setValue(config.channels?.pix || '')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(queuesInput),
      new ActionRowBuilder().addComponents(ticketsInput),
      new ActionRowBuilder().addComponents(logsInput),
      new ActionRowBuilder().addComponents(pixInput)
    );

    return await interaction.showModal(modal);
  }

  // owner_send_message
  if (customId === 'owner_send_message') {
    const modal = new ModalBuilder()
      .setCustomId('modal_owner_send_message')
      .setTitle('Enviar Mensagem');

    const channelInput = new TextInputBuilder()
      .setCustomId('channel_id')
      .setLabel('ID do Canal')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678')
      .setRequired(true);

    const messageInput = new TextInputBuilder()
      .setCustomId('message_content')
      .setLabel('Mensagem')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Digite a mensagem aqui...')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(channelInput),
      new ActionRowBuilder().addComponents(messageInput)
    );

    return await interaction.showModal(modal);
  }

  // owner_create_ticket_panel
  if (customId === 'owner_create_ticket_panel') {
    const modal = new ModalBuilder()
      .setCustomId('modal_owner_create_ticket_panel')
      .setTitle('Criar Painel de Ticket');

    const channelInput = new TextInputBuilder()
      .setCustomId('channel_id')
      .setLabel('ID do Canal para o Painel')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678')
      .setRequired(true);

    const titleInput = new TextInputBuilder()
      .setCustomId('panel_title')
      .setLabel('Título do Painel')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Sistema de Tickets')
      .setValue('🎫 SISTEMA DE TICKETS')
      .setRequired(true);

    const descInput = new TextInputBuilder()
      .setCustomId('panel_description')
      .setLabel('Descrição do Painel')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Clique nos botões abaixo para abrir um ticket...')
      .setValue('Clique nos botões abaixo para abrir um ticket:\n\n🆘 **Suporte** - Problemas ou dúvidas\n💼 **Vagas** - Candidatar-se para a equipe')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(channelInput),
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descInput)
    );

    return await interaction.showModal(modal);
  }

  // owner_view_config
  if (customId === 'owner_view_config') {
    await interaction.deferReply({ ephemeral: true });
    
    let config;
    try {
      config = await Promise.race([
        db.readData('config'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
    } catch (error) {
      config = { taxes: {}, roles: {}, channels: {} };
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.SHIELD} Configurações Atuais`)
      .setDescription('Todas as configurações do bot')
      .addFields(
        {
          name: `${EMOJIS.MONEY} Taxas`,
          value: `**Mediador:** ${config.taxes?.mediador || 0}%\n**Analista:** ${config.taxes?.analista || 0}%`,
          inline: true
        },
        {
          name: `${EMOJIS.TEAM} Cargos`,
          value: `**Mediador:** ${(config.roles?.mediador || []).length} cargo(s)\n**Analista:** ${(config.roles?.analista || []).length} cargo(s)\n**Staff:** ${(config.roles?.staff || []).length} cargo(s)\n**Suporte:** ${(config.roles?.suporte || []).length} cargo(s)`,
          inline: true
        },
        {
          name: `${EMOJIS.GAME} Canais`,
          value: `**Filas:** ${config.channels?.queues ? `<#${config.channels.queues}>` : 'Não configurado'}\n**Tickets:** ${config.channels?.tickets ? `<#${config.channels.tickets}>` : 'Não configurado'}\n**Logs:** ${config.channels?.logs ? `<#${config.channels.logs}>` : 'Não configurado'}\n**PIX:** ${config.channels?.pix ? `<#${config.channels.pix}>` : 'Não configurado'}`,
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({ text: 'INFINITY BOT • Configurações' });

    return await interaction.editReply({
      embeds: [embed]
    });
  }

  // owner_view_mediadores
  if (customId === 'owner_view_mediadores') {
    await interaction.deferReply({ ephemeral: true });
    
    const mediadores = await getActiveMediadores();

    if (mediadores.length === 0) {
      return interaction.editReply({
        embeds: [createInfoEmbed('Mediadores', 'Nenhum mediador ativo no momento.')]
      });
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.MEDIATOR} Mediadores Ativos`)
      .setDescription(`Total: ${mediadores.length} mediador(es)`)
      .setTimestamp()
      .setFooter({ text: 'INFINITY BOT • Mediadores' });

    for (const mediador of mediadores) {
      const expiresIn = mediador.expiresAt - Date.now();
      const days = Math.floor(expiresIn / (1000 * 60 * 60 * 24));
      const hours = Math.floor((expiresIn % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const status = mediador.onDuty ? '🟢 Em Serviço' : '⚪ Fora de Serviço';

      embed.addFields({
        name: `<@${mediador.userId}>`,
        value: `**Status:** ${status}\n**Expira em:** ${days}d ${hours}h\n**Adicionado:** ${new Date(mediador.addedAt).toLocaleDateString('pt-BR')}`,
        inline: true
      });
    }

    return await interaction.editReply({
      embeds: [embed]
    });
  }

  // owner_config_queue_values
  if (customId === 'owner_config_queue_values') {
    const modal = new ModalBuilder()
      .setCustomId('modal_owner_config_queue_values')
      .setTitle('Configurar Valores de Filas');

    const valuesInput = new TextInputBuilder()
      .setCustomId('queue_values')
      .setLabel('Valores de aposta (separados por vírgula)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('1,2,5,10,20,50,100')
      .setValue('1,2,5,10,20,50,100')
      .setRequired(true);

    const infoInput = new TextInputBuilder()
      .setCustomId('info')
      .setLabel('Informação')
      .setStyle(TextInputStyle.Paragraph)
      .setValue('Estes valores serão usados como padrão para todas as filas.\nVocê pode configurar valores específicos por tipo/plataforma no futuro.')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(valuesInput),
      new ActionRowBuilder().addComponents(infoInput)
    );

    return await interaction.showModal(modal);
  }

  // owner_config_ss_roles
  if (customId === 'owner_config_ss_roles') {
    let config;
    try {
      config = await Promise.race([
        db.readData('config'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
    } catch (error) {
      config = { roles: {} };
    }
    
    const modal = new ModalBuilder()
      .setCustomId('modal_owner_config_ss_roles')
      .setTitle('Configurar Cargos que podem chamar SS');

    const ssRolesInput = new TextInputBuilder()
      .setCustomId('ss_roles')
      .setLabel('IDs dos Cargos (separados por vírgula)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789,987654321')
      .setValue((config.roles?.ss || []).join(','))
      .setRequired(false);

    const infoInput = new TextInputBuilder()
      .setCustomId('info')
      .setLabel('Informação')
      .setStyle(TextInputStyle.Paragraph)
      .setValue('Estes cargos poderão usar o botão "Chamar Analista" nas filas.\nMediadores, Staff e Suporte já têm essa permissão por padrão.')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ssRolesInput),
      new ActionRowBuilder().addComponents(infoInput)
    );

    return await interaction.showModal(modal);
  }

  // owner_config_ticket_roles
  if (customId === 'owner_config_ticket_roles') {
    const config = await db.readData('config');
    
    const modal = new ModalBuilder()
      .setCustomId('modal_owner_config_ticket_roles')
      .setTitle('Configurar Atendentes de Ticket');

    const ticketRolesInput = new TextInputBuilder()
      .setCustomId('ticket_roles')
      .setLabel('IDs dos Cargos (separados por vírgula)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789,987654321')
      .setValue((config.roles?.ticketAttendants || []).join(','))
      .setRequired(false);

    const infoInput = new TextInputBuilder()
      .setCustomId('info')
      .setLabel('Informação')
      .setStyle(TextInputStyle.Paragraph)
      .setValue('Estes cargos poderão visualizar e atender tickets abertos.')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ticketRolesInput),
      new ActionRowBuilder().addComponents(infoInput)
    );

    return await interaction.showModal(modal);
  }

  // owner_config_pix
  if (customId === 'owner_config_pix') {
    let pixData;
    try {
      pixData = await Promise.race([
        db.readData('pix'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
    } catch (error) {
      pixData = [];
    }

    const pixInfo = pixData && pixData.length > 0 ? pixData[0] : {};

    const modal = new ModalBuilder()
      .setCustomId('modal_owner_config_pix')
      .setTitle('Configurar PIX Global');

    const nomeInput = new TextInputBuilder()
      .setCustomId('nome')
      .setLabel('Nome do Beneficiário')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('João da Silva')
      .setValue(pixInfo.nome || '')
      .setRequired(true);

    const tipoChaveInput = new TextInputBuilder()
      .setCustomId('tipo_chave')
      .setLabel('Tipo de Chave')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('CPF, Email, Telefone ou Aleatória')
      .setValue(pixInfo.tipoChave || '')
      .setRequired(true);

    const chaveInput = new TextInputBuilder()
      .setCustomId('chave')
      .setLabel('Chave PIX')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('000.000.000-00 ou email@exemplo.com')
      .setValue(pixInfo.chave || '')
      .setRequired(true);

    const imagemUrlInput = new TextInputBuilder()
      .setCustomId('imagem_url')
      .setLabel('URL da Imagem do QR Code (opcional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('https://i.imgur.com/exemplo.png')
      .setValue(pixInfo.imagemUrl || '')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nomeInput),
      new ActionRowBuilder().addComponents(tipoChaveInput),
      new ActionRowBuilder().addComponents(chaveInput),
      new ActionRowBuilder().addComponents(imagemUrlInput)
    );

    return await interaction.showModal(modal);
  }

  // owner_remove_mediador
  if (customId === 'owner_remove_mediador') {
    const modal = new ModalBuilder()
      .setCustomId('modal_owner_remove_mediador')
      .setTitle('Remover Mediador');

    const userInput = new TextInputBuilder()
      .setCustomId('user_id')
      .setLabel('ID do Usuário')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(userInput)
    );

    return await interaction.showModal(modal);
  }
}

module.exports = { handle };
