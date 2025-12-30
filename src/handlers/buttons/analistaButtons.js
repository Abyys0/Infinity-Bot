// Handler de botões do painel de analista

const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../../utils/embeds');
const { ANALYST_TYPES, EMOJIS, COLORS } = require('../../config/constants');
const permissions = require('../../config/permissions');
const db = require('../../database');
const logger = require('../../utils/logger');

async function handle(interaction) {
  const customId = interaction.customId;

  // analista_configurar_pix - Qualquer um pode configurar
  if (customId === 'analista_configurar_pix') {
    // Criar modal para configurar PIX
    const modal = new ModalBuilder()
      .setCustomId('modal_analista_pix')
      .setTitle('Configurar PIX de Analista');

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

module.exports = { handle };
