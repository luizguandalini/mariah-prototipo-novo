# Mariah - Laudos Imobiliários com IA

Plataforma web para geração de laudos imobiliários utilizando Inteligência Artificial.

## 🚀 Tecnologias

- **React 18** - Biblioteca para interfaces
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **TailwindCSS** - Framework CSS utilitário
- **React Router** - Roteamento
- **Framer Motion** - Animações

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── layout/          # Componentes de layout (Header, Footer)
│   ├── ui/              # Componentes reutilizáveis (Button)
│   └── sections/        # Seções da página (Hero, Pricing, etc)
├── pages/               # Páginas da aplicação
│   ├── Home.tsx         # Página inicial institucional
│   ├── Login.tsx        # Página de login
│   └── Register.tsx     # Página de cadastro
├── assets/
│   └── images/          # Imagens do projeto (mariah.png, etc)
├── styles/              # Estilos globais
├── types/               # TypeScript types
├── utils/               # Funções utilitárias
├── App.tsx              # Componente principal
└── main.tsx             # Entrada da aplicação
```

## 🎨 Design System

### Cores

- **Primary**: `#A156E1`
- **Primary Dark**: `#5C2896`

### Componentes

- **Button**: Variantes (primary, secondary, outline) e tamanhos (sm, md, lg)
- **Header**: Navegação fixa com links e CTAs
- **Footer**: Informações e links úteis

## 📄 Páginas

### Home (/)
Página institucional com:
- Hero Section com apresentação da Mariah
- Como Funciona (4 etapas)
- Vantagens/Diferenciais
- Planos e Preços (3 planos + créditos avulsos)
- CTA Final

### Login (/login)
- Login com email/senha
- Login social (Google, Apple)
- Link para recuperação de senha
- Link para cadastro

### Cadastro (/cadastro)
- Cadastro com email/senha
- Cadastro social (Google, Apple)
- Termos de uso
- Link para login

## 🚦 Como Executar

1. Instalar dependências:
```bash
npm install
```

2. Iniciar servidor de desenvolvimento:
```bash
npm run dev
```

3. Build para produção:
```bash
npm run build
```

## 📝 Próximos Passos

- [ ] Integrar backend para autenticação
- [ ] Implementar upload de imagens
- [ ] Criar dashboard do usuário
- [ ] Integrar API de geração de laudos
- [ ] Implementar sistema de pagamentos
- [ ] Adicionar área administrativa

## 📸 Assets

As imagens devem estar em `src/assets/images/`:
- `mariah.png` - Personagem da Mariah (agente IA)
- `instagram.png` - Material de marketing
- Outros assets conforme necessário

## 🔧 Configurações

- **Vite**: Configurado com alias `@` para `src/`
- **TailwindCSS**: Cores customizadas e utilitários de gradiente
- **TypeScript**: Strict mode habilitado
