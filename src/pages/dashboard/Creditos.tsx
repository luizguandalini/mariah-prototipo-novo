import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import FormularioPlano from '../../components/dashboard/FormularioPlano';
import { planosService } from '../../services/planos';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import type { Plano, CreatePlanoDto, UpdatePlanoDto } from '../../types/planos';

export default function Creditos() {
  const { user } = useAuth();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editandoPlano, setEditandoPlano] = useState<Plano | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const isAdminOrDev = user?.role === UserRole.ADMIN || user?.role === UserRole.DEV;

  useEffect(() => {
    carregarPlanos();
  }, []);

  const carregarPlanos = async () => {
    try {
      setIsLoading(true);
      const data = await planosService.getPlanos();
      setPlanos(data);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlano = async (data: CreatePlanoDto) => {
    try {
      await planosService.createPlano(data);
      toast.success('Plano criado com sucesso!');
      setMostrarFormulario(false);
      await carregarPlanos();
    } catch (error: any) {
      console.error('Erro ao criar plano:', error);
      const mensagem = error.response?.data?.message || 'Erro ao criar plano';
      toast.error(mensagem);
      throw error;
    }
  };

  const handleUpdatePlano = async (data: UpdatePlanoDto) => {
    if (!editandoPlano) return;

    try {
      await planosService.updatePlano(editandoPlano.id, data);
      toast.success('Plano atualizado com sucesso!');
      setEditandoPlano(null);
      await carregarPlanos();
    } catch (error: any) {
      console.error('Erro ao atualizar plano:', error);
      const mensagem = error.response?.data?.message || 'Erro ao atualizar plano';
      toast.error(mensagem);
      throw error;
    }
  };

  const handleDeletePlano = async (plano: Plano) => {
    if (!confirm(`Tem certeza que deseja deletar o plano "${plano.nome}"?`)) {
      return;
    }

    try {
      await planosService.deletePlano(plano.id);
      toast.success('Plano deletado com sucesso!');
      await carregarPlanos();
    } catch (error: any) {
      console.error('Erro ao deletar plano:', error);
      const mensagem = error.response?.data?.message || 'Erro ao deletar plano';
      toast.error(mensagem);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
          {/* Título removido por ser redundante com o header */}
          {isAdminOrDev && !editandoPlano && (
            <Button
              variant="primary"
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className="w-full sm:w-auto shadow-lg shadow-primary/20"
            >
              {mostrarFormulario ? '❌ Cancelar' : '✨ Novo Plano'}
            </Button>
          )}
        </div>

        {/* Saldo de Créditos do Usuário */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-dark rounded-2xl p-6 sm:p-10 text-white shadow-xl shadow-primary/20">
          <div className="relative z-10">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-primary-foreground/80 mb-2">
              Saldo em Conta
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
              <span className="text-5xl sm:text-7xl font-black tracking-tight">
                {user?.quantidadeImagens?.toLocaleString() || 0}
              </span>
              <span className="text-primary-foreground/70 font-medium text-lg sm:text-2xl">
                imagens disponíveis
              </span>
            </div>
          </div>
          {/* Efeitos Decorativos */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-black/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Formulário de Criação/Edição (Admin/Dev) */}
        {isAdminOrDev && (mostrarFormulario || editandoPlano) && (
          <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              {editandoPlano ? 'Editar Plano' : 'Criar Novo Plano'}
            </h3>
            <FormularioPlano
              planoEdit={editandoPlano || undefined}
              onSubmit={editandoPlano ? handleUpdatePlano : handleCreatePlano}
              onCancel={() => {
                setEditandoPlano(null);
                setMostrarFormulario(false);
              }}
            />
          </div>
        )}

        {/* Lista de Planos */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-sm border border-[var(--border-color)] p-5 sm:p-8 transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              {isAdminOrDev ? 'Gerenciar Planos' : 'Planos Disponíveis'}
            </h3>
          </div>

          {isLoading ? (
            <p className="text-[var(--text-secondary)]">Carregando planos...</p>
          ) : planos.length === 0 ? (
            <p className="text-[var(--text-secondary)]">Nenhum plano disponível no momento.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {planos.map((plano) => (
                <div
                  key={plano.id}
                  className="group relative border border-[var(--border-color)] rounded-xl p-6 bg-[var(--bg-primary)] transition-all hover:border-primary hover:shadow-xl hover:shadow-primary/5"
                >
                  <h4 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                    {plano.nome}
                  </h4>
                  {plano.subtitulo && (
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-4 uppercase tracking-wider">
                      {plano.subtitulo}
                    </p>
                  )}
                  <div className="mb-6 bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]/50 group-hover:border-primary/30 transition-colors">
                    <p className="text-4xl font-black text-[var(--text-primary)] leading-none">
                      {plano.quantidadeImagens}
                    </p>
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mt-1">Imagens Analisadas</p>
                  </div>
                  {plano.preco !== null && plano.preco !== undefined && (
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-sm font-bold text-primary">R$</span>
                      <span className="text-3xl font-black text-primary">
                        {Number(plano.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {isAdminOrDev ? (
                    /* Botões Admin/Dev */
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setEditandoPlano(plano);
                          setMostrarFormulario(false);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleDeletePlano(plano)}
                      >
                        Deletar
                      </Button>
                    </div>
                  ) : (
                    /* Botão Usuário Comum (desabilitado) */
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      disabled
                      title="Compra de créditos em breve"
                    >
                      Em breve
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
