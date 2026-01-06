import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import { planosService } from '../../services/planos'
import type { Plano } from '../../types/planos'
import { useAuth } from '../../contexts/AuthContext'

export default function Pricing() {
  const [plans, setPlans] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await planosService.getPlanos()
        // Sort plans by price (lowest to highest)
        const sortedPlans = data.sort((a, b) => (a.preco || 0) - (b.preco || 0))
        setPlans(sortedPlans)
      } catch (error) {
        console.error('Erro ao buscar planos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  const handleComprarPlano = () => {
    if (!isAuthenticated) {
      // Se não estiver autenticado, redirecionar para login
      navigate('/login')
    } else {
      // Se estiver autenticado, ir para página de créditos
      navigate('/dashboard/creditos')
    }
  }

  if (loading) {
    return (
      <section id="planos" className="py-12 md:py-20 bg-[var(--bg-secondary)]">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[var(--text-secondary)]">Carregando planos...</p>
        </div>
      </section>
    )
  }

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
            Escolha o pacote ideal de créditos para seus laudos. Sem mensalidade, apenas pague pelo que usar.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto mb-10 md:mb-12 items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl p-6 md:p-8 transition-all duration-300 bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col h-full hover:shadow-lg hover:border-primary/50`}
            >
              <div className="mb-4 md:mb-6">
                <h3 className="text-xl md:text-2xl font-bold mb-2 text-[var(--text-primary)]">
                  {plan.nome}
                </h3>
                {plan.subtitulo && (
                  <p className="text-xs md:text-sm text-[var(--text-secondary)]">
                    {plan.subtitulo}
                  </p>
                )}
              </div>

              <div className="mb-4 md:mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl md:text-5xl font-bold text-[var(--text-primary)]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.preco || 0)}
                  </span>
                </div>
                <div className="text-sm text-[var(--text-secondary)] mt-1">
                  pagamento único
                </div>
              </div>

              <div className="flex-grow">
                <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                  <li className="flex items-start gap-2 md:gap-3">
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5 mt-0.5 flex-shrink-0 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm md:text-base text-[var(--text-secondary)]">
                      <strong>{plan.quantidadeImagens}</strong> créditos de imagens
                    </span>
                  </li>
                  {plan.beneficios && plan.beneficios.map((beneficio) => (
                     <li key={beneficio.id} className="flex items-start gap-2 md:gap-3">
                     <svg
                       className="w-4 h-4 md:w-5 md:h-5 mt-0.5 flex-shrink-0 text-primary"
                       fill="currentColor"
                       viewBox="0 0 20 20"
                     >
                       <path
                         fillRule="evenodd"
                         d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                         clipRule="evenodd"
                       />
                     </svg>
                     <span className="text-sm md:text-base text-[var(--text-secondary)]">
                       {beneficio.descricao}
                     </span>
                   </li>
                  ))}
                </ul>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full mt-auto"
                onClick={handleComprarPlano}
              >
                Comprar Agora
              </Button>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center mt-8">
           <p className="text-sm text-[var(--text-secondary)]">
             Créditos não expiram e podem ser usados a qualquer momento.
           </p>
        </div>

      </div>
    </section>
  )
}
