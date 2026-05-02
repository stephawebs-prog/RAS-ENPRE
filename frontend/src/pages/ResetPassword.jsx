import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useI18n } from "@/i18n/I18nContext";

const ResetPassword = () => {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (password !== password2) { setError(t.fields.passwordsDoNotMatch); return; }
    if (password.length < 6) { setError("Mínimo 6 caracteres."); return; }
    setLoading(true); setError("");
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) { setError(formatApiError(err)); }
    finally { setLoading(false); }
  };

  if (!token) {
    return (
      <section className="min-h-[80vh] bg-cream flex items-center justify-center py-16">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-200 p-8 md:p-10 text-center">
          <AlertCircle className="text-red-500 mx-auto" size={48} />
          <h1 className="font-display text-2xl text-teal-deep mt-4">{t.reset.invalidTitle}</h1>
          <p className="text-teal-soft mt-2 text-sm">{t.reset.invalidBody}</p>
          <Link to="/forgot-password" className="btn-orange mt-6 inline-flex">
            {t.forgot.title} <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[80vh] bg-cream flex items-center justify-center py-16">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-200 p-8 md:p-10">
        {done ? (
          <div className="text-center">
            <CheckCircle2 className="text-orange mx-auto" size={52} />
            <h1 className="font-display text-3xl text-teal-deep mt-4 leading-tight" data-testid="reset-done">
              {t.reset.doneTitle}
            </h1>
            <p className="text-teal-soft mt-3 leading-relaxed">{t.reset.doneBody}</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <span className="w-12 h-12 rounded-full bg-orange/15 text-orange mx-auto flex items-center justify-center">
                <Lock size={20} />
              </span>
              <p className="eyebrow text-orange mt-4">{t.reset.eyebrow}</p>
              <h1 className="font-display text-3xl text-teal-deep mt-1 leading-tight">{t.reset.title}</h1>
              <p className="text-teal-soft mt-3 text-sm">{t.reset.subtitle}</p>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-4" data-testid="reset-form">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.reset.newPassword}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoFocus
                  className="field-input mt-1"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="reset-password"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.reset.confirmPassword}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="field-input mt-1"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  data-testid="reset-password2"
                />
              </div>
              {error && <p className="text-red-600 text-sm" data-testid="reset-error">{error}</p>}
              <button type="submit" disabled={loading} className="btn-orange w-full justify-center" data-testid="reset-submit">
                {loading ? "…" : t.reset.submit} <ArrowRight size={14} />
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
};

export default ResetPassword;
