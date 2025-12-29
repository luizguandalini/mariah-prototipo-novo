import DashboardLayout from '../../components/layout/DashboardLayout'

export default function Pagamentos() {
  const pagamentos = [
    { id: '1', data: '01/11/2024', descricao: 'Plano Professional - Renovação', valor: 297, status: 'aprovado' },
    { id: '2', data: '15/10/2024', descricao: 'Créditos Avulsos - 50 unidades', valor: 200, status: 'aprovado' },
    { id: '3', data: '01/10/2024', descricao: 'Plano Professional - Renovação', valor: 297, status: 'aprovado' },
  ]

  const getStatusBadge = (status: string) => {
    const styles = {
      aprovado: 'bg-green-500/10 text-green-500 border border-green-500/20',
      pendente: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
      recusado: 'bg-red-500/10 text-red-500 border border-red-500/20'
    }
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]} transition-colors`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] transition-colors">Histórico de Pagamentos</h2>

        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] transition-all">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--text-primary)]">Data</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--text-primary)]">Descrição</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--text-primary)]">Valor</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--text-primary)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagamentos.map((pag) => (
                  <tr key={pag.id} className="hover:bg-[var(--bg-primary)] transition-colors border-b border-[var(--border-color)] last:border-0">
                    <td className="px-6 py-4 text-sm text-[var(--text-primary)]">{pag.data}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{pag.descricao}</td>
                    <td className="px-6 py-4 text-sm font-bold text-[var(--text-primary)]">R$ {pag.valor}</td>
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
