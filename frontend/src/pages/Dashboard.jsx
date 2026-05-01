import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink, Save, LogOut, Eye, MousePointerClick } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/auth/AuthContext";
import ImageUpload from "@/components/ImageUpload";

const Dashboard = () => {
  const { t } = useI18n();
  const { user, profile, refreshProfile, logout, setProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const categoryKeys = useMemo(() => Object.keys(t.categories), [t]);

  useEffect(() => {
    if (user === false) navigate("/login", { state: { from: "/dashboard" } });
  }, [user, navigate]);

  useEffect(() => {
    if (profile && !form) setForm({ ...profile });
  }, [profile, form]);

  if (!form) return <div className="container-tight py-24 text-center text-teal-soft">Loading…</div>;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setSaved(false);
    try {
      const { data } = await api.put("/entrepreneurs/me", form);
      setProfile(data); setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) { setError(formatApiError(err)); }
    finally { setLoading(false); }
  };

  return (
    <section className="bg-cream min-h-screen py-12">
      <div className="container-tight grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sticky top-32">
            <p className="eyebrow text-orange">{t.dashboard.welcome}</p>
            <h2 className="font-display text-2xl text-teal-deep mt-2 leading-tight">{form.business_name || "—"}</h2>
            <p className="text-xs text-teal-soft mt-1">{user?.email}</p>
            <ul className="mt-6 space-y-2">
              <li><a href="#profile" className="text-teal hover:text-orange text-sm font-semibold">{t.dashboard.profile}</a></li>
              <li>
                <Link to={`/entrepreneur/${profile?.id}`} className="text-teal hover:text-orange text-sm font-semibold inline-flex items-center gap-2">
                  {t.dashboard.profilePreview} <ExternalLink size={12} />
                </Link>
              </li>
            </ul>
            <button onClick={async () => { await logout(); navigate("/"); }} className="text-red-600 hover:text-red-700 text-sm font-semibold mt-6 inline-flex items-center gap-2" data-testid="dashboard-logout">
              <LogOut size={14} /> {t.nav.logout}
            </button>
          </div>
        </aside>

        <main className="lg:col-span-9">
          <div className="bg-white rounded-3xl border border-gray-200 p-8 md:p-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="eyebrow text-orange">{t.dashboard.title}</p>
                <h1 className="font-display text-4xl text-teal-deep mt-2 leading-tight">{t.dashboard.editProfile}</h1>
              </div>
              {profile?.id && (
                <Link to={`/entrepreneur/${profile.id}`} className="btn-teal-outline">
                  {t.dashboard.profilePreview} <ExternalLink size={14} />
                </Link>
              )}
            </div>

            <form onSubmit={submit} id="profile" className="mt-8 space-y-5" data-testid="dashboard-form">
              {/* My stats */}
              <div className="grid grid-cols-2 gap-4 p-5 bg-teal/5 rounded-2xl border-2 border-teal/10">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-teal text-white flex items-center justify-center"><Eye size={18} /></span>
                  <div>
                    <div className="text-xs text-teal-soft uppercase tracking-wider font-bold">{t.myStats.views}</div>
                    <div className="font-display text-3xl text-teal-deep leading-none mt-1" data-testid="my-view-count">{form.view_count || 0}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-orange text-white flex items-center justify-center"><MousePointerClick size={18} /></span>
                  <div>
                    <div className="text-xs text-teal-soft uppercase tracking-wider font-bold">{t.myStats.clicks}</div>
                    <div className="font-display text-3xl text-teal-deep leading-none mt-1" data-testid="my-click-count">{form.contact_click_count || 0}</div>
                  </div>
                </div>
              </div>

              {/* Volunteer toggle */}
              <label className="flex items-start gap-3 p-4 rounded-2xl border-2 border-teal/20 hover:border-teal/50 cursor-pointer transition-colors bg-cream" data-testid="d-volunteer">
                <input
                  type="checkbox"
                  checked={!!form.volunteer}
                  onChange={async (e) => {
                    const v = e.target.checked;
                    setForm({ ...form, volunteer: v });
                    try { await api.put("/me/volunteer", { volunteer: v }); } catch (err) { console.error(err); }
                  }}
                  className="mt-1 w-5 h-5 accent-orange"
                />
                <div>
                  <div className="text-sm font-bold text-teal-deep">{t.auth.volunteerLabel}</div>
                  <div className="text-xs text-teal-soft mt-0.5">{t.auth.volunteerHint}</div>
                </div>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={t.fields.businessName}><input required className="field-input" value={form.business_name || ""} onChange={set("business_name")} data-testid="d-business-name" /></Field>
                <Field label={t.fields.ownerName}><input required className="field-input" value={form.owner_name || ""} onChange={set("owner_name")} /></Field>
              </div>
              <Field label={t.fields.category}>
                <select className="field-input" value={form.category} onChange={set("category")}>
                  {categoryKeys.map((k) => <option key={k} value={k}>{t.categories[k]}</option>)}
                </select>
              </Field>
              <Field label={t.fields.description}><textarea rows={4} className="field-input" value={form.description || ""} onChange={set("description")} /></Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={t.fields.phone}><input className="field-input" value={form.phone || ""} onChange={set("phone")} /></Field>
                <Field label={t.fields.city}><input className="field-input" value={form.city || ""} onChange={set("city")} /></Field>
                <Field label={t.fields.state}><input className="field-input" value={form.state || ""} onChange={set("state")} /></Field>
                <Field label={t.fields.country}><input className="field-input" value={form.country || ""} onChange={set("country")} /></Field>
                <Field label={t.fields.address}><input className="field-input" value={form.address || ""} onChange={set("address")} /></Field>
                <Field label={t.fields.website}><input className="field-input" value={form.website || ""} onChange={set("website")} /></Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageUpload
                  label={t.fields.logoUrl}
                  value={form.logo_url || ""}
                  onChange={(v) => setForm({ ...form, logo_url: v })}
                  aspect="square"
                  testid="d-logo-upload"
                />
                <ImageUpload
                  label={t.fields.coverUrl}
                  value={form.cover_url || ""}
                  onChange={(v) => setForm({ ...form, cover_url: v })}
                  aspect="wide"
                  testid="d-cover-upload"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={t.fields.facebook}><input className="field-input" value={form.facebook || ""} onChange={set("facebook")} /></Field>
                <Field label={t.fields.instagram}><input className="field-input" value={form.instagram || ""} onChange={set("instagram")} /></Field>
                <Field label={t.fields.linkedin}><input className="field-input" value={form.linkedin || ""} onChange={set("linkedin")} data-testid="d-linkedin" /></Field>
                <Field label={t.fields.tiktok}><input className="field-input" value={form.tiktok || ""} onChange={set("tiktok")} data-testid="d-tiktok" /></Field>
                <Field label={t.fields.youtube}><input className="field-input" value={form.youtube || ""} onChange={set("youtube")} data-testid="d-youtube" /></Field>
                <Field label={t.fields.whatsapp}>
                  <input className="field-input" placeholder="+1 432 555 0123" value={form.whatsapp || ""} onChange={set("whatsapp")} />
                  <p className="text-xs text-teal-soft mt-1">{t.fields.whatsappHint}</p>
                </Field>
                <Field label={t.fields.twitter}><input className="field-input" value={form.twitter || ""} onChange={set("twitter")} /></Field>
              </div>

              {error && <p className="text-red-600 text-sm" data-testid="dashboard-error">{error}</p>}
              {saved && <p className="text-teal text-sm font-semibold" data-testid="dashboard-saved">✓ {t.dashboard.saved}</p>}

              <div className="pt-2">
                <button type="submit" disabled={loading} className="btn-orange" data-testid="dashboard-save">
                  <Save size={14} /> {loading ? "…" : t.dashboard.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </section>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-bold uppercase tracking-wider text-teal block mb-1">{label}</label>
    {children}
  </div>
);

export default Dashboard;
