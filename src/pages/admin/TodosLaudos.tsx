import DashboardLayout from '../../components/layout/DashboardLayout'

export default function TodosLaudos() {
  const laudos = [
    { id: '1', usuario: 'João Silva', endereco: 'Av. José Galante, 671', status: 'concluido', data: '14/11/2024' },
    { id: '2', usuario: 'Maria Santos', endereco: 'Rua das Flores, 123', status: 'processando', data: '18/11/2024' },
    { id: '3', usuario: 'Pedro Costa', endereco: 'Av. Paulista, 1000', status: 'nao_iniciado', data: '18/11/2024' },
  ]

  const getStatusBadge = (status: string) => {
    const config = {
      concluido: { bg: 'bg-green-100', text: 'text-green-800', label: 'Concluído' },
      processando: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Processando' },
      nao_iniciado: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Não Iniciado' },
    }
    const { bg, text, label } = config[status as keyof typeof config]
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>{label}</span>
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Todos os Laudos</h2>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Usuário</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Endereço</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {laudos.map((laudo) => (
                  <tr key={laudo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{laudo.usuario}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{laudo.endereco}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{laudo.data}</td>
                    <td className="px-6 py-4">{getStatusBadge(laudo.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
