import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/auth/AuthContext";
import { formatApiError } from "@/lib/api";

const blank = {
  email: "", password: "",
  business_name: "", owner_name: "", category: "other", description: "",
  phone: "", city: "", state: "", country: "USA", address: "",
  website: "", logo_url: "", cover_url: "",
  facebook: "", instagram: "", twitter: "", whatsapp: "",
  source: "",
};

const SOURCE_KEYS = ["Roxxi", "TRC", "UMAPT", "Google", "Social", "Other"];

const Register = () => {
  const { t } = useI18n();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const categoryKeys = useMemo(() => Object.keys(t.categories), [t]);

  const stepValid = () => {
    if (step === 0) return form.email && form.password.length >= 6;
    if (step === 1) return form.business_name && form.owner_name && form.category && form.description.length >= 10 && form.phone && form.city;
    return true;
  };

  const next = () => { if (stepValid()) setStep((s) => Math.min(s + 1, 2)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async (e) => {
    e.preventDefault();
    // Guard: if not on final step, only advance to next step (prevents Enter-to-submit bugs)
    if (step < 2) {
      if (stepValid()) setStep((s) => s + 1);
      return;
    }
    setError(""); setLoading(true);
    try {
      await register(form);
      setDone(true);
    } catch (err) {
      setError(formatApiError(err));
      // jump back to step that has the error
      if (String(err?.response?.data?.detail || "").toLowerCase().includes("email")) setStep(0);
    } finally { setLoading(false); }
  };

  if (done) {
    return (
      <section className="min-h-[80vh] bg-cream flex items-center justify-center py-20">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-gray-200 p-10 text-center">
          <CheckCircle2 className="text-orange mx-auto" size={56} />
          <h1 className="font-display text-4xl text-teal-deep mt-4 leading-tight" data-testid="register-success">{t.auth.successTitle}</h1>
          <p className="text-teal-soft mt-3">{t.auth.successSub}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate("/dashboard")} className="btn-orange">{t.auth.goDashboard}</button>
          </div>
        </div>
      </section>
    );
  }

  const StepHeader = () => (
    <div className="flex items-center gap-3 mb-8">
      {[t.auth.step1, t.auth.step2, t.auth.step3].map((label, i) => {
        const cls = step === i ? "active" : i < step ? "done" : "todo";
        return (
          <div key={i} className="flex items-center gap-2">
            <span className={`step-dot ${cls}`}>{i < step ? "✓" : i + 1}</span>
            <span className={`text-sm font-bold uppercase tracking-wider ${i === step ? "text-orange" : "text-teal-soft"}`}>{label}</span>
            {i < 2 && <span className="w-6 h-px bg-gray-300 mx-1" />}
          </div>
        );
      })}
    </div>
  );

  return (
    <section className="min-h-[80vh] bg-cream py-16">
      <div className="container-tight">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-200 p-8 md:p-10">
          <p className="eyebrow text-orange">{t.nav.register}</p>
          <h1 className="font-display text-4xl text-teal-deep mt-2 leading-tight">{t.auth.registerTitle}</h1>
          <p className="text-teal-soft mt-2">{t.auth.registerSub}</p>

          <div className="mt-8"><StepHeader /></div>

          <form onSubmit={submit} className="space-y-5" data-testid="register-form">
            {step === 0 && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.email}</label>
                  <input type="email" required className="field-input mt-1" value={form.email} onChange={set("email")} data-testid="reg-email" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.password}</label>
                  <input type="password" required minLength={6} className="field-input mt-1" value={form.password} onChange={set("password")} data-testid="reg-password" />
                  <p className="text-xs text-teal-soft mt-1">min 6 characters</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.source}</label>
                  <select className="field-input mt-1" value={form.source} onChange={set("source")} data-testid="reg-source">
                    <option value="">—</option>
                    {SOURCE_KEYS.map((k) => (<option key={k} value={k}>{t.auth.sources[k]}</option>))}
                  </select>
                  <p className="text-xs text-teal-soft mt-1">{t.auth.sourceHint}</p>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.businessName}</label>
                    <input required className="field-input mt-1" value={form.business_name} onChange={set("business_name")} data-testid="reg-business-name" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.ownerName}</label>
                    <input required className="field-input mt-1" value={form.owner_name} onChange={set("owner_name")} data-testid="reg-owner-name" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.category}</label>
                  <select required className="field-input mt-1" value={form.category} onChange={set("category")} data-testid="reg-category">
                    {categoryKeys.map((k) => <option key={k} value={k}>{t.categories[k]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.description}</label>
                  <textarea required rows={4} minLength={10} className="field-input mt-1" placeholder={t.fields.placeholders.description} value={form.description} onChange={set("description")} data-testid="reg-description" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.phone}</label>
                    <input required className="field-input mt-1" value={form.phone} onChange={set("phone")} data-testid="reg-phone" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.city}</label>
                    <input required className="field-input mt-1" value={form.city} onChange={set("city")} data-testid="reg-city" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.state}</label>
                    <input className="field-input mt-1" value={form.state} onChange={set("state")} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.country}</label>
                    <input className="field-input mt-1" value={form.country} onChange={set("country")} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.address}</label>
                  <input className="field-input mt-1" value={form.address} onChange={set("address")} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.logoUrl}</label>
                  <input className="field-input mt-1" placeholder={t.fields.placeholders.logoUrl} value={form.logo_url} onChange={set("logo_url")} data-testid="reg-logo-url" />
                  {form.logo_url && <img src={form.logo_url} alt="" className="mt-3 w-20 h-20 rounded-full object-cover border-2 border-white shadow" />}
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.coverUrl}</label>
                  <input className="field-input mt-1" placeholder={t.fields.placeholders.coverUrl} value={form.cover_url} onChange={set("cover_url")} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.website}</label>
                  <input className="field-input mt-1" value={form.website} onChange={set("website")} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.facebook}</label>
                    <input className="field-input mt-1" value={form.facebook} onChange={set("facebook")} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.instagram}</label>
                    <input className="field-input mt-1" value={form.instagram} onChange={set("instagram")} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.twitter}</label>
                    <input className="field-input mt-1" value={form.twitter} onChange={set("twitter")} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.whatsapp}</label>
                    <input className="field-input mt-1" value={form.whatsapp} onChange={set("whatsapp")} />
                  </div>
                </div>
              </>
            )}

            {error && <p className="text-sm text-red-600" data-testid="reg-error">{error}</p>}

            <div className="flex items-center justify-between pt-4 gap-3 flex-wrap">
              <button type="button" onClick={back} disabled={step === 0} className={`btn-teal-outline ${step === 0 ? "opacity-40 pointer-events-none" : ""}`} data-testid="reg-back">
                <ArrowLeft size={14} /> {t.auth.back}
              </button>
              {step < 2 ? (
                <button type="button" onClick={next} disabled={!stepValid()} className={`btn-orange ${!stepValid() ? "opacity-50 cursor-not-allowed" : ""}`} data-testid="reg-next">
                  {t.auth.next} <ArrowRight size={14} />
                </button>
              ) : (
                <button type="submit" disabled={loading} className="btn-orange" data-testid="reg-submit">
                  {loading ? "…" : t.auth.submit} <ArrowRight size={14} />
                </button>
              )}
            </div>
          </form>

          <p className="text-sm text-teal-soft mt-6 text-center">
            {t.auth.hasAccount} <Link to="/login" className="text-orange font-bold hover:underline">{t.auth.loginLink}</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Register;
