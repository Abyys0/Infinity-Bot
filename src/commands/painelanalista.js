// Comando: /painelanalista - Cria painel fixo para chamar analista (só mediadores)

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../utils/embeds');
const permissions = require('../config/permissions');
const { EMOJIS, COLORS, DISABLED_FEATURES, DISABLED_MESSAGE } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painelanalista')
    .setDescription('[MEDIADOR] Cria painel fixo para chamar analista')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal onde o painel será criado')
        .setRequired(true)),

  async execute(interaction) {
    // Defer IMEDIATAMENTE antes de qualquer operação
    await interaction.deferReply({ flags: 64 });

    // Verificar se o painel de analista está desativado
    if (DISABLED_FEATURES.PAINEL_ANALISTA) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Sistema Desativado', DISABLED_MESSAGE)]
      });
    }

    // Verificar se é mediador ou superior (sem await inline)
    const temPermissao = await permissions.isMediadorOrAbove(interaction.member);
    if (!temPermissao) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Sem Permissão', 'Apenas mediadores podem criar este painel.')]
      });
    }

    const canal = interaction.options.getChannel('canal');

    // PAINEL 1: Para Analistas (Entrar/Sair de Serviço)
    const embedAnalistas = new EmbedBuilder()
      .setTitle(`${EMOJIS.ANALYST} Painel de Controle - Analistas`)
      .setDescription(
        `${EMOJIS.ONLINE} **Sistema de Gerenciamento de Analistas**\n\n` +
        '**Para Analistas:**\n' +
        '• 🟢 **Entrar em Serviço:** Fique disponível para chamados\n' +
        '• ⚪ **Sair de Serviço:** Pare de receber chamados\n' +
        '• 📊 **Ver Analistas:** Veja quem está em serviço\n\n' +
        `📊 **Analistas em Serviço:** 0`
      )
      .setColor(COLORS.SUCCESS)
      .setTimestamp()
      .setFooter({ text: 'INFINITY BOT • Painel de Analistas' });

    const botoesAnalistas = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('analista_entrar_servico_mobile')
          .setLabel('Entrar - Mobile')
          .setStyle(ButtonStyle.Success)
          .setEmoji('📱'),
        new ButtonBuilder()
          .setCustomId('analista_entrar_servico_emulador')
          .setLabel('Entrar - Emulador')
          .setStyle(ButtonStyle.Success)
          .setEmoji('💻'),
        new ButtonBuilder()
          .setCustomId('analista_sair_servico')
          .setLabel('Sair de Serviço')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('⚪')
      );

    const botoesAnalistas2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('analista_ver_lista')
          .setLabel('Ver Analistas')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📊')
      );

    // PAINEL 2: Para Mediadores (Chamar Analista)
    const embedChamar = new EmbedBuilder()
      .setTitle(`${EMOJIS.WARNING} Chamar Analista - Mediadores`)
      .setDescription(
        '**Sistema de Chamado de Analistas**\n\n' +
        `${EMOJIS.WARNING} **Quando Chamar:**\n` +
        '• 🔍 Suspeita de trapaça\n' +
        '• ✅ Verificação de resultado\n' +
        '• 📸 Análise de SS (screenshot)\n' +
        '• ⚔️ Disputas de partidas\n\n' +
        '**Escolha o tipo de analista:**\n' +
        '📱 **Mobile:** Análise em celular\n' +
        '💻 **Emulador:** Análise em emulador'
      )
      .setColor(COLORS.WARNING)
      .setTimestamp()
      .setFooter({ text: 'INFINITY BOT • Apenas Mediadores' });

    const botoesChamar = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('chamar_analista_mobile')
          .setLabel('Chamar Analista Mobile')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📱'),
        new ButtonBuilder()
          .setCustomId('chamar_analista_emulador')
          .setLabel('Chamar Analista Emulador')
          .setStyle(ButtonStyle.Success)
          .setEmoji('💻')
      );

    try {
      // Enviar PAINEL 1 - Para Analistas
      const messageAnalistas = await canal.send({
        embeds: [embedAnalistas],
        components: [botoesAnalistas, botoesAnalistas2]
      });

      // Enviar PAINEL 2 - Para Mediadores
      const messageChamar = await canal.send({
        embeds: [embedChamar],
        components: [botoesChamar]
      });

      // Salvar messageIds para atualizar depois
      const db = require('../database');
      const config = await db.readData('config');
      config.painelAnalistaMessageId = messageAnalistas.id;
      config.painelAnalistaChannelId = canal.id;
      config.painelChamarAnalistaMessageId = messageChamar.id;
      await db.writeData('config', config);

      await interaction.editReply({
        content: `✅ Painéis de analista criados em ${canal}!\n• **Painel 1:** Controle para Analistas\n• **Painel 2:** Chamar Analista (Mediadores)`
      });
    } catch (error) {
      console.error('Erro ao criar painel de analista:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Não foi possível criar o painel. Verifique as permissões do bot.')]
      });
    }
  }
};
