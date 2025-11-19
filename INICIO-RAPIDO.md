# 🚀 Início Rápido - Mariah

## ✅ Projeto Pronto!

O projeto React + Vite está 100% configurado e funcionando!

## 📦 Instalar e Rodar

```bash
# Já instalado! Mas se precisar reinstalar:
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: **http://localhost:5173**

## 🎨 O que você vai ver

### Página Inicial (/)
✨ **Landing page institucional completa:**

1. **Hero Section**
   - Título impactante sobre Laudos com IA
   - Botões de CTA (Começar Gratuitamente + Ver Demonstração)
   - Imagem da Mariah (personagem 3D)
   - Estatísticas (10K+ laudos, 98% satisfação, 24/7)

2. **Como Funciona**
   - 4 etapas do processo
   - Upload → IA Analisa → Laudo Gerado → Download

3. **Vantagens/Diferenciais**
   - 6 cards com benefícios
   - Análise Inteligente, Rapidez, Precisão, etc.

4. **Planos e Preços**
   - 3 planos: Starter (R$ 97), Professional (R$ 297), Enterprise (R$ 797)
   - Seção de créditos avulsos
   - Destaque no plano mais popular

5. **CTA Final**
   - Chamada para teste grátis
   - Benefícios resumidos

### Páginas de Autenticação

**Login (/login)**
- Email/senha
- Login com Google
- Login com Apple
- Link para cadastro

**Cadastro (/cadastro)**
- Nome, email, senha
- Cadastro com Google
- Cadastro com Apple
- Termos de uso

## 🎨 Cores da Marca

```css
Roxo Principal:  #A156E1
Roxo Escuro:     #5C2896
```

Uso no código:
```jsx
className="bg-primary"           // Fundo roxo principal
className="text-primary-dark"    // Texto roxo escuro
className="gradient-text"        // Gradiente roxo
```

## 📁 Estrutura dos Arquivos

```
Mariah-Novo/
├── public/
│   └── images/
│       ├── mariah.png        ← Personagem 3D da Mariah
│       └── instagram.png     ← Material de marketing
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx    ← Navegação fixa
│   │   │   └── Footer.tsx    ← Rodapé
│   │   ├── ui/
│   │   │   └── Button.tsx    ← Botão reutilizável
│   │   └── sections/
│   │       ├── Hero.tsx      ← Seção principal
│   │       ├── HowItWorks.tsx
│   │       ├── Features.tsx
│   │       ├── Pricing.tsx
│   │       └── CTA.tsx
│   │
│   ├── pages/
│   │   ├── Home.tsx          ← Página inicial
│   │   ├── Login.tsx         ← Tela de login
│   │   └── Register.tsx      ← Tela de cadastro
│   │
│   ├── styles/
│   │   └── index.css         ← Estilos globais + Tailwind
│   │
│   ├── App.tsx               ← Rotas
│   └── main.tsx              ← Entrada
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🛠️ Tecnologias Usadas

- ⚛️ **React 18** - UI Library
- 📘 **TypeScript** - Tipagem
- ⚡ **Vite** - Build tool super rápido
- 🎨 **TailwindCSS** - Estilização
- 🛣️ **React Router** - Navegação
- ✨ **Framer Motion** - Animações suaves

## 📝 Comandos Disponíveis

```bash
npm run dev       # Desenvolvimento (porta 5173)
npm run build     # Build para produção
npm run preview   # Preview do build
npm run lint      # Verificar código
```

## 🎯 Rotas Configuradas

```
/           → Home (landing page)
/login      → Tela de login
/cadastro   → Tela de cadastro
```

## 🔥 Próximos Passos Sugeridos

### Design/Front-end
1. Ajustar textos e copywriting
2. Adicionar mais imagens de exemplo
3. Criar animações extras
4. Menu mobile (hamburger)
5. Smooth scroll para seções

### Funcionalidades
1. Integrar autenticação real (Firebase, Auth0, etc)
2. Criar dashboard do usuário
3. Implementar upload de fotos
4. Integrar API de IA para análise
5. Sistema de pagamentos
6. Geração de PDF dos laudos

## 💡 Dicas Importantes

### 1. Usar o Componente Button

```tsx
import Button from '@/components/ui/Button'

// Variantes
<Button variant="primary">Primário</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="outline">Outline</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="md">Médio</Button>
<Button size="lg">Grande</Button>
```

### 2. Animações com Framer Motion

```tsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Conteúdo animado
</motion.div>
```

### 3. Navegação

```tsx
import { Link } from 'react-router-dom'

<Link to="/login">Ir para Login</Link>
```

## 🐛 Troubleshooting

**Porta já em uso?**
```bash
# Vite vai sugerir outra porta automaticamente
# Ou mate o processo na porta 5173
```

**Erro de build?**
```bash
# Limpe e reinstale
rm -rf node_modules package-lock.json
npm install
```

**Imagens não aparecem?**
```bash
# Verifique se estão em public/images/
ls public/images/
```

## 📚 Documentação Útil

- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [TailwindCSS](https://tailwindcss.com)
- [React Router](https://reactrouter.com)
- [Framer Motion](https://www.framer.com/motion)

## ✨ Tudo Pronto!

Execute `npm run dev` e comece a desenvolver! 🚀

O projeto está completamente funcional e pronto para você personalizar conforme necessário.
