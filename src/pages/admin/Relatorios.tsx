import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'

export default function Relatorios() {
  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Relatórios e Analytics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Laudos por Período</h3>
            <div className="space-y-3 mb-4">
              <input type="date" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg" />
              <input type="date" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg" />
            </div>
            <Button variant="primary" className="w-full">Gerar Relatório</Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Receita por Período</h3>
            <div className="space-y-3 mb-4">
              <input type="date" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg" />
              <input type="date" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg" />
            </div>
            <Button variant="primary" className="w-full">Gerar Relatório</Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Usuários Ativos</h3>
            <Button variant="primary" className="w-full">Exportar Lista</Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Créditos Consumidos</h3>
            <Button variant="primary" className="w-full">Gerar Relatório</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
