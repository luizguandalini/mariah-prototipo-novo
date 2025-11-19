import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Step1Informacoes from '../../components/laudo/Step1Informacoes'
import Step2Ambientes from '../../components/laudo/Step2Ambientes'
import Step3Upload from '../../components/laudo/Step3Upload'
import Step4Revisao from '../../components/laudo/Step4Revisao'

export default function NovoLaudo() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [laudoData, setLaudoData] = useState({
    vistoriaInfo: {},
    ambientes: [],
    checklist: []
  })

  const steps = [
    { number: 1, title: 'Informações', icon: '📝' },
    { number: 2, title: 'Ambientes', icon: '🏠' },
    { number: 3, title: 'Upload de Imagens', icon: '📸' },
    { number: 4, title: 'Revisão', icon: '✅' },
  ]

  const handleNext = (data: any) => {
    setLaudoData({ ...laudoData, ...data })
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else {
      // Finalizar e processar
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    // Aqui seria a chamada para a API
    console.log('Laudo finalizado:', laudoData)
    navigate('/dashboard/laudos')
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-6"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-xl font-bold transition-all ${
                      currentStep >= step.number
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.number ? '✓' : step.icon}
                  </div>
                  <span
                    className={`mt-1 md:mt-2 text-[10px] md:text-sm font-medium text-center ${
                      currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    <span className="hidden sm:inline">{step.title}</span>
                    <span className="sm:hidden">{step.number}</span>
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 md:h-1 flex-1 mx-1 md:mx-4 rounded transition-all ${
                      currentStep > step.number ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && <Step1Informacoes onNext={handleNext} initialData={laudoData.vistoriaInfo} />}
            {currentStep === 2 && <Step2Ambientes onNext={handleNext} onBack={handleBack} initialData={laudoData.ambientes} />}
            {currentStep === 3 && <Step3Upload onNext={handleNext} onBack={handleBack} ambientes={laudoData.ambientes} />}
            {currentStep === 4 && <Step4Revisao onSubmit={handleNext} onBack={handleBack} laudoData={laudoData} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
