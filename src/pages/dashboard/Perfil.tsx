import { useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'

export default function Perfil() {
  const [userData, setUserData] = useState({
    nome: 'João Silva',
    email: 'joao.silva@example.com',
    telefone: '(11) 98765-4321',
    cpf: '123.456.789-00',
    empresa: 'Imobiliária Silva & Costa',
  })

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Meu Perfil</h2>

        {/* Foto */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Foto de Perfil</h3>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-3xl font-bold">
              JS
            </div>
            <div>
              <Button variant="outline" size="sm">Alterar Foto</Button>
              <p className="text-sm text-gray-500 mt-2">JPG, PNG ou GIF. Máx. 2MB</p>
            </div>
          </div>
        </div>

        {/* Dados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Informações Pessoais</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
              <input
                type="text"
                value={userData.nome}
                onChange={(e) => setUserData({...userData, nome: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={userData.email}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50"
                disabled
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                <input
                  type="text"
                  value={userData.telefone}
                  onChange={(e) => setUserData({...userData, telefone: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                <input
                  type="text"
                  value={userData.cpf}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50"
                  disabled
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Empresa (opcional)</label>
              <input
                type="text"
                value={userData.empresa}
                onChange={(e) => setUserData({...userData, empresa: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>
            <Button variant="primary">Salvar Alterações</Button>
          </form>
        </div>

        {/* Senha */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Alterar Senha</h3>
          <form className="space-y-4">
            <input
              type="password"
              placeholder="Senha atual"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            />
            <input
              type="password"
              placeholder="Nova senha"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            />
            <Button variant="outline">Alterar Senha</Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
