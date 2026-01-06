import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Dashboard User
import Dashboard from "./pages/dashboard/Dashboard";
import MeusLaudos from "./pages/dashboard/MeusLaudos";

import LaudoPreview from "./pages/dashboard/LaudoPreview";
import Perfil from "./pages/dashboard/Perfil";
import Creditos from "./pages/dashboard/Creditos";
import Pagamentos from "./pages/dashboard/Pagamentos";
import Suporte from "./pages/dashboard/Suporte";
import GaleriaImagens from "./pages/dashboard/GaleriaImagens";
import VisualizadorPdfLaudo from "./pages/dashboard/VisualizadorPdfLaudo";

// Dashboard Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import Usuarios from "./pages/admin/Usuarios";
import TodosLaudos from "./pages/admin/TodosLaudos";
import GerenciarAmbientes from "./pages/admin/GerenciarAmbientes";
import GerenciarDetalhesLaudo from "./pages/admin/GerenciarDetalhesLaudo";

function App() {
  return (
    <ThemeProvider>
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
          <Route
            path="/dashboard/laudos/:id/galeria"
            element={<GaleriaImagens />}
          />
          <Route
            path="/dashboard/laudos/:id/pdf"
            element={<VisualizadorPdfLaudo />}
          />

          <Route path="/dashboard/perfil" element={<Perfil />} />
          <Route path="/dashboard/creditos" element={<Creditos />} />
          <Route path="/dashboard/pagamentos" element={<Pagamentos />} />
          <Route path="/dashboard/suporte" element={<Suporte />} />

          {/* Admin Dashboard Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/usuarios" element={<Usuarios />} />
          <Route path="/admin/laudos" element={<TodosLaudos />} />
          <Route path="/admin/ambientes" element={<GerenciarAmbientes />} />
          <Route
            path="/admin/detalhes-laudo"
            element={<GerenciarDetalhesLaudo />}
          />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
