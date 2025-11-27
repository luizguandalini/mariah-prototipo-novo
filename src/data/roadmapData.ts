/**
 * ROADMAP DO PROJETO MARIAH COPILOT
 *
 * Para atualizar o progresso, basta editar o campo "status":
 * - "todo" = ○ A Fazer (cinza)
 * - "doing" = ⏳ Fazendo (amarelo)
 * - "done" = ✓ Pronto (verde)
 */

export type TaskStatus = "todo" | "doing" | "done";

export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  icon: string;
  description: string;
  tasks: RoadmapTask[];
}

export const roadmapData: RoadmapPhase[] = [
  {
    id: "phase-1",
    title: "Telas Iniciais",
    icon: "🎯",
    description: "Fluxo de boas-vindas e configurações iniciais",
    tasks: [
      {
        id: "task-1-1",
        title: "Tela de apresentação da Mariah",
        description:
          'Tela com personagem Mariah e status "Laudo Gerado" / "Pronto em segundos"',
        status: "doing",
      },
      {
        id: "task-1-2",
        title: 'Tela "Olá, vamos iniciar"',
        description: "Botões Entrada/Saída, campo de Endereço e botão Avançar",
        status: "doing",
      },
      {
        id: "task-1-3",
        title: "Tela de Tipo de Uso",
        description: "Seleção entre Industrial, Comercial e Residencial",
        status: "doing",
      },
      {
        id: "task-1-4",
        title: "Tela de Tipo de Imóvel",
        description: "Seleção entre Casa, Apartamento e Estúdio",
        status: "doing",
      },
      {
        id: "task-1-5",
        title: 'Tela "Iniciando modo COPILOTO"',
        description: "Tela de transição antes de iniciar a vistoria",
        status: "doing",
      },
    ],
  },
  {
    id: "phase-2",
    title: "Interface do Copiloto",
    icon: "📱",
    description: "Tela principal de captura com câmera e comandos",
    tasks: [
      {
        id: "task-2-1",
        title: "Visualização da câmera",
        description: "Preview da câmera em tempo real ocupando a tela",
        status: "todo",
      },
      {
        id: "task-2-2",
        title: 'Badge "Ativado copilot"',
        description: "Indicador visual mostrando que o copiloto está ativo",
        status: "todo",
      },
      {
        id: "task-2-3",
        title: 'Campo de voz "Fale o nome do ambiente"',
        description:
          "Input com ícone de microfone para nomear ambiente por voz",
        status: "todo",
      },
      {
        id: "task-2-4",
        title: 'Botão "Foto Avarias"',
        description:
          "Botão especial que adiciona borda vermelha nas fotos de problemas",
        status: "todo",
      },
      {
        id: "task-2-5",
        title: "Alerta de orientação paisagem",
        description:
          'Mensagem: "para resultado satisfatório, tire fotos em modo paisagem"',
        status: "todo",
      },
    ],
  },
  {
    id: "phase-3",
    title: "Botões de Captura - Estrutura",
    icon: "🚪",
    description: "Primeira tela de categorias de fotos",
    tasks: [
      {
        id: "task-3-1",
        title: "Botão PORTA",
        description:
          "Foto da porta completa, avaliando manchas e irregularidades",
        status: "todo",
      },
      {
        id: "task-3-2",
        title: "Botão VISTA GERAL",
        description: "Foto panorâmica do ambiente",
        status: "todo",
      },
      {
        id: "task-3-3",
        title: "Botão PAREDE",
        description: "Analisa pintura/revestimento de cada parede",
        status: "todo",
      },
      {
        id: "task-3-4",
        title: "Botão JANELA",
        description: "Foto das janelas do ambiente",
        status: "todo",
      },
      {
        id: "task-3-5",
        title: "Botão FECHADURA & MAÇANETA",
        description: "Foto específica de fechadura e maçaneta",
        status: "todo",
      },
    ],
  },
  {
    id: "phase-4",
    title: "Botões de Captura - Complementos",
    icon: "💡",
    description: "Segunda tela com mais categorias",
    tasks: [
      {
        id: "task-4-1",
        title: "Botão ELETRO",
        description: "Foto panorâmica focando em elementos elétricos",
        status: "todo",
      },
      {
        id: "task-4-2",
        title: "Botão ARTIGOS",
        description: "Registro de artigos presentes no ambiente",
        status: "todo",
      },
      {
        id: "task-4-3",
        title: "Botão TOMADAS / INTERRUPTOR",
        description: "Fotos específicas de tomadas e interruptores",
        status: "todo",
      },
      {
        id: "task-4-4",
        title: "Botão EQUIPAMENTOS",
        description: "Registro de equipamentos do ambiente",
        status: "todo",
      },
      {
        id: "task-4-5",
        title: "Botão MOBÍLIA",
        description: "Fotos das mobílias do ambiente",
        status: "todo",
      },
    ],
  },
  {
    id: "phase-5",
    title: "Botões de Captura - Acabamentos",
    icon: "🏠",
    description: "Terceira tela com categorias finais",
    tasks: [
      {
        id: "task-5-1",
        title: "Botão PISO",
        description: "Foto do piso, rodapés, tapetes, ralos e outros",
        status: "todo",
      },
      {
        id: "task-5-2",
        title: "Botão TETO",
        description: "Foto geral do teto incluindo spots/lâmpadas",
        status: "todo",
      },
      {
        id: "task-5-3",
        title: "Botão LUSTRES / PENDENTES",
        description: "Fotos de lustres e pendentes do ambiente",
        status: "todo",
      },
      {
        id: "task-5-4",
        title: 'Campo "Comentar ambiente"',
        description: "Input de voz para adicionar comentários sobre o ambiente",
        status: "todo",
      },
      {
        id: "task-5-5",
        title: "Navegação entre telas de botões",
        description: "Setas para navegar entre as 3 telas de categorias",
        status: "todo",
      },
    ],
  },
  {
    id: "phase-6",
    title: "Ações do Ambiente",
    icon: "⚙️",
    description: "Opções após captura das fotos",
    tasks: [
      {
        id: "task-6-1",
        title: 'Botão "Visualizar Galeria"',
        description: "Ver todas as fotos capturadas do ambiente",
        status: "todo",
      },
      {
        id: "task-6-2",
        title: 'Botão "Enviar Estúdio Mariah"',
        description: "Enviar fotos do ambiente para processamento",
        status: "todo",
      },
      {
        id: "task-6-3",
        title: 'Botão "Novo ambiente"',
        description: "Adicionar mais um ambiente para vistoriar",
        status: "todo",
      },
    ],
  },
  {
    id: "phase-7",
    title: "Galeria de Fotos",
    icon: "🖼️",
    description: "Visualização das fotos organizadas",
    tasks: [
      {
        id: "task-7-1",
        title: "Grade de miniaturas",
        description: "Grid 3x5 com fotos numeradas (1.1, 1.2, 1.3, etc)",
        status: "todo",
      },
      {
        id: "task-7-2",
        title: "Abas de ambientes",
        description: "Filtros: Sala, Cozinha, Banheiro, Suíte, Sala Jantar",
        status: "todo",
      },
      {
        id: "task-7-3",
        title: "Botão expandir foto",
        description: "Ícone em cada foto para visualizar em tela cheia",
        status: "todo",
      },
      {
        id: "task-7-4",
        title: "Botão excluir foto",
        description: "Ícone de lixeira para remover fotos",
        status: "todo",
      },
      {
        id: "task-7-5",
        title: 'Campo "Comentar ambiente" na galeria',
        description: "Input de voz disponível também na visualização",
        status: "todo",
      },
      {
        id: "task-7-6",
        title: 'Botão "Gerar descrição"',
        description: "Processar fotos com IA (ícone estrela roxa)",
        status: "todo",
      },
    ],
  },
  {
    id: "phase-8",
    title: "Atestado de Vistoria",
    icon: "📋",
    description: "Formulário de avaliação geral",
    tasks: [
      {
        id: "task-8-1",
        title: "Pergunta sobre pintura",
        description: "Qual é o estado geral da pintura? (6 opções)",
        status: "todo",
      },
      {
        id: "task-8-2",
        title: "Opção: Pintura nova sem manchas",
        description: "Primeira opção de avaliação",
        status: "todo",
      },
      {
        id: "task-8-3",
        title: "Opção: Pintura nova com manchas leves",
        description: "Segunda opção de avaliação",
        status: "todo",
      },
      {
        id: "task-8-4",
        title: "Opção: Pintura usada com manchas leves",
        description: "Terceira opção de avaliação",
        status: "todo",
      },
      {
        id: "task-8-5",
        title: "Opção: Pintura usada com manchas visíveis",
        description: "Quarta opção de avaliação",
        status: "todo",
      },
      {
        id: "task-8-6",
        title: "Opção: Pintura com desgaste aparente",
        description: "Quinta opção de avaliação",
        status: "todo",
      },
      {
        id: "task-8-7",
        title: "Opção: Pintura com muitas manchas e buracos",
        description: "Sexta opção de avaliação",
        status: "todo",
      },
      {
        id: "task-8-8",
        title: 'Link "Não incluir atestado"',
        description: "Opção para pular esta etapa",
        status: "todo",
      },
    ],
  },
  {
    id: "phase-9",
    title: "Análises Hidráulicas",
    icon: "💧",
    description: "Avaliação de sistemas de água",
    tasks: [
      {
        id: "task-9-1",
        title: "Fluxo e escoamento de água",
        description: "Teste em torneiras e vasos sanitários (4 opções)",
        status: "todo",
      },
      {
        id: "task-9-2",
        title: "Vazamentos",
        description:
          "Verificação em sifões, flexíveis, torneiras e vasos (4 opções)",
        status: "todo",
      },
      {
        id: "task-9-3",
        title: "Opções: Consta apontamento / sem irregularidades",
        description: "Botões de seleção para cada teste",
        status: "todo",
      },
      {
        id: "task-9-4",
        title: "Opções: Teste não realizado / Inexistente",
        description: "Botões alternativos quando não aplicável",
        status: "todo",
      },
    ],
  },
  {
    id: "phase-10",
    title: "Análises Elétricas",
    icon: "⚡",
    description: "Avaliação de sistemas elétricos",
    tasks: [
      {
        id: "task-10-1",
        title: "Testes de tomadas, interruptores e luminárias",
        description: "Verificação de funcionamento (4 opções)",
        status: "todo",
      },
      {
        id: "task-10-2",
        title: "Testes de eletrodomésticos e equipamentos",
        description: "Verificação de funcionamento (4 opções)",
        status: "todo",
      },
      {
        id: "task-10-3",
        title: "Opções: Consta apontamento / sem irregularidades",
        description: "Botões de seleção para cada teste",
        status: "todo",
      },
      {
        id: "task-10-4",
        title: "Opções: Teste não realizado / Inexistente",
        description: "Botões alternativos quando não aplicável",
        status: "todo",
      },
    ],
  },
  {
    id: "phase-11",
    title: "Sistema de Ar e Aquecimento",
    icon: "❄️",
    description: "Avaliação de climatização",
    tasks: [
      {
        id: "task-11-1",
        title: "Equipamentos de ar-condicionado",
        description:
          "Verificação de ar-condicionado e condensadoras (4 opções)",
        status: "todo",
      },
      {
        id: "task-11-2",
        title: "Sistema de aquecimento",
        description: "Verificação de sistemas de aquecimento (4 opções)",
        status: "todo",
      },
      {
        id: "task-11-3",
        title: "Opções: Consta apontamento / sem irregularidades",
        description: "Botões de seleção para cada teste",
        status: "todo",
      },
      {
        id: "task-11-4",
        title: "Opções: Teste não realizado / Inexistente",
        description: "Botões alternativos quando não aplicável",
        status: "todo",
      },
    ],
  },
  {
    id: "phase-12",
    title: "Mecanismos de Abertura",
    icon: "🔐",
    description: "Avaliação de portas e janelas",
    tasks: [
      {
        id: "task-12-1",
        title: "Abertura e fechamento",
        description: "Teste de portas, janelas e gavetas (3 opções)",
        status: "todo",
      },
      {
        id: "task-12-2",
        title: "Puxadores, maçanetas e fechaduras",
        description: "Verificação de funcionamento (3 opções)",
        status: "todo",
      },
      {
        id: "task-12-3",
        title: "Esquadrias, espelhos e vidros",
        description: "Avaliação de estado (3 opções)",
        status: "todo",
      },
      {
        id: "task-12-4",
        title: "Opções: Consta apontamento / sem irregularidades / Inexistente",
        description: 'Botões de seleção (sem "teste não realizado")',
        status: "todo",
      },
    ],
  },
  {
    id: "phase-13",
    title: "Revestimentos",
    icon: "🎨",
    description: "Avaliação de acabamentos",
    tasks: [
      {
        id: "task-13-1",
        title: "Forros",
        description: "Avaliação de forros (3 opções)",
        status: "todo",
      },
      {
        id: "task-13-2",
        title: "Revestimento de pisos",
        description: "Avaliação de pisos (3 opções)",
        status: "todo",
      },
      {
        id: "task-13-3",
        title: "Bancadas e pedras",
        description: "Avaliação de bancadas (3 opções)",
        status: "todo",
      },
      {
        id: "task-13-4",
        title: "Opções: Consta apontamento / sem irregularidades / Inexistente",
        description: "Botões de seleção",
        status: "todo",
      },
    ],
  },
  {
    id: "phase-14",
    title: "Mobílias",
    icon: "🪑",
    description: "Avaliação de móveis",
    tasks: [
      {
        id: "task-14-1",
        title: "Mobília fixa",
        description: "Avaliação de móveis fixos (3 opções)",
        status: "todo",
      },
      {
        id: "task-14-2",
        title: "Mobília não fixa",
        description: "Avaliação de móveis soltos (3 opções)",
        status: "todo",
      },
      {
        id: "task-14-3",
        title: "Opções: Consta apontamento / sem irregularidades / Inexistente",
        description: "Botões de seleção",
        status: "todo",
      },
    ],
  },
  {
    id: "phase-15",
    title: "Sistema de Prompts IA",
    icon: "🤖",
    description: "Integração com inteligência artificial",
    tasks: [
      {
        id: "task-15-1",
        title: "Prompts específicos por botão de foto",
        description:
          "Cada categoria gera prompt isolado para IA identificar o item",
        status: "todo",
      },
      {
        id: "task-15-2",
        title: "Prompt específico para avarias",
        description:
          "Quando foto de avaria, borda vermelha + prompt específico",
        status: "todo",
      },
      {
        id: "task-15-3",
        title: "Processamento de imagens",
        description: "IA analisa fotos e gera descrições para o laudo",
        status: "todo",
      },
    ],
  },
];
