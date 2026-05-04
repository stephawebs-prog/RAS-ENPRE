import React, { useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, CheckCircle2, PartyPopper } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/auth/AuthContext";
import { formatApiError } from "@/lib/api";
import LocationSelect from "@/components/LocationSelect";
import PhoneInput from "@/components/PhoneInput";
import ImageUpload from "@/components/ImageUpload";

const blank = {
  email: "", password: "", password2: "",
  business_name: "", owner_name: "", category: "other", description: "",
  phoneCountry: "US", phoneDialCode: "+1", phoneNumber: "",
  country: "", state: "", city: "",
  address: "",
  website: "", logo_url: "", cover_url: "",
  facebook: "", instagram: "", twitter: "", whatsapp: "",
  linkedin: "", tiktok: "", youtube: "",
  source: "",
  volunteer: false,
};

const SOURCE_KEYS = ["Roxxi", "TRC", "UMAPT", "Google", "Social", "Other"];

const Register = () => {
  const { t } = useI18n();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const categoryKeys = useMemo(() => Object.keys(t.categories), [t]);

  const stepValid = () => {
    if (step === 0) return form.email && form.password.length >= 6 && form.password === form.password2;
    if (step === 1) return form.business_name && form.owner_name && form.category && form.description.length >= 10 && form.phoneNumber && form.country && form.city;
    return true;
  };

  const goToStep = (n) => {
    stepRef.current = n;
    setStep(n);
  };
  const next = () => { if (stepValid()) goToStep(Math.min(step + 1, 2)); };
  const back = () => goToStep(Math.max(step - 1, 0));

  // Prevent ANY accidental form submission (Enter key, etc.) — submit only runs via the explicit button onClick on step 2.
  const handleFormSubmit = (e) => { e.preventDefault(); };

  const handleSubmitClick = async () => {
    // Hard guard: only allow real submission when stepRef is at the final step
    if (stepRef.current !== 2) return;
    setError(""); setLoading(true);
    try {
      const { phoneCountry, phoneDialCode, phoneNumber, ...rest } = form;
      const payload = {
        ...rest,
        phone: `${phoneDialCode || ""} ${phoneNumber || ""}`.trim(),
      };
      await register(payload);
      setDone(true);
    } catch (err) {
      setError(formatApiError(err));
      if (String(err?.response?.data?.detail || "").toLowerCase().includes("email")) goToStep(0);
    } finally { setLoading(false); }
  };

  if (done) {
    return (
      <section className="min-h-[80vh] bg-gradient-to-br from-cream via-orange/10 to-teal/10 flex items-center justify-center py-20">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border-2 border-orange p-12 text-center fade-up">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-orange shadow-lg shadow-orange/30 mb-6">
            <PartyPopper className="text-white" size={42} />
          </div>
          <p className="eyebrow text-orange mb-2">¡Registro completo!</p>
          <h1 className="font-display text-4xl md:text-5xl text-teal-deep leading-tight" data-testid="register-success">{t.auth.successTitle}</h1>
          <p className="text-teal-soft text-lg mt-4">{t.auth.successSub}</p>
          <div className="mt-8 inline-flex items-center gap-3 bg-teal/10 text-teal-deep rounded-full px-5 py-2 text-sm font-semibold">
            <CheckCircle2 size={18} className="text-teal" /> Tu perfil ya está activo en el directorio
          </div>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate("/dashboard")} className="btn-orange" data-testid="success-go-dashboard">
              {t.auth.goDashboard} <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate("/directory")} className="btn-teal-outline">
              {t.auth.goDirectory}
            </button>
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

          <form onSubmit={handleFormSubmit} className="space-y-5" data-testid="register-form" noValidate>
            <p className="text-sm text-teal-soft italic">
              <span className="text-red-500 font-bold">*</span> {t.fields.requiredNote}
            </p>
            {step === 0 && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.email} <span className="text-red-500">*</span></label>
                  <input type="email" required className="field-input mt-1" value={form.email} onChange={set("email")} data-testid="reg-email" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.createPassword} <span className="text-red-500">*</span></label>
                  <input type="password" required minLength={6} className="field-input mt-1" value={form.password} onChange={set("password")} data-testid="reg-password" />
                  <p className="text-xs text-teal-soft mt-1">min 6 characters</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.confirmPassword} <span className="text-red-500">*</span></label>
                  <input type="password" required minLength={6} className="field-input mt-1" value={form.password2} onChange={set("password2")} data-testid="reg-password2" />
                  {form.password2 && form.password !== form.password2 && (
                    <p className="text-xs text-red-600 mt-1">{t.fields.passwordsDoNotMatch}</p>
                  )}
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
                    <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.businessName} <span className="text-red-500">*</span></label>
                    <input required className="field-input mt-1" value={form.business_name} onChange={set("business_name")} data-testid="reg-business-name" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.ownerName} <span className="text-red-500">*</span></label>
                    <input required className="field-input mt-1" value={form.owner_name} onChange={set("owner_name")} data-testid="reg-owner-name" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.category} <span className="text-red-500">*</span></label>
                  <select required className="field-input mt-1" value={form.category} onChange={set("category")} data-testid="reg-category">
                    {categoryKeys.map((k) => <option key={k} value={k}>{t.categories[k]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.description} <span className="text-red-500">*</span></label>
                  <textarea required rows={4} minLength={10} className="field-input mt-1" placeholder={t.fields.placeholders.description} value={form.description} onChange={set("description")} data-testid="reg-description" />
                </div>

                <PhoneInput
                  label={<>{t.fields.phone} <span className="text-red-500">*</span></>}
                  value={{ country: form.phoneCountry, dialCode: form.phoneDialCode, number: form.phoneNumber }}
                  onChange={(v) => setForm({ ...form, phoneCountry: v.country, phoneDialCode: v.dialCode, phoneNumber: v.number })}
                />

                <LocationSelect
                  labels={{
                    country: t.fields.country,
                    state: t.fields.state,
                    city: <>{t.fields.city} <span className="text-red-500">*</span></>,
                  }}
                  value={{ country: form.country, state: form.state, city: form.city }}
                  onChange={(loc) => setForm({ ...form, ...loc })}
                />

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.address}</label>
                  <input className="field-input mt-1" value={form.address} onChange={set("address")} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="bg-orange/10 border-l-4 border-orange rounded-lg px-4 py-3">
                  <p className="text-sm text-teal-deep font-semibold">✨ {t.fields.step3OptionalNote}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUpload
                    label={t.fields.logoUrl}
                    value={form.logo_url}
                    onChange={(v) => setForm({ ...form, logo_url: v })}
                    aspect="square"
                    testid="reg-logo-upload"
                  />
                  <ImageUpload
                    label={t.fields.coverUrl}
                    value={form.cover_url}
                    onChange={(v) => setForm({ ...form, cover_url: v })}
                    aspect="wide"
                    testid="reg-cover-upload"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.website}</label>
                  <input className="field-input mt-1" placeholder="https://…" value={form.website} onChange={set("website")} />
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
                    <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.linkedin}</label>
                    <input className="field-input mt-1" value={form.linkedin} onChange={set("linkedin")} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.tiktok}</label>
                    <input className="field-input mt-1" value={form.tiktok} onChange={set("tiktok")} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.youtube}</label>
                    <input className="field-input mt-1" value={form.youtube} onChange={set("youtube")} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.whatsapp}</label>
                    <input className="field-input mt-1" placeholder="+1 432 555 0123" value={form.whatsapp} onChange={set("whatsapp")} />
                    <p className="text-xs text-teal-soft mt-1">{t.fields.whatsappHint}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.twitter}</label>
                    <input className="field-input mt-1" value={form.twitter} onChange={set("twitter")} />
                  </div>
                </div>

                <label className="flex items-start gap-3 mt-6 p-4 rounded-2xl border-2 border-teal/20 hover:border-teal/50 cursor-pointer transition-colors bg-teal/5" data-testid="reg-volunteer">
                  <input
                    type="checkbox"
                    checked={form.volunteer}
                    onChange={(e) => setForm({ ...form, volunteer: e.target.checked })}
                    className="mt-1 w-5 h-5 accent-orange"
                  />
                  <div>
                    <div className="text-sm font-bold text-teal-deep">{t.auth.volunteerLabel}</div>
                    <div className="text-xs text-teal-soft mt-0.5">{t.auth.volunteerHint}</div>
                  </div>
                </label>
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
                <button type="button" onClick={handleSubmitClick} disabled={loading} className="btn-orange" data-testid="reg-submit">
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
