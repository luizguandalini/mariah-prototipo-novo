import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function AdminDashboard() {
  const stats = [
    { label: 'Usuários Ativos', value: '1,234', icon: '👥', change: '+12%' },
    { label: 'Laudos Processados Hoje', value: '87', icon: '📄', change: '+5%' },
    { label: 'Receita do Mês', value: 'R$ 45.2K', icon: '💰', change: '+18%' },
    { label: 'Taxa de Conversão', value: '3.2%', icon: '📈', change: '+0.3%' },
  ]

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Admin</h2>
          <p className="text-gray-600">Visão geral do sistema Mariah</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{stat.icon}</span>
                <span className="text-sm font-semibold text-green-600">{stat.change}</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Laudos Recentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Laudos em Processamento</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">Laudo #{1000 + i}</p>
                  <p className="text-sm text-gray-600">Usuário: João Silva</p>
                </div>
                <span className="text-sm text-yellow-600 font-medium">Processando...</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
