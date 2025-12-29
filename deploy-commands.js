// Script para registrar comandos slash no Discord

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`✅ Comando carregado: ${command.data.name}`);
  } else {
    console.log(`⚠️ Comando ignorado (sem data/execute): ${file}`);
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`\n🔄 Registrando ${commands.length} comandos slash...`);

    // Obter CLIENT_ID do token
    const clientId = Buffer.from(process.env.DISCORD_TOKEN.split('.')[0], 'base64').toString();

    // Registrar comandos no servidor específico
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, process.env.GUILD_ID),
      { body: commands },
    );

    console.log(`✅ ${data.length} comandos registrados com sucesso!`);
    console.log('\n📋 Comandos registrados:');
    data.forEach(cmd => console.log(`   - /${cmd.name}`));
    console.log('\n🎉 Pronto! Agora você pode iniciar o bot com: npm start');
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }
})();
