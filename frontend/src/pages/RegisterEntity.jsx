import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, HeartHandshake } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/auth/AuthContext";
import LocationSelect from "@/components/LocationSelect";
import PhoneInput from "@/components/PhoneInput";
import ImageUpload from "@/components/ImageUpload";

const ENTITY_TYPES = [
  "ngo", "foundation", "church", "government", "training_center",
  "help_center", "health_center", "legal_migration_center", "chamber_commerce",
  "cultural_center", "food_bank", "informal_network", "other",
];

const SOURCE_KEYS = ["Roxxi", "TRC", "UMAPT", "Google", "Social", "Other"];

const blank = {
  email: "", password: "", password2: "",
  rep_name: "",
  repDialCode: "+1", repNumber: "",
  entity_name: "", entity_email: "",
  entityDialCode: "+1", entityNumber: "",
  entity_type: "ngo",
  country: "", state: "", city: "",
  address: "",
  description: "",
  website: "",
  logo_url: "", cover_url: "",
  facebook: "", instagram: "",
  source: "",
};

const RegisterEntity = () => {
  const { t } = useI18n();
  const { setAuthFromRegister } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) { setError(t.fields.passwordsDoNotMatch); return; }
    if (!form.city || form.city.trim().length < 2) { setError("La ciudad es obligatoria."); return; }
    setError(""); setLoading(true);
    try {
      const payload = {
        email: form.email, password: form.password,
        rep_name: form.rep_name,
        rep_whatsapp: `${form.repDialCode} ${form.repNumber}`.trim(),
        entity_name: form.entity_name,
        entity_email: form.entity_email,
        entity_phone: `${form.entityDialCode} ${form.entityNumber}`.trim(),
        entity_type: form.entity_type,
        country: form.country, state: form.state, city: form.city,
        address: form.address, description: form.description,
        website: form.website, logo_url: form.logo_url, cover_url: form.cover_url,
        facebook: form.facebook, instagram: form.instagram,
        source: form.source,
      };
      const { data } = await api.post("/auth/register-entity", payload);
      if (data.access_token) localStorage.setItem("red.token", data.access_token);
      if (setAuthFromRegister) setAuthFromRegister(data.user, null, data.entity);
      setDone(true);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail) setError(formatApiError(err));
      else if (err?.message?.toLowerCase().includes("network")) setError("Error de red: revisa tu conexión y que las imágenes no sean muy grandes. Se comprimen automáticamente, pero si sigue fallando intenta sin imágenes primero.");
      else setError(formatApiError(err));
    }
    finally { setLoading(false); }
  };

  if (done) {
    return (
      <section className="min-h-[80vh] bg-cream flex items-center justify-center py-20">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-gray-200 p-10 text-center">
          <CheckCircle2 className="text-orange mx-auto" size={56} />
          <h1 className="font-display text-4xl text-teal-deep mt-4 leading-tight" data-testid="entity-success">
            {t.auth.successTitle}
          </h1>
          <p className="text-teal-soft mt-3">{t.auth.successSub}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate("/entity")} className="btn-orange">{t.auth.goDashboard}</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[80vh] bg-cream py-16">
      <div className="container-tight max-w-3xl">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 md:p-10">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-teal-deep text-white flex items-center justify-center"><HeartHandshake size={22} /></span>
            <div>
              <p className="eyebrow text-orange">{t.nav.register}</p>
              <h1 className="font-display text-3xl text-teal-deep leading-tight">{t.auth.entityTitle}</h1>
            </div>
          </div>
          <p className="text-teal-soft mt-3">{t.auth.entitySub}</p>

          <form onSubmit={submit} className="mt-8 space-y-6" data-testid="entity-form">
            {/* Cuenta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.email}</label>
                <input type="email" required className="field-input mt-1" value={form.email} onChange={set("email")} data-testid="entity-email" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.createPassword}</label>
                <input type="password" required minLength={6} className="field-input mt-1" value={form.password} onChange={set("password")} data-testid="entity-password" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.confirmPassword}</label>
                <input type="password" required minLength={6} className="field-input mt-1" value={form.password2} onChange={set("password2")} />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Representante */}
            <div>
              <h3 className="font-display text-xl text-teal-deep">{t.auth.entityStep2}</h3>
              <div className="grid grid-cols-1 gap-4 mt-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.repName}</label>
                  <input required className="field-input mt-1" value={form.rep_name} onChange={set("rep_name")} data-testid="entity-rep-name" />
                </div>
                <PhoneInput
                  label={t.auth.repWhatsapp}
                  value={{ dialCode: form.repDialCode, number: form.repNumber }}
                  onChange={(v) => setForm({ ...form, repDialCode: v.dialCode, repNumber: v.number })}
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Entidad */}
            <div>
              <h3 className="font-display text-xl text-teal-deep">{t.auth.entityStep3}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.entityName}</label>
                  <input required className="field-input mt-1" value={form.entity_name} onChange={set("entity_name")} data-testid="entity-name" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.entityEmail}</label>
                  <input type="email" className="field-input mt-1" value={form.entity_email} onChange={set("entity_email")} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.entityType}</label>
                  <select required className="field-input mt-1" value={form.entity_type} onChange={set("entity_type")} data-testid="entity-type">
                    {ENTITY_TYPES.map((k) => (<option key={k} value={k}>{t.entities.types[k]}</option>))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <PhoneInput
                    label={t.auth.entityPhone}
                    value={{ dialCode: form.entityDialCode, number: form.entityNumber }}
                    onChange={(v) => setForm({ ...form, entityDialCode: v.dialCode, entityNumber: v.number })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.description}</label>
                  <textarea rows={3} className="field-input mt-1" value={form.description} onChange={set("description")} />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Ubicación + marca */}
            <div>
              <h3 className="font-display text-xl text-teal-deep">{t.auth.entityStep4}</h3>
              <div className="mt-3 space-y-4">
                <LocationSelect
                  labels={{ country: t.fields.country, state: t.fields.state, city: t.fields.city }}
                  value={{ country: form.country, state: form.state, city: form.city }}
                  onChange={(loc) => setForm({ ...form, ...loc })}
                  required={false}
                />
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.address}</label>
                  <input className="field-input mt-1" value={form.address} onChange={set("address")} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.fields.website}</label>
                  <input className="field-input mt-1" placeholder="https://…" value={form.website} onChange={set("website")} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUpload
                    label={t.fields.logoUrl}
                    value={form.logo_url}
                    onChange={(v) => setForm({ ...form, logo_url: v })}
                    aspect="square"
                    testid="entity-logo-upload"
                  />
                  <ImageUpload
                    label={t.fields.coverUrl}
                    value={form.cover_url}
                    onChange={(v) => setForm({ ...form, cover_url: v })}
                    aspect="wide"
                    testid="entity-cover-upload"
                  />
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
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.auth.source}</label>
                  <select className="field-input mt-1" value={form.source} onChange={set("source")}>
                    <option value="">—</option>
                    {SOURCE_KEYS.map((k) => (<option key={k} value={k}>{t.auth.sources[k]}</option>))}
                  </select>
                </div>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm" data-testid="entity-error">{error}</p>}

            <button type="submit" disabled={loading} className="btn-orange w-full justify-center" data-testid="entity-submit">
              {loading ? "…" : t.auth.submit} <ArrowRight size={14} />
            </button>
          </form>

          <p className="text-sm text-teal-soft mt-6 text-center">
            {t.auth.hasAccount}{" "}
            <Link to="/login" className="text-orange font-bold hover:underline">{t.auth.loginLink}</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default RegisterEntity;
