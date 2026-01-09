// Handler de select menus do sistema de vendas

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../../utils/embeds');
const { EMOJIS, COLORS } = require('../../config/constants');
const permissions = require('../../config/permissions');
const db = require('../../database');

async function handle(interaction) {
  const customId = interaction.customId;

  // vendas_select_produto_CANALID - Selecionar produto para compra
  if (customId.startsWith('vendas_select_produto_')) {
    const produtoId = interaction.values[0];

    await interaction.deferReply({ flags: 64 });

    // Verificar blacklist
    if (await permissions.isBlacklisted(interaction.user.id)) {
      const entry = await permissions.getBlacklistEntry(interaction.user.id);
      return interaction.editReply({
        embeds: [createErrorEmbed(
          'Blacklist',
          `${EMOJIS.BLACKLIST} Você está na blacklist e não pode comprar.\n\n**Motivo:** ${entry.reason}`
        )]
      });
    }

    // Buscar produto
    const produtos = await db.readData('produtos') || [];
    const produto = produtos.find(p => p.id === produtoId);

    if (!produto) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Produto Não Encontrado', 'Este produto não existe mais.')]
      });
    }

    if (produto.estoque <= 0) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Sem Estoque', 'Este produto está sem estoque no momento.')]
      });
    }

    // Verificar se já tem um ticket aberto para este produto
    const ticketsVenda = await db.readData('ticketsVenda') || [];
    const ticketExistente = ticketsVenda.find(t => 
      t.usuarioId === interaction.user.id && 
      t.produtoId === produtoId && 
      t.status === 'aberto'
    );

    if (ticketExistente) {
      return interaction.editReply({
        embeds: [createErrorEmbed(
          'Ticket Existente',
          `Você já tem um ticket aberto para este produto.\n\nCanal: <#${ticketExistente.canalId}>`
        )]
      });
    }

    // Buscar configuração de vendas
    const vendasConfig = await db.readData('vendasConfig') || {};
    const categoriaId = vendasConfig.categoriaPainel;

    // Buscar cargos de suporte para permissões
    const config = await db.readData('config') || {};
    const suporteRoles = config.roles?.suporte || [];
    const ticketAttendants = config.roles?.ticketAttendants || [];
    const ownerRoles = process.env.OWNER_ID?.split(',').map(id => id.trim()) || [];

    // Criar canal de ticket de venda
    const ticketId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const channelName = `🛒-${interaction.user.username.substring(0, 20)}-${ticketId.substring(0, 5)}`;

    try {
      // Configurar permissões do canal
      const permissionOverwrites = [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles]
        },
        {
          id: interaction.client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages]
        }
      ];

      // Adicionar permissões para cargos de suporte
      for (const roleId of [...suporteRoles, ...ticketAttendants, ...ownerRoles]) {
        permissionOverwrites.push({
          id: roleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages]
        });
      }

      const ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: categoriaId,
        permissionOverwrites
      });

      // Criar embed do ticket
      const ticketEmbed = new EmbedBuilder()
        .setTitle(`${EMOJIS.TICKET} Ticket de Venda - ${produto.nome}`)
        .setDescription(
          `**Cliente:** ${interaction.user}\n` +
          `**Produto:** ${produto.nome}\n` +
          `**Valor:** R$ ${produto.valor.toFixed(2)}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `📝 **Descrição do Produto:**\n${produto.descricao}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${EMOJIS.INFO} **Instruções:**\n` +
          `• Aguarde um atendente assumir sua venda\n` +
          `• O atendente enviará os dados de pagamento\n` +
          `• Envie o comprovante após o pagamento\n` +
          `• Aguarde a confirmação e entrega`
        )
        .setColor(COLORS.PRIMARY)
        .setTimestamp()
        .setFooter({ text: `Ticket ID: ${ticketId}` });

      // Botões do ticket
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`vendas_assumir_${ticketId}`)
            .setLabel('Assumir Venda')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✋'),
          new ButtonBuilder()
            .setCustomId(`vendas_pix_${ticketId}`)
            .setLabel('Enviar PIX')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💳'),
          new ButtonBuilder()
            .setCustomId(`vendas_fechar_${ticketId}`)
            .setLabel('Fechar Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒')
        );

      await ticketChannel.send({
        content: `${interaction.user} | ${ownerRoles.map(r => `<@&${r}>`).join(' ')} ${suporteRoles.map(r => `<@&${r}>`).join(' ')}`,
        embeds: [ticketEmbed],
        components: [row]
      });

      // Salvar ticket no banco
      const novoTicket = {
        id: ticketId,
        usuarioId: interaction.user.id,
        produtoId: produto.id,
        produtoNome: produto.nome,
        valor: produto.valor,
        canalId: ticketChannel.id,
        status: 'aberto',
        criadoEm: Date.now(),
        atendidoPor: null,
        atendidoEm: null
      };

      await db.addItem('ticketsVenda', novoTicket);

      return interaction.editReply({
        embeds: [createSuccessEmbed(
          'Ticket Criado',
          `${EMOJIS.SUCCESS} Seu ticket de compra foi criado!\n\n` +
          `**Produto:** ${produto.nome}\n` +
          `**Valor:** R$ ${produto.valor.toFixed(2)}\n` +
          `**Canal:** ${ticketChannel}\n\n` +
          `Aguarde um atendente!`
        )]
      });

    } catch (error) {
      console.error('Erro ao criar ticket de venda:', error);
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Não foi possível criar o ticket de venda. Tente novamente.')]
      });
    }
  }
}

module.exports = { handle };
