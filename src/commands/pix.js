// Comando: /pix - Configurar PIX do mediador

const { SlashCommandBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../utils/embeds');
const { isValidPixKey } = require('../utils/validators');
const permissions = require('../config/permissions');
const db = require('../database');
const logger = require('../utils/logger');
const { EMOJIS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pix')
    .setDescription('[MEDIADOR] Configurar dados do PIX')
    .addStringOption(option =>
      option.setName('nome')
        .setDescription('Nome completo')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('chave')
        .setDescription('Chave PIX (CPF, email, telefone ou chave aleatória)')
        .setRequired(true)),

  async execute(interaction) {
    // Verificar se é mediador
    if (!await permissions.isMediador(interaction.member)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas mediadores podem usar este comando.')],
        flags: 64
      });
    }

    // Verificar se está no canal correto
    const config = await db.readData('config');
    if (config.channels?.pix && interaction.channel.id !== config.channels.pix) {
      return interaction.reply({
        embeds: [createErrorEmbed(
          'Canal Incorreto',
          `Este comando só pode ser usado em <#${config.channels.pix}>`
        )],
        flags: 64
      });
    }

    const nome = interaction.options.getString('nome');
    const chave = interaction.options.getString('chave');

    // Validar chave PIX
    if (!isValidPixKey(chave)) {
      return interaction.reply({
        embeds: [createErrorEmbed(
          'Chave PIX Inválida',
          'A chave PIX informada não é válida.\nFormatos aceitos: CPF, CNPJ, email, telefone ou chave aleatória.'
        )],
        flags: 64
      });
    }

    // Salvar ou atualizar PIX
    const pixData = await db.readData('pixData');
    const existingIndex = pixData.findIndex(p => p.userId === interaction.user.id);

    const pixEntry = {
      userId: interaction.user.id,
      nome,
      chave,
      updatedAt: Date.now()
    };

    if (existingIndex !== -1) {
      pixData[existingIndex] = pixEntry;
    } else {
      pixData.push(pixEntry);
    }

    await db.writeData('pixData', pixData);

    // Log
    await logger.logPixConfigured(interaction.client, interaction.user.tag, nome, chave);

    await interaction.reply({
      embeds: [createSuccessEmbed(
        'PIX Configurado',
        `${EMOJIS.PIX} **PIX configurado com sucesso!**\n\n**Nome:** ${nome}\n**Chave:** ${chave}`
      )],
      flags: 64
    });
  }
};
