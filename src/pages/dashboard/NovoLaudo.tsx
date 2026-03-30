import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Step1Informacoes from '../../components/laudo/Step1Informacoes'
import { laudosService } from '../../services/laudos'
import { toast } from 'sonner'

export default function NovoLaudo() {
  const navigate = useNavigate()
  const [criandoLaudo, setCriandoLaudo] = useState(false)

  const handleSubmit = async (data: any) => {
    const info = data.vistoriaInfo || data

    try {
      setCriandoLaudo(true)
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
        incluirAtestado: 1,
      })

      toast.success('Laudo criado com sucesso! Redirecionando para a galeria...')
      
      // Redirecionar para a galeria do novo laudo
      navigate(`/dashboard/laudos/${laudo.id}/galeria`)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar laudo')
      console.error('Erro ao criar laudo:', err)
    } finally {
      setCriandoLaudo(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-3 md:p-6 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl md:text-2xl bg-primary text-white">
              📝
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-[var(--text-primary)]">
                Novo Laudo
              </h2>
              <p className="text-xs md:text-sm text-[var(--text-secondary)]">
                Preencha as informações do imóvel. Após criar, você será direcionado para a galeria para adicionar ambientes e fotos.
              </p>
            </div>
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

        {/* Formulário de informações */}
        {!criandoLaudo && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Step1Informacoes
              onNext={handleSubmit}
              initialData={{}}
            />
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}
