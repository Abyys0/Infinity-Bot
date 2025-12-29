// Sistema de gerenciamento de dados

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

// Estrutura inicial dos arquivos de dados
const INITIAL_DATA = {
  config: {
    roles: {
      mediador: [],
      analista: [],
      staff: [],
      suporte: [],
      ss: [],
      ticketAttendants: []
    },
    channels: {
      queues: null,
      tickets: null,
      logs: null,
      pix: null
    },
    taxes: {
      mediador: 10,
      analista: 5
    },
    queueValues: {
      // formato: "1x1_mobile": [1, 2, 5, 10, 20, 50, 100]
    }
  },
  mediadores: [],
  analistas: [],
  queues: [],
  tickets: [],
  blacklist: [],
  ranking: [],
  pixData: []
};

/**
 * Garante que o diretório de dados existe
 */
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * Lê dados de um arquivo
 */
async function readData(fileName) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${fileName}.json`);
  
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Se o arquivo não existe, retorna dados iniciais
    if (error.code === 'ENOENT') {
      const initialData = INITIAL_DATA[fileName] || [];
      await writeData(fileName, initialData);
      return initialData;
    }
    throw error;
  }
}

/**
 * Escreve dados em um arquivo
 */
async function writeData(fileName, data) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${fileName}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Adiciona log ao arquivo de logs
 */
async function appendLog(message, mediadorTag = null) {
  await ensureDataDir();
  const logPath = path.join(DATA_DIR, 'logs.txt');
  
  const timestamp = new Date().toLocaleString('pt-BR');
  let logLine = `[${timestamp}] ${message}`;
  if (mediadorTag) {
    logLine += ` | Mediador: ${mediadorTag}`;
  }
  logLine += '\n';
  
  try {
    await fs.appendFile(logPath, logLine, 'utf8');
  } catch (error) {
    console.error('Erro ao escrever log:', error);
  }
}

/**
 * Atualiza um item em um array de dados
 */
async function updateItem(fileName, findFn, updateFn) {
  const data = await readData(fileName);
  const index = data.findIndex(findFn);
  
  if (index !== -1) {
    data[index] = updateFn(data[index]);
    await writeData(fileName, data);
    return data[index];
  }
  return null;
}

/**
 * Remove um item de um array de dados
 */
async function removeItem(fileName, findFn) {
  const data = await readData(fileName);
  const filteredData = data.filter(item => !findFn(item));
  await writeData(fileName, filteredData);
  return filteredData.length < data.length;
}

/**
 * Adiciona um item a um array de dados
 */
async function addItem(fileName, item) {
  const data = await readData(fileName);
  data.push(item);
  await writeData(fileName, data);
  return item;
}

/**
 * Busca um item em um array de dados
 */
async function findItem(fileName, findFn) {
  const data = await readData(fileName);
  return data.find(findFn);
}

/**
 * Busca todos os itens que correspondem ao critério
 */
async function findItems(fileName, filterFn) {
  const data = await readData(fileName);
  return data.filter(filterFn);
}

module.exports = {
  readData,
  writeData,
  appendLog,
  updateItem,
  removeItem,
  addItem,
  findItem,
  findItems
};
