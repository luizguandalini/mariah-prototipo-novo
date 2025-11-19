import { useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'

export default function Configuracoes() {
  const [config, setConfig] = useState({
    siteName: 'Mariah',
    supportEmail: 'suporte@mariah.com',
    maxCreditos: 1000,
    apiKey: 'sk-xxxxxxxxxxxxx',
  })

  return (
    <DashboardLayout userType="admin">
      <div className="max-w-3xl space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h2>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Configurações Gerais</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Site</label>
              <input
                type="text"
                value={config.siteName}
                onChange={(e) => setConfig({...config, siteName: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email de Suporte</label>
              <input
                type="email"
                value={config.supportEmail}
                onChange={(e) => setConfig({...config, supportEmail: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Máximo de Créditos por Usuário</label>
              <input
                type="number"
                value={config.maxCreditos}
                onChange={(e) => setConfig({...config, maxCreditos: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key da IA</label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <Button variant="primary">Salvar Configurações</Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
