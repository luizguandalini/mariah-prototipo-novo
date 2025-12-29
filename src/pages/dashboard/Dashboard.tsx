import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import { laudosService, DashboardStats, Laudo } from "../../services/laudos";
import { authService } from "../../services/auth";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLaudos, setRecentLaudos] = useState<Laudo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirecionar DEV e ADMIN para área administrativa
    const currentUser = authService.getCurrentUser();
    if (currentUser && (currentUser.role === 'DEV' || currentUser.role === 'ADMIN')) {
      navigate('/admin/dashboard');
      return;
    }
    
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, laudosData] = await Promise.all([
        laudosService.getDashboardStats(),
        laudosService.getRecentLaudos(2),
      ]);
      setStats(statsData);
      setRecentLaudos(laudosData);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = stats
    ? [
        {
          label: "Laudos Criados",
          value: stats.totalLaudos.toString(),
          icon: "📄",
          color: "from-blue-500 to-blue-600",
        },
        {
          label: "Em Processamento",
          value: stats.emProcessamento.toString(),
          icon: "⏳",
          color: "from-yellow-500 to-yellow-600",
        },
        {
          label: "Concluídos",
          value: stats.concluidos.toString(),
          icon: "✅",
          color: "from-green-500 to-green-600",
        },
        {
          label: "Imagens Disponíveis",
          value:
            stats.imagensRestantes === 999999
              ? "∞"
              : stats.imagensRestantes.toString(),
          icon: "🖼️",
          color: "from-purple-500 to-purple-600",
        },
      ]
    : [];

  const getStatusBadge = (status: string) => {
    const styles = {
      concluido: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
      processando: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
      nao_iniciado: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
      paralisado: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
    };
    const labels = {
      concluido: "Concluído",
      processando: "Processando",
      nao_iniciado: "Não Iniciado",
      paralisado: "Paralisado",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
          styles[status as keyof typeof styles]
        }`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-[var(--text-secondary)]">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl md:text-3xl font-bold text-[var(--text-primary)] mb-1 md:mb-2 transition-colors">
            Bem-vindo de volta! 👋
          </h2>
          <p className="text-sm md:text-base text-[var(--text-secondary)] transition-colors">
            Aqui está um resumo da sua atividade recente.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[var(--bg-secondary)] rounded-xl shadow-sm p-4 md:p-6 border border-[var(--border-color)] transition-colors duration-300"
            >
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl md:text-2xl shadow-lg`}
                >
                  {stat.icon}
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-1">
                {stat.value}
              </h3>
              <p className="text-xs md:text-sm text-[var(--text-secondary)]">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Recent Laudos */}
        {recentLaudos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] transition-colors duration-300"
          >
            <div className="p-6 border-b border-[var(--border-color)]">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  Laudos Recentes
                </h3>
                <Link
                  to="/dashboard/laudos"
                  className="text-sm text-primary hover:text-primary-dark font-semibold transition-colors"
                >
                  Ver todos →
                </Link>
              </div>
            </div>

            <div className="divide-y divide-[var(--border-color)]">
              {recentLaudos.map((laudo) => (
                <div
                  key={laudo.id}
                  className="p-6 hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                        {laudo.endereco}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                        <span>📍 {laudo.tipo}</span>
                        <span>📅 {formatDate(laudo.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(laudo.status)}
                      <Link to={`/dashboard/laudos/${laudo.id}`}>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
