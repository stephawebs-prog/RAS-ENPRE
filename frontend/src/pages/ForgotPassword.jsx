import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useI18n } from "@/i18n/I18nContext";

const ForgotPassword = () => {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) { setError(formatApiError(err)); }
    finally { setLoading(false); }
  };

  return (
    <section className="min-h-[80vh] bg-cream flex items-center justify-center py-16">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-200 p-8 md:p-10">
        {sent ? (
          <div className="text-center">
            <CheckCircle2 className="text-orange mx-auto" size={52} />
            <h1 className="font-display text-3xl text-teal-deep mt-4 leading-tight" data-testid="forgot-sent">
              {t.forgot.sentTitle}
            </h1>
            <p className="text-teal-soft mt-3 leading-relaxed">{t.forgot.sentBody}</p>
            <Link to="/login" className="btn-orange mt-6 inline-flex">
              {t.forgot.backToLogin} <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <span className="w-12 h-12 rounded-full bg-orange/15 text-orange mx-auto flex items-center justify-center">
                <Mail size={20} />
              </span>
              <p className="eyebrow text-orange mt-4">{t.forgot.eyebrow}</p>
              <h1 className="font-display text-3xl text-teal-deep mt-1 leading-tight">{t.forgot.title}</h1>
              <p className="text-teal-soft mt-3 text-sm">{t.forgot.subtitle}</p>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-4" data-testid="forgot-form">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.email}</label>
                <input
                  type="email"
                  required
                  autoFocus
                  className="field-input mt-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  data-testid="forgot-email"
                />
              </div>
              {error && <p className="text-red-600 text-sm" data-testid="forgot-error">{error}</p>}
              <button type="submit" disabled={loading} className="btn-orange w-full justify-center" data-testid="forgot-submit">
                {loading ? "…" : t.forgot.sendLink} <ArrowRight size={14} />
              </button>
            </form>

            <p className="text-center text-sm text-teal-soft mt-6">
              <Link to="/login" className="text-orange font-bold hover:underline">
                ← {t.forgot.backToLogin}
              </Link>
            </p>
          </>
        )}
      </div>
    </section>
  );
};

export default ForgotPassword;
