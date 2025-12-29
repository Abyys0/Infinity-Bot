// Handler de botões de blacklist

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embeds');
const { COLORS, EMOJIS } = require('../../config/constants');
const permissions = require('../../config/permissions');
const db = require('../../database');

async function handle(interaction) {
  const customId = interaction.customId;

  // Verificar permissões
  if (!await permissions.isAnalista(interaction.member) && !await permissions.isOwner(interaction.user.id, interaction.member)) {
    return interaction.reply({
      embeds: [createErrorEmbed('Sem Permissão', 'Apenas analistas podem gerenciar a blacklist.')],
      flags: 64
    });
  }

  // blacklist_add
  if (customId === 'blacklist_add') {
    const modal = new ModalBuilder()
      .setCustomId('modal_blacklist_add')
      .setTitle('Adicionar à Blacklist');

    const userInput = new TextInputBuilder()
      .setCustomId('user_id')
      .setLabel('ID do Usuário')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678')
      .setRequired(true);

    const reasonInput = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('Motivo')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Descreva o motivo da blacklist...')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(userInput),
      new ActionRowBuilder().addComponents(reasonInput)
    );

    return await interaction.showModal(modal);
  }

  // blacklist_remove
  if (customId === 'blacklist_remove') {
    const modal = new ModalBuilder()
      .setCustomId('modal_blacklist_remove')
      .setTitle('Remover da Blacklist');

    const userInput = new TextInputBuilder()
      .setCustomId('user_id')
      .setLabel('ID do Usuário')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(userInput)
    );

    return await interaction.showModal(modal);
  }

  // blacklist_search
  if (customId === 'blacklist_search') {
    const modal = new ModalBuilder()
      .setCustomId('modal_blacklist_search')
      .setTitle('Consultar Blacklist');

    const userInput = new TextInputBuilder()
      .setCustomId('user_id')
      .setLabel('ID do Usuário')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(userInput)
    );

    return await interaction.showModal(modal);
  }

  // blacklist_list
  if (customId === 'blacklist_list') {
    await interaction.deferReply({ flags: 64 });
    
    const blacklist = await db.readData('blacklist');

    if (blacklist.length === 0) {
      return interaction.editReply({
        content: 'Não há usuários na blacklist.'
      });
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.BLACKLIST)
      .setTitle(`${EMOJIS.BLACKLIST} BLACKLIST`)
      .setDescription(`Total de usuários: ${blacklist.length}`)
      .setTimestamp()
      .setFooter({ text: 'INFINITY BOT • Blacklist' });

    for (const entry of blacklist.slice(0, 10)) {
      try {
        const user = await interaction.client.users.fetch(entry.userId).catch(() => null);
        const userName = user ? user.tag : entry.userId;

        embed.addFields({
          name: userName,
          value: `**Motivo:** ${entry.reason}\n**Por:** <@${entry.addedBy}>\n**Em:** ${new Date(entry.addedAt).toLocaleDateString('pt-BR')}`,
          inline: false
        });
      } catch (err) {
        console.error('Erro ao buscar usuário:', err);
      }
    }

    if (blacklist.length > 10) {
      embed.setDescription(`Total de usuários: ${blacklist.length}\n*Mostrando os 10 primeiros*`);
    }

    return await interaction.editReply({
      embeds: [embed]
    });
  }
}

/**
 * Handler para botões públicos de blacklist (qualquer um pode consultar, só analista adiciona)
 */
async function handlePublico(interaction) {
  const customId = interaction.customId;

  // blacklist_consultar_publico
  if (customId === 'blacklist_consultar_publico') {
    const modal = new ModalBuilder()
      .setCustomId('modal_blacklist_search')
      .setTitle('Consultar Blacklist');

    const userInput = new TextInputBuilder()
      .setCustomId('user_id')
      .setLabel('ID do Usuário')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(userInput)
    );

    return await interaction.showModal(modal);
  }

  // blacklist_adicionar_publico - verificar se é analista
  if (customId === 'blacklist_adicionar_publico') {
    // Verificar permissões ANTES de qualquer resposta
    if (!await permissions.isAnalista(interaction.member) && !await permissions.isOwner(interaction.user.id, interaction.member)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas analistas podem adicionar usuários à blacklist.')],
        flags: 64
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_blacklist_add')
      .setTitle('Adicionar à Blacklist');

    const userInput = new TextInputBuilder()
      .setCustomId('user_id')
      .setLabel('ID do Usuário')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678')
      .setRequired(true);

    const reasonInput = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('Motivo')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Descreva o motivo da blacklist...')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(userInput),
      new ActionRowBuilder().addComponents(reasonInput)
    );

    return await interaction.showModal(modal);
  }

  // blacklist_listar_publico
  if (customId === 'blacklist_listar_publico') {
    await interaction.deferReply({ flags: 64 });
    
    const blacklist = await db.readData('blacklist');

    if (blacklist.length === 0) {
      return interaction.editReply({
        content: 'Não há usuários na blacklist.'
      });
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.BLACKLIST)
      .setTitle(`${EMOJIS.BLACKLIST} BLACKLIST`)
      .setDescription(`Total de usuários: ${blacklist.length}`)
      .setTimestamp()
      .setFooter({ text: 'INFINITY BOT • Blacklist' });

    for (const entry of blacklist.slice(0, 10)) {
      try {
        const user = await interaction.client.users.fetch(entry.userId).catch(() => null);
        const userName = user ? user.tag : entry.userId;

        embed.addFields({
          name: userName,
          value: `**Motivo:** ${entry.reason}\n**Por:** <@${entry.addedBy}>\n**Em:** ${new Date(entry.addedAt).toLocaleDateString('pt-BR')}`,
          inline: false
        });
      } catch (err) {
        console.error('Erro ao buscar usuário:', err);
      }
    }

    if (blacklist.length > 10) {
      embed.setDescription(`Total de usuários: ${blacklist.length}\n*Mostrando os 10 primeiros*`);
    }

    return await interaction.editReply({
      embeds: [embed]
    });
  }
}

module.exports = { handle, handlePublico };
