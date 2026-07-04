import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Faça Upload das Fotos',
    description: 'Utilize nosso aplicativo exclusivo para capturar e enviar as fotos do imóvel de forma prática.',
    icon: '📸'
  },
  {
    number: '02',
    title: 'IA Analisa o Imóvel',
    description: 'A Mariah analisa cada detalhe: acabamentos, conservação e características visuais do imóvel.',
    icon: '🤖'
  },
  {
    number: '03',
    title: 'Laudo Profissional Gerado',
    description: 'Receba um laudo completo e profissional, revisado e pronto para apresentação.',
    icon: '📄'
  },
  {
    number: '04',
    title: 'Baixe e Compartilhe',
    description: 'Gere arquivos PDF completos e compartilhe facilmente com seus clientes.',
    icon: '✅'
  }
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-12 md:py-20 bg-[var(--bg-secondary)] transition-colors duration-300">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 text-[var(--text-primary)]">
            Como <span className="gradient-text">Funciona</span>
          </h2>
          <p className="text-base md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto px-4">
            Gerar laudos imobiliários nunca foi tão simples. Veja como a Mariah
            transforma suas fotos em relatórios profissionais.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Linha conectora (exceto no último) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary to-primary-dark opacity-20"></div>
              )}

              <div className="relative bg-[var(--bg-primary)] rounded-2xl p-5 md:p-6 h-full border border-[var(--border-color)] hover:shadow-lg transition-all duration-300">
                <div className="text-4xl md:text-5xl mb-3 md:mb-4">{step.icon}</div>
                <div className="text-3xl md:text-5xl font-bold text-primary/10 mb-2">{step.number}</div>
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-[var(--text-primary)]">{step.title}</h3>
                <p className="text-sm md:text-base text-[var(--text-secondary)]">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
