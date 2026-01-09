import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usersService } from "../../services/users";
import { User, UserRole } from "../../types/auth";
import { authService } from "../../services/auth";
import { useAuth } from "../../contexts/AuthContext";
import ThemeToggle from "../ui/ThemeToggle";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  path: string;
  icon: string;
  label: string;
  roles?: UserRole[];
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Usar dados do contexto global para ter contadores atualizados
  const { user: currentUser, isLoading: loading, logout } = useAuth();

  const getRoleName = (role: UserRole): string => {
    const roleNames = {
      [UserRole.DEV]: "Desenvolvedor",
      [UserRole.ADMIN]: "Administrador",
      [UserRole.USUARIO]: "Usuário",
    };
    return roleNames[role] || "Usuário";
  };

  const getInitials = (name: string): string => {
    const names = name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatImagensDisponiveis = (
    quantidade: number,
    role: UserRole
  ): string => {
    if ([UserRole.DEV, UserRole.ADMIN].includes(role)) {
      return "∞";
    }
    return quantidade.toString();
  };

  const isAdmin = currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DEV);

  const allMenuItems: MenuItem[] = [
    // 1. Dashboards
    {
      path: "/admin/dashboard",
      icon: "📊",
      label: "Dashboard",
      roles: [UserRole.ADMIN, UserRole.DEV],
    },

    // 2. Laudos (Ações e Gestão)
    { path: "/dashboard/laudos", icon: "📋", label: "Meus Laudos" },
    {
      path: "/admin/laudos",
      icon: "📄",
      label: "Todos os Laudos",
      roles: [UserRole.ADMIN, UserRole.DEV],
    },

    // 3. Configurações do Sistema (Admin/Dev)
    {
      path: "/admin/detalhes-laudo",
      icon: "📋",
      label: "Detalhes do Laudo",
      roles: [UserRole.ADMIN, UserRole.DEV],
    },
    {
      path: "/admin/ambientes",
      icon: "🏠",
      label: "Gerenciar Ambientes",
      roles: [UserRole.ADMIN, UserRole.DEV],
    },

    // 4. Gestão de Usuários (Admin/Dev)
    {
      path: "/admin/usuarios",
      icon: "👥",
      label: "Usuários",
      roles: [UserRole.ADMIN, UserRole.DEV],
    },

    // 5. Conta e Faturamento
    { path: "/dashboard/creditos", icon: "💳", label: "Créditos" },
    { path: "/dashboard/pagamentos", icon: "💰", label: "Pagamentos" },
    { path: "/dashboard/perfil", icon: "👤", label: "Meu Perfil" },

    // Configurações IA (Admin/Dev)
    {
      path: "/admin/configuracoes-ia",
      icon: "🤖",
      label: "Configurações IA",
      roles: [UserRole.ADMIN, UserRole.DEV],
    },
  ];

  const menuItems = allMenuItems.filter((item) => {
    if (!item.roles) return true;
    return currentUser && item.roles.includes(currentUser.role);
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex transition-colors duration-300">
      {/* Backdrop para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:sticky top-0 left-0 h-screen w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] overflow-y-auto z-40
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="text-xl lg:text-2xl font-bold">
                <span className="text-[var(--text-primary)]">MAR</span>
                <span className="gradient-text">i</span>
                <span className="text-[var(--text-primary)]">AH</span>
              </div>
            </Link>
            {/* Botão fechar mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-[var(--bg-primary)] rounded-lg text-[var(--text-secondary)]"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          {currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DEV) && (
            <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-primary/10 text-primary rounded">
              {getRoleName(currentUser.role)}
            </span>
          )}
        </div>

        {/* Menu Items */}
        <nav className="p-3 lg:p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span className="text-lg lg:text-xl">{item.icon}</span>
                <span className="text-sm lg:text-base font-medium flex items-center gap-2">
                  {item.label}
                  {item.roles && (
                    <span className="opacity-40" title="Acesso restrito">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="sticky bottom-0 left-0 right-0 p-3 lg:p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 w-full rounded-lg text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors"
          >
            <span className="text-lg lg:text-xl">🚪</span>
            <span className="text-sm lg:text-base font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] transition-colors duration-300">
          <div className="px-3 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-[var(--bg-primary)] rounded-lg transition-colors lg:hidden text-[var(--text-secondary)]"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="text-base md:text-xl font-semibold text-[var(--text-primary)] truncate">
                {menuItems.find((item) => item.path === location.pathname)
                  ?.label || "Dashboard"}
              </h1>
            </div>

            {/* User Info & Theme Toggle */}
            <div className="flex items-center gap-2 md:gap-6">
              <div className="flex items-center gap-2 border-r border-[var(--border-color)] pr-2 md:pr-4">
                <ThemeToggle />
              </div>

              {currentUser && (
                <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-2 bg-primary/10 rounded-lg">
                  <span className="text-xs md:text-sm font-medium text-[var(--text-secondary)] hidden sm:inline">
                    Imagens:
                  </span>
                  <span className="text-xs md:text-sm font-bold text-primary">
                    {formatImagensDisponiveis(
                      currentUser.quantidadeImagens,
                      currentUser.role
                    )}
                  </span>
                </div>
              )}
              {currentUser && (
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {currentUser.nome}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {getRoleName(currentUser.role)}
                    </p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-sm md:text-base font-bold shadow-lg">
                    {getInitials(currentUser.nome)}
                  </div>
                </div>
              )}
              {!currentUser && !loading && (
                <div className="text-sm text-[var(--text-secondary)]">Carregando...</div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 md:p-6 bg-[var(--bg-primary)] transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
