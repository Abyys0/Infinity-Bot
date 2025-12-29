// INFINITY BOT - Sistema de Apostado Free Fire
// Desenvolvido por Felipe - 2025

require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { handleButton } = require('./handlers/buttonHandler');
const { handleModal } = require('./handlers/modalHandler');
const { handleMessage } = require('./handlers/messageHandler');
const { startMediatorRenewalChecker } = require('./services/mediadorService');
const logger = require('./utils/logger');

// Validação de variáveis de ambiente
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ ERRO: Token do Discord não encontrado no arquivo .env');
  process.exit(1);
}

if (!process.env.OWNER_ID) {
  console.error('⚠️ AVISO: OWNER_ID não configurado no .env');
}

// Criar cliente do Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message]
});

// Coleção de comandos
client.commands = new Collection();

// Evento: Bot pronto
client.once('clientReady', async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔥 INFINITY BOT ONLINE');
  console.log(`📱 Conectado como: ${client.user.tag}`);
  console.log(`🎮 Servidores: ${client.guilds.cache.size}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Carregar comandos
  await loadCommands(client);

  // Registrar comandos
  try {
    if (process.env.GUILD_ID) {
      // Registrar no servidor específico (desenvolvimento)
      const guild = client.guilds.cache.get(process.env.GUILD_ID);
      if (guild) {
        const commands = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());
        await guild.commands.set(commands);
        console.log(`✅ ${commands.length} comandos registrados no servidor`);
      }
    } else {
      // Registrar globalmente (produção)
      const commands = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());
      await client.application.commands.set(commands);
      console.log(`✅ ${commands.length} comandos registrados globalmente`);
    }
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }

  // Iniciar verificador de renovação de mediadores
  startMediatorRenewalChecker(client);
  
  console.log('✅ Sistema totalmente iniciado!\n');
});

// Evento: Interação (comandos, botões, modais)
client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      // Comando slash
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction);
    } else if (interaction.isButton()) {
      // Botão clicado
      await handleButton(interaction);
    } else if (interaction.isModalSubmit()) {
      // Modal enviado
      await handleModal(interaction);
    }
  } catch (error) {
    console.error('❌ Erro ao processar interação:', error);
    
    const errorMessage = {
      content: '❌ Ocorreu um erro ao processar sua solicitação. Tente novamente.',
      flags: 64
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage).catch(() => {});
    } else {
      await interaction.reply(errorMessage).catch(() => {});
    }
  }
});

// Evento: Mensagem (para detectar credenciais nas filas)
client.on('messageCreate', async (message) => {
  try {
    await handleMessage(message, client);
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

// Evento: Erro
client.on('error', (error) => {
  console.error('❌ Erro no cliente Discord:', error);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (error) => {
  console.error('❌ Erro não tratado (unhandledRejection):', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado (uncaughtException):', error);
  process.exit(1);
});

// Login
client.login(process.env.DISCORD_TOKEN);
