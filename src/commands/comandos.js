// Comando: /comandos - Ver todos os comandos disponíveis com detalhes

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../config/constants');
const permissions = require('../config/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('comandos')
    .setDescription('Ver todos os comandos disponíveis com instruções de uso'),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });
    
    const member = interaction.member;
    
    // Verificar permissões do usuário
    const isDono = await permissions.isOwner(interaction.user.id, member);
    const isMediador = await permissions.isMediadorOrAbove(member);
    const isAnalista = await permissions.isAnalista(member);

    // Embed principal - SIMPLIFICADO
    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.GAME} INFINITY BOT - Comandos`)
      .setDescription('**Lista de comandos disponíveis**\n')
      .setTimestamp();

    // Comandos Públicos
    embed.addFields({
      name: '⚪ Comandos Públicos',
      value: 
        '**`/ticket`** - Abrir ticket de suporte ou vagas\n' +
        '**`/ranking`** - Ver ranking de vitórias\n' +
        '**`/comandos`** - Ver esta lista\n',
      inline: false
    });

    // Comandos de Analista
    if (isAnalista || isDono) {
      embed.addFields({
        name: `${EMOJIS.ANALYST} Comandos de Analista`,
        value: 
          '**`/analista`** - Entrar/sair de serviço\n' +
          '**`/ss`** - Solicitar screenshot\n',
        inline: false
      });
    }

    // Comandos de Mediador
    if (isMediador || isDono) {
      embed.addFields({
        name: `${EMOJIS.MEDIATOR} Comandos de Mediador`,
        value: 
          '**`/mediador`** - Entrar/sair de serviço\n' +
          '**`/fila`** - Criar fila de apostas\n' +
          '**`/finalizar`** - Finalizar fila\n' +
          '**`/pix`** - Configurar PIX pessoal\n',
        inline: false
      });
    }

    // Comandos do Dono
    if (isDono) {
      embed.addFields({
        name: `${EMOJIS.SHIELD} Comandos do Dono`,
        value: 
          '**`/painel`** - Painel de controle completo\n' +
          '**`/painelanalista`** - Criar painel de analistas\n' +
          '**`/painelmediador`** - Criar painel de mediadores\n' +
          '**`/painelticket`** - Criar painel de tickets\n' +
          '**`/painelfila`** - Criar painel de filas\n' +
          '**`/painelranking`** - Criar painel de ranking\n' +
          '**`/blacklist`** - Gerenciar blacklist\n' +
          '**`/diagnostico`** - Ver status do sistema\n',
        inline: false
      });
    }

    embed.setFooter({ text: 'INFINITY BOT • Sistema de Apostas' });

    await interaction.editReply({ embeds: [embed] });
  }
};
