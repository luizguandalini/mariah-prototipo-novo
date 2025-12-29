import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { usersService } from '../../services/users'
import { toast } from 'sonner'

export default function Perfil() {
  const { user, updateUser } = useAuth()
  const [userData, setUserData] = useState({
    nome: '',
    email: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setUserData({
        nome: user.nome || '',
        email: user.email || '',
      })
    }
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      setIsSaving(true)
      const updatedUser = await usersService.updateUser(user.id, { nome: userData.nome })
      updateUser(updatedUser)
      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      toast.error('Erro ao atualizar perfil. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] transition-colors">Meu Perfil</h2>

        {/* Dados */}
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Informações Pessoais</h3>
          <form className="space-y-4" onSubmit={handleSave}>
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Nome Completo</label>
              <input
                type="text"
                value={userData.nome}
                onChange={(e) => setUserData({...userData, nome: e.target.value})}
                className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all"
                required
                maxLength={100}
                pattern="^[a-zA-ZÀ-ÿ\s'-]+$"
                title="O nome deve conter apenas letras, espaços, hifens ou apóstrofos (máx. 100 caracteres)"
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Apenas letras, espaços, hifens ou apóstrofos. Máx. 100 caracteres.
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Email</label>
              <input
                type="email"
                value={userData.email}
                className="w-full px-4 py-3 border-2 border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-secondary)] opacity-70 cursor-not-allowed"
                disabled
              />
            </div>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              Salvar Alterações
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
