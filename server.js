// Servidor HTTP para manter o bot ativo no Render
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Rota de health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Rota de ping
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Status do bot
app.get('/status', (req, res) => {
  res.json({
    bot: 'INFINITY BOT',
    status: 'running',
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP rodando na porta ${PORT}`);
  console.log(`✅ Keep-alive ativo para Render`);
});

module.exports = app;
