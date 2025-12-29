# 🚀 Deploy no Render - INFINITY BOT

## 📋 Pré-requisitos

1. Conta no [Render](https://render.com) (grátis)
2. Repositório no GitHub com o código do bot
3. Variáveis de ambiente configuradas

## 🔧 Configuração

### 1. Instalar dependência do Express

```bash
npm install express
```

### 2. Configurar no Render

1. Acesse [render.com](https://render.com) e faça login
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub: `https://github.com/Abyys0/Infinity-Bot`
4. Configure:
   - **Name**: infinity-bot
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3. Adicionar Variáveis de Ambiente

Vá em **"Environment"** e adicione:

```
DISCORD_TOKEN=seu_token_aqui
CLIENT_ID=seu_client_id_aqui
GUILD_ID=seu_guild_id_aqui
OWNER_ID=seus_role_ids_aqui
PORT=3000
```

### 4. Deploy

Clique em **"Create Web Service"** e aguarde o deploy!

## 🌐 Keep-Alive (Evitar Sleep)

O Render coloca apps gratuitos para dormir após 15 minutos de inatividade. Para manter o bot acordado 24/7:

### Opção 1: UptimeRobot (Recomendado)

1. Acesse [uptimerobot.com](https://uptimerobot.com) e crie conta grátis
2. Clique em **"Add New Monitor"**
3. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: INFINITY BOT
   - **URL**: `https://seu-app.onrender.com/ping`
   - **Monitoring Interval**: 5 minutos
4. Salve!

### Opção 2: Cron-job.org

1. Acesse [cron-job.org](https://cron-job.org) e crie conta
2. Crie um novo cron job:
   - **URL**: `https://seu-app.onrender.com/ping`
   - **Interval**: A cada 5 minutos
3. Ative o job!

### Opção 3: BetterStack (Uptime)

1. Acesse [betterstack.com/uptime](https://betterstack.com/uptime)
2. Adicione monitor HTTP
3. URL: `https://seu-app.onrender.com/ping`
4. Intervalo: 5 minutos

## 🔍 Verificar Status

Após o deploy, acesse:

- **Health Check**: `https://seu-app.onrender.com/ping`
- **Status**: `https://seu-app.onrender.com/status`
- **Info**: `https://seu-app.onrender.com/`

## 📊 Monitoramento

O Render fornece:
- Logs em tempo real
- Métricas de uso
- Alertas de erro
- Auto-restart em caso de crash

## ⚠️ Limitações do Plano Gratuito

- **750 horas/mês** de uptime
- Sleep após 15 min de inatividade (resolvido com keep-alive)
- 512MB RAM
- CPU compartilhada

**Dica**: Com o keep-alive configurado, você terá ~720 horas/mês de uptime contínuo!

## 🔄 Atualizações Automáticas

O Render detecta automaticamente pushes no GitHub e faz deploy automático!

```bash
git add .
git commit -m "Atualização do bot"
git push origin main
```

## 🆘 Troubleshooting

### Bot não inicia

1. Verifique as variáveis de ambiente
2. Confira os logs no Render
3. Verifique se o TOKEN está correto

### Bot dorme mesmo com keep-alive

1. Verifique se o UptimeRobot está ativo
2. Confirme a URL do monitor
3. Intervalo deve ser menor que 15 min

### Erro de porta

Certifique-se que a variável `PORT` está configurada ou que o código usa `process.env.PORT`

## ✅ Pronto!

Seu bot está rodando 24/7 no Render! 🎉
