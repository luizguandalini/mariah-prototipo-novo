import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'

export default function Creditos() {
  const planoAtual = {
    nome: 'Professional',
    preco: 297,
    creditos: 200,
    usados: 50,
    renovacao: '18/12/2024'
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] transition-colors">Créditos & Planos</h2>

        {/* Plano Atual */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Plano {planoAtual.nome}</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-purple-200 text-sm">Créditos Restantes</p>
              <p className="text-4xl font-bold">{planoAtual.creditos - planoAtual.usados}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Total do Plano</p>
              <p className="text-4xl font-bold">{planoAtual.creditos}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Renovação</p>
              <p className="text-2xl font-bold">{planoAtual.renovacao}</p>
            </div>
          </div>
        </div>

        {/* Comprar Créditos Avulsos */}
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Comprar Créditos Avulsos</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { qtd: 10, preco: 50, economia: 0 },
              { qtd: 50, preco: 200, economia: 20 },
              { qtd: 100, preco: 300, economia: 40 },
            ].map((pacote) => (
              <div key={pacote.qtd} className="border-2 border-[var(--border-color)] rounded-lg p-4 bg-[var(--bg-primary)] transition-colors hover:border-primary">
                {pacote.economia > 0 && (
                  <span className="text-xs font-bold text-primary mb-2 block">
                    ECONOMIA DE {pacote.economia}%
                  </span>
                )}
                <p className="text-3xl font-bold text-[var(--text-primary)]">{pacote.qtd}</p>
                <p className="text-sm text-[var(--text-secondary)] mb-4">créditos</p>
                <p className="text-2xl font-bold text-primary mb-4">R$ {pacote.preco}</p>
                <Button variant="primary" size="sm" className="w-full">Comprar</Button>
              </div>
            ))}
          </div>
        </div>

        {/* Outros Planos */}
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Mudar de Plano</h3>
          <Button variant="outline">Ver Todos os Planos</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
