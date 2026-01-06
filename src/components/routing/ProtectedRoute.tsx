import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { UserRole } from '../../types/auth'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Mostra tela de carregamento enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Carregando...</p>
        </div>
      </div>
    )
  }

  // Redireciona para login se não autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Verifica se requer permissão de admin
  if (requireAdmin && user) {
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.DEV
    if (!isAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="text-center max-w-md p-8">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Acesso Negado
            </h1>
            <p className="text-[var(--text-secondary)] mb-6">
              Você não tem permissão para acessar esta área. Esta seção é restrita a administradores.
            </p>
            <a
              href="/dashboard"
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Voltar ao Dashboard
            </a>
          </div>
        </div>
      )
    }
  }

  // Renderiza o componente protegido se todas as verificações passarem
  return <>{children}</>
}
