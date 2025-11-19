# Guia de Desenvolvimento - Mariah

## ✅ Status do Projeto

O projeto está configurado e pronto para desenvolvimento! Todos os componentes principais foram criados.

## 🎯 O que foi feito

### 1. Configuração do Projeto
- ✅ React 18 + TypeScript + Vite
- ✅ TailwindCSS configurado com cores da marca
- ✅ React Router para navegação
- ✅ Framer Motion para animações
- ✅ Build funcionando sem erros

### 2. Estrutura Criada

#### Componentes de Layout
- **Header**: [src/components/layout/Header.tsx](src/components/layout/Header.tsx)
  - Navegação fixa
  - Links para seções
  - Botões de Login/Cadastro

- **Footer**: [src/components/layout/Footer.tsx](src/components/layout/Footer.tsx)
  - Informações da empresa
  - Links úteis
  - Copyright

#### Componentes UI
- **Button**: [src/components/ui/Button.tsx](src/components/ui/Button.tsx)
  - 3 variantes: primary, secondary, outline
  - 3 tamanhos: sm, md, lg
  - Animações com Framer Motion

#### Seções da Home
- **Hero**: [src/components/sections/Hero.tsx](src/components/sections/Hero.tsx)
  - Apresentação principal
  - CTA para começar
  - Placeholder para imagem da Mariah
  - Estatísticas

- **HowItWorks**: [src/components/sections/HowItWorks.tsx](src/components/sections/HowItWorks.tsx)
  - 4 etapas do processo
  - Ícones e descrições

- **Features**: [src/components/sections/Features.tsx](src/components/sections/Features.tsx)
  - 6 vantagens principais
  - Cards animados

- **Pricing**: [src/components/sections/Pricing.tsx](src/components/sections/Pricing.tsx)
  - 3 planos (Starter, Professional, Enterprise)
  - Seção de créditos avulsos
  - Destaque no plano mais popular

- **CTA**: [src/components/sections/CTA.tsx](src/components/sections/CTA.tsx)
  - Call to action final
  - Benefícios resumidos

#### Páginas
- **Home**: [src/pages/Home.tsx](src/pages/Home.tsx)
- **Login**: [src/pages/Login.tsx](src/pages/Login.tsx)
  - Login com email/senha
  - Login social (Google, Apple)

- **Register**: [src/pages/Register.tsx](src/pages/Register.tsx)
  - Cadastro com email/senha
  - Cadastro social (Google, Apple)

## 📸 Importante: Uso da Imagem da Mariah

A imagem `mariah.png` precisa estar acessível. Atualmente ela está referenciada em:

**[src/components/sections/Hero.tsx:63](src/components/sections/Hero.tsx#L63)**

```tsx
<img
  src="/src/assets/images/mariah.png"
  alt="Mariah - Agente IA"
  className="w-full h-full object-contain"
/>
```

### Como Ajustar:

**Opção 1: Mover para pasta public (Recomendado)**
1. Crie uma pasta `public` na raiz
2. Mova `mariah.png` para `public/images/mariah.png`
3. Atualize o src para: `src="/images/mariah.png"`

**Opção 2: Importar como módulo**
```tsx
import mariahImg from '@/assets/images/mariah.png'
// ...
<img src={mariahImg} alt="Mariah - Agente IA" />
```

## 🎨 Cores Configuradas

```css
primary: #A156E1
primary-dark: #5C2896
```

Uso no TailwindCSS:
```jsx
className="bg-primary"           // Fundo roxo
className="text-primary"         // Texto roxo
className="border-primary-dark"  // Borda roxo escuro
className="gradient-text"        // Texto com gradiente
```

## 🚀 Como Executar

### Desenvolvimento
```bash
npm run dev
```
Acesse: http://localhost:5173

### Build
```bash
npm run build
```

### Preview do Build
```bash
npm run preview
```

## 📝 Próximas Tarefas Sugeridas

### Front-end
1. **Assets**
   - [ ] Mover imagens para pasta public
   - [ ] Adicionar favicon
   - [ ] Criar imagem de exemplo de laudo gerado

2. **Componentes Adicionais**
   - [ ] Modal para preview de laudos
   - [ ] Loading states
   - [ ] Toast notifications
   - [ ] Menu mobile (hamburger)

3. **Páginas**
   - [ ] Dashboard do usuário
   - [ ] Tela de upload de fotos
   - [ ] Histórico de laudos
   - [ ] Configurações de conta
   - [ ] Página de recuperação de senha

4. **Melhorias UX**
   - [ ] Smooth scroll para âncoras
   - [ ] Lazy loading de imagens
   - [ ] Skeleton loaders
   - [ ] Animações de entrada de seções

### Backend (Futuro)
- [ ] Integração com API de autenticação
- [ ] Upload de imagens para S3/Storage
- [ ] Integração com IA para análise de fotos
- [ ] Sistema de pagamentos (Stripe/Mercado Pago)
- [ ] Gerenciamento de créditos
- [ ] Geração de PDFs dos laudos

## 🔧 Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview do build
npm run lint     # Lint do código
```

## 📦 Dependências Instaladas

**Produção:**
- react 18.3.1
- react-dom 18.3.1
- react-router-dom 6.26.1
- framer-motion 11.5.4

**Desenvolvimento:**
- vite 5.4.1
- typescript 5.5.3
- tailwindcss 3.4.10
- @vitejs/plugin-react 4.3.1

## 🎯 Estrutura de Rotas Atual

```
/           → Home (página institucional)
/login      → Login
/cadastro   → Cadastro
```

## 💡 Dicas de Desenvolvimento

1. **Usar o componente Button:**
```tsx
import Button from '@/components/ui/Button'

<Button variant="primary" size="lg">Clique aqui</Button>
```

2. **Adicionar novas cores ao Tailwind:**
Edite [tailwind.config.js](tailwind.config.js)

3. **Criar nova rota:**
Adicione em [src/App.tsx](src/App.tsx)

4. **Animações com Framer Motion:**
```tsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  Conteúdo
</motion.div>
```

## ✨ Pronto para Desenvolvimento!

O projeto está 100% funcional e pronto para você começar a desenvolver novos recursos!
