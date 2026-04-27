import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { I18nProvider } from "@/i18n/I18nContext";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { PageShell } from "@/components/Layout";
import Home from "@/pages/Home";
import Directory from "@/pages/Directory";
import ProfileDetail from "@/pages/ProfileDetail";
import Login from "@/pages/Login";
import RegisterChoice from "@/pages/RegisterChoice";
import RegisterClient from "@/pages/RegisterClient";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import AdminPanel from "@/pages/AdminPanel";

const Stand = ({ children }) => <PageShell>{children}</PageShell>;

const SmartDashboard = () => {
  const { user } = useAuth();
  if (user === null) return <div className="container-tight py-24 text-center text-teal-soft">…</div>;
  if (user === false) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "entrepreneur") return <Dashboard />;
  // client → directory
  return <Navigate to="/directory" replace />;
};

const About = () => { React.useEffect(() => { window.location.href = "/#about"; }, []); return null; };
const Contact = () => { React.useEffect(() => { window.location.href = "/#contact"; }, []); return null; };

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Stand><Home /></Stand>} />
            <Route path="/directory" element={<Stand><Directory /></Stand>} />
            <Route path="/entrepreneur/:id" element={<Stand><ProfileDetail /></Stand>} />
            <Route path="/login" element={<Stand><Login /></Stand>} />
            <Route path="/register" element={<Stand><RegisterChoice /></Stand>} />
            <Route path="/register/client" element={<Stand><RegisterClient /></Stand>} />
            <Route path="/register/business" element={<Stand><Register /></Stand>} />
            <Route path="/dashboard" element={<Stand><SmartDashboard /></Stand>} />
            <Route path="/admin" element={<Stand><AdminPanel /></Stand>} />
            <Route path="/about" element={<Stand><About /></Stand>} />
            <Route path="/contact" element={<Stand><Contact /></Stand>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
