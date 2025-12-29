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
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-primary)] transition-colors">Dashboard Admin</h2>
          <p className="text-[var(--text-secondary)] transition-colors">Visão geral do sistema Mariah</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[var(--bg-secondary)] rounded-xl shadow-sm p-6 border border-[var(--border-color)] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{stat.icon}</span>
                <span className="text-sm font-semibold text-green-500">{stat.change}</span>
              </div>
              <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-1 transition-colors">{stat.value}</h3>
              <p className="text-sm text-[var(--text-secondary)] transition-colors">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Laudos Recentes */}
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-colors duration-300">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Laudos em Processamento</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] transition-colors hover:shadow-md">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Laudo #{1000 + i}</p>
                  <p className="text-sm text-[var(--text-secondary)]">Usuário: João Silva</p>
                </div>
                <span className="text-sm text-yellow-500 font-medium animate-pulse">Processando...</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
