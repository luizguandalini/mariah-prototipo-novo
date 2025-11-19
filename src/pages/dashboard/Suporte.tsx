import { useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'

export default function Suporte() {
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('')

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Suporte</h2>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Abrir Novo Ticket</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assunto</label>
              <input
                type="text"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                placeholder="Descreva resumidamente seu problema"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem</label>
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                placeholder="Descreva detalhadamente sua dúvida ou problema..."
              />
            </div>
            <Button variant="primary">Enviar Ticket</Button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Meus Tickets</h3>
          <p className="text-gray-500">Nenhum ticket aberto no momento</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
