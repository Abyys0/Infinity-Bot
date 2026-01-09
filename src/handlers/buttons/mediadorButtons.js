// Handler de botões do painel de mediador

const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../../utils/embeds');
const { EMOJIS, COLORS, DISABLED_FEATURES, DISABLED_MESSAGE } = require('../../config/constants');
const permissions = require('../../config/permissions');
const db = require('../../database');

async function handle(interaction) {
  const customId = interaction.customId;

  // Verificar se o painel de mediador está desativado
  if (DISABLED_FEATURES.PAINEL_MEDIADOR) {
    return interaction.reply({
      embeds: [createErrorEmbed('Sistema Desativado', DISABLED_MESSAGE)],
      flags: 64
    });
  }

  console.log('[MEDIADOR PAINEL] Botão clicado:', customId, 'por', interaction.user.tag);

  // Verificar se está registrado como mediador no sistema
  const mediadores = await db.readData('mediadores');
  console.log('[MEDIADOR PAINEL] Total de mediadores no banco:', mediadores.length);
  console.log('[MEDIADOR PAINEL] Mediadores:', mediadores.map(m => ({ userId: m.userId, active: m.active })));
  
  const mediador = mediadores.find(m => m.userId === interaction.user.id && m.active);
  console.log('[MEDIADOR PAINEL] Mediador encontrado para', interaction.user.id, ':', mediador ? 'SIM' : 'NÃO');

  // mediador_configurar_pix - Não precisa verificar se está registrado
  if (customId === 'mediador_configurar_pix') {
    // Criar modal para configurar PIX
    const modal = new ModalBuilder()
      .setCustomId('modal_mediador_pix')
      .setTitle('Configurar PIX de Mediador');

    const tipoChaveInput = new TextInputBuilder()
      .setCustomId('tipo_chave')
      .setLabel('Tipo de Chave PIX')
      .setPlaceholder('CPF, CNPJ, Email, Telefone ou Chave Aleatória')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const chaveInput = new TextInputBuilder()
      .setCustomId('chave')
      .setLabel('Chave PIX')
      .setPlaceholder('Digite sua chave PIX')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const nomeInput = new TextInputBuilder()
      .setCustomId('nome')
      .setLabel('Nome do Titular')
      .setPlaceholder('Nome completo')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const imagemInput = new TextInputBuilder()
      .setCustomId('imagem')
      .setLabel('URL da Imagem QR Code (Opcional)')
      .setPlaceholder('https://exemplo.com/qrcode.png')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const row1 = new ActionRowBuilder().addComponents(tipoChaveInput);
    const row2 = new ActionRowBuilder().addComponents(chaveInput);
    const row3 = new ActionRowBuilder().addComponents(nomeInput);
    const row4 = new ActionRowBuilder().addComponents(imagemInput);

    modal.addComponents(row1, row2, row3, row4);

    return interaction.showModal(modal);
  }

  if (!mediador) {
    return interaction.reply({
      embeds: [createErrorEmbed('Não Registrado', 'Você não está registrado como mediador no sistema.\n\nPeça para um dono te adicionar com `/painel`.')],
      flags: 64
    });
  }

  // mediador_entrar_painel
  if (customId === 'mediador_entrar_painel') {
    await interaction.deferReply({ flags: 64 });

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

    if (mediador.onDuty) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Já em Serviço', 'Você já está em serviço!')]
      });
    }

    // Entrar em serviço
    await db.updateItem('mediadores',
      m => m.userId === interaction.user.id,
      m => ({ ...m, onDuty: true, onDutySince: Date.now() })
    );

    // Atualizar painel
    await atualizarPainel(interaction.client);

    await interaction.editReply({
      embeds: [createSuccessEmbed(
        'Em Serviço',
        `${EMOJIS.ONLINE} **Você entrou em serviço como mediador!**\n\nBoa sorte nos atendimentos!`
      )]
    });
  }

  // mediador_sair_painel
  if (customId === 'mediador_sair_painel') {
    await interaction.deferReply({ flags: 64 });

    if (!mediador.onDuty) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Não em Serviço', 'Você não está em serviço!')]
      });
    }

    // Sair de serviço
    await db.updateItem('mediadores',
      m => m.userId === interaction.user.id,
      m => ({ ...m, onDuty: false, lastOffDuty: Date.now() })
    );

    // Atualizar painel
    await atualizarPainel(interaction.client);

    await interaction.editReply({
      embeds: [createSuccessEmbed(
        'Fora de Serviço',
        `${EMOJIS.OFFLINE} **Você saiu de serviço!**\n\nObrigado pelo trabalho!`
      )]
    });
  }

  // mediador_ver_lista
  if (customId === 'mediador_ver_lista') {
    await interaction.deferReply({ flags: 64 });

    const mediadores = await db.readData('mediadores');
    const mediadoresAtivos = mediadores.filter(m => m.active && m.onDuty);

    if (mediadoresAtivos.length === 0) {
      return interaction.editReply({
        embeds: [createInfoEmbed(
          '📊 Mediadores em Serviço',
          'Nenhum mediador em serviço no momento.'
        )]
      });
    }

    // Buscar dados dos mediadores
    const lista = [];
    for (const med of mediadoresAtivos) {
      try {
        const user = await interaction.client.users.fetch(med.userId);
        const tempo = med.onDutySince ? Math.floor((Date.now() - med.onDutySince) / 60000) : 0;
        lista.push(`${EMOJIS.ONLINE} ${user.tag} - *${tempo}min*`);
      } catch (error) {
        console.error('Erro ao buscar mediador:', error);
      }
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('📊 Mediadores em Serviço')
      .setDescription(lista.join('\n') || 'Nenhum mediador em serviço.')
      .addFields({
        name: '📈 Total',
        value: `**${mediadoresAtivos.length}** mediador(es) ativo(s)`,
        inline: false
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}

/**
 * Atualiza o painel de mediadores com a contagem atual
 */
async function atualizarPainel(client) {
  try {
    const config = await db.readData('config');
    
    if (!config.painelMediadorMessageId || !config.painelMediadorChannelId) {
      return; // Painel não configurado
    }

    const channel = await client.channels.fetch(config.painelMediadorChannelId).catch(() => null);
    if (!channel) return;

    const message = await channel.messages.fetch(config.painelMediadorMessageId).catch(() => null);
    if (!message) return;

    // Contar mediadores ativos
    const mediadores = await db.readData('mediadores');
    const mediadoresAtivos = mediadores.filter(m => m.active && m.onDuty);

    // Atualizar embed
    const embed = message.embeds[0];
    const newEmbed = new EmbedBuilder(embed.data);

    // Atualizar descrição com nova contagem
    const descricao = embed.description.replace(
      /📊 \*\*Mediadores em Serviço:\*\* \d+/,
      `📊 **Mediadores em Serviço:** ${mediadoresAtivos.length}`
    );

    newEmbed.setDescription(descricao);

    await message.edit({ embeds: [newEmbed], components: message.components });

  } catch (error) {
    console.error('Erro ao atualizar painel de mediadores:', error);
  }
}

module.exports = { handle, atualizarPainel };
