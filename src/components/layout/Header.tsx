import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import Button from '../ui/Button'
import ThemeToggle from '../ui/ThemeToggle'
import { useTheme } from '../../contexts/ThemeContext'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme } = useTheme()

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
        mobileMenuOpen 
          ? 'bg-white dark:bg-[#0f172a] shadow-xl' 
          : 'bg-glass'
      }`}
    >
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="text-xl md:text-2xl font-bold">
              <span style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>MAR</span>
              <span className="gradient-text">IA</span>
              <span style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>H</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#como-funciona" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
              Como Funciona
            </a>
            <a href="#planos" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
              Planos
            </a>
            <a href="#sobre" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
              Sobre
            </a>
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="outline" size="sm">
                Entrar
              </Button>
            </Link>
            <Link to="/cadastro">
              <Button variant="primary" size="sm">
                Começar Agora
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="outline" size="sm" className="px-3 py-1.5 h-9 text-xs whitespace-nowrap">
                Entrar
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden"
          >
            <div className="pt-4 pb-8 space-y-6">
              <nav className="flex flex-col gap-1">
                <a
                  href="#como-funciona"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-4 px-1 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium border-b border-gray-100 dark:border-gray-800/50"
                >
                  Como Funciona
                </a>
                <a
                  href="#planos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-4 px-1 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium border-b border-gray-100 dark:border-gray-800/50"
                >
                  Planos
                </a>
                <a
                  href="#sobre"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-4 px-1 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium"
                >
                  Sobre
                </a>
              </nav>

              <div className="pt-2 text-center">
                <Link 
                  to="/cadastro" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-primary font-semibold hover:underline"
                >
                  Ainda não tem conta? Clique aqui
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}
