import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import LaudoDetalhes from "../../components/LaudoDetalhes";
import EditarEnderecoLaudo from "../../components/EditarEnderecoLaudo";
import { laudosService, type Laudo } from "../../services/laudos";

export default function TodosLaudos() {
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 15;
  const [laudoEditando, setLaudoEditando] = useState<Laudo | null>(null);

  useEffect(() => {
    fetchAllLaudos();
  }, []);

  const fetchAllLaudos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await laudosService.getAllLaudos();
      setLaudos(data);
    } catch (err) {
      setError("Erro ao carregar laudos");
      console.error(err);
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
      setLaudos((prevLaudos) => prevLaudos.filter((l) => l.id !== id));
    } catch (err: any) {
      alert(err.message || "Erro ao deletar laudo");
      console.error("Erro ao deletar laudo:", err);
    }
  };

  const handleEnderecoAtualizado = (laudoAtualizado: Laudo) => {
    // Atualizar o laudo na lista
    setLaudos((prevLaudos) =>
      prevLaudos.map((l) => (l.id === laudoAtualizado.id ? laudoAtualizado : l))
    );
  };

  const mapStatus = (status: string) => {
    const mapping: Record<string, string> = {
      NAO_INICIADO: "nao_iniciado",
      EM_ANDAMENTO: "processando",
      CONCLUIDO: "concluido",
      PARALISADO: "paralisado",
    };
    return mapping[status] || status.toLowerCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    const config = {
      concluido: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Concluído",
      },
      processando: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Processando",
      },
      nao_iniciado: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "Não Iniciado",
      },
      paralisado: {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "Paralisado",
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

  // Paginação
  const totalPaginas = Math.ceil(laudos.length / itensPorPagina);
  const indexInicio = (paginaAtual - 1) * itensPorPagina;
  const indexFim = indexInicio + itensPorPagina;
  const laudosPaginados = laudos.slice(indexInicio, indexFim);

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Todos os Laudos</h2>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={fetchAllLaudos}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </div>
        ) : laudos.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-600 text-lg">Nenhum laudo encontrado</p>
          </div>
        ) : (
          <>
            {/* Grid de Cards */}
            <div className="grid grid-cols-1 gap-4">
              {laudosPaginados.map((laudo) => (
                <div
                  key={laudo.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusBadge(mapStatus(laudo.status))}
                        <span className="text-xs text-gray-400 font-mono">
                          ID: {laudo.id.substring(0, 8)}
                        </span>
                      </div>

                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {laudo.rua || laudo.endereco}
                          {laudo.numero && `, ${laudo.numero}`}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-0.5">
                          {laudo.complemento && <div>{laudo.complemento}</div>}
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
                      {mapStatus(laudo.status) === "concluido" &&
                        laudo.pdfUrl && (
                          <a
                            href={laudo.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium text-center whitespace-nowrap"
                          >
                            📄 Ver PDF
                          </a>
                        )}
                      <button
                        onClick={() => setLaudoEditando(laudo)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium whitespace-nowrap"
                      >
                        ✏️ Editar Endereço
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteLaudo(
                            laudo.id,
                            laudo.rua || laudo.endereco
                          )
                        }
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium whitespace-nowrap"
                      >
                        🗑️ Deletar
                      </button>
                    </div>
                  </div>

                  {/* Detalhes do Laudo (Expansível) */}
                  <LaudoDetalhes laudo={laudo} />
                </div>
              ))}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-6">
                <div className="text-sm text-gray-600">
                  Mostrando {indexInicio + 1} a{" "}
                  {Math.min(indexFim, laudos.length)} de {laudos.length} laudos
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
                    {Array.from(
                      { length: Math.min(totalPaginas, 10) },
                      (_, i) => {
                        let pagina: number;
                        if (totalPaginas <= 10) {
                          pagina = i + 1;
                        } else if (paginaAtual <= 5) {
                          pagina = i + 1;
                        } else if (paginaAtual >= totalPaginas - 4) {
                          pagina = totalPaginas - 9 + i;
                        } else {
                          pagina = paginaAtual - 4 + i;
                        }
                        return (
                          <button
                            key={pagina}
                            onClick={() => setPaginaAtual(pagina)}
                            className={`px-3 py-2 rounded-lg ${
                              paginaAtual === pagina
                                ? "bg-purple-600 text-white"
                                : "border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {pagina}
                          </button>
                        );
                      }
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

        {/* Modal de Edição de Endereço */}
        {laudoEditando && (
          <EditarEnderecoLaudo
            laudo={laudoEditando}
            onClose={() => setLaudoEditando(null)}
            onSuccess={handleEnderecoAtualizado}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
