# 📋 Sistema de Painéis - Bot Infinity

## 🎯 Visão Geral

Este documento descreve os painéis fixos implementados no bot, suas funcionalidades e como utilizá-los.

---

## 👥 Painel de Mediadores (`/painelmediador`)

### Descrição
Painel fixo para mediadores controlarem sua entrada e saída de serviço.

### Comandos
- `/painelmediador canal:#canal` - Cria o painel no canal especificado

### Funcionalidades

#### 🟢 Entrar em Serviço
- Registra o mediador como disponível para atendimentos
- Verifica se o usuário está cadastrado no sistema via `/painel`
- Verifica se há multa pendente
- Atualiza o status para `onDuty: true`
- Exibe mensagem de confirmação

#### ⚪ Sair de Serviço
- Remove o mediador dos atendimentos disponíveis
- Atualiza o status para `onDuty: false`
- Exibe mensagem de confirmação

#### 📊 Ver Mediadores
- Lista todos os mediadores em serviço
- Mostra há quanto tempo estão online
- Exibe total de mediadores disponíveis

### Verificações de Segurança
1. ✅ Usuário deve estar registrado em `mediadores.json` com `active: true`
2. ✅ Não pode entrar em serviço com multa pendente
3. ✅ Sistema salva logs de todas as ações

---

## 🎮 Sistema de Filas

### Funcionamento Atualizado

#### Criação da Fila (`/fila`)
1. Cria mensagem da fila no canal atual (sem criar canal privado)
2. Adiciona botões "Entrar na Fila" e "Sair da Fila"
3. Mostra lista de jogadores em tempo real

#### Entrada na Fila
**Verificações automáticas:**
- ✅ Multa pendente
- ✅ Blacklist
- ✅ Limite de jogadores

**Quando completa:**
- Divide automaticamente em 2 times (Gelo Infinito vs Gelo Normal)
- Adiciona botão "Atender Fila" para mediadores
- Notifica todos os jogadores

#### 👤 Atendimento de Fila (NOVO)

**Funcionalidade:** Apenas um mediador pode atender cada fila.

**Verificações:**
1. ✅ Usuário é mediador (`mediadores.json` com `active: true`)
2. ✅ Mediador está em serviço (`onDuty: true`)
3. ✅ Fila ainda não tem mediador atribuído

**Ao Atender:**
- Vincula o mediador à fila
- Desabilita o botão "Atender Fila"
- Atualiza embed mostrando quem está atendendo
- Salva log da ação

**Campos atualizados na fila:**
```javascript
{
  mediadorId: "ID_DO_MEDIADOR",
  mediadorAtendeu: true,
  mediadorAtendeuEm: timestamp
}
```

---

## 🔍 Painel de Analistas (`/painelanalista`)

### Descrição
Painel para mediadores solicitarem analistas para verificação de partidas.

### Comandos
- `/painelanalista canal:#canal` - Cria o painel no canal especificado

### Funcionalidades

#### 📱 Chamar Analista Mobile
- Busca analistas mobile em serviço
- Seleciona aleatoriamente entre os disponíveis
- Envia DM para o analista escolhido
- Notifica quem solicitou

#### 💻 Chamar Analista Emulador
- Busca analistas de emulador em serviço
- Seleciona aleatoriamente entre os disponíveis
- Envia DM para o analista escolhido
- Notifica quem solicitou

### Verificações de Segurança
1. ✅ Apenas mediadores podem usar o painel
2. ✅ Verifica se há analistas do tipo solicitado em serviço
3. ✅ Salva log de todas as solicitações

---

## 🐛 Sistema de Debug

### Logs Implementados

#### No mediadorService.js:
```
[MEDIADOR] Iniciando addMediador: { userId, roleId, addedBy }
[MEDIADOR] Mediadores existentes: X
[MEDIADOR] Adicionando mediador: {...}
[MEDIADOR] Mediadores após adicionar: X
[MEDIADOR] Cargo adicionado com sucesso
```

