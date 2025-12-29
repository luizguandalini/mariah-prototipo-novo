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
      DEV: "bg-purple-100 text-purple-800",
      ADMIN: "bg-blue-100 text-blue-800",
      USUARIO: "bg-gray-100 text-gray-800",
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
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">
            Gerenciar Usuários
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Total: <span className="font-semibold">{total}</span> usuários
            </div>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              ➕ Novo Usuário
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🔍 Buscar
              </label>
              <input
                type="text"
                placeholder="Nome ou email..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                👤 Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => handleRoleFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="DEV">DEV</option>
                <option value="ADMIN">ADMIN</option>
                <option value="USUARIO">USUARIO</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ✅ Status
              </label>
              <select
                value={ativoFilter === undefined ? "" : ativoFilter.toString()}
                onChange={(e) => handleAtivoFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("");
                  setAtivoFilter(undefined);
                  setPage(1);
                }}
                className="w-full"
              >
                🔄 Limpar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Carregando usuários...
            </div>
          ) : usuarios.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum usuário encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Usuário
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Imagens
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
                  {usuarios.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {user.nome}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.role === "DEV" || user.role === "ADMIN" ? (
                          <span className="text-green-600 font-semibold">
                            ∞ Ilimitado
                          </span>
                        ) : (
                          <span className="font-semibold">
                            {user.quantidadeImagens}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.ativo
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {user.role !== "DEV" && user.role !== "ADMIN" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModalEditarImagens(user)}
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
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4">
            <div className="text-sm text-gray-600">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                📊 Gerenciar Imagens - {editingUser.nome}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade Atual de Imagens
                  </label>
                  <input
                    type="number"
                    value={quantidadeImagens}
                    onChange={(e) =>
                      setQuantidadeImagens(Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantidadeImagens((q) => q + 10)}
                  >
                    +10
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantidadeImagens((q) => q + 50)}
                  >
                    +50
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantidadeImagens((q) => q + 100)}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                ➕ Criar Novo Usuário
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={novoUsuario.nome}
                    onChange={(e) =>
                      setNovoUsuario({ ...novoUsuario, nome: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="João Silva"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={novoUsuario.email}
                    onChange={(e) =>
                      setNovoUsuario({ ...novoUsuario, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="joao@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={novoUsuario.senha}
                    onChange={(e) =>
                      setNovoUsuario({ ...novoUsuario, senha: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USUARIO">USUARIO</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="primary"
                    onClick={handleCriarUsuario}
                    className="flex-1"
                  >
                    ✅ Criar Usuário
                  </Button>
                  <Button
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
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
