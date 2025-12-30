// Handler de botões do painel de analista

const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../../utils/embeds');
const { ANALYST_TYPES, EMOJIS } = require('../../config/constants');
const permissions = require('../../config/permissions');
const db = require('../../database');
const logger = require('../../utils/logger');

async function handle(interaction) {
  const customId = interaction.customId;

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

    // Responder confirmando
    await interaction.editReply({
      embeds: [createSuccessEmbed(
        'Analista Chamado',
        `${EMOJIS.SUCCESS} **Analista chamado com sucesso!**\n\n` +
        `${tipoEmoji} **Tipo:** ${tipoNome}\n` +
        `👨‍💼 **Analista:** ${analistaMember}\n\n` +
        `${EMOJIS.INFO} O analista foi notificado e entrará em contato.`
      )]
    });
  } catch (error) {
    console.error('Erro ao chamar analista:', error);
    return interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Não foi possível chamar o analista.')]
    });
  }
}

module.exports = { handle };
