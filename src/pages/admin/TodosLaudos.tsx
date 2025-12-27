import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { laudosService, type Laudo } from "../../services/laudos";

export default function TodosLaudos() {
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 15;

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
    };
    const { bg, text, label } = config[status as keyof typeof config];
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Endereço
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Ambientes
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Fotos
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Data
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {laudosPaginados.map((laudo) => (
                    <tr key={laudo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-500">
                        {laudo.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {laudo.rua}
                            {laudo.numero && `, ${laudo.numero}`}
                          </div>
                          {laudo.complemento && (
                            <div className="text-gray-500 text-xs">
                              {laudo.complemento}
                            </div>
                          )}
                          <div className="text-gray-500 text-xs mt-1">
                            {laudo.bairro && <span>{laudo.bairro}</span>}
                            {laudo.cidade && (
                              <span>
                                {laudo.bairro && " • "}
                                {laudo.cidade}
                              </span>
                            )}
                            {laudo.estado && (
                              <span>
                                {(laudo.bairro || laudo.cidade) && " • "}
                                {laudo.estado}
                              </span>
                            )}
                            {laudo.cep && (
                              <span>
                                {(laudo.bairro ||
                                  laudo.cidade ||
                                  laudo.estado) &&
                                  " • "}
                                CEP {laudo.cep}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {laudo.totalAmbientes}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {laudo.totalFotos}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(laudo.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(mapStatus(laudo.status))}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            handleDeleteLaudo(
                              laudo.id,
                              laudo.rua || laudo.endereco
                            )
                          }
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          🗑️ Deletar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 p-4">
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
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
