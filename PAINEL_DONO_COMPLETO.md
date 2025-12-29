# 👑 Painel do Dono - Documentação Completa

## ✅ IMPLEMENTADO COM SUCESSO

O painel do dono está **100% funcional** com todos os botões e modals implementados!

---

## 🎮 Como Usar

Use o comando `/painel` (apenas o dono pode usar). Você verá um painel completo com 4 linhas de botões:

---

## 📋 Funcionalidades Disponíveis

### **Linha 1 - Configurações Principais**

#### 👔 **Adicionar Mediador**
- **Botão:** `Adicionar Mediador`
- **Função:** Adiciona um mediador ao sistema
- **Modal:** Pede ID do usuário e ID do cargo
- **Resultado:** 
  - Cargo adicionado ao membro
  - Mediador registrado por 7 dias
  - Sistema de renovação automática ativado
  - Log registrado

#### 💰 **Configurar Taxas**
- **Botão:** `Configurar Taxas`
- **Função:** Define taxas de mediador e analista
- **Modal:** Pede % de taxa do mediador e analista
- **Validação:** Valores entre 0 e 100
- **Resultado:** Taxas salvas e confirmadas

#### 👥 **Configurar Cargos**
- **Botão:** `Configurar Cargos`
- **Função:** Define cargos do sistema (Mediador, Analista, Staff, Suporte)
- **Modal:** 4 campos para IDs de cargos (separados por vírgula)
- **Resultado:** Todos os cargos configurados

---

### **Linha 2 - Canais e Comunicação**

#### 📢 **Configurar Canais**
- **Botão:** `Configurar Canais`
- **Função:** Define canais/categorias do sistema
- **Modal:** 4 campos:
  - Canal/Categoria de Filas
  - Canal/Categoria de Tickets
  - Canal de Logs
  - Canal de PIX
- **Resultado:** Canais configurados, bot usará automaticamente

#### 📨 **Enviar Mensagem**
- **Botão:** `Enviar Mensagem`
- **Função:** Envia mensagem customizada em qualquer canal
- **Modal:** Pede ID do canal e conteúdo da mensagem
- **Resultado:** Mensagem enviada + log registrado

#### 🎫 **Criar Painel de Ticket**
- **Botão:** `Criar Painel de Ticket`
- **Função:** Cria painel interativo de tickets
- **Modal:** Pede canal, título e descrição
- **Resultado:** 
  - Painel criado com embed customizado
  - 2 botões: Suporte e Vagas
  - Pronto para uso pelos membros

---

### **Linha 3 - Visualização e Valores**

#### 📋 **Ver Configurações**
- **Botão:** `Ver Configurações`
- **Função:** Mostra todas as configurações atuais
- **Exibe:**
  - Taxas de mediador e analista
  - Quantidade de cargos configurados
  - Canais configurados (com links)
- **Não abre modal:** Resposta imediata

#### 👤 **Ver Mediadores**
- **Botão:** `Ver Mediadores`
- **Função:** Lista todos os mediadores ativos
- **Exibe para cada mediador:**
  - Status (🟢 Em Serviço / ⚪ Fora de Serviço)
  - Tempo restante (dias e horas)
  - Data de adição
- **Não abre modal:** Resposta imediata

#### 💵 **Valores de Filas**
- **Botão:** `Valores de Filas`
- **Função:** Configura valores padrão de apostas
- **Modal:** Campo para valores separados por vírgula
- **Exemplo:** `1,2,5,10,20,50,100`
- **Resultado:** Valores ordenados e salvos

---

### **Linha 4 - Permissões Avançadas**

#### 📸 **Cargos SS**
- **Botão:** `Cargos SS`
- **Função:** Define quais cargos podem chamar analista (SS)
- **Modal:** IDs de cargos separados por vírgula
- **Nota:** Mediadores, Staff e Suporte já têm permissão automática
- **Resultado:** Cargos adicionais configurados

#### 🎫 **Atendentes de Ticket**
- **Botão:** `Atendentes de Ticket`
- **Função:** Define quais cargos podem atender tickets
- **Modal:** IDs de cargos separados por vírgula
- **Resultado:** Cargos que verão tickets configurados

#### ❌ **Remover Mediador**
- **Botão:** `Remover Mediador` (vermelho)
- **Função:** Remove mediador manualmente antes do prazo
- **Modal:** Pede ID do usuário
- **Resultado:**
  - Cargo removido
  - Registro marcado como inativo
  - Log registrado

