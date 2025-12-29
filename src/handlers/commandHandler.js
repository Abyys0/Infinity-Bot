// Handler de comandos

const fs = require('fs').promises;
const path = require('path');

/**
 * Carrega todos os comandos da pasta commands
 */
async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '../commands');
  
  try {
    const files = await fs.readdir(commandsPath);
    const jsFiles = files.filter(file => file.endsWith('.js'));

    for (const file of jsFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);

      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(`⚠️ Comando em ${file} está faltando "data" ou "execute"`);
      }
    }

    console.log(`📝 ${client.commands.size} comandos carregados`);
  } catch (error) {
    console.error('❌ Erro ao carregar comandos:', error);
  }
}

module.exports = { loadCommands };
