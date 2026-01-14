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
        {/* Título removido por ser redundante com o header */}
        
        <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden transition-all duration-300">
          <div className="flex items-center gap-3 p-6 border-b border-[var(--border-color)]">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              Histórico de Transações
            </h3>
          </div>

          {/* Vista Desktop (Tabela) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Data</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Descrição</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Valor</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {pagamentos.map((pag) => (
                  <tr key={pag.id} className="hover:bg-[var(--bg-primary)] transition-all group">
                    <td className="px-6 py-5 text-sm font-medium text-[var(--text-primary)]">
                      {pag.data}
                    </td>
                    <td className="px-6 py-5 text-sm text-[var(--text-secondary)]">
                      {pag.descricao}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-black text-[var(--text-primary)]">
                        R$ {pag.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {getStatusBadge(pag.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista Mobile (Cards) */}
          <div className="md:hidden divide-y divide-[var(--border-color)]">
            {pagamentos.map((pag) => (
              <div key={pag.id} className="p-5 space-y-4 bg-[var(--bg-secondary)] active:bg-[var(--bg-primary)] transition-colors">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                      {pag.data}
                    </p>
                    <h4 className="font-bold text-[var(--text-primary)] leading-tight text-sm">
                      {pag.descricao}
                    </h4>
                  </div>
                  {getStatusBadge(pag.status)}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Valor Total</span>
                  <span className="text-lg font-black text-primary">
                    R$ {pag.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
