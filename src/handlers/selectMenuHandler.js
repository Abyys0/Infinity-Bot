// Handler de Menus de Seleção (StringSelectMenu)

const ticketMenus = require('./selectMenus/ticketMenus');

async function handleSelectMenu(interaction) {
  try {
    const customId = interaction.customId;

    // Tickets
    if (customId.startsWith('ticket_')) {
      await ticketMenus.handle(interaction);
      return;
    }

    // Se nenhum handler foi encontrado
    console.log(`⚠️ Menu de seleção não tratado: ${customId}`);
    await interaction.reply({
      content: '❌ Menu não reconhecido.',
      flags: 64
    });

  } catch (error) {
    console.error('❌ Erro ao processar menu de seleção:', error);
    
    const errorMessage = {
      content: '❌ Ocorreu um erro ao processar sua seleção.',
      flags: 64
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage).catch(() => {});
    } else {
      await interaction.reply(errorMessage).catch(() => {});
    }
  }
}

module.exports = { handleSelectMenu };
