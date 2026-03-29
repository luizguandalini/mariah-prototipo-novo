import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Step1Informacoes from '../../components/laudo/Step1Informacoes'
import Step2Ambientes from '../../components/laudo/Step2Ambientes'
import Step3Upload from '../../components/laudo/Step3Upload'
import Step4Revisao from '../../components/laudo/Step4Revisao'
import { laudosService } from '../../services/laudos'
import { toast } from 'sonner'

interface LaudoData {
  vistoriaInfo: any
  ambientes: any[]
  laudoId?: string
  uploadedImages?: any
}

export default function NovoLaudo() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [laudoData, setLaudoData] = useState<LaudoData>({
    vistoriaInfo: {},
    ambientes: [],
  })
  const [criandoLaudo, setCriandoLaudo] = useState(false)

  const steps = [
    { number: 1, title: 'Informações', icon: '📝' },
    { number: 2, title: 'Ambientes', icon: '🏠' },
    { number: 3, title: 'Upload de Imagens', icon: '📸' },
    { number: 4, title: 'Revisão', icon: '✅' },
  ]

  const handleStep1Next = (data: any) => {
    setLaudoData(prev => ({ ...prev, ...data }))
    setCurrentStep(2)
  }

  const handleStep2Next = async (data: any) => {
    const updatedData = { ...laudoData, ...data }
    setLaudoData(updatedData)

    // Criar o laudo no backend ao avançar para step 3
    if (!updatedData.laudoId) {
      try {
        setCriandoLaudo(true)
        const info = updatedData.vistoriaInfo
        const laudo = await laudosService.createLaudo({
          rua: info.rua,
          numero: info.numero,
          complemento: info.complemento || undefined,
          bairro: info.bairro,
          cidade: info.cidade,
          estado: info.estado,
          cep: info.cep,
          endereco: info.endereco,
          unidade: info.unidade || undefined,
          tipoVistoria: info.tipoVistoria,
          tipoUso: info.tipoUso,
          tipoImovel: info.tipoImovel,
          tamanho: info.tamanho || undefined,
        })

        setLaudoData(prev => ({ ...prev, ...data, laudoId: laudo.id }))
        toast.success('Laudo criado com sucesso!')
        setCurrentStep(3)
      } catch (err: any) {
        toast.error(err.message || 'Erro ao criar laudo')
        console.error('Erro ao criar laudo:', err)
      } finally {
        setCriandoLaudo(false)
      }
    } else {
      setCurrentStep(3)
    }
  }

  const handleStep3Next = (data: any) => {
    setLaudoData(prev => ({ ...prev, ...data }))
    setCurrentStep(4)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinalSubmit = () => {
    toast.success('Laudo finalizado! Redirecionando...')
    navigate('/dashboard/laudos')
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-3 md:p-6 transition-all"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-xl font-bold transition-all ${
                      currentStep >= step.number
                        ? 'bg-primary text-white'
                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                    }`}
                  >
                    {currentStep > step.number ? '✓' : step.icon}
                  </div>
                  <span
                    className={`mt-1 md:mt-2 text-[10px] md:text-sm font-medium text-center transition-colors ${
                      currentStep >= step.number ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] opacity-60'
                    }`}
                  >
                    <span className="hidden sm:inline">{step.title}</span>
                    <span className="sm:hidden">{step.number}</span>
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 md:h-1 flex-1 mx-1 md:mx-4 rounded transition-all ${
                      currentStep > step.number ? 'bg-primary' : 'bg-[var(--border-color)]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Loader quando criando laudo */}
        {criandoLaudo && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-[var(--text-secondary)]">Criando laudo no servidor...</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        {!criandoLaudo && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && (
                <Step1Informacoes
                  onNext={handleStep1Next}
                  initialData={laudoData.vistoriaInfo}
                />
              )}
              {currentStep === 2 && (
                <Step2Ambientes
                  onNext={handleStep2Next}
                  onBack={handleBack}
                  initialData={laudoData.ambientes}
                  vistoriaInfo={laudoData.vistoriaInfo}
                />
              )}
              {currentStep === 3 && (
                <Step3Upload
                  onNext={handleStep3Next}
                  onBack={handleBack}
                  ambientes={laudoData.ambientes}
                  laudoId={laudoData.laudoId!}
                />
              )}
              {currentStep === 4 && (
                <Step4Revisao
                  onSubmit={handleFinalSubmit}
                  onBack={handleBack}
                  laudoData={laudoData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </DashboardLayout>
  )
}
