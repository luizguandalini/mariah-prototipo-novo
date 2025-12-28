import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usersService } from "../../services/users";
import { User, UserRole } from "../../types/auth";
import { authService } from "../../services/auth";

interface DashboardLayoutProps {
  children: ReactNode;
  userType?: "user" | "admin";
}

interface MenuItem {
  path: string;
  icon: string;
  label: string;
}

export default function DashboardLayout({
  children,
  userType = "user",
}: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Tenta buscar do localStorage primeiro
      const cachedUser = authService.getCurrentUser();
      if (cachedUser) {
        setCurrentUser(cachedUser);
      }

      // Depois atualiza com dados do servidor
      const userData = await usersService.getMe();
      setCurrentUser(userData);

      // Atualiza no localStorage
      localStorage.setItem("auth_user", JSON.stringify(userData));
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      // Se falhar, usa dados do cache
      const cachedUser = authService.getCurrentUser();
      if (cachedUser) {
        setCurrentUser(cachedUser);
      }
    } finally {
      setLoading(false);
    }
  };

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

  const userMenuItems: MenuItem[] = [
    { path: "/dashboard", icon: "📊", label: "Dashboard" },
    { path: "/dashboard/laudos", icon: "📄", label: "Meus Laudos" },
    { path: "/dashboard/novo-laudo", icon: "➕", label: "Novo Laudo" },
    { path: "/dashboard/creditos", icon: "💳", label: "Créditos & Planos" },
    { path: "/dashboard/pagamentos", icon: "💰", label: "Pagamentos" },
    { path: "/dashboard/perfil", icon: "👤", label: "Meu Perfil" },
    { path: "/dashboard/suporte", icon: "💬", label: "Suporte" },
  ];

  const adminMenuItems: MenuItem[] = [
    { path: "/admin/dashboard", icon: "📊", label: "Dashboard" },
    { path: "/admin/usuarios", icon: "👥", label: "Usuários" },
    { path: "/dashboard/laudos", icon: "📋", label: "Meus Laudos" },
    { path: "/admin/laudos", icon: "📄", label: "Todos os Laudos" },
    { path: "/admin/ambientes", icon: "🏠", label: "Gerenciar Ambientes" },
    { path: "/admin/detalhes-laudo", icon: "📋", label: "Detalhes do Laudo" },
    { path: "/admin/pdf-settings", icon: "📝", label: "Config. PDF" },
  ];

  const menuItems = userType === "admin" ? adminMenuItems : userMenuItems;

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
        fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto z-40
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="text-xl lg:text-2xl font-bold">
                <span className="text-gray-900">MAR</span>
                <span className="gradient-text">i</span>
                <span className="text-gray-900">AH</span>
              </div>
            </Link>
            {/* Botão fechar mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
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
          {userType === "admin" && (
            <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-primary/10 text-primary rounded">
              Admin
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
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg lg:text-xl">{item.icon}</span>
                <span className="text-sm lg:text-base font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 w-full rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <span className="text-lg lg:text-xl">🚪</span>
            <span className="text-sm lg:text-base font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="px-3 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
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
              <h1 className="text-base md:text-xl font-semibold text-gray-800 truncate">
                {menuItems.find((item) => item.path === location.pathname)
                  ?.label || "Dashboard"}
              </h1>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-2 md:gap-4">
              {userType === "user" && currentUser && (
                <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-2 bg-purple-50 rounded-lg">
                  <span className="text-xs md:text-sm font-medium text-gray-700 hidden sm:inline">
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
                    <p className="text-sm font-medium text-gray-900">
                      {currentUser.nome}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getRoleName(currentUser.role)}
                    </p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-sm md:text-base font-bold">
                    {getInitials(currentUser.nome)}
                  </div>
                </div>
              )}
              {!currentUser && !loading && (
                <div className="text-sm text-gray-500">Carregando...</div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 md:p-6">{children}</main>
      </div>
    </div>
  );
}
