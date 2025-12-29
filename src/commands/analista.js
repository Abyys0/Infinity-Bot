// Comando: /analista - Entrar/sair de serviço como analista

const { SlashCommandBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../utils/embeds');
const { ANALYST_TYPES, EMOJIS } = require('../config/constants');
const permissions = require('../config/permissions');
const db = require('../database');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('analista')
    .setDescription('[ANALISTA] Entrar ou sair de serviço como analista')
    .addStringOption(option =>
      option.setName('acao')
        .setDescription('Ação')
        .setRequired(true)
        .addChoices(
          { name: '🟢 Entrar - Mobile', value: 'entrar_mobile' },
          { name: '🟢 Entrar - Emulador', value: 'entrar_emulador' },
          { name: '⚪ Sair de Serviço', value: 'sair' },
          { name: '📊 Ver Status', value: 'status' }
        )),

  async execute(interaction) {
    // Verificar se tem cargo de analista
    if (!await permissions.isAnalista(interaction.member)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Você não tem o cargo de analista.')],
        ephemeral: true
      });
    }

    const acao = interaction.options.getString('acao');
    const analistas = await db.readData('analistas');
    const analista = analistas.find(a => a.userId === interaction.user.id && a.active);

    if (acao === 'entrar_mobile' || acao === 'entrar_emulador') {
      const tipo = acao === 'entrar_mobile' ? ANALYST_TYPES.MOBILE : ANALYST_TYPES.EMULATOR;

      // Verificar se já está em serviço
      if (analista && analista.onDuty) {
        return interaction.reply({
          embeds: [createErrorEmbed(
            'Já em Serviço',
            `Você já está em serviço como **Analista ${analista.tipo === ANALYST_TYPES.MOBILE ? 'Mobile' : 'Emulador'}**!\n\nSaia de serviço antes de trocar de tipo.`
          )],
          ephemeral: true
        });
      }

      // Entrar em serviço
      if (analista) {
        await db.updateItem('analistas',
          a => a.userId === interaction.user.id,
          a => ({
            ...a,
            onDuty: true,
            tipo,
            onDutySince: Date.now()
          })
        );
      } else {
        await db.addItem('analistas', {
          userId: interaction.user.id,
          tipo,
          onDuty: true,
          active: true,
          onDutySince: Date.now()
        });
      }

      await logger.logAnalista(interaction.client, 'enter', interaction.user.id, interaction.user.tag, tipo, interaction.user.tag);

      const tipoEmoji = tipo === ANALYST_TYPES.MOBILE ? EMOJIS.MOBILE : EMOJIS.PC;
      const tipoNome = tipo === ANALYST_TYPES.MOBILE ? 'Mobile' : 'Emulador';

      await interaction.reply({
        embeds: [createSuccessEmbed(
          'Em Serviço',
          `${EMOJIS.ONLINE} **Você entrou em serviço!**\n\n${tipoEmoji} **Tipo:** Analista ${tipoNome}\n\nVocê receberá chamados de SS ${tipoNome}!`
        )],
        ephemeral: true
      });
    }

    else if (acao === 'sair') {
      if (!analista || !analista.onDuty) {
        return interaction.reply({
          embeds: [createErrorEmbed('Não em Serviço', 'Você não está em serviço!')],
          ephemeral: true
        });
      }

      await db.updateItem('analistas',
        a => a.userId === interaction.user.id,
        a => ({
          ...a,
          onDuty: false,
          lastOffDuty: Date.now()
        })
      );

      await logger.logAnalista(interaction.client, 'leave', interaction.user.id, interaction.user.tag, analista.tipo, interaction.user.tag);

      await interaction.reply({
        embeds: [createSuccessEmbed(
          'Fora de Serviço',
          `${EMOJIS.OFFLINE} **Você saiu de serviço!**\n\nObrigado pelo trabalho!`
        )],
        ephemeral: true
      });
    }

    else if (acao === 'status') {
      if (!analista) {
        return interaction.reply({
          embeds: [createInfoEmbed(
            'Status de Analista',
            `${EMOJIS.OFFLINE} Você nunca entrou em serviço como analista.\n\nUse \`/analista entrar_mobile\` ou \`/analista entrar_emulador\`.`
          )],
          ephemeral: true
        });
      }

      const status = analista.onDuty ? '🟢 Em Serviço' : '⚪ Fora de Serviço';
      const tipoEmoji = analista.tipo === ANALYST_TYPES.MOBILE ? EMOJIS.MOBILE : EMOJIS.PC;
      const tipoNome = analista.tipo === ANALYST_TYPES.MOBILE ? 'Mobile' : 'Emulador';

      let description = `**Status Atual:** ${status}\n**Tipo:** ${tipoEmoji} ${tipoNome}`;

      if (analista.onDuty && analista.onDutySince) {
        const timeOnDuty = Date.now() - analista.onDutySince;
        const hours = Math.floor(timeOnDuty / (1000 * 60 * 60));
        const minutes = Math.floor((timeOnDuty % (1000 * 60 * 60)) / (1000 * 60));
        description += `\n**Em serviço há:** ${hours}h ${minutes}m`;
      }

      const embed = createInfoEmbed('Status de Analista', description);

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }
  }
};
