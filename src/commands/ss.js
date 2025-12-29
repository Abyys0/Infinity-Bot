// Comando: /ss - Chamar analista para SS (somente mediadores e superiores)

const { SlashCommandBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../utils/embeds');
const { ANALYST_TYPES, EMOJIS } = require('../config/constants');
const permissions = require('../config/permissions');
const db = require('../database');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ss')
    .setDescription('[MEDIADOR+] Chamar analista para SS')
    .addStringOption(option =>
      option.setName('tipo')
        .setDescription('Tipo de analista')
        .setRequired(true)
        .addChoices(
          { name: '📱 Mobile', value: ANALYST_TYPES.MOBILE },
          { name: '💻 Emulador', value: ANALYST_TYPES.EMULATOR }
        ))
    .addUserOption(option =>
      option.setName('cliente')
        .setDescription('Cliente que precisa da SS')
        .setRequired(false)),

  async execute(interaction) {
    // Apenas mediadores e superiores podem chamar SS
    if (!await permissions.isMediadorOrAbove(interaction.member)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas mediadores e superiores podem chamar analistas para SS.')],
        ephemeral: true
      });
    }

    const tipo = interaction.options.getString('tipo');
    const cliente = interaction.options.getUser('cliente');

    // Buscar analistas em serviço do tipo solicitado
    const analistas = await db.readData('analistas');
    const analistasDisponiveis = analistas.filter(a => 
      a.onDuty && 
      a.active && 
      a.tipo === tipo
    );

    if (analistasDisponiveis.length === 0) {
      const tipoNome = tipo === ANALYST_TYPES.MOBILE ? 'Mobile' : 'Emulador';
      return interaction.reply({
        embeds: [createErrorEmbed(
          'Nenhum Analista Disponível',
          `Não há analistas ${tipoNome} em serviço no momento.\n\n${EMOJIS.INFO} Peça para um analista entrar em serviço com \`/analista entrar_${tipo}\`.`
        )],
        ephemeral: true
      });
    }

    // Selecionar analista aleatório (pode melhorar com sistema de rodízio)
    const analistaEscolhido = analistasDisponiveis[Math.floor(Math.random() * analistasDisponiveis.length)];
    
    try {
      const analistaMember = await interaction.guild.members.fetch(analistaEscolhido.userId);
      const tipoEmoji = tipo === ANALYST_TYPES.MOBILE ? EMOJIS.MOBILE : EMOJIS.PC;
      const tipoNome = tipo === ANALYST_TYPES.MOBILE ? 'Mobile' : 'Emulador';

      // Notificar o analista
      try {
        await analistaMember.send({
          embeds: [createInfoEmbed(
            '📢 Chamado de SS',
            `${EMOJIS.WARNING} **Você foi chamado para fazer uma SS!**\n\n${tipoEmoji} **Tipo:** ${tipoNome}\n👤 **Solicitante:** ${interaction.user}\n${cliente ? `🎯 **Cliente:** ${cliente}` : ''}\n📍 **Servidor:** ${interaction.guild.name}`
          )]
        });
      } catch (error) {
        console.error(`Erro ao enviar DM para analista ${analistaMember.user.tag}:`, error);
      }

      await logger.logSS(interaction.client, 'call', interaction.user.id, interaction.user.tag, analistaMember.user.id, analistaMember.user.tag, tipo);

      // Responder confirmando
      await interaction.reply({
        embeds: [createSuccessEmbed(
          'Analista Chamado',
          `${EMOJIS.SUCCESS} **Analista chamado com sucesso!**\n\n${tipoEmoji} **Tipo:** ${tipoNome}\n👨‍💼 **Analista:** ${analistaMember}\n${cliente ? `🎯 **Cliente:** ${cliente}` : ''}\n\n${EMOJIS.INFO} O analista foi notificado via DM.`
        )]
      });
    } catch (error) {
      console.error('Erro ao chamar analista:', error);
      return interaction.reply({
        embeds: [createErrorEmbed('Erro', 'Não foi possível chamar o analista.')],
        ephemeral: true
      });
    }
  }
};
