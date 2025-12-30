// Comando: /painelticket - Cria painel fixo de tickets (para todos)

const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../utils/embeds');
const permissions = require('../config/permissions');
const { EMOJIS, COLORS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painelticket')
    .setDescription('[DONO] Cria painel fixo de tickets de suporte')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal onde o painel será criado')
        .setRequired(true)),

  async execute(interaction) {
    // Defer IMEDIATAMENTE antes de qualquer operação
    await interaction.deferReply({ flags: 64 });

    // Verificar se é dono (sem await inline)
    const ehDono = await permissions.isOwner(interaction.user.id, interaction.member);
    if (!ehDono) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas o dono pode criar este painel.')]
      });
    }

    const canal = interaction.options.getChannel('canal');

    // Criar embed do painel
    const embed = new EmbedBuilder()
      .setTitle('SUPORTE ZE')
      .setDescription(
        'Seja bem-vindo(a) ao quadro de tickets, aqui você pode solicitar suporte para a administração do servidor! Assim que aberto, a equipe de atendimento irá te ajudar o mais rápido possível!'
      )
      .setColor(COLORS.PRIMARY)
      .setImage('https://i.imgur.com/YourImageURL.png') // Substitua pela URL da sua imagem "ABRA SEU TICKET"
      .setFooter({ text: 'Acabou de ler? Confira #🍀 • chat-geral.' });

    // Menu de seleção para escolher categoria
    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('ticket_select_categoria')
          .setPlaceholder('Selecione uma categoria para criar um ticket.')
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel('Suporte')
              .setDescription('Abrir ticket para suporte da administração')
              .setValue('suporte')
              .setEmoji('🎫')
          )
      );

    try {
      await canal.send({
        embeds: [embed],
        components: [row]
      });

      await interaction.editReply({
        content: `✅ Painel de tickets criado em ${canal}!`
      });
    } catch (error) {
      console.error('Erro ao criar painel de tickets:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Não foi possível criar o painel. Verifique as permissões do bot.')]
      });
    }
  }
};