---

## 🔧 Detalhes Técnicos

### **Validações Implementadas**

✅ **IDs do Discord**
- Formato: 17-19 dígitos
- Validação automática

✅ **Taxas**
- Valores: 0 a 100
- Aceita decimais

✅ **Valores de Filas**
- Apenas números positivos
- Ordenação automática
- Remove valores inválidos

✅ **Cargos Múltiplos**
- Aceita vários IDs separados por vírgula
- Remove espaços automaticamente
- Filtra IDs inválidos

### **Sistema de Logs**

Todas as ações do painel do dono são registradas:
- ✅ Arquivo `data/logs.txt` com timestamp
- ✅ Canal de logs (se configurado)
- ✅ Nome do executor incluído

### **Mensagens de Sucesso/Erro**

- ✅ Embeds coloridos padronizados
- ✅ Emojis para fácil identificação
- ✅ Mensagens claras e informativas
- ✅ Sempre ephemeral (apenas você vê)

---

## 🎯 Exemplos de Uso

### **1. Configuração Inicial Completa**

```
1. Use /painel
2. Clique em "Configurar Cargos"
   - Mediador: 123456789
   - Analista: 987654321
   - Staff: 111111111
   - Suporte: 222222222

3. Clique em "Configurar Canais"
   - Filas: 123456789 (categoria)
   - Tickets: 987654321 (categoria)
   - Logs: 111111111 (canal de texto)
   - PIX: 222222222 (canal de texto)

4. Clique em "Configurar Taxas"
   - Mediador: 10
   - Analista: 5

5. Clique em "Valores de Filas"
   - Valores: 1,2,5,10,20,50,100

✅ Bot configurado e pronto para uso!
```

### **2. Adicionar um Mediador**

```
1. Use /painel
2. Clique em "Adicionar Mediador"
3. Preencha:
   - ID do Usuário: 123456789012345678
   - ID do Cargo: 987654321012345678
4. Confirme

✅ Mediador adicionado por 7 dias!
✅ Em 6 dias, canal de renovação será criado automaticamente
```

### **3. Criar Painel de Tickets**

```
1. Use /painel
2. Clique em "Criar Painel de Ticket"
3. Preencha:
   - Canal: 123456789 (ID do canal)
   - Título: 🎫 SISTEMA DE TICKETS
   - Descrição: Clique nos botões para abrir ticket...
4. Confirme

✅ Painel criado no canal especificado!
✅ Membros podem abrir tickets clicando nos botões
```

### **4. Ver Status do Sistema**

```
1. Use /painel
2. Clique em "Ver Configurações"

Você verá:
- Taxas atuais
- Quantidade de cargos configurados
- Canais em uso

3. Clique em "Ver Mediadores"

Você verá:
- Lista de todos os mediadores
- Status atual de cada um
- Tempo restante antes de expirar
```

---

## ⚠️ Notas Importantes

### **IDs do Discord**
Para pegar ID de usuário/canal/cargo:
1. Ative o Modo Desenvolvedor no Discord
2. Clique com botão direito no item
3. Copiar ID

### **Cargos Múltiplos**
Use vírgulas sem espaços ou com espaços, ambos funcionam:
- ✅ `123,456,789`
- ✅ `123, 456, 789`

### **Canais vs Categorias**
- **Filas/Tickets:** Pode ser canal OU categoria
  - Categoria: Canais criados dentro dela
  - Canal: Usado como referência
- **Logs/PIX:** DEVE ser canal de texto

### **Permissões do Bot**
Certifique-se que o bot tem permissões para:
- ✅ Gerenciar cargos
- ✅ Gerenciar canais
- ✅ Enviar mensagens
- ✅ Enviar embeds
- ✅ Usar botões

---

## 🎉 Resultado Final

Com o painel do dono completo, você pode:

✅ Adicionar e remover mediadores
✅ Configurar todo o sistema sem código
✅ Criar painéis de ticket personalizados
✅ Enviar mensagens por todo o servidor
✅ Visualizar status do sistema em tempo real
✅ Configurar permissões granulares
✅ Definir valores de apostas customizados

**Tudo isso com uma interface simples de botões e formulários!**

---

## 📞 Suporte

Se algo não funcionar:
1. Verifique os logs do terminal
2. Confirme que é o dono (OWNER_ID no .env)
3. Verifique permissões do bot
4. Teste com `/painel` novamente

---

**Desenvolvido para INFINITY BOT v2.0** 🔥
