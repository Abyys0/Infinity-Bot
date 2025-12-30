// Handlers de modals para configuração de PIX pessoal (Mediadores e Analistas)

const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { EMOJIS } = require('../../config/constants');
const db = require('../../database');
const logger = require('../../utils/logger');

async function handle(interaction) {
  const customId = interaction.customId;

  // modal_mediador_pix
  if (customId === 'modal_mediador_pix') {
    const tipoChave = interaction.fields.getTextInputValue('tipo_chave').trim();
    const chave = interaction.fields.getTextInputValue('chave').trim();
    const nome = interaction.fields.getTextInputValue('nome').trim();
    const imagemUrl = interaction.fields.getTextInputValue('imagem')?.trim() || null;

    await interaction.deferReply({ flags: 64 });

    try {
      // Atualizar dados do mediador com informações de PIX
      const updated = await db.updateItem('mediadores',
        m => m.userId === interaction.user.id && m.active,
        m => ({
          ...m,
          pix: {
            tipoChave,
            chave,
            nome,
            imagemUrl,
            configuradoEm: Date.now()
          }
        })
      );

      if (!updated) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Erro', 'Você não está registrado como mediador.')]
        });
      }

      await logger.sendLog(
        interaction.client,
        `Mediador ${interaction.user.tag} configurou seu PIX`,
        interaction.user.tag
      );

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'PIX Configurado',
          `${EMOJIS.SUCCESS} **Seu PIX foi configurado com sucesso!**\n\n` +
          `**Tipo de Chave:** ${tipoChave}\n` +
          `**Chave:** ${chave}\n` +
          `**Nome:** ${nome}\n\n` +
          `${EMOJIS.MONEY} Você receberá sua porcentagem neste PIX quando finalizar atendimentos.`
        )]
      });
    } catch (error) {
      console.error('Erro ao configurar PIX do mediador:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Não foi possível configurar o PIX.')]
      });
    }
  }

  // modal_analista_pix
  if (customId === 'modal_analista_pix') {
    const tipoChave = interaction.fields.getTextInputValue('tipo_chave').trim();
    const chave = interaction.fields.getTextInputValue('chave').trim();
    const nome = interaction.fields.getTextInputValue('nome').trim();
    const imagemUrl = interaction.fields.getTextInputValue('imagem')?.trim() || null;

    await interaction.deferReply({ flags: 64 });

    try {
      // Atualizar dados do analista com informações de PIX
      const updated = await db.updateItem('analistas',
        a => a.userId === interaction.user.id && a.active,
        a => ({
          ...a,
          pix: {
            tipoChave,
            chave,
            nome,
            imagemUrl,
            configuradoEm: Date.now()
          }
        })
      );

      if (!updated) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Erro', 'Você não está registrado como analista.')]
        });
      }

      await logger.sendLog(
        interaction.client,
        `Analista ${interaction.user.tag} configurou seu PIX`,
        interaction.user.tag
      );

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'PIX Configurado',
          `${EMOJIS.SUCCESS} **Seu PIX foi configurado com sucesso!**\n\n` +
          `**Tipo de Chave:** ${tipoChave}\n` +
          `**Chave:** ${chave}\n` +
          `**Nome:** ${nome}\n\n` +
          `${EMOJIS.MONEY} Você receberá sua porcentagem neste PIX quando finalizar análises.`
        )]
      });
    } catch (error) {
      console.error('Erro ao configurar PIX do analista:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Não foi possível configurar o PIX.')]
      });
    }
  }
}

module.exports = { handle };
