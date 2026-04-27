import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/auth/AuthContext";
import api, { formatApiError } from "@/lib/api";

const blank = {
  email: "", password: "", full_name: "", phone: "", city: "", state: "", interests: [], source: "",
};

const SOURCE_KEYS = ["Roxxi", "TRC", "UMAPT", "Google", "Social", "Other"];

const RegisterClient = () => {
  const { t } = useI18n();
  const { setProfile, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const categoryKeys = useMemo(() => Object.keys(t.categories), [t]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleInterest = (k) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(k) ? f.interests.filter((x) => x !== k) : [...f.interests, k],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/register-client", form);
      if (data.access_token) localStorage.setItem("red.token", data.access_token);
      // refresh auth state by calling login flow context (we already have token)
      // Use the AuthContext setters via a quick login round-trip
      try { await login(form.email, form.password); } catch (_) {}
      setDone(true);
    } catch (err) { setError(formatApiError(err)); }
    finally { setLoading(false); }
  };

  if (done) {
    return (
      <section className="min-h-[80vh] bg-cream flex items-center justify-center py-20">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-gray-200 p-10 text-center">
          <CheckCircle2 className="text-orange mx-auto" size={56} />
          <h1 className="font-display text-4xl text-teal-deep mt-4 leading-tight" data-testid="client-success">
            {t.auth.successTitle}
          </h1>
          <p className="text-teal-soft mt-3">{t.auth.successSub}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate("/directory")} className="btn-orange">{t.auth.goDirectory}</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[80vh] bg-cream py-16">
      <div className="container-tight max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 md:p-10">
          <p className="eyebrow text-orange">{t.paywall.asClient}</p>
          <h1 className="font-display text-4xl text-teal-deep mt-2 leading-tight">{t.auth.clientTitle}</h1>
          <p className="text-teal-soft mt-2">{t.auth.clientSub}</p>

          <form onSubmit={submit} className="mt-8 space-y-5" data-testid="client-form">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.fullName}</label>
                <input required className="field-input mt-1" value={form.full_name} onChange={set("full_name")} data-testid="client-name" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.email}</label>
                <input type="email" required className="field-input mt-1" value={form.email} onChange={set("email")} data-testid="client-email" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.password}</label>
                <input type="password" required minLength={6} className="field-input mt-1" value={form.password} onChange={set("password")} data-testid="client-password" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.phone}</label>
                <input required className="field-input mt-1" value={form.phone} onChange={set("phone")} data-testid="client-phone" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.city}</label>
                <input required className="field-input mt-1" value={form.city} onChange={set("city")} data-testid="client-city" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.state}</label>
                <input className="field-input mt-1" value={form.state} onChange={set("state")} />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.interests}</label>
              <p className="text-xs text-teal-soft mt-1">{t.auth.interestsHint}</p>
              <div className="flex flex-wrap gap-2 mt-3" data-testid="client-interests">
                {categoryKeys.map((k) => (
                  <button
                    key={k} type="button" onClick={() => toggleInterest(k)}
                    className={`chip ${form.interests.includes(k) ? "active" : ""}`}
                    data-testid={`interest-${k}`}
                  >
                    {t.categories[k]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.source}</label>
              <select className="field-input mt-1" value={form.source} onChange={set("source")} data-testid="client-source">
                <option value="">—</option>
                {SOURCE_KEYS.map((k) => (<option key={k} value={k}>{t.auth.sources[k]}</option>))}
              </select>
              <p className="text-xs text-teal-soft mt-1">{t.auth.sourceHint}</p>
            </div>

            {error && <p className="text-sm text-red-600" data-testid="client-error">{error}</p>}

            <button type="submit" disabled={loading} className="btn-orange w-full justify-center" data-testid="client-submit">
              {loading ? "…" : t.auth.clientSubmit} <ArrowRight size={14} />
            </button>
          </form>

          <p className="text-sm text-teal-soft mt-6 text-center">
            {t.auth.hasAccount} <Link to="/login" className="text-orange font-bold hover:underline">{t.auth.loginLink}</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default RegisterClient;
