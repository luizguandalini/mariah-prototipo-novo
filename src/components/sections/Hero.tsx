import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[var(--bg-primary)] transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-dark/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-24 md:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Texto */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight text-[var(--text-primary)]">
              Laudos Imobiliários com
              <span className="gradient-text"> Inteligência Artificial</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] mb-6 md:mb-8">
              Transforme fotos em laudos profissionais de forma rápida e precisa.
              A Mariah é sua agente de IA especializada no mercado imobiliário.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full">
                  Começar Agora
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 md:gap-6 mt-8 md:mt-12 justify-items-center lg:justify-items-start">
              <div>
                <div className="text-2xl md:text-3xl font-bold gradient-text">24/7</div>
                <div className="text-xs md:text-sm text-[var(--text-secondary)]">Disponível</div>
              </div>
            </div>
          </motion.div>

          {/* Imagem da Mariah + Preview do Laudo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mt-8 lg:mt-0"
          >
            {/* Placeholder para imagem da Mariah */}
            <div className="relative z-10 flex justify-center">
              <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-80 lg:h-80 bg-gradient-to-br from-primary/20 to-primary-dark/20 rounded-full flex items-center justify-center">
                {/* A imagem mariah.png será colocada aqui */}
                <img
                  src="/images/mariah.png"
                  alt="Mariah - Agente IA"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Preview de Laudo - Card flutuante */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="hidden sm:block absolute -bottom-10 -left-10 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl p-4 md:p-6 max-w-[200px] md:max-w-xs"
            >
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500"></div>
                <span className="text-xs md:text-sm font-semibold text-[var(--text-primary)]">Laudo Gerado</span>
              </div>
              <div className="space-y-2">
                <div className="h-1.5 md:h-2 bg-[var(--bg-primary)] rounded w-full"></div>
                <div className="h-1.5 md:h-2 bg-[var(--bg-primary)] rounded w-4/5"></div>
                <div className="h-1.5 md:h-2 bg-[var(--bg-primary)] rounded w-3/5"></div>
              </div>
              <div className="mt-3 md:mt-4 flex items-center gap-2">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-primary to-primary-dark rounded-full"></div>
                <div className="text-[10px] md:text-xs text-[var(--text-secondary)]">Pronto para uso</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
