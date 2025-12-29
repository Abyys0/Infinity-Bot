// Handler de modals de blacklist

const { createSuccessEmbed, createErrorEmbed, createBlacklistEmbed } = require('../../utils/embeds');
const { isValidDiscordId } = require('../../utils/validators');
const permissions = require('../../config/permissions');
const db = require('../../database');
const logger = require('../../utils/logger');
const { EMOJIS } = require('../../config/constants');

async function handle(interaction) {
  const customId = interaction.customId;

  // Verificar permissões
  if (!await permissions.isAnalista(interaction.member) && !await permissions.isOwner(interaction.user.id, interaction.member)) {
    return interaction.reply({
      embeds: [createErrorEmbed('Sem Permissão', 'Apenas analistas podem gerenciar a blacklist.')],
      flags: 64
    });
  }

  // modal_blacklist_add
  if (customId === 'modal_blacklist_add') {
    const userId = interaction.fields.getTextInputValue('user_id').trim();
    const motivo = interaction.fields.getTextInputValue('reason').trim();

    if (!isValidDiscordId(userId)) {
      return interaction.reply({
        embeds: [createErrorEmbed('ID Inválido', 'O ID do usuário é inválido.')],
        flags: 64
      });
    }

    // Verificar se já está na blacklist
    if (await permissions.isBlacklisted(userId)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Já na Blacklist', 'Este usuário já está na blacklist.')],
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      const user = await interaction.client.users.fetch(userId).catch(() => null);
      const userName = user ? user.tag : userId;

      // Adicionar à blacklist
      const entry = {
        userId,
        reason: motivo,
        addedBy: interaction.user.id,
        addedAt: Date.now()
      };

      await db.addItem('blacklist', entry);

      // Log
      await logger.logBlacklist(interaction.client, 'add', userId, userName, motivo, interaction.user.tag);

      if (user) {
        const embed = createBlacklistEmbed(user, motivo, interaction.user.id, entry.addedAt);
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({
          embeds: [createSuccessEmbed(
            'Adicionado à Blacklist',
            `${EMOJIS.BLACKLIST} **Usuário** (${userId}) foi adicionado à blacklist!\n\n**Motivo:** ${motivo}`
          )]
        });
      }

    } catch (error) {
      console.error('Erro ao adicionar à blacklist:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao adicionar o usuário à blacklist.')]
      });
    }
  }

  // modal_blacklist_remove
  if (customId === 'modal_blacklist_remove') {
    const userId = interaction.fields.getTextInputValue('user_id').trim();

    if (!isValidDiscordId(userId)) {
      return interaction.reply({
        embeds: [createErrorEmbed('ID Inválido', 'O ID do usuário é inválido.')],
        flags: 64
      });
    }

    // Verificar se está na blacklist
    if (!await permissions.isBlacklisted(userId)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Não Encontrado', 'Este usuário não está na blacklist.')],
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      const user = await interaction.client.users.fetch(userId).catch(() => null);
      const userName = user ? user.tag : userId;

      // Remover da blacklist
      await db.removeItem('blacklist', entry => entry.userId === userId);

      // Log
      await logger.logBlacklist(interaction.client, 'remove', userId, userName, null, interaction.user.tag);

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Removido da Blacklist',
          `${EMOJIS.SUCCESS} **${userName}** foi removido da blacklist!`
        )]
      });

    } catch (error) {
      console.error('Erro ao remover da blacklist:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao remover o usuário da blacklist.')]
      });
    }
  }

  // modal_blacklist_search
  if (customId === 'modal_blacklist_search') {
    const userId = interaction.fields.getTextInputValue('user_id').trim();

    if (!isValidDiscordId(userId)) {
      return interaction.reply({
        embeds: [createErrorEmbed('ID Inválido', 'O ID do usuário é inválido.')],
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      const entry = await permissions.getBlacklistEntry(userId);
      const user = await interaction.client.users.fetch(userId).catch(() => null);

      if (!entry) {
        const userName = user ? user.tag : userId;
        return interaction.editReply({
          embeds: [createSuccessEmbed(
            'Não Encontrado',
            `${EMOJIS.SUCCESS} **${userName}** não está na blacklist.`
          )]
        });
      }

      if (user) {
        const embed = createBlacklistEmbed(user, entry.reason, entry.addedBy, entry.addedAt);
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({
          embeds: [createSuccessEmbed(
            'Encontrado na Blacklist',
            `**Usuário:** ${userId}\n**Motivo:** ${entry.reason}\n**Adicionado por:** <@${entry.addedBy}>\n**Data:** ${new Date(entry.addedAt).toLocaleString('pt-BR')}`
          )]
        });
      }

    } catch (error) {
      console.error('Erro ao consultar blacklist:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao consultar a blacklist.')]
      });
    }
  }
}

module.exports = { handle };
