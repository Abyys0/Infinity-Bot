// Comando: /mediador - Entrar/sair de serviço como mediador

const { SlashCommandBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../utils/embeds');
const permissions = require('../config/permissions');
const db = require('../database');
const { EMOJIS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mediador')
    .setDescription('[MEDIADOR] Entrar ou sair de serviço')
    .addStringOption(option =>
      option.setName('acao')
        .setDescription('Ação')
        .setRequired(true)
        .addChoices(
          { name: '🟢 Entrar em Serviço', value: 'entrar' },
          { name: '⚪ Sair de Serviço', value: 'sair' },
          { name: '📊 Ver Status', value: 'status' }
        )),

  async execute(interaction) {
    // Verificar se tem cargo de mediador
    if (!await permissions.isMediador(interaction.member)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Você não tem o cargo de mediador.')],
        flags: 64
      });
    }

    const acao = interaction.options.getString('acao');
    const mediadores = await db.readData('mediadores');
    const mediador = mediadores.find(m => m.userId === interaction.user.id && m.active);

    if (!mediador) {
      return interaction.reply({
        embeds: [createErrorEmbed('Erro', 'Você não está registrado como mediador no sistema.')],
        flags: 64
      });
    }

    if (acao === 'entrar') {
      // Verificar se tem multa pendente
      const { temMultaPendente, getMultaPendente } = require('../services/multaService');
      const temMulta = await temMultaPendente(interaction.user.id);
      
      if (temMulta) {
        const multa = await getMultaPendente(interaction.user.id);
        return interaction.reply({
          embeds: [createErrorEmbed(
            '🚫 Multa Pendente',
            `Você não pode entrar em serviço pois tem uma multa pendente!\n\n` +
            `**💰 Valor:** R$ ${multa.valor}\n` +
            `**📝 Motivo:** ${multa.motivo}\n` +
            `**📍 Canal:** <#${multa.canalId}>\n\n` +
            `Pague a multa para voltar a trabalhar.`
          )],
          flags: 64
        });
      }

      if (mediador.onDuty) {
        return interaction.reply({
          embeds: [createErrorEmbed('Já em Serviço', 'Você já está em serviço!')],
          flags: 64
        });
      }

      await db.updateItem('mediadores',
        m => m.userId === interaction.user.id,
        m => ({ ...m, onDuty: true, onDutySince: Date.now() })
      );

      await interaction.reply({
        embeds: [createSuccessEmbed(
          'Em Serviço',
          `${EMOJIS.ONLINE} **Você entrou em serviço como mediador!**\n\nBoa sorte nos atendimentos!`
        )],
        flags: 64
      });

    } else if (acao === 'sair') {
      if (!mediador.onDuty) {
        return interaction.reply({
          embeds: [createErrorEmbed('Não em Serviço', 'Você não está em serviço!')],
          flags: 64
        });
      }

      await db.updateItem('mediadores',
        m => m.userId === interaction.user.id,
        m => ({ ...m, onDuty: false, lastOffDuty: Date.now() })
      );

      await interaction.reply({
        embeds: [createSuccessEmbed(
          'Fora de Serviço',
          `${EMOJIS.OFFLINE} **Você saiu de serviço!**\n\nObrigado pelo trabalho!`
        )],
        flags: 64
      });

    } else if (acao === 'status') {
      const status = mediador.onDuty ? '🟢 Em Serviço' : '⚪ Fora de Serviço';
      const expiresIn = mediador.expiresAt - Date.now();
      const daysLeft = Math.floor(expiresIn / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((expiresIn % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      const embed = createInfoEmbed(
        'Status de Mediador',
        `**Status Atual:** ${status}\n**Expira em:** ${daysLeft} dia(s) e ${hoursLeft} hora(s)\n**Adicionado em:** ${new Date(mediador.addedAt).toLocaleString('pt-BR')}`
      );

      await interaction.reply({
        embeds: [embed],
        flags: 64
      });
    }
  }
};
