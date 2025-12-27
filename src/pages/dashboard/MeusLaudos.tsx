import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import LaudoDetalhes from "../../components/LaudoDetalhes";
import { laudosService, type Laudo } from "../../services/laudos";
import { useAuth } from "../../contexts/AuthContext";
import { UserRole } from "../../types/auth";

export default function MeusLaudos() {
  const { user } = useAuth();
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  useEffect(() => {
    fetchLaudos();
  }, []);

  const fetchLaudos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await laudosService.getMyLaudos();
      setLaudos(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar laudos");
      console.error("Erro ao buscar laudos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLaudo = async (id: string, endereco: string) => {
    if (
      !window.confirm(
        `Tem certeza que deseja deletar o laudo de "${endereco}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      await laudosService.deleteLaudo(id);
      // Atualiza a lista removendo o laudo deletado
      setLaudos((prevLaudos) => prevLaudos.filter((l) => l.id !== id));
    } catch (err: any) {
      alert(err.message || "Erro ao deletar laudo");
      console.error("Erro ao deletar laudo:", err);
    }
  };

  const mapStatus = (
    status: string
  ): "nao_iniciado" | "processando" | "concluido" | "paralisado" => {
    const statusMap: Record<
      string,
      "nao_iniciado" | "processando" | "concluido" | "paralisado"
    > = {
      NAO_INICIADO: "nao_iniciado",
      EM_ANDAMENTO: "processando",
      CONCLUIDO: "concluido",
      PARALISADO: "paralisado",
    };
    return statusMap[status.toUpperCase()] || "nao_iniciado";
  };

  const getStatusBadge = (status: string) => {
    const config = {
      concluido: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "✅ Concluído",
        icon: "✅",
      },
      processando: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "⏳ Processando",
        icon: "⏳",
      },
      nao_iniciado: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "📝 Não Iniciado",
        icon: "📝",
      },
      paralisado: {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "⏸️ Paralisado",
        icon: "⏸️",
      },
    };
    const statusConfig =
      config[status as keyof typeof config] || config.nao_iniciado;
    const { bg, text, label } = statusConfig;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}
      >
        {label}
      </span>
    );
  };

  const laudosFiltrados =
    filtroStatus === "todos"
      ? laudos
      : laudos.filter((l) => mapStatus(l.status) === filtroStatus);

  // Paginação
  const totalPaginas = Math.ceil(laudosFiltrados.length / itensPorPagina);
  const indexInicio = (paginaAtual - 1) * itensPorPagina;
  const indexFim = indexInicio + itensPorPagina;
  const laudosPaginados = laudosFiltrados.slice(indexInicio, indexFim);

  // Reset página ao mudar filtro
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroStatus]);

  const statusCounts = {
    todos: laudos.length,
    concluido: laudos.filter((l) => mapStatus(l.status) === "concluido").length,
    processando: laudos.filter((l) => mapStatus(l.status) === "processando")
      .length,
    nao_iniciado: laudos.filter((l) => mapStatus(l.status) === "nao_iniciado")
      .length,
    paralisado: laudos.filter((l) => mapStatus(l.status) === "paralisado")
      .length,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <DashboardLayout
      userType={
        user?.role === UserRole.ADMIN || user?.role === UserRole.DEV
          ? "admin"
          : "user"
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Meus Laudos
            </h2>
            <p className="text-gray-600">
              Gerencie todos os seus laudos imobiliários
            </p>
          </div>
          <Link to="/dashboard/novo-laudo">
            <Button variant="primary" size="lg">
              ➕ Novo Laudo
            </Button>
          </Link>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
        >
          <div className="flex flex-wrap gap-2">
            {[
              { key: "todos", label: `Todos (${statusCounts.todos})` },
              {
                key: "concluido",
                label: `Concluídos (${statusCounts.concluido})`,
              },
              {
                key: "processando",
                label: `Processando (${statusCounts.processando})`,
              },
              {
                key: "nao_iniciado",
                label: `Não Iniciados (${statusCounts.nao_iniciado})`,
              },
              {
                key: "paralisado",
                label: `Paralisados (${statusCounts.paralisado})`,
              },
            ].map((filtro) => (
              <button
                key={filtro.key}
                onClick={() => setFiltroStatus(filtro.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroStatus === filtro.key
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filtro.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Lista de Laudos */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando laudos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchLaudos} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        ) : laudosFiltrados.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <p className="text-gray-600 mb-4">
              {filtroStatus === "todos"
                ? "Nenhum laudo encontrado. Comece criando seu primeiro laudo!"
                : "Nenhum laudo encontrado com este status."}
            </p>
            {filtroStatus === "todos" && (
              <Link to="/dashboard/novo-laudo">
                <Button>Criar Primeiro Laudo</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {laudosPaginados.map((laudo, index) => {
                const status = mapStatus(laudo.status);
                return (
                  <motion.div
                    key={laudo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {getStatusBadge(status)}
                        </div>

                        <div className="mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {laudo.rua || laudo.endereco}
                            {laudo.numero && `, ${laudo.numero}`}
                          </h3>
                          <div className="text-sm text-gray-600 space-y-0.5">
                            {laudo.complemento && (
                              <div>{laudo.complemento}</div>
                            )}
                            {laudo.bairro && (
                              <div>
                                <span className="text-gray-400">Bairro:</span>{" "}
                                {laudo.bairro}
                              </div>
                            )}
                            <div className="flex gap-4">
                              {laudo.cidade && (
                                <span>
                                  <span className="text-gray-400">Cidade:</span>{" "}
                                  {laudo.cidade}
                                </span>
                              )}
                              {laudo.estado && (
                                <span>
                                  <span className="text-gray-400">Estado:</span>{" "}
                                  {laudo.estado}
                                </span>
                              )}
                              {laudo.cep && (
                                <span>
                                  <span className="text-gray-400">CEP:</span>{" "}
                                  {laudo.cep}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="text-gray-400">Ambientes:</span>{" "}
                            <span className="font-medium text-gray-900">
                              {laudo.totalAmbientes}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Fotos:</span>{" "}
                            <span className="font-medium text-gray-900">
                              {laudo.totalFotos}
                            </span>
                          </div>
                          {laudo.tamanho && (
                            <div>
                              <span className="text-gray-400">Tamanho:</span>{" "}
                              <span className="font-medium text-gray-900">
                                {laudo.tamanho}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-400">Data:</span>{" "}
                            <span className="font-medium text-gray-900">
                              {formatDate(laudo.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {status === "concluido" && laudo.pdfUrl && (
                          <a
                            href={laudo.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              variant="primary"
                              size="sm"
                              className="whitespace-nowrap"
                            >
                              📄 Ver PDF
                            </Button>
                          </a>
                        )}
                        {status === "concluido" && (
                          <Link to={`/dashboard/laudos/${laudo.id}/preview`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="whitespace-nowrap"
                            >
                              👁️ Visualizar
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                          onClick={() =>
                            handleDeleteLaudo(
                              laudo.id,
                              laudo.rua || laudo.endereco
                            )
                          }
                        >
                          🗑️ Deletar
                        </Button>
                      </div>
                    </div>
                    {/* Detalhes do Laudo (Expansível) */}
                    <LaudoDetalhes laudo={laudo} />{" "}
                  </motion.div>
                );
              })}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-6">
                <div className="text-sm text-gray-600">
                  Mostrando {indexInicio + 1} a{" "}
                  {Math.min(indexFim, laudosFiltrados.length)} de{" "}
                  {laudosFiltrados.length} laudos
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    ← Anterior
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                      (pagina) => (
                        <button
                          key={pagina}
                          onClick={() => setPaginaAtual(pagina)}
                          className={`px-3 py-2 rounded-lg ${
                            paginaAtual === pagina
                              ? "bg-primary text-white"
                              : "border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pagina}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                    }
                    disabled={paginaAtual === totalPaginas}
                    className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
