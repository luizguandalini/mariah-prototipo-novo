import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'

export default function Dashboard() {
  const stats = [
    { label: 'Laudos Criados', value: '12', icon: '📄', color: 'from-blue-500 to-blue-600' },
    { label: 'Em Processamento', value: '2', icon: '⏳', color: 'from-yellow-500 to-yellow-600' },
    { label: 'Concluídos', value: '10', icon: '✅', color: 'from-green-500 to-green-600' },
    { label: 'Créditos Restantes', value: '150', icon: '💳', color: 'from-purple-500 to-purple-600' },
  ]

  const recentLaudos = [
    {
      id: '1',
      endereco: 'Av. José Galante, 671 - Apto 161',
      status: 'concluido',
      data: '14/11/2024',
      tipo: 'Apartamento'
    },
    {
      id: '2',
      endereco: 'Rua das Flores, 123 - Casa 5',
      status: 'processando',
      data: '18/11/2024',
      tipo: 'Casa'
    },
  ]

  const getStatusBadge = (status: string) => {
    const styles = {
      concluido: 'bg-green-100 text-green-800',
      processando: 'bg-yellow-100 text-yellow-800',
      nao_iniciado: 'bg-gray-100 text-gray-800',
      paralisado: 'bg-red-100 text-red-800'
    }
    const labels = {
      concluido: 'Concluído',
      processando: 'Processando',
      nao_iniciado: 'Não Iniciado',
      paralisado: 'Paralisado'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
            Bem-vindo de volta! 👋
          </h2>
          <p className="text-sm md:text-base text-gray-600">
            Aqui está um resumo da sua atividade recente.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl md:text-2xl`}>
                  {stat.icon}
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-xs md:text-sm text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-primary to-primary-dark rounded-xl shadow-lg p-5 md:p-8 text-white"
        >
          <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Criar Novo Laudo</h3>
          <p className="mb-4 md:mb-6 text-sm md:text-base text-purple-100">
            Comece um novo laudo imobiliário agora mesmo. O processo é rápido e simples!
          </p>
          <Link to="/dashboard/novo-laudo">
            <Button variant="secondary" size="lg">
              ➕ Novo Laudo
            </Button>
          </Link>
        </motion.div>

        {/* Recent Laudos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Laudos Recentes</h3>
              <Link to="/dashboard/laudos" className="text-sm text-primary hover:text-primary-dark font-semibold">
                Ver todos →
              </Link>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {recentLaudos.map((laudo) => (
              <div key={laudo.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{laudo.endereco}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>📍 {laudo.tipo}</span>
                      <span>📅 {laudo.data}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(laudo.status)}
                    <Link to={`/dashboard/laudos/${laudo.id}`}>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
