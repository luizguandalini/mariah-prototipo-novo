import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from '../components/ui/ThemeToggle'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(formData)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-dark/10 rounded-full blur-3xl"></div>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <Link to="/" className="flex justify-center mb-6 md:mb-8">
          <div className="text-2xl md:text-3xl font-bold">
            <span className="text-[var(--text-primary)]">MAR</span>
            <span className="gradient-text">i</span>
            <span className="text-[var(--text-primary)]">AH</span>
          </div>
        </Link>

        {/* Card */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 md:p-8 transition-colors duration-300">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2 text-center">
            Bem-vindo de volta!
          </h1>
          <p className="text-sm md:text-base text-[var(--text-secondary)] text-center mb-6 md:mb-8">
            Faça login para continuar gerando laudos incríveis
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary focus:outline-none transition-colors"
                placeholder="seu@email.com"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Senha
              </label>
              <input
                type="password"
                id="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary focus:outline-none transition-colors"
                placeholder="••••••••"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-primary border-gray-300 dark:border-gray-700 rounded focus:ring-primary" />
                <span className="ml-2 text-sm text-[var(--text-secondary)] transition-colors">Lembrar de mim</span>
              </label>
              <a href="#" className="text-sm text-primary hover:text-primary-dark transition-colors">
                Esqueceu a senha?
              </a>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="mt-6 text-center text-[var(--text-secondary)]">
            Não tem uma conta?{' '}
            <Link to="/cadastro" className="text-primary font-semibold hover:text-primary-dark transition-colors">
              Cadastre-se grátis
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center transition-colors">
          <Link to="/" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm">
            ← Voltar para home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
