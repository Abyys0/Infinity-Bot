# 🧪 Guia de Teste Rápido - Painel do Dono

## ✅ Checklist de Testes

### 1️⃣ **Testar Comando /painel**

```bash
1. No Discord, digite: /painel
2. Deve aparecer um embed laranja com título "PAINEL DO DONO"
3. Deve ter 4 linhas de botões (total de 12 botões)
```

**✅ Se funcionou:** Painel carregou corretamente!

---

### 2️⃣ **Testar Configurar Taxas**

```bash
1. Clique em "Configurar Taxas"
2. Preencha:
   - Taxa do Mediador: 10
   - Taxa do Analista: 5
3. Clique em "Enviar"
4. Deve aparecer mensagem verde de sucesso
```

**✅ Se funcionou:** Sistema de taxas OK!

---

### 3️⃣ **Testar Ver Configurações**

```bash
1. Clique em "Ver Configurações"
2. Deve mostrar:
   - Taxas que você acabou de configurar
   - Quantidade de cargos (pode ser 0)
   - Canais (podem estar "Não configurado")
```

**✅ Se funcionou:** Sistema de leitura de config OK!

---

### 4️⃣ **Testar Configurar Cargos**

```bash
1. No Discord, pegue ID de um cargo qualquer:
   - Ative Modo Desenvolvedor
   - Clique com direito em um cargo
   - Copiar ID

2. No painel, clique em "Configurar Cargos"
3. Cole o ID no campo "Mediador"
4. Envie
5. Clique em "Ver Configurações" novamente
6. Deve mostrar "1 cargo(s)" em Mediador
```

**✅ Se funcionou:** Sistema de cargos OK!

---

### 5️⃣ **Testar Adicionar Mediador**

```bash
1. Pegue seu próprio User ID ou de outro membro
2. Pegue ID de um cargo
3. Clique em "Adicionar Mediador"
4. Preencha os IDs
5. Envie
6. Deve:
   - Mostrar mensagem de sucesso
   - O cargo deve ser adicionado ao usuário
   - Exibir data de expiração (7 dias)
```

**✅ Se funcionou:** Sistema de mediadores OK!

---

### 6️⃣ **Testar Ver Mediadores**

```bash
1. Clique em "Ver Mediadores"
2. Deve listar o mediador que você acabou de adicionar
3. Mostrar status, tempo restante e data
```

**✅ Se funcionou:** Listagem de mediadores OK!

---

### 7️⃣ **Testar Enviar Mensagem**

```bash
1. Pegue ID de um canal de teste
2. Clique em "Enviar Mensagem"
3. Preencha:
   - Canal: [ID do canal]
   - Mensagem: Teste do INFINITY BOT!
4. Envie
5. Vá até o canal
6. Deve ter a mensagem lá
```

**✅ Se funcionou:** Sistema de mensagens OK!

---

### 8️⃣ **Testar Criar Painel de Ticket**

```bash
1. Pegue ID de um canal de teste
2. Clique em "Criar Painel de Ticket"
3. Preencha:
   - Canal: [ID do canal]
   - Título: 🎫 TESTE DE TICKETS
   - Descrição: Painel de teste
4. Envie
5. Vá até o canal
6. Deve ter um embed com 2 botões: Suporte e Vagas
```

**✅ Se funcionou:** Painéis de ticket OK!

---

### 9️⃣ **Testar Configurar Valores de Filas**

```bash
1. Clique em "Valores de Filas"
2. Digite: 5,10,25,50,100
3. Envie
4. Deve mostrar valores ordenados: R$ 5, R$ 10, R$ 25, R$ 50, R$ 100
```

**✅ Se funcionou:** Valores de filas OK!

---

### 🔟 **Testar Remover Mediador**

```bash
1. Clique em "Remover Mediador"
2. Cole o ID do usuário que você adicionou antes
3. Envie
4. Deve:
   - Mostrar mensagem de sucesso
   - Remover o cargo do usuário
5. Clique em "Ver Mediadores"
6. Lista deve estar vazia ou sem o mediador removido
```

**✅ Se funcionou:** Remoção de mediadores OK!

---

## 🎯 Teste Completo em 5 Minutos

Execute estes comandos em sequência:

```
1. /painel
2. Configurar Taxas: 10, 5
3. Ver Configurações (confirmar taxas)
4. Valores de Filas: 1,5,10,20,50
5. Enviar Mensagem em canal de teste
6. Ver Configurações novamente
```

Se tudo funcionar = **✅ PAINEL 100% OPERACIONAL!**

---

## ❌ Problemas Comuns

### "Sem Permissão"
**Causa:** Você não é o dono
**Solução:** Confirme que seu User ID está no `.env` como `OWNER_ID`

### "ID Inválido"
**Causa:** ID está errado ou tem letras
**Solução:** Copie novamente com botão direito → Copiar ID

### "Canal Não Encontrado"
**Causa:** Bot não vê o canal ou ID errado
**Solução:** 
- Confirme que o bot está no servidor
- Confirme que o canal existe
- Teste com outro canal

### Botões não respondem
**Causa:** Handlers não carregados
**Solução:** Reinicie o bot com `npm start`

### Modal não abre
**Causa:** Erro de permissão ou ID
**Solução:** Veja o terminal para logs de erro

---

## 📊 Status dos Componentes

| Componente | Status | Testes |
|------------|--------|--------|
| Comando /painel | ✅ | Básico |
| Botão Adicionar Mediador | ✅ | Modal + Validação |
| Botão Configurar Taxas | ✅ | Modal + Validação |
| Botão Configurar Cargos | ✅ | Modal + Parse |
| Botão Configurar Canais | ✅ | Modal + Validação |
| Botão Enviar Mensagem | ✅ | Modal + Envio |
| Botão Criar Painel Ticket | ✅ | Modal + Embed |
| Botão Ver Configurações | ✅ | Leitura |
| Botão Ver Mediadores | ✅ | Listagem |
| Botão Valores de Filas | ✅ | Modal + Parse |
| Botão Cargos SS | ✅ | Modal + Parse |
| Botão Atendentes Ticket | ✅ | Modal + Parse |
| Botão Remover Mediador | ✅ | Modal + Remoção |

**13/13 Funcionalidades ✅**

---

## 🚀 Próximo Passo

Depois de testar o painel do dono, você pode:

1. ✅ Configurar o bot completamente
2. ✅ Adicionar mediadores de teste
3. ✅ Criar painéis de ticket
4. ✅ Testar comando `/fila`
5. ⏭️ Implementar sistema de tickets completo
6. ⏭️ Implementar sistema de blacklist
7. ⏭️ Implementar sistema de SS

---

**Bons testes! 🎮**