#### No mediadorButtons.js:
```
[MEDIADOR PAINEL] Botão clicado: mediador_entrar_painel por Username#1234
[MEDIADOR PAINEL] Total de mediadores no banco: X
[MEDIADOR PAINEL] Mediadores: [{ userId, active }]
[MEDIADOR PAINEL] Mediador encontrado para ID: SIM/NÃO
```

### Como Usar os Logs

1. **Ao adicionar mediador via `/painel`:**
   - Verifique o console do bot
   - Confirme que aparece "[MEDIADOR] Adicionando mediador"
   - Verifique se o contador de mediadores aumentou

2. **Ao usar o painel:**
   - Veja qual botão foi clicado
   - Confirme quantos mediadores estão no banco
   - Verifique se o usuário foi encontrado

3. **Se o painel não funcionar:**
   - Verifique se `data/mediadores.json` não está vazio
   - Confirme que `active: true` está presente
   - Verifique se o userId está correto

---

## 📊 Estrutura de Dados

### Mediador
```json
{
  "userId": "123456789",
  "roleId": "987654321",
  "addedBy": "111111111",
  "addedAt": 1234567890,
  "expiresAt": 1234567890,
  "active": true,
  "onDuty": false,
  "renewalNotified": false
}
```

### Fila
```json
{
  "id": "fila_123",
  "channelId": "channel_id",
  "messageId": "message_id",
  "tipo": "1x1",
  "plataforma": "Mobile",
  "valor": 10,
  "jogadores": ["user1", "user2"],
  "time1": ["user1"],
  "time2": ["user2"],
  "status": "iniciada",
  "mediadorId": "mediador_id",
  "mediadorAtendeu": true,
  "mediadorAtendeuEm": 1234567890
}
```

### Analista
```json
{
  "userId": "123456789",
  "roleId": "987654321",
  "tipo": "mobile",
  "active": true,
  "onDuty": false,
  "addedBy": "111111111",
  "addedAt": 1234567890
}
```

---

## 🔧 Resolução de Problemas

### "Você não está registrado como mediador"

**Causas possíveis:**
1. Usuário não foi adicionado via `/painel`
2. Campo `active: false` no banco
3. Arquivo `mediadores.json` corrompido

**Solução:**
1. Verifique `data/mediadores.json`
2. Confirme que o userId está presente
3. Confirme que `active: true`
4. Se não estiver, adicione novamente via `/painel`

### "Fila já está sendo atendida"

**Causa:** Outro mediador já clicou em "Atender Fila"

**Solução:**
- Verifique quem é o mediador responsável no embed
- Se for erro, entre em contato com o dono para resetar a fila

### "Nenhum analista disponível"

**Causa:** Não há analistas do tipo solicitado em serviço

**Solução:**
- Peça para um analista mobile/emulador entrar em serviço
- Use o painel de analistas para entrar em serviço

---

## 📝 Comandos Relacionados

- `/painel` - Painel do dono para gerenciar mediadores e analistas
- `/painelmediador` - Cria painel de controle de mediadores
- `/painelanalista` - Cria painel de chamada de analistas
- `/fila` - Cria nova fila de apostas
- `/comandos` - Lista todos os comandos disponíveis

---

## 🚀 Melhorias Implementadas

### v2.0 - Sistema de Atendimento Único
- ✅ Apenas um mediador pode atender cada fila
- ✅ Botão "Atender Fila" desabilitado após uso
- ✅ Verificação de mediador em serviço
- ✅ Logs completos de debug
- ✅ Painéis com verificação de config

### v1.5 - Sistema de Filas Redesenhado
- ✅ Filas no canal atual (sem criar canal privado)
- ✅ Sistema de botões para entrar/sair
- ✅ Divisão automática em times
- ✅ Verificação de multa e blacklist

### v1.0 - Painéis Fixos
- ✅ Painel de mediadores
- ✅ Painel de analistas com Mobile/Emulador
- ✅ Documentação completa

---

**Desenvolvido para:** Bot Infinity  
**Última Atualização:** 2024  
**Suporte:** Via `/painel` com o dono do servidor
