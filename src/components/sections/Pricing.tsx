import { motion } from 'framer-motion'
import Button from '../ui/Button'

const plans = [
  {
    name: 'Starter',
    price: 'R$ 97',
    period: '/mês',
    description: 'Ideal para corretores autônomos começando',
    features: [
      '50 laudos por mês',
      'Análise de até 20 fotos por laudo',
      'Exportação em PDF',
      'Suporte por email',
      'Histórico de 30 dias',
      'Marca d\'água Mariah'
    ],
    highlighted: false
  },
  {
    name: 'Professional',
    price: 'R$ 297',
    period: '/mês',
    description: 'Para profissionais que precisam de volume',
    features: [
      '200 laudos por mês',
      'Análise de até 50 fotos por laudo',
      'Exportação em PDF sem marca d\'água',
      'Suporte prioritário',
      'Histórico ilimitado',
      'API para integração',
      'Relatórios personalizados',
      'Análise de vídeos (em breve)'
    ],
    highlighted: true
  },
  {
    name: 'Enterprise',
    price: 'R$ 797',
    period: '/mês',
    description: 'Solução completa para imobiliárias',
    features: [
      'Laudos ilimitados',
      'Análise ilimitada de fotos',
      'White label completo',
      'Suporte dedicado 24/7',
      'Gerenciamento de equipes',
      'API ilimitada',
      'Relatórios customizados',
      'Análise de vídeos',
      'Treinamento personalizado',
      'SLA garantido'
    ],
    highlighted: false
  }
]

export default function Pricing() {
  return (
    <section id="planos" className="py-12 md:py-20 bg-[var(--bg-secondary)] transition-colors duration-300">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 text-[var(--text-primary)]">
            Planos e <span className="gradient-text">Preços</span>
          </h2>
          <p className="text-base md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto px-4">
            Escolha o plano ideal para seu negócio. Todos com 7 dias de garantia.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto mb-10 md:mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl p-6 md:p-8 transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl md:scale-105 border-none'
                  : 'bg-[var(--bg-primary)] border border-[var(--border-color)]'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold shadow-md">
                  Mais Popular
                </div>
              )}

              <div className="mb-4 md:mb-6">
                <h3 className={`text-xl md:text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                  {plan.name}
                </h3>
                <p className={`text-xs md:text-sm ${plan.highlighted ? 'text-purple-100' : 'text-[var(--text-secondary)]'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-4 md:mb-6">
                <div className="flex items-baseline">
                  <span className={`text-4xl md:text-5xl font-bold ${plan.highlighted ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                    {plan.price}
                  </span>
                  <span className={`ml-2 text-sm md:text-base ${plan.highlighted ? 'text-purple-100' : 'text-[var(--text-secondary)]'}`}>
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 md:gap-3">
                    <svg
                      className={`w-4 h-4 md:w-5 md:h-5 mt-0.5 flex-shrink-0 ${
                        plan.highlighted ? 'text-purple-200' : 'text-primary'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className={`text-sm md:text-base ${plan.highlighted ? 'text-purple-50' : 'text-[var(--text-secondary)]'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? 'outline' : 'primary'}
                size="lg"
                className={`w-full ${plan.highlighted ? 'bg-white text-primary border-white hover:bg-white/90' : ''}`}
              >
                Começar Agora
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Seção de Créditos Avulsos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-[var(--bg-primary)] rounded-2xl p-6 md:p-8 border border-[var(--border-color)] transition-colors duration-300">
            <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-[var(--text-primary)]">
              Precisa de créditos avulsos?
            </h3>
            <p className="text-sm md:text-base text-[var(--text-secondary)] mb-4 md:mb-6">
              Compre créditos sob demanda sem compromisso mensal. Ideal para uso esporádico.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {[
                { label: 'ECONOMIA DE 0%', price: 'R$ 5', qty: '10' },
                { label: 'ECONOMIA DE 20%', price: 'R$ 4', qty: '50', best: true },
                { label: 'ECONOMIA DE 40%', price: 'R$ 3', qty: '100' }
              ].map((item, idx) => (
                <div key={idx} className={`bg-[var(--bg-secondary)] rounded-xl p-4 md:p-6 border ${item.best ? 'border-primary' : 'border-[var(--border-color)]'}`}>
                  <div className={`text-[10px] md:text-xs font-bold text-primary mb-1 md:mb-2 ${item.label === 'ECONOMIA DE 0%' ? 'invisible' : ''}`}>{item.label}</div>
                  <div className="text-2xl md:text-3xl font-bold text-primary mb-1 md:mb-2">{item.price}</div>
                  <div className="text-[var(--text-secondary)] text-xs md:text-sm mb-3 md:mb-4">por laudo</div>
                  <Button variant={item.best ? "primary" : "outline"} size="sm" className="w-full text-xs md:text-sm">
                    Comprar {item.qty} Créditos
                  </Button>
                </div>
              ))}
            </div>

            <p className="text-xs text-[var(--text-secondary)] mt-4 text-center">
              Créditos não expiram e podem ser usados a qualquer momento.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
