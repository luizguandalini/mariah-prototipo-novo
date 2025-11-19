import DashboardLayout from '../../components/layout/DashboardLayout'

export default function Pagamentos() {
  const pagamentos = [
    { id: '1', data: '01/11/2024', descricao: 'Plano Professional - Renovação', valor: 297, status: 'aprovado' },
    { id: '2', data: '15/10/2024', descricao: 'Créditos Avulsos - 50 unidades', valor: 200, status: 'aprovado' },
    { id: '3', data: '01/10/2024', descricao: 'Plano Professional - Renovação', valor: 297, status: 'aprovado' },
  ]

  const getStatusBadge = (status: string) => {
    const styles = {
      aprovado: 'bg-green-100 text-green-800',
      pendente: 'bg-yellow-100 text-yellow-800',
      recusado: 'bg-red-100 text-red-800'
    }
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Histórico de Pagamentos</h2>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Descrição</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Valor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagamentos.map((pag) => (
                  <tr key={pag.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{pag.data}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{pag.descricao}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">R$ {pag.valor}</td>
                    <td className="px-6 py-4">{getStatusBadge(pag.status)}</td>
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
