import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Calendar, MapPin, Tag, Info } from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { laudosService, type ImagemLaudo } from "../../services/laudos";
import { toast } from "sonner";

export default function GaleriaImagens() {
  const { id } = useParams<{ id: string }>();
  const [imagens, setImagens] = useState<ImagemLaudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limit = 20;

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    imagemId: string;
  }>({ isOpen: false, imagemId: "" });

  useEffect(() => {
    if (id) {
      fetchImagens(1);
    }
  }, [id]);

  const fetchImagens = async (page: number) => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await laudosService.getImagens(id, page, limit);
      setImagens(res.data);
      setTotalPaginas(res.lastPage);
      setPaginaAtual(res.page);
    } catch (err: any) {
      setError("Erro ao carregar imagens.");
      console.error(err);
      toast.error("Não foi possível carregar a galeria.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await laudosService.deleteImagem(confirmDelete.imagemId);
      toast.success("Imagem deletiada com sucesso!");
      setConfirmDelete({ isOpen: false, imagemId: "" });
      fetchImagens(paginaAtual); // Recarrega a página atual
    } catch (err: any) {
      toast.error("Erro ao deletar imagem.");
      console.error(err);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPaginas) {
      fetchImagens(newPage);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard/laudos">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Galeria de Imagens
              </h2>
              <p className="text-[var(--text-secondary)]">
                Gerencie as fotos do laudo
              </p>
            </div>
          </div>
          {/* Pode adicionar um botão de upload aqui futuramente */}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : imagens.length === 0 ? (
          <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
            <p className="text-[var(--text-secondary)]">
              Nenhuma imagem encontrada neste laudo.
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
                  className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all"
                >
                  <img
                    src={img.url}
                    alt={img.descricao || "Imagem do laudo"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 flex flex-col justify-between text-white text-xs overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                       {img.ambiente && (
                        <div className="flex items-start gap-2">
                            <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
                            <span className="font-medium">{img.ambiente}</span>
                        </div>
                       )}
                       {img.categoria && (
                        <div className="flex items-center gap-2">
                            <Tag className="w-3 h-3 shrink-0 text-blue-400" />
                            <span>{img.categoria}</span>
                        </div>
                       )}
                       {img.descricao && (
                        <div className="flex items-start gap-2">
                            <Info className="w-3 h-3 mt-0.5 shrink-0 text-yellow-400" />
                            <span className="line-clamp-3">{img.descricao}</span>
                        </div>
                       )}
                       <div className="flex items-center gap-2 text-gray-400 pt-2 border-t border-white/10 mt-2">
                           <Calendar className="w-3 h-3" />
                           <span>{formatDate(img.dataCaptura)}</span>
                       </div>
                    </div>

                    <button
                      onClick={() =>
                        setConfirmDelete({ isOpen: true, imagemId: img.id })
                      }
                      className="mt-3 w-full py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/50 rounded flex items-center justify-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(paginaAtual - 1)}
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
                  onClick={() => handlePageChange(paginaAtual + 1)}
                  disabled={paginaAtual === totalPaginas}
                >
                  Próxima
                </Button>
              </div>
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
