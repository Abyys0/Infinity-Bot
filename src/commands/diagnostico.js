// Comando de diagnóstico para verificar persistência de dados

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../config/constants');
const permissions = require('../config/permissions');
const db = require('../database');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('diagnostico')
    .setDescription('[DONO] Verifica estado dos dados e persistência'),

  async execute(interaction) {
    // Apenas dono
    if (!(await permissions.isOwner(interaction.user.id))) {
      return interaction.reply({
        content: '❌ Apenas o dono pode usar este comando.',
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      // Verificar arquivos de dados
      const dataDir = path.join(__dirname, '../../data');
      const files = await fs.readdir(dataDir);
      
      // Ler cada arquivo e contar itens
      const stats = {};
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const data = await db.readData(file.replace('.json', ''));
            const count = Array.isArray(data) ? data.length : (Object.keys(data).length || 1);
            stats[file] = count;
          } catch (error) {
            stats[file] = 'Erro ao ler';
          }
        }
      }

      // Verificar variáveis de ambiente
      const hasDatabase = !!process.env.MONGODB_URI || !!process.env.DATABASE_URL;
      const platform = process.env.RENDER ? 'Render' : (process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Local/Outro');

      // Criar embed
      const embed = new EmbedBuilder()
        .setTitle('🔍 Diagnóstico do Sistema')
        .setColor(hasDatabase ? COLORS.SUCCESS : COLORS.WARNING)
        .setTimestamp();

      // Informações do ambiente
      embed.addFields({
        name: '🖥️ Plataforma',
        value: platform,
        inline: true
      });

      embed.addFields({
        name: '💾 Banco de Dados',
        value: hasDatabase ? '✅ Configurado' : '❌ NÃO CONFIGURADO',
        inline: true
      });

      embed.addFields({
        name: '⚠️ Status de Persistência',
        value: hasDatabase 
          ? '✅ Dados persistem entre reinicializações'
          : '🔴 **DADOS SERÃO PERDIDOS AO REINICIAR**',
        inline: false
      });

      // Estatísticas de dados
      let dataInfo = '';
      for (const [file, count] of Object.entries(stats)) {
        dataInfo += `**${file}:** ${count} ${Array.isArray(count) ? 'itens' : 'configurações'}\n`;
      }

      if (dataInfo) {
        embed.addFields({
          name: '📊 Dados Atuais',
          value: dataInfo,
          inline: false
        });
      }

      // Alerta se não tem banco de dados
      if (!hasDatabase && platform === 'Render') {
        embed.addFields({
          name: '🚨 ALERTA CRÍTICO',
          value: 
            '**Você está usando arquivos JSON no Render!**\n\n' +
            '❌ Todos os dados serão perdidos quando:\n' +
            '• O bot reiniciar\n' +
            '• Fizer novo deploy\n' +
            '• O container for reiniciado\n\n' +
            '**Soluções:**\n' +
            '1. Configure MongoDB Atlas (gratuito)\n' +
            '2. Use Persistent Disk do Render ($1/mês)\n' +
            '3. Migre para Railway/VPS\n\n' +
            'Consulte a documentação para migração.',
          inline: false
        });
      }

      // Data/hora atual do servidor
      embed.addFields({
        name: '🕐 Última Verificação',
        value: new Date().toLocaleString('pt-BR'),
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Erro no diagnóstico:', error);
      await interaction.editReply({
        content: '❌ Erro ao executar diagnóstico: ' + error.message
      });
    }
  }
};
