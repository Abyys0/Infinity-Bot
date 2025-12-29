# 🚀 Guia de Instalação Rápida - INFINITY BOT v2.0

## ⚡ Instalação

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env`:
```bash
copy .env.example .env
```

Edite o arquivo `.env` e preencha:
```env
DISCORD_TOKEN=seu_token_do_bot_aqui
GUILD_ID=id_do_seu_servidor (opcional, para testes)
OWNER_ID=seu_user_id_aqui
```

### 3. Iniciar o Bot
```bash
npm start
```

## 🎮 Primeiros Passos

### 1. Configure o Bot
Use o comando `/painel` (apenas o dono pode usar) para:
- ⚙️ Configurar taxas de mediador e analista
- 👥 Adicionar mediadores
- 🎭 Configurar cargos do sistema
- 📢 Configurar canais (filas, tickets, logs, pix)

### 2. Criar Painéis
- Use o painel do dono para criar painéis de ticket
- Configure os valores das filas

### 3. Comandos Principais
- `/fila` - Criar fila de apostado
- `/mediador` - Mediador entrar/sair de serviço
- `/analista` - Analista entrar/sair de serviço  
- `/pix` - Configurar PIX (mediadores)
- `/ranking` - Ver ranking
- `/comandos` - Ver todos os comandos

## 📋 Checklist de Configuração

- [ ] Token do bot configurado no `.env`
- [ ] Owner ID configurado no `.env`
- [ ] Bot iniciado com sucesso
- [ ] Usado `/painel` para configurar cargos
- [ ] Configurado canais (filas, tickets, logs, pix)
- [ ] Configurado taxas de mediador e analista
- [ ] Adicionado pelo menos 1 mediador de teste

## ⚠️ Problemas Comuns

### Bot não inicia
- Verifique se o token está correto no `.env`
- Certifique-se de que executou `npm install`

### Comandos não aparecem
- Aguarde alguns minutos (comandos globais podem demorar)
- OU configure GUILD_ID no `.env` para registro instantâneo no servidor

### Sem permissão para usar comandos
- Verifique se você é o dono (OWNER_ID correto)
- Configure os cargos no `/painel`

## 🔧 Comandos por Cargo

| Cargo | Comandos |
|-------|----------|
| 👑 Dono | `/painel` |
| 👔 Mediador | `/mediador`, `/pix`, `/fila` |
| 🎯 Analista | `/analista` |
| 👥 Todos | `/ranking`, `/comandos`, `/fila` (como jogador) |

## 📚 Próximos Passos

O sistema base está funcionando! Algumas funcionalidades ainda precisam ser implementadas:

- [ ] Handlers completos dos botões do painel do dono
- [ ] Sistema de tickets completo
- [ ] Sistema de blacklist completo
- [ ] Sistema de SS completo
- [ ] Comando `/finalizar` para filas
- [ ] Comando `/analista` completo

Entre em contato se precisar de ajuda ou quiser implementar mais funcionalidades!

---
**INFINITY BOT v2.0** - Desenvolvido por Felipe
