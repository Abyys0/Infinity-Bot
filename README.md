# 🎮 INFINITY BOT v2.0

Bot profissional de filas de apostado para Free Fire com sistema completo de gerenciamento.

## ✨ Funcionalidades

### 🔧 Painel do Dono
- ⚙️ Configurar taxas (mediador e analista)
- 👥 Adicionar/remover mediadores
- 🎭 Configurar cargos (staff, suporte, mediador, analista)
- 📢 Configurar canais (filas, tickets, logs, pix)
- 📨 Enviar mensagens customizadas
- 🎫 Criar painéis de ticket

### 👔 Sistema de Mediadores
- ⏱️ Cargo automático por 1 semana
- 🔄 Sistema de renovação automática
- 🟢 Entrar/sair de serviço
- 💰 Comando `/pix` (configurável por canal)

### 🎯 Sistema de Analistas
- 📱 Analista Mobile
- 🖥️ Analista Emulador
- 🟢 Entrar/sair de serviço por tipo
- 💵 Taxa configurável

### 🎲 Sistema de Filas
- 📊 Tipos: 1x1, 2x2, 3x3, 4x4
- 📱 Plataformas: Mobile, Emulador, Misto
- 💰 Valores configuráveis (1, 2, 5, 10, 20, 50, 100...)
- 🔒 Canais privados automáticos
- 📬 DM automático para jogadores
- 🎮 Painel de confirmação e pagamento

### 📸 Sistema de SS
- 👮 Apenas cargos autorizados podem chamar
- 📋 Painel para analistas atenderem

### 🎫 Sistema de Tickets
- 💬 Tipos: Suporte e Vagas
- 🎭 Cargos de atendimento configuráveis
- 📋 Painéis customizáveis

### 🚫 Blacklist
- ❌ Sistema de lista negra
- 📝 Registro de motivos
- 🔍 Consulta com histórico

### 🏆 Ranking
- 📊 Apostados ganhos
- 🎯 W.O e Win normal
- 📈 Estatísticas completas

### 📝 Logs
- 📄 Arquivo TXT com histórico
- ⏰ Data, hora e detalhes completos
- 🔍 Comando `/fila @user` para consulta

## 🚀 Como usar

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar
1. Copie `.env.example` para `.env`
2. Preencha com seu token do Discord e IDs
3. Configure o bot no painel do dono

### 3. Iniciar
```bash
npm start
```

## 📁 Estrutura

```
infinity-bot/
├── src/
│   ├── index.js              # Inicialização
│   ├── config/
│   │   ├── constants.js      # Constantes
│   │   └── permissions.js    # Permissões
│   ├── database/
│   │   └── index.js          # Gerenciador de dados
│   ├── utils/
│   │   ├── embeds.js         # Templates de embeds
│   │   ├── logger.js         # Sistema de logs
│   │   └── validators.js     # Validações
│   ├── handlers/
│   │   ├── commandHandler.js
│   │   ├── buttonHandler.js
│   │   └── modalHandler.js
│   ├── commands/
│   │   └── ...               # Comandos slash
│   └── services/
│       ├── mediadorService.js
│       ├── analistaService.js
│       ├── filaService.js
│       └── ticketService.js
└── data/
    └── ...                   # Arquivos de dados
```

## 👨‍💻 Desenvolvido por

Felipe - 2025

---
**INFINITY BOT** - Sistema profissional de apostado Free Fire
