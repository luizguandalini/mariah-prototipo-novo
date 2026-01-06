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
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] transition-colors">
            Créditos
          </h2>
          {isAdminOrDev && !editandoPlano && (
            <Button
              variant="primary"
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
            >
              {mostrarFormulario ? 'Cancelar' : '+ Novo Plano'}
            </Button>
          )}
        </div>

        {/* Saldo de Créditos do Usuário */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-8 text-white">
          <h3 className="text-xl font-bold mb-4">Seus Créditos</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-bold">{user?.quantidadeImagens || 0}</p>
            <p className="text-purple-200 text-lg">imagens disponíveis</p>
          </div>
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
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
            {isAdminOrDev ? 'Gerenciar Planos' : 'Planos Disponíveis'}
          </h3>

          {isLoading ? (
            <p className="text-[var(--text-secondary)]">Carregando planos...</p>
          ) : planos.length === 0 ? (
            <p className="text-[var(--text-secondary)]">Nenhum plano disponível no momento.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {planos.map((plano) => (
                <div
                  key={plano.id}
                  className="border-2 border-[var(--border-color)] rounded-lg p-6 bg-[var(--bg-primary)] transition-all hover:border-primary"
                >
                  <h4 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                    {plano.nome}
                  </h4>
                  {plano.subtitulo && (
                    <p className="text-sm text-[var(--text-secondary)] mb-3">
                      {plano.subtitulo}
                    </p>
                  )}
                  <div className="mb-4">
                    <p className="text-4xl font-bold text-[var(--text-primary)]">
                      {plano.quantidadeImagens}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">imagens</p>
                  </div>
                  {plano.preco !== null && plano.preco !== undefined && (
                    <p className="text-2xl font-bold text-primary mb-4">
                      R$ {Number(plano.preco).toFixed(2)}
                    </p>
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
