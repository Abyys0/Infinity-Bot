// Handler de modais de vitória

const { EmbedBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { EMOJIS, COLORS } = require('../../config/constants');
const db = require('../../database');
const rankingService = require('../../services/rankingService');

async function handle(interaction) {
  const customId = interaction.customId;

  // modal_vitoria_FILAID
  if (customId.startsWith('modal_vitoria_')) {
    return await handleVitoriaModal(interaction);
  }

  await interaction.reply({
    content: '❌ Modal não reconhecido.',
    flags: 64
  });
}

/**
 * Processa o modal de vitória
 */
async function handleVitoriaModal(interaction) {
  const filaId = interaction.customId.replace('modal_vitoria_', '');
  const vencedorInput = interaction.fields.getTextInputValue('vencedor_id');
  
  await interaction.deferReply({ flags: 64 });

  // Buscar fila
  const fila = await db.findItem('filas', f => f.id === filaId);
  if (!fila) {
    return interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Fila não encontrada.')]
    });
  }

  // Usar jogadoresPartida
  const jogadoresDaPartida = fila.jogadoresPartida || [];
  
  if (jogadoresDaPartida.length === 0) {
    return interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Nenhum jogador encontrado nesta partida.')]
    });
  }

  // Extrair ID do usuário (pode ser menção ou ID direto)
  let vencedorId = vencedorInput.replace(/[<@!>]/g, '').trim();
  
  // Verificar se é um ID válido (números)
  if (!/^\d+$/.test(vencedorId)) {
    // Tentar buscar por nome entre os jogadores da partida
    try {
      for (const playerId of jogadoresDaPartida) {
        const member = await interaction.guild.members.fetch(playerId).catch(() => null);
        if (member && (member.user.username.toLowerCase().includes(vencedorInput.toLowerCase()) || 
            member.displayName.toLowerCase().includes(vencedorInput.toLowerCase()))) {
          vencedorId = playerId;
          break;
        }
      }
    } catch (error) {
      console.error('Erro ao buscar membro:', error);
    }
  }

  // Verificar se o vencedor faz parte da partida
  if (!jogadoresDaPartida.includes(vencedorId)) {
    return interaction.editReply({
      embeds: [createErrorEmbed(
        'Jogador Inválido', 
        `O jogador informado não faz parte desta partida.\n\n**Jogadores da partida:**\n${jogadoresDaPartida.map(id => `<@${id}>`).join('\n')}`
      )]
    });
  }

  // Calcular valores
  const valorPorJogador = fila.valor;
  const metadeJogadores = jogadoresDaPartida.length / 2;
  const totalTime = valorPorJogador * metadeJogadores;
  const valorReceber = totalTime * 2;
  const valorPorVencedor = valorReceber / metadeJogadores;

  // Determinar perdedores (todos exceto o vencedor informado)
  // Como é 1v1 geralmente, o perdedor é o outro jogador
  const perdedores = jogadoresDaPartida.filter(id => id !== vencedorId);

  // Atualizar status da fila
  await db.updateItem('filas',
    f => f.id === filaId,
    f => ({
      ...f,
      status: 'finalizada',
      vencedorId: vencedorId,
      finalizadaEm: Date.now(),
      finalizadoPor: interaction.user.id
    })
  );

  // Registrar no ranking
  try {
    await rankingService.addVictory(vencedorId, valorReceber);
    for (const perdedorId of perdedores) {
      await rankingService.addDefeat(perdedorId, valorPorJogador);
    }
    console.log(`[RANKING] Vitória registrada: ${vencedorId} ganhou R$ ${valorReceber}`);
  } catch (error) {
    console.error('[RANKING] Erro ao registrar no ranking:', error);
  }

  // Buscar dados do vencedor para exibir
  let vencedorTag = `<@${vencedorId}>`;
  try {
    const vencedorMember = await interaction.guild.members.fetch(vencedorId);
    vencedorTag = `${vencedorMember.user.tag} (<@${vencedorId}>)`;
  } catch (error) {
    // Usar apenas a menção se não conseguir buscar
  }

  // Criar embed de vitória
  const vitoriaEmbed = new EmbedBuilder()
    .setTitle('🏆 VITÓRIA REGISTRADA!')
    .setDescription(
      `**Partida finalizada!**\n\n` +
      `🥇 **Vencedor:** <@${vencedorId}>\n` +
      `💰 **Valor a receber:** R$ ${valorReceber.toFixed(2)}\n\n` +
      `**Tipo:** ${fila.tipo} ${fila.plataforma}\n` +
      `**Valor por jogador:** R$ ${fila.valor}\n\n` +
      `👥 **Jogadores da Partida:**\n${jogadoresDaPartida.map(id => id === vencedorId ? `🥇 <@${id}> (Vencedor)` : `❌ <@${id}>`).join('\n')}\n\n` +
      `✅ **Mediador:** ${interaction.user}`
    )
    .setColor(COLORS.SUCCESS)
    .setTimestamp();

  // Enviar no canal privado
  if (fila.canalPrivadoId) {
    try {
      const privateChannel = await interaction.guild.channels.fetch(fila.canalPrivadoId);
      if (privateChannel) {
        await privateChannel.send({ 
          content: jogadoresDaPartida.map(id => `<@${id}>`).join(' '),
          embeds: [vitoriaEmbed] 
        });
      }
    } catch (error) {
      console.error('[FILA] Erro ao acessar canal privado:', error);
    }
  }

  await interaction.editReply({
    embeds: [createSuccessEmbed(
      'Vitória Registrada',
      `🏆 **Vencedor:** <@${vencedorId}>\n💰 **Valor:** R$ ${valorReceber.toFixed(2)}\n\n` +
      `O resultado foi registrado no ranking.`
    )]
  });
}

module.exports = { handle };
