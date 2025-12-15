import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import EscolasPage from "./pages/admin/EscolasPage";
import ProfessoresPage from "./pages/admin/ProfessoresPage";
import AAPsPage from "./pages/admin/AAPsPage";
import ProgramacaoPage from "./pages/admin/ProgramacaoPage";
import RegistrosPage from "./pages/admin/RegistrosPage";
import RelatoriosPage from "./pages/admin/RelatoriosPage";
import AAPRegistrarAcaoPage from "./pages/aap/AAPRegistrarAcaoPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Admin Routes */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/escolas" element={<EscolasPage />} />
              <Route path="/professores" element={<ProfessoresPage />} />
              <Route path="/aaps" element={<AAPsPage />} />
              <Route path="/programacao" element={<ProgramacaoPage />} />
              <Route path="/registros" element={<RegistrosPage />} />
              <Route path="/relatorios" element={<RelatoriosPage />} />
              
              {/* AAP Routes */}
              <Route path="/aap/dashboard" element={<AdminDashboard />} />
              <Route path="/aap/calendario" element={<ProgramacaoPage />} />
              <Route path="/aap/registrar" element={<AAPRegistrarAcaoPage />} />
              <Route path="/aap/historico" element={<RegistrosPage />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
