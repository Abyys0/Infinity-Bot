// Comando: /comandos - Ver todos os comandos disponíveis com detalhes

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../config/constants');
const permissions = require('../config/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('comandos')
    .setDescription('Ver todos os comandos disponíveis com instruções de uso'),

  async execute(interaction) {
    const member = interaction.member;
    
    // Verificar permissões do usuário
    const isDono = await permissions.isOwner(member.user.id);
    const isStaff = await permissions.isStaff(member);
    const isMediador = await permissions.isMediadorOrAbove(member);
    const isAnalista = await permissions.isAnalista(member);

    // Embed principal
    const embedPrincipal = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.GAME} INFINITY BOT - Guia de Comandos`)
      .setDescription('**Lista completa de comandos disponíveis**\n\nClique nos títulos abaixo para ver comandos detalhados por categoria.')
      .setTimestamp()
      .setFooter({ text: 'INFINITY BOT • Sistema de Apostado Free Fire' });

    // Adicionar campos baseados nas permissões
    if (isDono) {
      embedPrincipal.addFields({
        name: `🔴 ${EMOJIS.SHIELD} Comandos do Dono (Você tem acesso)`,
        value: '`/painel` • `/mediador` • `/blacklist` • E todos os comandos abaixo',
        inline: false
      });
    }

    if (isStaff) {
      embedPrincipal.addFields({
        name: `🟠 ${EMOJIS.SHIELD} Comandos de Staff (Você tem acesso)`,
        value: '`/blacklist` • `/ticket` (fechar) • E comandos de mediador',
        inline: false
      });
    }

    if (isMediador) {
      embedPrincipal.addFields({
        name: `🟡 ${EMOJIS.MEDIATOR} Comandos de Mediador (Você tem acesso)`,
        value: '`/fila` • `/finalizar` • `/ss` • `/pix`',
        inline: false
      });
    }

    if (isAnalista) {
      embedPrincipal.addFields({
        name: `🟢 ${EMOJIS.ANALYST} Comandos de Analista (Você tem acesso)`,
        value: '`/analista`',
        inline: false
      });
    }

    embedPrincipal.addFields({
      name: `⚪ ${EMOJIS.USER} Comandos Públicos (Todos têm acesso)`,
      value: '`/ticket` • `/ranking` • `/comandos`',
      inline: false
    });

    // Embed de comandos do dono
    const embedDono = new EmbedBuilder()
      .setColor(COLORS.ERROR)
      .setTitle(`${EMOJIS.SHIELD} Comandos do Dono`)
      .setDescription('**Apenas o proprietário do bot pode usar estes comandos**')
      .addFields(
        {
          name: '`/painel`',
          value: '**Descrição:** Abre o painel de controle completo do bot\n**Uso:** `/painel`\n**Onde:** Qualquer canal\n**Funcionalidades:** Configurar canais, cargos, valores, taxa, logs e muito mais',
          inline: false
        },
        {
          name: '`/mediador adicionar <usuário>`',
          value: '**Descrição:** Adiciona um mediador por 7 dias\n**Uso:** `/mediador adicionar @usuário`\n**Onde:** Qualquer canal\n**Nota:** Renovação automática 24h antes do vencimento',
          inline: false
        },
        {
          name: '`/mediador remover <usuário>`',
          value: '**Descrição:** Remove um mediador\n**Uso:** `/mediador remover @usuário`\n**Onde:** Qualquer canal',
          inline: false
        },
        {
          name: '`/mediador listar`',
          value: '**Descrição:** Lista todos os mediadores ativos\n**Uso:** `/mediador listar`\n**Onde:** Qualquer canal\n**Exibe:** Nome, data de adição e data de expiração',
          inline: false
        }
      );

    // Embed de comandos de staff
    const embedStaff = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.SHIELD} Comandos de Staff/Admin`)
      .setDescription('**Para membros com cargo de staff ou administrador**')
      .addFields(
        {
          name: '`/blacklist adicionar`',
          value: '**Descrição:** Adiciona um usuário à blacklist\n**Uso:** `/blacklist adicionar` (via painel) ou `/blacklist painel`\n**Onde:** Qualquer canal\n**Requer:** ID do usuário Discord e motivo',
          inline: false
        },
        {
          name: '`/blacklist remover`',
          value: '**Descrição:** Remove um usuário da blacklist\n**Uso:** `/blacklist remover` (via painel) ou `/blacklist painel`\n**Onde:** Qualquer canal',
          inline: false
        },
        {
          name: '`/blacklist consultar`',
          value: '**Descrição:** Consulta um usuário específico na blacklist\n**Uso:** `/blacklist consultar` (via painel)\n**Onde:** Qualquer canal\n**Exibe:** Motivo, quem adicionou e quando',
          inline: false
        },
        {
          name: '`/blacklist listar`',
          value: '**Descrição:** Lista todos os usuários na blacklist\n**Uso:** `/blacklist listar`\n**Onde:** Qualquer canal',
          inline: false
        },
        {
          name: '`/blacklist painel`',
          value: '**Descrição:** Abre o painel de gerenciamento de blacklist\n**Uso:** `/blacklist painel`\n**Onde:** Qualquer canal\n**Funcionalidades:** Adicionar, remover, consultar via botões',
          inline: false
        }
      );

    // Embed de comandos de mediador
    const embedMediador = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`${EMOJIS.MEDIATOR} Comandos de Mediador`)
      .setDescription('**Para membros com cargo de mediador ou superior**')
      .addFields(
        {
          name: '`/fila <tipo> <plataforma> <valor> [jogadores...]`',
          value: '**Descrição:** Cria uma fila de apostado\n**Uso:** `/fila tipo:2x2 plataforma:mobile valor:10 jogador1:@user1 jogador2:@user2...`\n**Onde:** Qualquer canal\n**Tipos:** 1x1, 2x2, 3x3, 4x4\n**Plataformas:** Mobile, Emulador, Misto\n**Nota:** Cria canal privado e divide em 2 times automaticamente',
          inline: false
        },
        {
          name: '`/finalizar <fila_id> <time_vencedor> <tipo_vitoria> [print]`',
          value: '**Descrição:** Finaliza uma fila e registra o vencedor\n**Uso:** `/finalizar fila_id:123456 time_vencedor:time1 tipo_vitoria:normal`\n**Onde:** Qualquer canal\n**Times:** Time 1 (Gelo Infinito) ou Time 2 (Gelo Normal)\n**Tipos:** Normal ou W.O.\n**Print:** Opcional - screenshot do resultado\n**Efeitos:** Atualiza ranking, calcula pagamentos, notifica jogadores',
          inline: false
        },
        {
          name: '`/ss <tipo> [cliente]`',
          value: '**Descrição:** Chama um analista para fazer SS\n**Uso:** `/ss tipo:mobile` ou `/ss tipo:emulador cliente:@usuário`\n**Onde:** Qualquer canal\n**Tipos:** Mobile ou Emulador\n**Nota:** Sistema seleciona analista disponível automaticamente',
          inline: false
        },
        {
          name: '`/pix configurar <nome> <chave>`',
          value: '**Descrição:** Configura sua chave PIX para receber pagamentos\n**Uso:** `/pix configurar nome:"João Silva" chave:"joao@email.com"`\n**Onde:** Qualquer canal\n**Aceita:** CPF, CNPJ, Email, Telefone, Chave Aleatória',
          inline: false
        },
        {
          name: '`/pix mostrar`',
          value: '**Descrição:** Mostra seu PIX configurado\n**Uso:** `/pix mostrar`\n**Onde:** Qualquer canal',
          inline: false
        }
      );

    // Embed de comandos de analista
    const embedAnalista = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.ANALYST} Comandos de Analista`)
      .setDescription('**Para membros com cargo de analista**')
      .addFields(
        {
          name: '`/analista <acao>`',
          value: '**Descrição:** Gerencia seu status como analista\n**Onde:** Qualquer canal',
          inline: false
        },
        {
          name: '• Entrar em Serviço (Mobile)',
          value: '**Uso:** `/analista acao:entrar_mobile`\n**Efeito:** Você ficará disponível para chamados de SS Mobile',
          inline: false
        },
        {
          name: '• Entrar em Serviço (Emulador)',
          value: '**Uso:** `/analista acao:entrar_emulador`\n**Efeito:** Você ficará disponível para chamados de SS Emulador',
          inline: false
        },
        {
          name: '• Sair de Serviço',
          value: '**Uso:** `/analista acao:sair`\n**Efeito:** Você não receberá mais chamados de SS',
          inline: false
        },
        {
          name: '• Ver Status',
          value: '**Uso:** `/analista acao:status`\n**Efeito:** Mostra se você está em serviço e há quanto tempo',
          inline: false
        }
      );

    // Embed de comandos públicos
    const embedPublico = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.USER} Comandos Públicos`)
      .setDescription('**Todos os membros podem usar estes comandos**')
      .addFields(
        {
          name: '`/ticket <tipo>`',
          value: '**Descrição:** Abre um ticket de atendimento\n**Uso:** `/ticket tipo:suporte` ou `/ticket tipo:vagas`\n**Onde:** Qualquer canal\n**Tipos:**\n• **Suporte** - Dúvidas, problemas, reclamações\n• **Vagas** - Candidatura para cargos (Mediador, Analista)\n**Efeito:** Cria canal privado com você e staff\n**Nota:** Não pode abrir ticket se estiver na blacklist',
          inline: false
        },
        {
          name: '`/ranking [usuario]`',
          value: '**Descrição:** Mostra o ranking de apostados\n**Uso:** `/ranking` (seu ranking) ou `/ranking usuario:@user` (de alguém)\n**Onde:** Qualquer canal\n**Exibe:** Vitórias, derrotas, total de jogos, taxa de vitória',
          inline: false
        },
        {
          name: '`/comandos`',
          value: '**Descrição:** Mostra esta lista de comandos\n**Uso:** `/comandos`\n**Onde:** Qualquer canal',
          inline: false
        }
      );

    // Embed de informações adicionais
    const embedInfo = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`${EMOJIS.INFO} Informações Importantes`)
      .addFields(
        {
          name: '🎮 Sistema de Filas',
          value: '• Filas são criadas em canais privados\n• Jogadores são divididos em 2 times automaticamente\n• Todos devem confirmar participação\n• Apenas criador ou staff pode cancelar\n• Apenas mediador+ pode finalizar',
          inline: false
        },
        {
          name: '🏆 Sistema de Ranking',
          value: '• Atualizado automaticamente ao finalizar fila\n• Vitórias normais e W.O. contam igual\n• Mostra taxa de vitória em porcentagem',
          inline: false
        },
        {
          name: '🚫 Sistema de Blacklist',
          value: '• Usuários na blacklist não podem:\n  - Participar de filas\n  - Abrir tickets\n• Staff pode adicionar/remover',
          inline: false
        },
        {
          name: '💰 Sistema de Pagamentos',
          value: '• Mediadores configuram PIX próprio\n• Taxa é descontada automaticamente\n• Cálculo mostrado ao finalizar fila\n• Valores configurados pelo dono',
          inline: false
        },
        {
          name: '📸 Sistema de SS',
          value: '• Analistas entram em serviço por tipo\n• Mediadores chamam quando necessário\n• Sistema seleciona analista disponível\n• Notificação via DM',
          inline: false
        },
        {
          name: '🔄 Sistema de Renovação',
          value: '• Mediadores têm 7 dias de acesso\n• Renovação automática 24h antes\n• Canal privado criado para confirmar\n• Remoção automática se não renovar',
          inline: false
        }
      );

    // Embed de dicas
    const embedDicas = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.STAR} Dicas de Uso`)
      .addFields(
        {
          name: '💡 Para Jogadores',
          value: '• Use `/ranking` para acompanhar seu progresso\n• Abra `/ticket tipo:suporte` se tiver problemas\n• Confirme sua participação em filas rapidamente\n• Respeite as regras para não ir para blacklist',
          inline: false
        },
        {
          name: '💡 Para Mediadores',
          value: '• Configure seu PIX com `/pix configurar`\n• Verifique blacklist antes de criar filas\n• Use `/ss` quando precisar de analista\n• Finalize filas com print sempre que possível\n• Renove seu acesso 24h antes do vencimento',
          inline: false
        },
        {
          name: '💡 Para Analistas',
          value: '• Entre em serviço quando disponível\n• Saia de serviço quando terminar\n• Responda chamados rapidamente\n• Use `/analista status` para verificar',
          inline: false
        },
        {
          name: '💡 Para Staff',
          value: '• Use `/blacklist painel` para gerenciar facilmente\n• Sempre documente motivo ao adicionar na blacklist\n• Verifique tickets regularmente\n• Ajude mediadores com dúvidas',
          inline: false
        }
      );

    // Enviar todos os embeds
    await interaction.reply({ 
      embeds: [
        embedPrincipal,
        ...(isDono ? [embedDono] : []),
        ...(isStaff ? [embedStaff] : []),
        ...(isMediador ? [embedMediador] : []),
        ...(isAnalista ? [embedAnalista] : []),
        embedPublico,
        embedInfo,
        embedDicas
      ], 
      flags: 64 
    });
  }
};
