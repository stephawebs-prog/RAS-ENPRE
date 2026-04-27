import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/auth/AuthContext";
import { formatApiError } from "@/lib/api";

const Login = () => {
  const { t } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await login(form.email, form.password);
      const next = location.state?.from || "/dashboard";
      navigate(next);
    } catch (err) { setError(formatApiError(err)); }
    finally { setLoading(false); }
  };

  return (
    <section className="min-h-[80vh] bg-cream flex items-center justify-center py-16">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-200 p-8 md:p-10">
        <p className="eyebrow text-orange">{t.nav.login}</p>
        <h1 className="font-display text-4xl text-teal-deep mt-3 leading-tight">{t.auth.loginTitle}</h1>
        <p className="text-teal-soft mt-2">{t.auth.loginSub}</p>
        <form onSubmit={submit} className="mt-8 space-y-4" data-testid="login-form">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.email}</label>
            <input type="email" required className="field-input mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="login-email" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.password}</label>
            <input type="password" required className="field-input mt-1" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="login-password" />
          </div>
          {error && <p className="text-sm text-red-600" data-testid="login-error">{error}</p>}
          <button type="submit" disabled={loading} className="btn-orange w-full justify-center" data-testid="login-submit">
            {loading ? "…" : t.auth.login}
          </button>
        </form>
        <p className="text-sm text-teal-soft mt-6 text-center">
          {t.auth.noAccount} <Link to="/register" className="text-orange font-bold hover:underline">{t.auth.registerLink}</Link>
        </p>
      </div>
    </section>
  );
};

export default Login;
