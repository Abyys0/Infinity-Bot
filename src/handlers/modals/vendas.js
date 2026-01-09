// Handler de modais do sistema de vendas

const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../../utils/embeds');
const { EMOJIS, COLORS } = require('../../config/constants');
const permissions = require('../../config/permissions');
const db = require('../../database');

async function handle(interaction) {
  const customId = interaction.customId;

  // modal_vendas_add_produto - Adicionar produto
  if (customId === 'modal_vendas_add_produto') {
    // Verificar permissão
    if (!await permissions.isOwner(interaction.user.id, interaction.member)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode adicionar produtos.')],
        flags: 64
      });
    }

    const nome = interaction.fields.getTextInputValue('nome').trim();
    const descricao = interaction.fields.getTextInputValue('descricao').trim();
    const valorStr = interaction.fields.getTextInputValue('valor').trim().replace(',', '.');
    const estoqueStr = interaction.fields.getTextInputValue('estoque').trim();

    // Validar valor
    const valor = parseFloat(valorStr);
    if (isNaN(valor) || valor <= 0) {
      return interaction.reply({
        embeds: [createErrorEmbed('Valor Inválido', 'O valor deve ser um número positivo. Ex: 25.00')],
        flags: 64
      });
    }

    // Validar estoque
    const estoque = parseInt(estoqueStr);
    if (isNaN(estoque) || estoque < 0) {
      return interaction.reply({
        embeds: [createErrorEmbed('Estoque Inválido', 'O estoque deve ser um número inteiro não negativo.')],
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    // Verificar se produto já existe
    const produtos = await db.readData('produtos') || [];
    const existente = produtos.find(p => p.nome.toLowerCase() === nome.toLowerCase());

    if (existente) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Produto Existente', `Já existe um produto com o nome "${nome}".`)]
      });
    }

    // Criar produto
    const novoProduto = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      nome,
      descricao,
      valor,
      estoque,
      criadoPor: interaction.user.id,
      criadoEm: Date.now()
    };

    await db.addItem('produtos', novoProduto);

    return interaction.editReply({
      embeds: [createSuccessEmbed(
        'Produto Adicionado',
        `${EMOJIS.SUCCESS} **Produto cadastrado com sucesso!**\n\n` +
        `**Nome:** ${nome}\n` +
        `**Valor:** R$ ${valor.toFixed(2)}\n` +
        `**Estoque:** ${estoque} unidade(s)\n` +
        `**Descrição:** ${descricao.substring(0, 100)}${descricao.length > 100 ? '...' : ''}`
      )]
    });
  }

  // modal_vendas_remover_produto - Remover produto
  if (customId === 'modal_vendas_remover_produto') {
    if (!await permissions.isOwner(interaction.user.id, interaction.member)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode remover produtos.')],
        flags: 64
      });
    }

    const nome = interaction.fields.getTextInputValue('nome').trim();

    await interaction.deferReply({ flags: 64 });

    const produtos = await db.readData('produtos') || [];
    const produtoIndex = produtos.findIndex(p => p.nome.toLowerCase() === nome.toLowerCase());

    if (produtoIndex === -1) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Produto Não Encontrado', `Não foi encontrado nenhum produto com o nome "${nome}".`)]
      });
    }

    const produtoRemovido = produtos[produtoIndex];
    await db.removeItem('produtos', p => p.nome.toLowerCase() === nome.toLowerCase());

    return interaction.editReply({
      embeds: [createSuccessEmbed(
        'Produto Removido',
        `${EMOJIS.SUCCESS} O produto **${produtoRemovido.nome}** foi removido com sucesso!`
      )]
    });
  }

  // modal_vendas_editar_painel - Editar painel
  if (customId === 'modal_vendas_editar_painel') {
    if (!await permissions.isOwner(interaction.user.id, interaction.member)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode editar o painel.')],
        flags: 64
      });
    }

    const titulo = interaction.fields.getTextInputValue('titulo').trim();
    const descricao = interaction.fields.getTextInputValue('descricao').trim();

    await interaction.deferReply({ flags: 64 });

    // Atualizar configuração
    let vendasConfig = await db.readData('vendasConfig') || {};
    vendasConfig.titulo = titulo;
    vendasConfig.descricao = descricao;

    await db.writeData('vendasConfig', vendasConfig);

    return interaction.editReply({
      embeds: [createSuccessEmbed(
        'Painel Atualizado',
        `${EMOJIS.SUCCESS} O painel de vendas foi atualizado!\n\n` +
        `**Título:** ${titulo}\n` +
        `**Descrição:** ${descricao.substring(0, 100)}${descricao.length > 100 ? '...' : ''}`
      )]
    });
  }

  // modal_vendas_config_pix - Configurar PIX
  if (customId === 'modal_vendas_config_pix') {
    if (!await permissions.isOwner(interaction.user.id, interaction.member)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode configurar o PIX.')],
        flags: 64
      });
    }

    const tipoChave = interaction.fields.getTextInputValue('tipo_chave').trim();
    const chave = interaction.fields.getTextInputValue('chave').trim();
    const nome = interaction.fields.getTextInputValue('nome').trim();
    const qrcode = interaction.fields.getTextInputValue('qrcode')?.trim() || '';

    await interaction.deferReply({ flags: 64 });

    // Atualizar configuração
    let vendasConfig = await db.readData('vendasConfig') || {};
    vendasConfig.pix = {
      tipoChave,
      chave,
      nome,
      qrcode
    };

    await db.writeData('vendasConfig', vendasConfig);

    return interaction.editReply({
      embeds: [createSuccessEmbed(
        'PIX Configurado',
        `${EMOJIS.SUCCESS} O PIX de vendas foi configurado!\n\n` +
        `**Tipo:** ${tipoChave}\n` +
        `**Chave:** \`${chave}\`\n` +
        `**Titular:** ${nome}\n` +
        `**QR Code:** ${qrcode ? 'Configurado ✅' : 'Não configurado'}`
      )]
    });
  }

  // modal_vendas_enviar_painel - Enviar painel para canal
  if (customId === 'modal_vendas_enviar_painel') {
    if (!await permissions.isOwner(interaction.user.id, interaction.member)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode enviar o painel.')],
        flags: 64
      });
    }

    const canalId = interaction.fields.getTextInputValue('canal_id').trim();

    await interaction.deferReply({ flags: 64 });

    // Buscar canal
    const canal = await interaction.guild.channels.fetch(canalId).catch(() => null);
    if (!canal) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Canal Não Encontrado', 'O ID do canal é inválido ou o canal não existe.')]
      });
    }

    if (!canal.isTextBased()) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Canal Inválido', 'O canal deve ser um canal de texto.')]
      });
    }

    // Buscar produtos e configuração
    const produtos = await db.readData('produtos') || [];
    const vendasConfig = await db.readData('vendasConfig') || {};

    if (produtos.length === 0) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Sem Produtos', 'Cadastre ao menos um produto antes de enviar o painel.')]
      });
    }

    // Criar embed do painel público
    const titulo = vendasConfig.titulo || '🛒 Loja INFINITY';
    const descricao = vendasConfig.descricao || 'Selecione um produto abaixo para realizar sua compra!';

    let produtosLista = produtos.map((p, i) => {
      const estoqueStatus = p.estoque > 0 ? `✅ ${p.estoque} em estoque` : '❌ Sem estoque';
      return `**${i + 1}. ${p.nome}** - R$ ${p.valor.toFixed(2)}\n   └ ${estoqueStatus}`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setTitle(titulo)
      .setDescription(
        `${descricao}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📦 **Produtos Disponíveis:**\n\n` +
        produtosLista + '\n\n' +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${EMOJIS.INFO} Selecione um produto no menu abaixo para abrir um ticket de compra.`
      )
      .setColor(COLORS.PRIMARY)
      .setTimestamp()
      .setFooter({ text: 'INFINITY BOT • Sistema de Vendas' });

    // Criar select menu com produtos
    const selectOptions = produtos
      .filter(p => p.estoque > 0)
      .slice(0, 25) // Limite do Discord
      .map(p => ({
        label: p.nome,
        description: `R$ ${p.valor.toFixed(2)} - ${p.estoque} disponível(is)`,
        value: p.id,
        emoji: '🛒'
      }));

    if (selectOptions.length === 0) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Sem Estoque', 'Todos os produtos estão sem estoque.')]
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`vendas_select_produto_${canal.id}`)
      .setPlaceholder('📦 Clique aqui para selecionar')
      .addOptions(selectOptions);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Salvar informação da categoria do canal para criar tickets na mesma categoria
    let vendasConfigAtualizado = await db.readData('vendasConfig') || {};
    vendasConfigAtualizado.canalPainel = canal.id;
    vendasConfigAtualizado.categoriaPainel = canal.parentId || null;
    await db.writeData('vendasConfig', vendasConfigAtualizado);

    // Enviar para o canal
    try {
      await canal.send({ embeds: [embed], components: [row] });

      return interaction.editReply({
        embeds: [createSuccessEmbed(
          'Painel Enviado',
          `${EMOJIS.SUCCESS} O painel de vendas foi enviado para ${canal}!\n\n` +
          `Os clientes podem selecionar produtos para abrir tickets de compra.`
        )]
      });
    } catch (error) {
      console.error('Erro ao enviar painel:', error);
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', `Não foi possível enviar o painel para o canal. Verifique as permissões do bot.`)]
      });
    }
  }

  // modal_vendas_fechar_TICKETID - Fechar ticket de venda
  if (customId.startsWith('modal_vendas_fechar_')) {
    const ticketId = customId.replace('modal_vendas_fechar_', '');
    const motivo = interaction.fields.getTextInputValue('motivo').trim();

    await interaction.deferReply({ flags: 64 });

    // Atualizar ticket
    await db.updateItem('ticketsVenda',
      t => t.id === ticketId,
      t => ({
        ...t,
        status: 'fechado',
        fechadoPor: interaction.user.id,
        fechadoEm: Date.now(),
        motivoFechamento: motivo
      })
    );

    // Enviar mensagem de fechamento
    const embedFechamento = new EmbedBuilder()
      .setTitle('🔒 Ticket de Venda Fechado')
      .setDescription(
        `**Fechado por:** ${interaction.user}\n` +
        `**Motivo:** ${motivo}\n\n` +
        `Este canal será deletado em 10 segundos...`
      )
      .setColor(COLORS.ERROR)
      .setTimestamp();

    await interaction.channel.send({ embeds: [embedFechamento] });

    await interaction.editReply({
      embeds: [createSuccessEmbed('Ticket Fechado', 'O ticket será deletado em 10 segundos.')]
    });

    // Deletar canal após 10 segundos
    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch (e) {
        console.error('Erro ao deletar canal de venda:', e);
      }
    }, 10000);
  }
}

module.exports = { handle };
