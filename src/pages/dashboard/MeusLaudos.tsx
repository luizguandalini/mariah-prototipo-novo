import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'

interface Laudo {
  id: string
  endereco: string
  tipo: string
  unidade?: string
  status: 'nao_iniciado' | 'processando' | 'concluido' | 'paralisado'
  data: string
  tamanho: string
  estimativa?: string
}

export default function MeusLaudos() {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  const laudos: Laudo[] = [
    {
      id: '1',
      endereco: 'Av. José Galante, 671 - Apto 161 - Vila Andrade, São Paulo - SP',
      tipo: 'Apartamento',
      unidade: '671',
      status: 'concluido',
      data: '14/11/2024',
      tamanho: '200 m²'
    },
    {
      id: '2',
      endereco: 'Rua das Flores, 123 - Casa 5 - Jardim Paulista, São Paulo - SP',
      tipo: 'Casa',
      status: 'processando',
      data: '18/11/2024',
      tamanho: '350 m²',
      estimativa: '~15 minutos'
    },
    {
      id: '3',
      endereco: 'Av. Paulista, 1000 - Sala 501 - Bela Vista, São Paulo - SP',
      tipo: 'Comercial',
      unidade: '501',
      status: 'nao_iniciado',
      data: '18/11/2024',
      tamanho: '80 m²'
    },
    {
      id: '4',
      endereco: 'Rua Augusta, 500 - Apto 22 - Consolação, São Paulo - SP',
      tipo: 'Apartamento',
      unidade: '22',
      status: 'paralisado',
      data: '15/11/2024',
      tamanho: '120 m²'
    },
  ]

  const getStatusBadge = (status: string) => {
    const config = {
      concluido: { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Concluído', icon: '✅' },
      processando: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⏳ Processando', icon: '⏳' },
      nao_iniciado: { bg: 'bg-gray-100', text: 'text-gray-800', label: '📝 Não Iniciado', icon: '📝' },
      paralisado: { bg: 'bg-red-100', text: 'text-red-800', label: '⏸️ Paralisado', icon: '⏸️' }
    }
    const { bg, text, label } = config[status as keyof typeof config]
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
        {label}
      </span>
    )
  }

  const laudosFiltrados = filtroStatus === 'todos'
    ? laudos
    : laudos.filter(l => l.status === filtroStatus)

  const statusCounts = {
    todos: laudos.length,
    concluido: laudos.filter(l => l.status === 'concluido').length,
    processando: laudos.filter(l => l.status === 'processando').length,
    nao_iniciado: laudos.filter(l => l.status === 'nao_iniciado').length,
    paralisado: laudos.filter(l => l.status === 'paralisado').length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Meus Laudos</h2>
            <p className="text-gray-600">Gerencie todos os seus laudos imobiliários</p>
          </div>
          <Link to="/dashboard/novo-laudo">
            <Button variant="primary" size="lg">
              ➕ Novo Laudo
            </Button>
          </Link>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
        >
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'todos', label: `Todos (${statusCounts.todos})` },
              { key: 'concluido', label: `Concluídos (${statusCounts.concluido})` },
              { key: 'processando', label: `Processando (${statusCounts.processando})` },
              { key: 'nao_iniciado', label: `Não Iniciados (${statusCounts.nao_iniciado})` },
              { key: 'paralisado', label: `Paralisados (${statusCounts.paralisado})` },
            ].map((filtro) => (
              <button
                key={filtro.key}
                onClick={() => setFiltroStatus(filtro.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroStatus === filtro.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filtro.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Lista de Laudos */}
        <div className="grid grid-cols-1 gap-4">
          {laudosFiltrados.map((laudo, index) => (
            <motion.div
              key={laudo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getStatusBadge(laudo.status)}
                    {laudo.status === 'processando' && laudo.estimativa && (
                      <span className="text-xs text-gray-500">
                        Estimativa: {laudo.estimativa}
                      </span>
                    )}
                    {laudo.status === 'paralisado' && (
                      <span className="text-xs text-red-600 font-medium">
                        Sem créditos disponíveis
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {laudo.endereco}
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-400">Tipo:</span>{' '}
                      <span className="font-medium text-gray-900">{laudo.tipo}</span>
                    </div>
                    {laudo.unidade && (
                      <div>
                        <span className="text-gray-400">Unidade:</span>{' '}
                        <span className="font-medium text-gray-900">{laudo.unidade}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">Tamanho:</span>{' '}
                      <span className="font-medium text-gray-900">{laudo.tamanho}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Data:</span>{' '}
                      <span className="font-medium text-gray-900">{laudo.data}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {laudo.status === 'nao_iniciado' && (
                    <Link to={`/dashboard/novo-laudo?continue=${laudo.id}`}>
                      <Button variant="primary" size="sm" className="whitespace-nowrap">
                        Continuar Edição
                      </Button>
                    </Link>
                  )}
                  {laudo.status === 'processando' && (
                    <Button variant="outline" size="sm" disabled className="whitespace-nowrap">
                      Processando...
                    </Button>
                  )}
                  {laudo.status === 'concluido' && (
                    <>
                      <Link to={`/dashboard/laudos/${laudo.id}/preview`}>
                        <Button variant="primary" size="sm" className="whitespace-nowrap">
                          Ver Laudo
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="whitespace-nowrap">
                        ⬇ Baixar PDF
                      </Button>
                    </>
                  )}
                  {laudo.status === 'paralisado' && (
                    <Link to="/dashboard/creditos">
                      <Button variant="primary" size="sm" className="whitespace-nowrap">
                        Adicionar Créditos
                      </Button>
                    </Link>
                  )}
                  <Button variant="outline" size="sm" className="whitespace-nowrap text-gray-600">
                    🗑️ Excluir
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {laudosFiltrados.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 text-lg mb-4">Nenhum laudo encontrado com este filtro</p>
            <Link to="/dashboard/novo-laudo">
              <Button variant="primary">Criar Primeiro Laudo</Button>
            </Link>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}
