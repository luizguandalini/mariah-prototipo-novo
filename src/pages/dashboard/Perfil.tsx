import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { usersService } from '../../services/users'
import { toast } from 'sonner'

const MAX_FOTO_BYTES = 5 * 1024 * 1024 // 5MB
const FORMATOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp']

export default function Perfil() {
  const { user, updateUser } = useAuth()
  const [userData, setUserData] = useState({
    nome: '',
    email: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingFoto, setIsUploadingFoto] = useState(false)
  const [fotoComErro, setFotoComErro] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setUserData({
        nome: user.nome || '',
        email: user.email || '',
      })
    }
  }, [user])

  // Reseta o estado de erro sempre que a URL da foto mudar
  useEffect(() => {
    setFotoComErro(false)
  }, [user?.fotoPerfilUrl])

  const iniciais = user?.nome
    ? user.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : '??'

  const temFoto = Boolean(user?.fotoPerfilUrl) && !fotoComErro

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      setIsSaving(true)
      const updatedUser = await usersService.updateUser(user.id, { nome: userData.nome })
      updateUser({ ...user, ...updatedUser })
      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      toast.error('Erro ao atualizar perfil. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelecionarFoto = () => {
    fileInputRef.current?.click()
  }

  const handleFotoSelecionada = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Limpa o input para permitir reenviar o mesmo arquivo depois
    e.target.value = ''
    if (!file || !user) return

    if (!FORMATOS_ACEITOS.includes(file.type)) {
      toast.error('Formato inválido. Envie uma imagem JPEG, PNG ou WEBP.')
      return
    }

    if (file.size > MAX_FOTO_BYTES) {
      toast.error('A imagem é muito grande. O limite é de 5MB.')
      return
    }

    try {
      setIsUploadingFoto(true)
      const { fotoPerfilUrl } = await usersService.uploadFotoPerfil(file)
      updateUser({ ...user, fotoPerfilUrl })
      setFotoComErro(false)
      toast.success('Foto de perfil atualizada!')
    } catch (error) {
      console.error('Erro ao enviar foto de perfil:', error)
      toast.error('Erro ao enviar a foto. Tente novamente.')
    } finally {
      setIsUploadingFoto(false)
    }
  }

  const handleRemoverFoto = async () => {
    if (!user) return
    try {
      setIsUploadingFoto(true)
      await usersService.removerFotoPerfil()
      updateUser({ ...user, fotoPerfilUrl: null })
      toast.success('Foto de perfil removida.')
    } catch (error) {
      console.error('Erro ao remover foto de perfil:', error)
      toast.error('Erro ao remover a foto. Tente novamente.')
    } finally {
      setIsUploadingFoto(false)
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
              <div className="group relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[var(--bg-secondary)] p-1.5 shadow-xl border border-[var(--border-color)]">
                <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-dark flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-inner">
                  {temFoto ? (
                    <img
                      src={user!.fotoPerfilUrl as string}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                      onError={() => setFotoComErro(true)}
                    />
                  ) : (
                    iniciais
                  )}
                </div>

                {/* Overlay de upload (clicável) */}
                <button
                  type="button"
                  onClick={handleSelecionarFoto}
                  disabled={isUploadingFoto}
                  aria-label="Alterar foto de perfil"
                  className="absolute inset-1.5 rounded-xl bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:cursor-not-allowed"
                >
                  {isUploadingFoto ? (
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFotoSelecionada}
            />
          </div>

          <div className="pt-16 pb-8 px-6 sm:px-10">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-[var(--text-primary)]">Configurações de Perfil</h3>
                <p className="text-sm text-[var(--text-secondary)]">Gerencie suas informações pessoais e de acesso.</p>
              </div>

              {/* Ações da foto de perfil */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelecionarFoto}
                  disabled={isUploadingFoto}
                  className="text-xs font-bold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {temFoto ? 'Trocar foto' : 'Adicionar foto'}
                </button>
                {temFoto && (
                  <button
                    type="button"
                    onClick={handleRemoverFoto}
                    disabled={isUploadingFoto}
                    className="text-xs font-bold text-red-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>

            <p className="-mt-4 mb-8 text-[10px] text-[var(--text-secondary)] opacity-60">
              Use uma foto pessoal ou a logo da sua empresa. JPEG, PNG ou WEBP, até 5MB.
            </p>

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
