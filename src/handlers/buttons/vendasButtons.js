// Handler de botões do sistema de vendas

const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../../utils/embeds');
const { EMOJIS, COLORS } = require('../../config/constants');
const permissions = require('../../config/permissions');
const db = require('../../database');

async function handle(interaction) {
  const customId = interaction.customId;

  // Verificar se é o dono para botões de gerenciamento
  const isOwner = await permissions.isOwner(interaction.user.id, interaction.member);

  // ==================== BOTÕES DO PAINEL DE GERENCIAMENTO ====================

  // vendas_add_produto - Adicionar produto
  if (customId === 'vendas_add_produto') {
    if (!isOwner) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode gerenciar produtos.')],
        flags: 64
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_vendas_add_produto')
      .setTitle('Adicionar Produto');

    const nomeInput = new TextInputBuilder()
      .setCustomId('nome')
      .setLabel('Nome do Produto')
      .setPlaceholder('Ex: Conta Premium')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const descricaoInput = new TextInputBuilder()
      .setCustomId('descricao')
      .setLabel('Descrição do Produto')
      .setPlaceholder('Descreva o produto...')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(500);

    const valorInput = new TextInputBuilder()
      .setCustomId('valor')
      .setLabel('Valor (R$)')
      .setPlaceholder('Ex: 25.00')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const estoqueInput = new TextInputBuilder()
      .setCustomId('estoque')
      .setLabel('Estoque Disponível')
      .setPlaceholder('Ex: 10')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nomeInput),
      new ActionRowBuilder().addComponents(descricaoInput),
      new ActionRowBuilder().addComponents(valorInput),
      new ActionRowBuilder().addComponents(estoqueInput)
    );

    return interaction.showModal(modal);
  }

  // vendas_ver_produtos - Ver produtos cadastrados
  if (customId === 'vendas_ver_produtos') {
    if (!isOwner) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode gerenciar produtos.')],
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    const produtos = await db.readData('produtos') || [];

    if (produtos.length === 0) {
      return interaction.editReply({
        embeds: [createInfoEmbed('Nenhum Produto', 'Não há produtos cadastrados. Use "Adicionar Produto" para cadastrar.')]
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('📦 Produtos Cadastrados')
      .setColor(COLORS.PRIMARY)
      .setTimestamp();

    let descricao = '';
    produtos.forEach((p, index) => {
      descricao += `**${index + 1}. ${p.nome}**\n`;
      descricao += `   💰 Valor: R$ ${p.valor.toFixed(2)}\n`;
      descricao += `   📦 Estoque: ${p.estoque} unidade(s)\n`;
      descricao += `   📝 ${p.descricao.substring(0, 50)}${p.descricao.length > 50 ? '...' : ''}\n\n`;
    });

    embed.setDescription(descricao || 'Nenhum produto cadastrado.');

    return interaction.editReply({ embeds: [embed] });
  }

  // vendas_remover_produto - Remover produto
  if (customId === 'vendas_remover_produto') {
    if (!isOwner) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode gerenciar produtos.')],
        flags: 64
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_vendas_remover_produto')
      .setTitle('Remover Produto');

    const nomeInput = new TextInputBuilder()
      .setCustomId('nome')
      .setLabel('Nome do Produto para Remover')
      .setPlaceholder('Digite o nome exato do produto')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nomeInput)
    );

    return interaction.showModal(modal);
  }

  // vendas_editar_painel - Editar título e descrição do painel
  if (customId === 'vendas_editar_painel') {
    if (!isOwner) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode editar o painel.')],
        flags: 64
      });
    }

    // Carregar configurações atuais
    const vendasConfig = await db.readData('vendasConfig') || {};

    const modal = new ModalBuilder()
      .setCustomId('modal_vendas_editar_painel')
      .setTitle('Editar Painel de Vendas');

    const tituloInput = new TextInputBuilder()
      .setCustomId('titulo')
      .setLabel('Título do Painel')
      .setPlaceholder('Ex: 🛒 Loja INFINITY')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(vendasConfig.titulo || '🛒 Loja INFINITY')
      .setMaxLength(100);

    const descricaoInput = new TextInputBuilder()
      .setCustomId('descricao')
      .setLabel('Descrição do Painel')
      .setPlaceholder('Descrição que aparece no painel público...')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setValue(vendasConfig.descricao || 'Selecione um produto abaixo para realizar sua compra!')
      .setMaxLength(1000);

    modal.addComponents(
      new ActionRowBuilder().addComponents(tituloInput),
      new ActionRowBuilder().addComponents(descricaoInput)
    );

    return interaction.showModal(modal);
  }

  // vendas_config_pix - Configurar PIX
  if (customId === 'vendas_config_pix') {
    if (!isOwner) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode configurar o PIX.')],
        flags: 64
      });
    }

    const vendasConfig = await db.readData('vendasConfig') || {};

    const modal = new ModalBuilder()
      .setCustomId('modal_vendas_config_pix')
      .setTitle('Configurar PIX de Vendas');

    const tipoChaveInput = new TextInputBuilder()
      .setCustomId('tipo_chave')
      .setLabel('Tipo de Chave PIX')
      .setPlaceholder('CPF, CNPJ, Email, Telefone ou Chave Aleatória')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(vendasConfig.pix?.tipoChave || '');

    const chaveInput = new TextInputBuilder()
      .setCustomId('chave')
      .setLabel('Chave PIX')
      .setPlaceholder('Digite sua chave PIX')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(vendasConfig.pix?.chave || '');

    const nomeInput = new TextInputBuilder()
      .setCustomId('nome')
      .setLabel('Nome do Titular')
      .setPlaceholder('Nome completo')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(vendasConfig.pix?.nome || '');

    const qrcodeInput = new TextInputBuilder()
      .setCustomId('qrcode')
      .setLabel('URL do QR Code (Opcional)')
      .setPlaceholder('https://exemplo.com/qrcode.png')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(vendasConfig.pix?.qrcode || '');

    modal.addComponents(
      new ActionRowBuilder().addComponents(tipoChaveInput),
      new ActionRowBuilder().addComponents(chaveInput),
      new ActionRowBuilder().addComponents(nomeInput),
      new ActionRowBuilder().addComponents(qrcodeInput)
    );

    return interaction.showModal(modal);
  }

  // vendas_enviar_painel - Enviar painel para canal
  if (customId === 'vendas_enviar_painel') {
    if (!isOwner) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode enviar o painel.')],
        flags: 64
      });
    }

    // Verificar se há produtos
    const produtos = await db.readData('produtos') || [];
    if (produtos.length === 0) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Produtos', 'Cadastre ao menos um produto antes de enviar o painel.')],
        flags: 64
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_vendas_enviar_painel')
      .setTitle('Enviar Painel de Vendas');

    const canalInput = new TextInputBuilder()
      .setCustomId('canal_id')
      .setLabel('ID do Canal')
      .setPlaceholder('Cole o ID do canal aqui')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(canalInput)
    );

    return interaction.showModal(modal);
  }

  // ==================== BOTÕES DO TICKET DE VENDA ====================

  // vendas_assumir_TICKETID - Assumir venda
  if (customId.startsWith('vendas_assumir_')) {
    const ticketId = customId.replace('vendas_assumir_', '');

    // Verificar permissão (equipe de suporte/atendimento)
    const canAttend = await permissions.canAttendTickets(interaction.member) ||
                      await permissions.isOwner(interaction.user.id, interaction.member) ||
                      await permissions.isSuporte(interaction.member);

    if (!canAttend) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas a equipe de atendimento pode assumir vendas.')],
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    // Buscar ticket de venda
    const ticketsVenda = await db.readData('ticketsVenda') || [];
    const ticket = ticketsVenda.find(t => t.id === ticketId);

    if (!ticket) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Ticket Não Encontrado', 'Este ticket de venda não foi encontrado.')]
      });
    }

    if (ticket.atendidoPor) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Já Assumido', `Esta venda já está sendo atendida por <@${ticket.atendidoPor}>.`)]
      });
    }

    // Atualizar ticket
    await db.updateItem('ticketsVenda',
      t => t.id === ticketId,
      t => ({
        ...t,
        atendidoPor: interaction.user.id,
        atendidoEm: Date.now()
      })
    );

    // Atualizar embed no canal
    try {
      const messages = await interaction.channel.messages.fetch({ limit: 20 });
      const ticketMessage = messages.find(m => m.author.bot && m.embeds.length > 0 && m.components.length > 0);

      if (ticketMessage) {
        const oldEmbed = ticketMessage.embeds[0];
        const newEmbed = EmbedBuilder.from(oldEmbed)
          .addFields({ name: '✋ Atendido por', value: `${interaction.user}`, inline: true });

        await ticketMessage.edit({ embeds: [newEmbed] });
      }
    } catch (e) {
      console.error('Erro ao atualizar embed:', e);
    }

    return interaction.editReply({
      embeds: [createSuccessEmbed('Venda Assumida', `${EMOJIS.SUCCESS} Você está atendendo esta venda!`)]
    });
  }

  // vendas_pix_TICKETID - Enviar PIX
  if (customId.startsWith('vendas_pix_')) {
    const ticketId = customId.replace('vendas_pix_', '');

    // Verificar permissão
    const canAttend = await permissions.canAttendTickets(interaction.member) ||
                      await permissions.isOwner(interaction.user.id, interaction.member) ||
                      await permissions.isSuporte(interaction.member);

    if (!canAttend) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas a equipe de atendimento pode enviar o PIX.')],
        flags: 64
      });
    }

    await interaction.deferReply();

    // Buscar configuração do PIX
    const vendasConfig = await db.readData('vendasConfig') || {};

    if (!vendasConfig.pix || !vendasConfig.pix.chave) {
      return interaction.editReply({
        embeds: [createErrorEmbed('PIX Não Configurado', 'O PIX de vendas ainda não foi configurado. Use /vendas para configurar.')]
      });
    }

    // Buscar ticket para pegar valor
    const ticketsVenda = await db.readData('ticketsVenda') || [];
    const ticket = ticketsVenda.find(t => t.id === ticketId);

    const pix = vendasConfig.pix;

    const pixEmbed = new EmbedBuilder()
      .setTitle('💳 Dados para Pagamento PIX')
      .setDescription(
        `**Produto:** ${ticket?.produtoNome || 'N/A'}\n` +
        `**Valor:** R$ ${ticket?.valor?.toFixed(2) || 'N/A'}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `**Tipo de Chave:** ${pix.tipoChave}\n` +
        `**Chave PIX:** \`${pix.chave}\`\n` +
        `**Titular:** ${pix.nome}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ **Importante:**\n` +
        `• Envie o comprovante neste canal após o pagamento\n` +
        `• Aguarde a confirmação do atendente`
      )
      .setColor(COLORS.SUCCESS)
      .setTimestamp();

    if (pix.qrcode) {
      pixEmbed.setImage(pix.qrcode);
    }

    return interaction.editReply({ embeds: [pixEmbed] });
  }

  // vendas_fechar_TICKETID - Fechar ticket de venda
  if (customId.startsWith('vendas_fechar_')) {
    const ticketId = customId.replace('vendas_fechar_', '');

    // Verificar permissão
    const canAttend = await permissions.canAttendTickets(interaction.member) ||
                      await permissions.isOwner(interaction.user.id, interaction.member) ||
                      await permissions.isSuporte(interaction.member);

    if (!canAttend) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas a equipe de atendimento pode fechar tickets de venda.')],
        flags: 64
      });
    }

    // Pedir motivo do fechamento
    const modal = new ModalBuilder()
      .setCustomId(`modal_vendas_fechar_${ticketId}`)
      .setTitle('Fechar Ticket de Venda');

    const motivoInput = new TextInputBuilder()
      .setCustomId('motivo')
      .setLabel('Motivo/Status do Fechamento')
      .setPlaceholder('Ex: Venda concluída, Cliente desistiu, etc.')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(motivoInput)
    );

    return interaction.showModal(modal);
  }
}

module.exports = { handle };
