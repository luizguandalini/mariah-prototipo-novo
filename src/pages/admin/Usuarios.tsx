import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import { usersService } from "../../services/users";
import { User } from "../../types/auth";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "DEV" | "ADMIN" | "USUARIO" | ""
  >("");
  const [ativoFilter, setAtivoFilter] = useState<boolean | undefined>(
    undefined
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [quantidadeImagens, setQuantidadeImagens] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({
    nome: "",
    email: "",
    senha: "",
    role: "USUARIO" as "ADMIN" | "USUARIO",
  });

  const limit = 10;

  useEffect(() => {
    carregarUsuarios();
  }, [page, search, roleFilter, ativoFilter]);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };

      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (ativoFilter !== undefined) params.ativo = ativoFilter;

      const response = await usersService.listarUsuarios(params);
      setUsuarios(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); // Reset para primeira página ao filtrar
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value as any);
    setPage(1);
  };

  const handleAtivoFilterChange = (value: string) => {
    if (value === "") {
      setAtivoFilter(undefined);
    } else {
      setAtivoFilter(value === "true");
    }
    setPage(1);
  };

  const abrirModalEditarImagens = (user: User) => {
    setEditingUser(user);
    setQuantidadeImagens(user.quantidadeImagens || 0);
    setShowEditModal(true);
  };

  const handleSetImagens = async () => {
    if (!editingUser) return;

    try {
      await usersService.setQuantidadeImagens(
        editingUser.id,
        quantidadeImagens
      );
      setShowEditModal(false);
      await carregarUsuarios();
    } catch (error) {
      console.error("Erro ao atualizar imagens:", error);
      toast.error("Erro ao atualizar quantidade de imagens");
    }
  };

  const handleAddImagens = async (userId: string, quantidade: number) => {
    try {
      await usersService.addQuantidadeImagens(userId, quantidade);
      await carregarUsuarios();
    } catch (error) {
      console.error("Erro ao adicionar imagens:", error);
      toast.error("Erro ao adicionar imagens");
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      DEV: "bg-purple-200 text-purple-900 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300 dark:border-purple-700 font-bold",
      ADMIN: "bg-blue-200 text-blue-900 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-bold",
      USUARIO: "bg-gray-200 text-gray-900 dark:bg-gray-700/50 dark:text-gray-300 border border-gray-300 dark:border-gray-600",
    };
    return colors[role] || colors.USUARIO;
  };

  const handleCriarUsuario = async () => {
    try {
      await usersService.criarUsuario(novoUsuario);
      setShowCreateModal(false);
      setNovoUsuario({ nome: "", email: "", senha: "", role: "USUARIO" });
      await carregarUsuarios();
      toast.success("Usuário criado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);

      // Tratamento de erros específicos
      const errorMessage = error.response?.data?.message || error.message;

      if (typeof errorMessage === "string") {
        if (
          errorMessage.includes("Email já cadastrado") ||
          errorMessage.includes("já cadastrado")
        ) {
          toast.error("Este email já está cadastrado no sistema!");
        } else if (errorMessage.includes("DEV")) {
          toast.error("Não é permitido criar usuário DEV via interface.");
        } else {
          toast.error(errorMessage);
        }
      } else if (Array.isArray(errorMessage)) {
        toast.error(errorMessage.join(", "));
      } else {
        toast.error(
          "Erro ao criar usuário. Verifique os dados e tente novamente."
        );
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-3 py-1.5 rounded-full border border-[var(--border-color)]">
              Total: <span className="font-bold text-primary">{total}</span> usuários
            </div>
          </div>
          <Button 
            variant="primary" 
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto shadow-lg shadow-primary/20"
          >
            ➕ Novo Usuário
          </Button>
        </div>

        {/* Filtros */}
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-4 transition-colors duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] ml-1">
                🔍 Buscar
              </label>
              <input
                type="text"
                placeholder="Nome ou email..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-[var(--text-secondary)]/50"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] ml-1">
                👤 Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => handleRoleFilterChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              >
                <option value="">Todas as Roles</option>
                <option value="DEV">DEV</option>
                <option value="ADMIN">ADMIN</option>
                <option value="USUARIO">USUÁRIO</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] ml-1">
                ✅ Status
              </label>
              <select
                value={ativoFilter === undefined ? "" : ativoFilter.toString()}
                onChange={(e) => handleAtivoFilterChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              >
                <option value="">Todos os Status</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
            </div>

            <div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("");
                  setAtivoFilter(undefined);
                  setPage(1);
                }}
                className="w-full py-2.5 flex items-center justify-center gap-2"
              >
                <span>🔄</span>
                <span className="sm:hidden lg:inline">Limpar Filtros</span>
                <span className="hidden sm:inline lg:hidden">Limpar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden transition-colors duration-300">
          {loading ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">
              <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-primary rounded-full mb-2" role="status">
                <span className="sr-only">Carregando...</span>
              </div>
              <p>Carregando usuários...</p>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">
              <span className="text-4xl mb-2 block">🤷‍♂️</span>
              <p>Nenhum usuário encontrado</p>
            </div>
          ) : (
            <>
              {/* Vista Desktop (Tabela) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Usuário
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Imagens
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {usuarios.map((user) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-[var(--bg-primary)] transition-colors group"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">
                          {user.nome}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md shadow-sm ${getRoleBadge(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {user.role === "DEV" || user.role === "ADMIN" ? (
                            <span className="text-green-500 font-bold italic flex items-center gap-1">
                              <span>∞</span> Ilimitado
                            </span>
                          ) : (
                            <span className="font-bold text-[var(--text-primary)] bg-[var(--bg-primary)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                              {user.quantidadeImagens}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md shadow-sm ${
                              user.ativo
                                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800"
                                : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800"
                            }`}
                          >
                            {user.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {user.role !== "DEV" && user.role !== "ADMIN" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => abrirModalEditarImagens(user)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                📊 Imagens
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista Mobile (Cards) */}
              <div className="md:hidden divide-y divide-[var(--border-color)]">
                {usuarios.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 space-y-3 bg-[var(--bg-secondary)]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-bold text-[var(--text-primary)] break-words">
                          {user.nome}
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] break-all px-2 py-1 bg-[var(--bg-primary)] rounded border border-[var(--border-color)] inline-block">
                          {user.email}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md shadow-sm ${
                          user.ativo
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800"
                            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800"
                        }`}
                      >
                        {user.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)]/50">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md shadow-sm ${getRoleBadge(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                        <div className="text-[10px] font-bold uppercase flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-md border border-[var(--border-color)]">
                          <span>📦</span>
                          {user.role === "DEV" || user.role === "ADMIN" ? (
                            <span className="text-green-500 italic">∞</span>
                          ) : (
                            <span>{user.quantidadeImagens} imgs</span>
                          )}
                        </div>
                      </div>
                      
                      {user.role !== "DEV" && user.role !== "ADMIN" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirModalEditarImagens(user)}
                          className="py-1 px-3 text-xs"
                        >
                          📊 Créditos
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] px-6 py-4 transition-colors">
            <div className="text-sm text-[var(--text-secondary)]">
              Página {page} de {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próxima →
              </Button>
            </div>
          </div>
        )}

        {/* Modal Editar Imagens */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl p-6 max-w-md w-full transition-colors duration-300"
            >
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                📊 Gerenciar Imagens - {editingUser.nome}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Quantidade Atual de Imagens
                  </label>
                  <input
                    type="number"
                    value={quantidadeImagens}
                    onChange={(e) =>
                      setQuantidadeImagens(Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    min="0"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantidadeImagens((q) => q + 10)}
                    className="flex-1"
                  >
                    +10
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantidadeImagens((q) => q + 50)}
                    className="flex-1"
                  >
                    +50
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantidadeImagens((q) => q + 100)}
                    className="flex-1"
                  >
                    +100
                  </Button>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="primary"
                    onClick={handleSetImagens}
                    className="flex-1"
                  >
                    ✅ Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1"
                  >
                    ❌ Cancelar
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Criar Usuário */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl p-6 max-w-md w-full transition-colors duration-300"
            >
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                ➕ Criar Novo Usuário
              </h3>

              <form onSubmit={(e) => { e.preventDefault(); handleCriarUsuario(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={novoUsuario.nome}
                    onChange={(e) =>
                      setNovoUsuario({ ...novoUsuario, nome: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="João Silva"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={novoUsuario.email}
                    onChange={(e) =>
                      setNovoUsuario({ ...novoUsuario, email: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="joao@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={novoUsuario.senha}
                    onChange={(e) =>
                      setNovoUsuario({ ...novoUsuario, senha: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Nível de Acesso
                  </label>
                  <select
                    value={novoUsuario.role}
                    onChange={(e) =>
                      setNovoUsuario({
                        ...novoUsuario,
                        role: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                  >
                    <option value="USUARIO">USUARIO</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? "Criando..." : "✅ Criar Usuário"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNovoUsuario({
                        nome: "",
                        email: "",
                        senha: "",
                        role: "USUARIO",
                      });
                    }}
                    className="flex-1"
                  >
                    ❌ Cancelar
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
