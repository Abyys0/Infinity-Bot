# 📋 Guia de Painéis Fixos - INFINITY BOT

## 🎯 O que são Painéis Fixos?

Painéis fixos são mensagens permanentes nos canais com botões que permitem aos usuários interagir com o bot de forma rápida e intuitiva, sem precisar digitar comandos.

---

## 🎮 Painel de Filas

### Como criar:

```
/painelfila canal:#nome-do-canal
```

### O que faz:
- Exibe todos os valores de fila configurados
- Permite criar filas clicando no valor desejado
- Cada botão inicia o processo de criação de fila automaticamente

### Onde usar:
- Canal público de filas
- Canal de apostas
- Canal principal do servidor

### Exemplo:
```
📢 Canal: #filas-apostado
Comando: /painelfila canal:#filas-apostado
Resultado: Painel fixo com botões R$ 10, R$ 20, R$ 50, etc.
```

---

## 🎫 Painel de Tickets

### Como criar:

```
/painelticket canal:#nome-do-canal
```

### O que faz:
- Botão "Suporte" - Abre ticket de ajuda/dúvidas
- Botão "Vagas" - Abre ticket para candidatar-se à equipe
- Cria canal privado automaticamente

### Onde usar:
- Canal de suporte
- Canal de abertura de tickets
- Canal de ajuda

### Exemplo:
```
📢 Canal: #abrir-ticket
Comando: /painelticket canal:#abrir-ticket
Resultado: Painel com 2 botões (Suporte e Vagas)
```

---

## 🚫 Painel de Blacklist Pública

### Como criar:

```
/painelblacklistpublico canal:#nome-do-canal
```

### O que faz:
- **Consultar Usuário** - Qualquer um pode verificar se alguém está na blacklist
- **Adicionar à Blacklist** - Apenas analistas podem adicionar
- **Ver Lista Completa** - Mostra todos os banidos

### Onde usar:
- Canal de regras
- Canal de informações
- Canal público do servidor

### Exemplo:
```
📢 Canal: #regras
Comando: /painelblacklistpublico canal:#regras
Resultado: Painel com 3 botões (Consultar, Adicionar, Listar)
```

---

## 🎯 Painel de Analistas

### Como criar:

```
/painelanalista canal:#nome-do-canal
```

### O que faz:
- Permite mediadores chamarem analistas
- Cria painel de atendimento automaticamente
- Sistema de fila de atendimento

### Onde usar:
- Canal privado de mediadores
- Canal de staff
- Canal de atendimento

### Exemplo:
```
📢 Canal: #staff-mediadores
Comando: /painelanalista canal:#staff-mediadores
Resultado: Painel com botão "Chamar Analista"
```

---

## ⚙️ Configurações Necessárias

### Antes de criar painéis:

#### 1. Configure valores de fila:
```
/painel → Configurar Valores de Fila
Valores: 10, 20, 50, 100 (exemplo)
```

#### 2. Configure cargos:
```
/painel → Configurar Cargos
- Mediador
- Analista
- Staff
- Suporte
```

#### 3. Configure canais:
```
/painel → Configurar Canais
- Categoria de filas
- Categoria de tickets
- Canal de logs
```

---

## 📊 Comparação: Comando vs Painel

| Recurso | Comando Manual | Painel Fixo |
|---------|---------------|-------------|
| Criar fila | `/fila valor:10` | Clique em "R$ 10" |
| Abrir ticket | `/ticket tipo:suporte` | Clique em "Suporte" |
| Consultar blacklist | `/blacklist consultar` | Clique em "Consultar" |
| Chamar analista | `/ss` | Clique em "Chamar Analista" |

**Vantagem**: Painéis são mais rápidos e intuitivos!

---

## 🎨 Personalização

### Cores dos painéis:
- Filas: Verde/Ciano (#00CED1)
- Tickets: Ciano (#00CED1)
- Blacklist: Preto (#000000)
- Analistas: Ciano (#00CED1)

### Emojis padrão:
- 🔥 Filas
- 🎫 Tickets
- 🚫 Blacklist
- 🎯 Analistas

---

## 🛡️ Permissões

### Quem pode criar painéis:
- ✅ Apenas **donos** (cargos configurados em OWNER_ID)

### Quem pode usar os botões:

| Painel | Todos | Mediador | Analista | Dono |
|--------|-------|----------|----------|------|
| Filas | ✅ | ✅ | ✅ | ✅ |
| Tickets | ✅ | ✅ | ✅ | ✅ |
| Blacklist (consultar) | ✅ | ✅ | ✅ | ✅ |
| Blacklist (adicionar) | ❌ | ❌ | ✅ | ✅ |
| Analistas | ❌ | ✅ | ✅ | ✅ |

---

## 📝 Exemplo Completo de Setup

### 1. Configure tudo no painel:
```
/painel
→ Configurar Cargos
→ Configurar Canais  
→ Configurar Valores de Fila
```

### 2. Crie os painéis fixos:
```
/painelfila canal:#filas-apostado
/painelticket canal:#suporte
/painelblacklistpublico canal:#regras
/painelanalista canal:#staff
```

### 3. Teste:
- Clique nos botões dos painéis
- Verifique se funcionam corretamente
- Ajuste permissões se necessário

---

## ❓ FAQ

**P: Posso editar um painel depois de criado?**
R: Não. Delete a mensagem e crie novamente com `/painelX`.

**P: Quantos painéis posso criar?**
R: Ilimitados! Você pode ter o mesmo painel em vários canais.

**P: Os painéis funcionam em DM?**
R: Não, apenas em canais de servidor.

**P: Posso mudar os valores depois de criar o painel de filas?**
R: Sim! Altere em `/painel` e recrie o painel.

**P: O painel para de funcionar?**
R: Não! Painéis são permanentes até serem deletados manualmente.

---

## ✅ Checklist de Criação

- [ ] Configure valores de fila
- [ ] Configure cargos de permissão
- [ ] Configure categorias de canais
- [ ] Teste permissões do bot (enviar mensagens, criar canais)
- [ ] Crie painel de filas no canal público
- [ ] Crie painel de tickets no canal de suporte
- [ ] Crie painel de blacklist no canal de regras
- [ ] Crie painel de analistas no canal de staff
- [ ] Teste todos os botões
- [ ] Ajuste permissões de canais se necessário

---

**🎉 Pronto! Seus painéis estão configurados!**
