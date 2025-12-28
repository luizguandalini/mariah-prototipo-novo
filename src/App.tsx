import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Dashboard User
import Dashboard from "./pages/dashboard/Dashboard";
import MeusLaudos from "./pages/dashboard/MeusLaudos";
import NovoLaudo from "./pages/dashboard/NovoLaudo";
import LaudoPreview from "./pages/dashboard/LaudoPreview";
import Perfil from "./pages/dashboard/Perfil";
import Creditos from "./pages/dashboard/Creditos";
import Pagamentos from "./pages/dashboard/Pagamentos";
import Suporte from "./pages/dashboard/Suporte";

// Dashboard Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import Usuarios from "./pages/admin/Usuarios";
import TodosLaudos from "./pages/admin/TodosLaudos";
import PDFSettings from "./pages/admin/PDFSettings";
import GerenciarAmbientes from "./pages/admin/GerenciarAmbientes";
import GerenciarDetalhesLaudo from "./pages/admin/GerenciarDetalhesLaudo";

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors expand={true} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />

        {/* User Dashboard Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/laudos" element={<MeusLaudos />} />
        <Route
          path="/dashboard/laudos/:id/preview"
          element={<LaudoPreview />}
        />
        <Route path="/dashboard/novo-laudo" element={<NovoLaudo />} />
        <Route path="/dashboard/perfil" element={<Perfil />} />
        <Route path="/dashboard/creditos" element={<Creditos />} />
        <Route path="/dashboard/pagamentos" element={<Pagamentos />} />
        <Route path="/dashboard/suporte" element={<Suporte />} />

        {/* Admin Dashboard Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/usuarios" element={<Usuarios />} />
        <Route path="/admin/laudos" element={<TodosLaudos />} />
        <Route path="/admin/pdf-settings" element={<PDFSettings />} />
        <Route path="/admin/ambientes" element={<GerenciarAmbientes />} />
        <Route
          path="/admin/detalhes-laudo"
          element={<GerenciarDetalhesLaudo />}
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
