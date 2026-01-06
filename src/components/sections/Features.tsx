import { motion } from 'framer-motion'

const features = [
  {
    title: 'Análise Inteligente',
    description: 'IA especializada identifica acabamentos, estado de conservação e características únicas de cada imóvel.',
    icon: '🧠'
  },
  {
    title: 'Rapidez Incomparável',
    description: 'Elabore laudos com muito mais agilidade. Aumente sua produtividade e foque no atendimento.',
    icon: '⚡'
  },
  {
    title: 'Precisão Profissional',
    description: 'Relatórios detalhados com padrões do mercado imobiliário, prontos para apresentação.',
    icon: '🎯'
  },
  {
    title: 'Múltiplos Formatos',
    description: 'Gere arquivos PDF detalhados, baixe e compartilhe diretamente com seus clientes.',
    icon: '📱'
  },
  {
    title: 'Disponível 24/7',
    description: 'A Mariah trabalha quando você precisa, sem horário comercial ou limites.',
    icon: '🌙'
  },
  {
    title: 'Evolução Constante',
    description: 'Modelo de IA atualizado regularmente com novas funcionalidades e melhorias.',
    icon: '🚀'
  }
]

export default function Features() {
  return (
    <section id="sobre" className="py-12 md:py-20 bg-[var(--bg-primary)] transition-colors duration-300">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 text-[var(--text-primary)]">
            Por que escolher a <span className="gradient-text">Mariah</span>?
          </h2>
          <p className="text-base md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto px-4">
            Tecnologia de ponta aliada à experiência do mercado imobiliário.
            Conheça os diferenciais que fazem a diferença.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-[var(--bg-secondary)] rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl border border-[var(--border-color)] transition-all"
            >
              <div className="text-4xl md:text-5xl mb-3 md:mb-4">{feature.icon}</div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-[var(--text-primary)]">{feature.title}</h3>
              <p className="text-sm md:text-base text-[var(--text-secondary)]">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
