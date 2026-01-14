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
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Card Principal de Perfil */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-xl shadow-black/5 border border-[var(--border-color)] overflow-hidden transition-all duration-300">
          {/* Header do Card com Gradiente e Avatar */}
          <div className="relative h-32 bg-gradient-to-r from-primary to-primary-dark">
            <div className="absolute -bottom-12 left-6 sm:left-10">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[var(--bg-secondary)] p-1.5 shadow-xl border border-[var(--border-color)]">
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary via-primary to-primary-dark flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-inner">
                  {user?.nome ? user.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-16 pb-8 px-6 sm:px-10">
            <div className="mb-8">
              <h3 className="text-xl font-black text-[var(--text-primary)]">Configurações de Perfil</h3>
              <p className="text-sm text-[var(--text-secondary)]">Gerencie suas informações pessoais e de acesso.</p>
            </div>

            <form className="space-y-6" onSubmit={handleSave}>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] ml-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={userData.nome}
                    onChange={(e) => setUserData({...userData, nome: e.target.value})}
                    className="w-full px-4 py-3.5 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                    required
                    maxLength={100}
                    placeholder="Seu nome completo"
                  />
                  <p className="text-[10px] text-[var(--text-secondary)] opacity-60 ml-1">
                    Como você gostaria de ser chamado no sistema.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] ml-1">
                    Endereço de Email
                  </label>
                  <input
                    type="email"
                    value={userData.email}
                    className="w-full px-4 py-3.5 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl opacity-60 cursor-not-allowed font-medium"
                    disabled
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-color)]/50">
                <Button 
                  variant="primary" 
                  type="submit" 
                  isLoading={isSaving}
                  className="w-full sm:w-auto px-10 py-4 shadow-lg shadow-primary/20"
                >
                  ✨ Salvar Alterações
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
