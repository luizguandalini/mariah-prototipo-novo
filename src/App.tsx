import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/routing/ProtectedRoute";

// Dashboard User
import Dashboard from "./pages/dashboard/Dashboard";
import MeusLaudos from "./pages/dashboard/MeusLaudos";

import LaudoPreview from "./pages/dashboard/LaudoPreview";
import Perfil from "./pages/dashboard/Perfil";
import Creditos from "./pages/dashboard/Creditos";
import Pagamentos from "./pages/dashboard/Pagamentos";

import GaleriaImagens from "./pages/dashboard/GaleriaImagens";
import VisualizadorPdfLaudo from "./pages/dashboard/VisualizadorPdfLaudo";

// Dashboard Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import Usuarios from "./pages/admin/Usuarios";
import TodosLaudos from "./pages/admin/TodosLaudos";
import GerenciarAmbientes from "./pages/admin/GerenciarAmbientes";
import GerenciarDetalhesLaudo from "./pages/admin/GerenciarDetalhesLaudo";
import ConfiguracoesIA from "./pages/admin/ConfiguracoesIA";

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

          {/* User Dashboard Routes - Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/laudos" element={<ProtectedRoute><MeusLaudos /></ProtectedRoute>} />
          <Route
            path="/dashboard/laudos/:id/preview"
            element={<ProtectedRoute><LaudoPreview /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/laudos/:id/galeria"
            element={<ProtectedRoute><GaleriaImagens /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/laudos/:id/pdf"
            element={<ProtectedRoute><VisualizadorPdfLaudo /></ProtectedRoute>}
          />

          <Route path="/dashboard/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
          <Route path="/dashboard/creditos" element={<ProtectedRoute><Creditos /></ProtectedRoute>} />
          <Route path="/dashboard/pagamentos" element={<ProtectedRoute><Pagamentos /></ProtectedRoute>} />


          {/* Admin Dashboard Routes - Protected with Admin requirement */}
          <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/usuarios" element={<ProtectedRoute requireAdmin><Usuarios /></ProtectedRoute>} />
          <Route path="/admin/laudos" element={<ProtectedRoute requireAdmin><TodosLaudos /></ProtectedRoute>} />
          <Route path="/admin/ambientes" element={<ProtectedRoute requireAdmin><GerenciarAmbientes /></ProtectedRoute>} />
          <Route
            path="/admin/detalhes-laudo"
            element={<ProtectedRoute requireAdmin><GerenciarDetalhesLaudo /></ProtectedRoute>}
          />
          <Route
            path="/admin/configuracoes-ia"
            element={<ProtectedRoute requireAdmin><ConfiguracoesIA /></ProtectedRoute>}
          />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
