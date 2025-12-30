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
          '**`/fila`** - Criar fila de apostado\n' +
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
          '**`/blacklist`** - Gerenciar blacklist\n' +
          '**`/diagnostico`** - Ver status do sistema\n',
        inline: false
      });
    }

    embed.setFooter({ text: 'INFINITY BOT • Sistema de Apostado' });

    await interaction.editReply({ embeds: [embed] });
  }
};
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
          name: '`/fila <tipo> <plataforma> <valor>`',
          value: '**Descrição:** Cria uma fila de apostado no canal atual\n**Uso:** `/fila tipo:1x1 plataforma:mobile valor:10`\n**Onde:** Canal de filas\n**Tipos:** 1x1, 2x2, 3x3, 4x4\n**Plataformas:** Mobile, Emulador, Misto, Tático\n**Nota:** Jogadores entram clicando no botão, divide em times automaticamente quando completar',
          inline: false
        },
        {
          name: '`/painelfila <canal>`',
          value: '**Descrição:** Cria painel fixo de criação de filas\n**Uso:** `/painelfila canal:#1v1-mobile`\n**Onde:** Qualquer canal\n**Efeito:** Cria painel com botões para cada valor configurado\n**Nota:** Jogadores clicam no valor desejado para criar fila',
          inline: false
        },
        {
          name: '`/painelmediador <canal>`',
          value: '**Descrição:** Cria painel fixo para mediadores entrarem/sairem de serviço\n**Uso:** `/painelmediador canal:#fila-mediadores`\n**Onde:** Canal de staff\n**Botões:** Entrar em Serviço, Sair de Serviço, Ver Mediadores\n**Nota:** Substitui o uso de `/mediador entrar/sair`',
          inline: false
        },
        {
          name: '`/painelanalista <canal>`',
          value: '**Descrição:** Cria painel fixo para chamar analistas\n**Uso:** `/painelanalista canal:#staff`\n**Onde:** Canal de staff\n**Botões:** Chamar Analista Mobile, Chamar Analista Emulador\n**Nota:** Substitui o uso de `/ss`',
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
          name: '`/painelticket <canal>`',
          value: '**Descrição:** Cria painel fixo para abrir tickets\n**Uso:** `/painelticket canal:#suporte`\n**Onde:** Qualquer canal\n**Botões:** Suporte, Vagas\n**Nota:** Qualquer pessoa pode clicar para abrir ticket',
          inline: false
        },
        {
          name: '`/painelblacklistpublico <canal>`',
          value: '**Descrição:** Cria painel público de blacklist\n**Uso:** `/painelblacklistpublico canal:#regras`\n**Onde:** Qualquer canal\n**Botões:** Consultar Usuário, Adicionar (analistas), Ver Lista\n**Nota:** Consultar e Ver são públicos, Adicionar apenas para analistas',
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
          name: '📋 Painéis Fixos',
          value: '• **Painéis** são mensagens permanentes com botões\n• Facilitam o uso - não precisa digitar comandos\n• Apenas donos/mediadores podem criar painéis\n• Tipos: Filas, Tickets, Mediadores, Analistas, Blacklist',
          inline: false
        },
        {
          name: '🎮 Sistema de Filas',
          value: '• Filas aparecem no mesmo canal (não cria canal novo)\n• Jogadores entram clicando em "Entrar na Fila"\n• Divide em 2 times automaticamente quando completar\n• Sistema de confirmação com botões Gelo Infinito/Normal\n• Verifica multas e blacklist antes de entrar',
          inline: false
        },
        {
          name: '🏆 Sistema de Ranking',
          value: '• Atualizado automaticamente ao finalizar fila\n• Vitórias normais e W.O. contam igual\n• Mostra taxa de vitória em porcentagem',
          inline: false
        },
        {
          name: '🚫 Sistema de Blacklist',
          value: '• Usuários na blacklist não podem:\n  - Participar de filas\n  - Abrir tickets\n• Staff pode adicionar/remover\n• Painel público permite consultar',
          inline: false
        },
        {
          name: '💰 Sistema de Pagamentos',
          value: '• Mediadores configuram PIX próprio\n• Taxa é descontada automaticamente\n• Cálculo mostrado ao finalizar fila\n• Valores configurados pelo dono',
          inline: false
        },
        {
          name: '📸 Sistema de SS',
          value: '• Analistas entram em serviço por tipo (Mobile/Emulador)\n• Mediadores chamam via painel ou comando\n• Sistema seleciona analista disponível\n• Notificação via DM',
          inline: false
        },
        {
          name: '👔 Sistema de Mediadores',
          value: '• Entram/saem de serviço via painel\n• Contador mostra quantos estão ativos\n• Multa pendente bloqueia trabalho\n• Renovação automática a cada 7 dias',
          inline: false
        },
        {
          name: '🎫 Sistema de Tickets',
          value: '• Botão "Atender Ticket" para staff\n• Apenas quem atendeu pode fechar\n• Criador também pode fechar seu ticket\n• Donos sempre podem fechar',
          inline: false
        },
        {
          name: '💸 Sistema de Multas',
          value: '• Donos podem multar mediadores\n• Cria canal privado de pagamento\n• Multado não pode trabalhar até pagar\n• Auto-expulso da fila de trabalho',
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

    // Enviar todos os embeds (máximo 10 embeds por mensagem)
    const embeds = [embedPrincipal];
    
    if (isDono) embeds.push(embedDono);
    if (isStaff) embeds.push(embedStaff);
    if (isMediador) embeds.push(embedMediador);
    if (isAnalista) embeds.push(embedAnalista);
    
    embeds.push(embedPublico);
    embeds.push(embedInfo);
    embeds.push(embedDicas);
    
    // Discord permite máximo 10 embeds - se passar, divide em 2 mensagens
    if (embeds.length <= 10) {
      await interaction.editReply({ embeds });
    } else {
      // Primeira mensagem com primeiros embeds
      await interaction.editReply({ 
        embeds: embeds.slice(0, 10) 
      });
      
      // Segunda mensagem com restante
      await interaction.followUp({ 
        embeds: embeds.slice(10),
        flags: 64 
      });
    }
  }
};
