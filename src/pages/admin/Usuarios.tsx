import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'

export default function Usuarios() {
  const usuarios = [
    { id: '1', nome: 'João Silva', email: 'joao@example.com', plano: 'Professional', creditos: 150, status: 'ativo' },
    { id: '2', nome: 'Maria Santos', email: 'maria@example.com', plano: 'Starter', creditos: 30, status: 'ativo' },
    { id: '3', nome: 'Pedro Costa', email: 'pedro@example.com', plano: 'Enterprise', creditos: 500, status: 'ativo' },
  ]

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h2>
          <Button variant="primary">➕ Novo Usuário</Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Usuário</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Plano</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Créditos</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.nome}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.plano}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.creditos}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Editar</Button>
                        <Button variant="outline" size="sm">Ver Laudos</Button>
                      </div>
                    </td>
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
