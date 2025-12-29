// Handler de botões de multas

const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { EMOJIS } = require('../../config/constants');
const permissions = require('../../config/permissions');
const db = require('../../database');
const logger = require('../../utils/logger');

async function confirmarPagamentoMulta(interaction) {
  const multaId = interaction.customId.replace('confirmar_pagamento_multa_', '');

  // Apenas dono pode confirmar
  if (!await permissions.isOwner(interaction.user.id, interaction.member)) {
    return interaction.reply({
      embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode confirmar pagamentos.')],
      flags: 64
    });
  }

  await interaction.deferReply({ flags: 64 });

  try {
    const multas = await db.readData('multas');
    const multa = multas.find(m => m.id === multaId);

    if (!multa) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Multa não encontrada.')]
      });
    }

    if (multa.status === 'paga') {
      return interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Esta multa já foi paga.')]
      });
    }

    // Marcar como paga
    await db.updateItem('multas',
      m => m.id === multaId,
      m => ({
        ...m,
        status: 'paga',
        pagaEm: Date.now(),
        confirmadaPor: interaction.user.id
      })
    );

    // Notificar usuário
    const user = await interaction.client.users.fetch(multa.userId).catch(() => null);

    if (user) {
      try {
        await user.send({
          embeds: [createSuccessEmbed(
            '✅ Multa Paga',
            `Sua multa de **R$ ${multa.valor}** foi confirmada como paga!\n\n` +
            `Você já pode voltar a trabalhar normalmente.`
          )]
        });
      } catch (error) {
        console.log('Não foi possível enviar DM para o usuário.');
      }
    }

    // Deletar canal após 10 segundos
    const canal = interaction.guild.channels.cache.get(multa.canalId);
    if (canal) {
      await canal.send({
        embeds: [createSuccessEmbed(
          '✅ Pagamento Confirmado',
          'Multa paga com sucesso! Este canal será deletado em 10 segundos.'
        )]
      });

      setTimeout(async () => {
        try {
          await canal.delete();
        } catch (error) {
          console.error('Erro ao deletar canal:', error);
        }
      }, 10000);
    }

    // Log
    await logger.logAction(
      interaction.client,
      'MULTA_PAGA',
      `${interaction.user.tag} confirmou pagamento da multa de ${user?.tag || multa.userId} - R$ ${multa.valor}`
    );

    await interaction.editReply({
      embeds: [createSuccessEmbed(
        'Pagamento Confirmado',
        `${EMOJIS.SUCCESS} Multa de **R$ ${multa.valor}** confirmada como paga!\n\n` +
        `${user ? `**Usuário:** ${user.tag}` : ''}\n` +
        `O canal será deletado em 10 segundos.`
      )]
    });

  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao confirmar o pagamento.')]
    });
  }
}

module.exports = { confirmarPagamentoMulta };
