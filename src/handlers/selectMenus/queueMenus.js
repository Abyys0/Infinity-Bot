// Handler de menus de seleção de filas

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { PLATFORMS, EMOJIS, COLORS } = require('../../config/constants');
const permissions = require('../../config/permissions');
const db = require('../../database');
const { temMultaPendente, getMultaPendente } = require('../../services/multaService');

async function handle(interaction) {
  const customId = interaction.customId;

  // fila_select_tipo_{valor}
  if (customId.startsWith('fila_select_tipo_')) {
    const valor = parseInt(customId.replace('fila_select_tipo_', ''));
    const selecao = interaction.values[0]; // ex: "2x2_mobile", "3x3_misto"
    
    const [tipo, plataformaStr] = selecao.split('_');
    
    // Mapear plataforma
    const plataformaMap = {
      'mobile': PLATFORMS.MOBILE,
      'emulador': PLATFORMS.EMULATOR,
      'misto': PLATFORMS.MIXED,
      'tatico': PLATFORMS.TACTICAL
    };
    
    const plataforma = plataformaMap[plataformaStr];

    await interaction.deferReply({ flags: 64 });

    // Verificar multa
    if (await temMultaPendente(interaction.user.id)) {
      const multa = await getMultaPendente(interaction.user.id);
      return interaction.editReply({
        embeds: [createErrorEmbed(
          '💸 Multa Pendente',
          `Você possui uma multa pendente e não pode criar filas.\n\n` +
          `**Valor:** R$ ${multa.valor}\n` +
          `**Motivo:** ${multa.motivo}\n` +
          `**Canal:** <#${multa.canalId}>`
        )]
      });
    }

    // Verificar blacklist
    if (await permissions.isBlacklisted(interaction.user.id)) {
      const entry = await permissions.getBlacklistEntry(interaction.user.id);
      return interaction.editReply({
        embeds: [createErrorEmbed(
          '🚫 Blacklist',
          `Você está na blacklist e não pode criar filas.\n\n` +
          `**Motivo:** ${entry.reason}\n` +
          `**Adicionado por:** <@${entry.addedBy}>`
        )]
      });
    }

    try {
      // Gerar ID único
      const filaId = `fila_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Criar fila no banco
      const queue = {
        id: filaId,
        channelId: interaction.channel.id,
        messageId: null,
        tipo,
        plataforma,
        valor,
        jogadores: [],
        criadoPor: interaction.user.id,
        criadoEm: Date.now(),
        status: 'aguardando'
      };

      // Criar embed da fila
      const queueEmbed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('🏆 STORM E-SPORTS')
        .addFields(
          { name: '🎮 MODO', value: `${tipo} ${plataforma}`, inline: false },
          { name: '💰 VALOR', value: `R$ ${valor.toFixed(2)}`, inline: false },
          { name: '👥 JOGADORES', value: 'Nenhum jogador na fila.', inline: false }
        )
        .setTimestamp();

      // Criar botões dinâmicos baseados no tipo e plataforma
      const botoes = criarBotoesFila(tipo, plataforma, filaId);

      const message = await interaction.channel.send({
        embeds: [queueEmbed],
        components: botoes
      });

      // Atualizar messageId
      queue.messageId = message.id;
      await db.addItem('filas', queue);

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Fila Criada',
          `${EMOJIS.SUCCESS} Fila **${tipo} ${plataforma}** criada!\n**Valor:** R$ ${valor}\n\nEscolha suas opções de entrada.`
        )]
      });

    } catch (error) {
      console.error('Erro ao criar fila:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao criar a fila.')]
      });
    }
  }
}

/**
 * Cria botões dinâmicos baseados no tipo e plataforma
 */
function criarBotoesFila(tipo, plataforma, filaId) {
  const rows = [];
  
  if (plataforma === PLATFORMS.MIXED) {
    // MISTO: Botões de quantidade de emuladores
    const row1 = new ActionRowBuilder();
    
    if (tipo === '2x2') {
      row1.addComponents(
        new ButtonBuilder()
          .setCustomId(`entrar_fila_misto_1emu_${filaId}`)
          .setLabel('1 Emulador')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('💻')
      );
    } else if (tipo === '3x3') {
      row1.addComponents(
        new ButtonBuilder()
          .setCustomId(`entrar_fila_misto_1emu_${filaId}`)
          .setLabel('1 Emulador')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('💻'),
        new ButtonBuilder()
          .setCustomId(`entrar_fila_misto_2emu_${filaId}`)
          .setLabel('2 Emulador')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('💻')
      );
    } else if (tipo === '4x4') {
      row1.addComponents(
        new ButtonBuilder()
          .setCustomId(`entrar_fila_misto_1emu_${filaId}`)
          .setLabel('1 Emulador')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('💻'),
        new ButtonBuilder()
          .setCustomId(`entrar_fila_misto_2emu_${filaId}`)
          .setLabel('2 Emulador')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('💻'),
        new ButtonBuilder()
          .setCustomId(`entrar_fila_misto_3emu_${filaId}`)
          .setLabel('3 Emulador')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('💻')
      );
    }
    
    rows.push(row1);
    
  } else if (plataforma === PLATFORMS.MOBILE || plataforma === PLATFORMS.EMULATOR) {
    // MOBILE ou EMULADOR: Full UMP XM8, Gelo Infinito, Gelo Normal
    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`entrar_fila_fullump_${filaId}`)
          .setLabel('Full UMP XM8')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🔫'),
        new ButtonBuilder()
          .setCustomId(`entrar_fila_geloinfinito_${filaId}`)
          .setLabel('Gelo Infinito')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🔥'),
        new ButtonBuilder()
          .setCustomId(`entrar_fila_gelonormal_${filaId}`)
          .setLabel('Gelo Normal')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('❄️')
      );
    
    rows.push(row1);
    
  } else if (plataforma === PLATFORMS.TACTICAL) {
    // TÁTICO: Mobile ou Emulador
    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`entrar_fila_tatico_mobile_${filaId}`)
          .setLabel('Mobile')
          .setStyle(ButtonStyle.Success)
          .setEmoji('📱'),
        new ButtonBuilder()
          .setCustomId(`entrar_fila_tatico_emulador_${filaId}`)
          .setLabel('Emulador')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('💻')
      );
    
    // Para 2v2, 3v3, 4v4 adicionar opção Misto
    if (tipo !== '1x1') {
      row1.addComponents(
        new ButtonBuilder()
          .setCustomId(`entrar_fila_tatico_misto_${filaId}`)
          .setLabel('Misto')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔀')
      );
    }
    
    rows.push(row1);
  }

  // Botão de Sair da Fila (sempre presente)
  const rowSair = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`sair_fila_${filaId}`)
        .setLabel('Sair da Fila')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('✖️')
    );
  
  rows.push(rowSair);

  return rows;
}

module.exports = { handle };
