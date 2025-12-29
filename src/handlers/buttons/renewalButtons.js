// Handler de botões de renovação de mediador

const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { renewMediador, removeMediador } = require('../../services/mediadorService');
const { EMOJIS } = require('../../config/constants');
const logger = require('../../utils/logger');
const permissions = require('../../config/permissions');

async function handle(interaction) {
  const [action, response, userId] = interaction.customId.split('_');

  // renew_yes_123456789 ou renew_no_123456789
  if (response === 'yes') {
    // Mediador clicou em "Sim, renovar"
    // Apenas marca como solicitado, dono precisa confirmar
    
    if (interaction.user.id !== userId) {
      return interaction.reply({
        embeds: [createErrorEmbed('Erro', 'Este botão é apenas para o mediador mencionado.')],
        flags: 64
      });
    }

    await interaction.reply({
      embeds: [createSuccessEmbed(
        'Solicitação Enviada',
        `${EMOJIS.SUCCESS} Sua solicitação de renovação foi enviada ao dono!\n\nAguarde a confirmação.`
      )],
      flags: 64
    });

    await interaction.message.edit({
      content: `${interaction.message.content}\n\n**${EMOJIS.LOADING} Mediador solicitou renovação. Aguardando confirmação do dono...**`,
      components: [] // Remove botões
    });

  } else if (response === 'no') {
    // Mediador não quer renovar
    if (interaction.user.id !== userId) {
      return interaction.reply({
        embeds: [createErrorEmbed('Erro', 'Este botão é apenas para o mediador mencionado.')],
        flags: 64
      });
    }

    await interaction.reply({
      embeds: [createSuccessEmbed(
        'Confirmado',
        `${EMOJIS.SUCCESS} Você optou por não renovar.\n\nSeu cargo será removido em breve.`
      )],
      flags: 64
    });

    // Remove mediador imediatamente
    await removeMediador(interaction.guild, userId);
    await logger.logMediador(interaction.client, 'remove', userId, interaction.user.tag, 'Sistema (não renovou)');

    // Deletar canal após 10 segundos
    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch (err) {
        console.error('Erro ao deletar canal de renovação:', err);
      }
    }, 10000);

  } else if (response === 'confirm') {
    // Dono confirmou renovação
    if (!await permissions.isOwner(interaction.user.id, interaction.member)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode confirmar renovações.')],
        flags: 64
      });
    }

    const result = await renewMediador(userId);
    
    if (!result.success) {
      return interaction.reply({
        embeds: [createErrorEmbed('Erro', result.message)],
        flags: 64
      });
    }

    await interaction.reply({
      embeds: [createSuccessEmbed(
        'Mediador Renovado',
        `${EMOJIS.SUCCESS} O mediador <@${userId}> foi renovado por mais 7 dias!`
      )]
    });

    await logger.logMediador(interaction.client, 'renew', userId, 'Renovação automática', interaction.user.tag);

    // Deletar canal após 10 segundos
    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch (err) {
        console.error('Erro ao deletar canal de renovação:', err);
      }
    }, 10000);
  }
}

module.exports = { handle };
