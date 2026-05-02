import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { I18nProvider } from "@/i18n/I18nContext";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import useAnalytics from "@/hooks/useAnalytics";
import { PageShell } from "@/components/Layout";
import Home from "@/pages/Home";
import Directory from "@/pages/Directory";
import ProfileDetail from "@/pages/ProfileDetail";
import Login from "@/pages/Login";
import RegisterChoice from "@/pages/RegisterChoice";
import RegisterClient from "@/pages/RegisterClient";
import Register from "@/pages/Register";
import RegisterEntity from "@/pages/RegisterEntity";
import Dashboard from "@/pages/Dashboard";
import EntityDashboard from "@/pages/EntityDashboard";
import ClientDashboard from "@/pages/ClientDashboard";
import AdminPanel from "@/pages/AdminPanel";
import Events from "@/pages/Events";
import About from "@/pages/About";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

const Stand = ({ children }) => <PageShell>{children}</PageShell>;

const AnalyticsTracker = () => { useAnalytics(); return null; };

const SmartDashboard = () => {
  const { user } = useAuth();
  if (user === null) return <div className="container-tight py-24 text-center text-teal-soft">…</div>;
  if (user === false) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "entrepreneur") return <Dashboard />;
  if (user.role === "entity") return <EntityDashboard />;
  return <ClientDashboard />;
};

const ContactRedirect = () => { React.useEffect(() => { window.location.href = "/#contact"; }, []); return null; };

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <AnalyticsTracker />
          <Routes>
            <Route path="/" element={<Stand><Home /></Stand>} />
            <Route path="/directory" element={<Stand><Directory /></Stand>} />
            <Route path="/eventos" element={<Stand><Events /></Stand>} />
            <Route path="/events" element={<Stand><Events /></Stand>} />
            <Route path="/conocenos" element={<Stand><About /></Stand>} />
            <Route path="/about" element={<Stand><About /></Stand>} />
            <Route path="/entrepreneur/:id" element={<Stand><ProfileDetail /></Stand>} />
            <Route path="/login" element={<Stand><Login /></Stand>} />
            <Route path="/register" element={<Stand><RegisterChoice /></Stand>} />
            <Route path="/register/client" element={<Stand><RegisterClient /></Stand>} />
            <Route path="/register/business" element={<Stand><Register /></Stand>} />
            <Route path="/register/entity" element={<Stand><RegisterEntity /></Stand>} />
            <Route path="/forgot-password" element={<Stand><ForgotPassword /></Stand>} />
            <Route path="/reset-password" element={<Stand><ResetPassword /></Stand>} />
            <Route path="/dashboard" element={<Stand><SmartDashboard /></Stand>} />
            <Route path="/entity" element={<Stand><EntityDashboard /></Stand>} />
            <Route path="/admin" element={<Stand><AdminPanel /></Stand>} />
            <Route path="/contact" element={<Stand><ContactRedirect /></Stand>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
