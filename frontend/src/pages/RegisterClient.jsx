import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/auth/AuthContext";
import api, { formatApiError } from "@/lib/api";
import LocationSelect from "@/components/LocationSelect";
import PhoneInput from "@/components/PhoneInput";

const blank = {
  email: "", password: "", password2: "", full_name: "",
  phoneDialCode: "+1", phoneNumber: "",
  country: "", state: "", city: "",
  interests: [], source: "",
  volunteer: false,
};

const SOURCE_KEYS = ["Roxxi", "TRC", "UMAPT", "Google", "Social", "Other"];

const RegisterClient = () => {
  const { t } = useI18n();
  const { login } = useAuth();
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
    if (form.password !== form.password2) {
      setError(t.fields.passwordsDoNotMatch); return;
    }
    setError(""); setLoading(true);
    try {
      const payload = {
        email: form.email, password: form.password,
        full_name: form.full_name,
        phone: `${form.phoneDialCode}${form.phoneNumber}`,
        city: form.city, state: form.state,
        interests: form.interests, source: form.source,
        volunteer: !!form.volunteer,
      };
      const { data } = await api.post("/auth/register-client", payload);
      if (data.access_token) localStorage.setItem("red.token", data.access_token);
      try { await login(form.email, form.password); } catch (err) { console.error("auto-login after register failed:", err); }
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
            <p className="text-sm text-teal-soft italic">
              <span className="text-red-500 font-bold">*</span> {t.fields.requiredNote}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.fullName} <span className="text-red-500">*</span></label>
                <input required className="field-input mt-1" value={form.full_name} onChange={set("full_name")} data-testid="client-name" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.email} <span className="text-red-500">*</span></label>
                <input type="email" required className="field-input mt-1" value={form.email} onChange={set("email")} data-testid="client-email" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.createPassword} <span className="text-red-500">*</span></label>
                <input type="password" required minLength={6} className="field-input mt-1" value={form.password} onChange={set("password")} data-testid="client-password" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.confirmPassword} <span className="text-red-500">*</span></label>
                <input type="password" required minLength={6} className="field-input mt-1" value={form.password2} onChange={set("password2")} data-testid="client-password2" />
                {form.password2 && form.password !== form.password2 && (
                  <p className="text-xs text-red-600 mt-1">{t.fields.passwordsDoNotMatch}</p>
                )}
              </div>
            </div>

            <PhoneInput
              label={<>{t.fields.phone} <span className="text-red-500">*</span></>}
              value={{ dialCode: form.phoneDialCode, number: form.phoneNumber }}
              onChange={(v) => setForm({ ...form, phoneDialCode: v.dialCode, phoneNumber: v.number })}
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

            <label className="flex items-start gap-3 p-4 rounded-2xl border-2 border-teal/20 hover:border-teal/50 cursor-pointer transition-colors bg-teal/5" data-testid="client-volunteer">
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
