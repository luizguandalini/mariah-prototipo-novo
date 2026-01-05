import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Calendar, MapPin, Tag, Info, FolderOpen, ChevronRight, Image as ImageIcon, CheckCircle } from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { laudosService, type ImagemLaudo, type AmbienteInfo } from "../../services/laudos";
import { toast } from "sonner";

export default function GaleriaImagens() {
  const { id } = useParams<{ id: string }>();
  
  // Estado para ambientes
  const [ambientes, setAmbientes] = useState<AmbienteInfo[]>([]);
  const [ambienteSelecionado, setAmbienteSelecionado] = useState<string | null>(null);
  const [paginaAmbientes, setPaginaAmbientes] = useState(1);
  const [totalPaginasAmbientes, setTotalPaginasAmbientes] = useState(1);
  const limitAmbientes = 12;
  
  // Estado para imagens (do ambiente selecionado)
  const [imagens, setImagens] = useState<ImagemLaudo[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limit = 20;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    imagemId: string;
  }>({ isOpen: false, imagemId: "" });

  // Carregar ambientes ao iniciar
  useEffect(() => {
    if (id && !ambienteSelecionado) {
      fetchAmbientes(1);
    }
  }, [id]);

  // Carregar imagens quando selecionar ambiente
  useEffect(() => {
    if (id && ambienteSelecionado) {
      fetchImagensByAmbiente(1);
    }
  }, [id, ambienteSelecionado]);

  const fetchAmbientes = async (page: number) => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await laudosService.getAmbientes(id, page, limitAmbientes);
      setAmbientes(res.data);
      setTotalPaginasAmbientes(res.lastPage);
      setPaginaAmbientes(res.page);
    } catch (err: any) {
      setError("Erro ao carregar ambientes.");
      console.error(err);
      toast.error("Não foi possível carregar os ambientes.");
    } finally {
      setLoading(false);
    }
  };

  const fetchImagensByAmbiente = async (page: number) => {
    if (!id || !ambienteSelecionado) return;
    try {
      setLoading(true);
      setError(null);
      const res = await laudosService.getImagensByAmbiente(id, ambienteSelecionado, page, limit);
      setImagens(res.data);
      setTotalPaginas(res.lastPage);
      setPaginaAtual(res.page);
    } catch (err: any) {
      setError("Erro ao carregar imagens.");
      console.error(err);
      toast.error("Não foi possível carregar as imagens.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAmbiente = (ambiente: string) => {
    setAmbienteSelecionado(ambiente);
    setPaginaAtual(1);
  };

  const handleVoltarParaAmbientes = () => {
    setAmbienteSelecionado(null);
    setImagens([]);
    setPaginaAtual(1);
  };

  const handleDelete = async () => {
    const imagemId = confirmDelete.imagemId;
    
    // 1. Salva a imagem para possível rollback
    const imagemDeletada = imagens.find(img => img.id === imagemId);
    const indexOriginal = imagens.findIndex(img => img.id === imagemId);
    
    // 2. Atualização otimista - remove da UI imediatamente
    setImagens(prev => prev.filter(img => img.id !== imagemId));
    setConfirmDelete({ isOpen: false, imagemId: "" });
    
    try {
      // 3. Chama a API em background
      await laudosService.deleteImagem(imagemId);
      toast.success("Imagem deletada com sucesso!");
      
      // Se deletou a última imagem do ambiente, voltar para lista de ambientes
      if (imagens.length === 1) {
        handleVoltarParaAmbientes();
        fetchAmbientes(paginaAmbientes);
      }
    } catch (err: any) {
      // 4. ROLLBACK - restaura a imagem na posição original
      if (imagemDeletada) {
        setImagens(prev => {
          const novaLista = [...prev];
          novaLista.splice(indexOriginal, 0, imagemDeletada);
          return novaLista;
        });
      }
      toast.error("Erro ao deletar imagem.");
      console.error(err);
    }
  };

  const handlePageChangeAmbientes = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPaginasAmbientes) {
      fetchAmbientes(newPage);
    }
  };

  const handlePageChangeImagens = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPaginas) {
      fetchImagensByAmbiente(newPage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Extrair apenas o nome do ambiente (sem o prefixo numérico)
  const getAmbienteNome = (ambiente: string) => {
    const match = ambiente.match(/^\d+\s*-\s*(.+)$/);
    return match ? match[1] : ambiente;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {ambienteSelecionado ? (
              <Button variant="outline" size="sm" onClick={handleVoltarParaAmbientes}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            ) : (
              <Link to="/dashboard/laudos">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            )}
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Galeria de Imagens
              </h2>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <button 
                  onClick={handleVoltarParaAmbientes}
                  className={`hover:text-primary transition-colors ${!ambienteSelecionado ? 'font-medium text-[var(--text-primary)]' : ''}`}
                  disabled={!ambienteSelecionado}
                >
                  Ambientes
                </button>
                {ambienteSelecionado && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span className="font-medium text-[var(--text-primary)]">
                      {getAmbienteNome(ambienteSelecionado)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : !ambienteSelecionado ? (
          // === MODO AMBIENTES ===
          <>
            {ambientes.length === 0 ? (
              <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                <FolderOpen className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
                <p className="text-[var(--text-secondary)]">
                  Nenhum ambiente com imagens encontrado neste laudo.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {ambientes.map((amb, index) => (
                    <motion.button
                      key={amb.ambiente}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelectAmbiente(amb.ambiente)}
                      className="group relative p-6 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] hover:border-primary/50 hover:shadow-lg transition-all text-left"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <FolderOpen className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-primary)] px-2 py-1 rounded-full">
                          {amb.ordem}
                        </span>
                      </div>
                      <h3 className="font-semibold text-[var(--text-primary)] mb-1 truncate">
                        {getAmbienteNome(amb.ambiente)}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                        <ImageIcon className="w-4 h-4" />
                        <span>{amb.totalImagens} {amb.totalImagens === 1 ? 'imagem' : 'imagens'}</span>
                      </div>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  ))}
                </div>

                {/* Paginação de Ambientes */}
                {totalPaginasAmbientes > 1 && (
                  <div className="flex justify-center mt-8 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChangeAmbientes(paginaAmbientes - 1)}
                      disabled={paginaAmbientes === 1}
                    >
                      Anterior
                    </Button>
                    <span className="flex items-center px-4 text-sm text-[var(--text-secondary)]">
                      Página {paginaAmbientes} de {totalPaginasAmbientes}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChangeAmbientes(paginaAmbientes + 1)}
                      disabled={paginaAmbientes === totalPaginasAmbientes}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          // === MODO IMAGENS ===
          <>
            {imagens.length === 0 ? (
              <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                <p className="text-[var(--text-secondary)]">
                  Nenhuma imagem encontrada neste ambiente.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {imagens.map((img, index) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group relative aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all ${
                        img.categoria === "AVARIA" 
                          ? "border-[3px] border-red-500" 
                          : "border border-[var(--border-color)]"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.tipo || "Imagem do laudo"}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      
                      {/* Badge de Confirmação IA */}
                      {img.imagemJaFoiAnalisadaPelaIa === "sim" && (
                        <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1.5 shadow-lg">
                          <CheckCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                      )}
                      
                      {/* Overlay on Hover */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 flex flex-col justify-between text-white text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{formatDate(img.dataCaptura)}</span>
                        </div>

                        <button
                          onClick={() =>
                            setConfirmDelete({ isOpen: true, imagemId: img.id })
                          }
                          className="w-full py-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/50 rounded flex items-center justify-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Paginação de Imagens */}
                {totalPaginas > 1 && (
                  <div className="flex justify-center mt-8 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChangeImagens(paginaAtual - 1)}
                      disabled={paginaAtual === 1}
                    >
                      Anterior
                    </Button>
                    <span className="flex items-center px-4 text-sm text-[var(--text-secondary)]">
                      Página {paginaAtual} de {totalPaginas}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChangeImagens(paginaAtual + 1)}
                      disabled={paginaAtual === totalPaginas}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        <ConfirmModal
          isOpen={confirmDelete.isOpen}
          onClose={() => setConfirmDelete({ isOpen: false, imagemId: "" })}
          onConfirm={handleDelete}
          title="Excluir Imagem"
          message="Tem certeza que deseja excluir esta imagem? Esta ação não pode ser desfeita e a imagem será removida permanentemente."
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          variant="danger"
        />
      </div>
    </DashboardLayout>
  );
}
