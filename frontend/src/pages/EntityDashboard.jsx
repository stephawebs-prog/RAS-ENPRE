import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, LogOut, Plus, Calendar, MapPin, Trash2, Eye, Edit3, CheckCircle2 } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/auth/AuthContext";
import LocationSelect from "@/components/LocationSelect";
import ImageUpload from "@/components/ImageUpload";

const ENTITY_TYPES = [
  "ngo", "foundation", "church", "government", "training_center",
  "help_center", "health_center", "legal_migration_center", "chamber_commerce",
  "cultural_center", "food_bank", "informal_network", "other",
];

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-bold uppercase tracking-wider text-teal block mb-1">{label}</label>
    {children}
  </div>
);

const EntityDashboard = () => {
  const { t } = useI18n();
  const { user, entity, setEntity, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [events, setEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    if (user === false) navigate("/login");
    if (user && user.role !== "entity") navigate("/");
  }, [user, navigate]);

  useEffect(() => { if (entity && !form) setForm({ ...entity }); }, [entity, form]);

  const loadEvents = async () => {
    try {
      const { data } = await api.get("/events/mine");
      setEvents(data.items || []);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { if (user?.role === "entity") loadEvents(); }, [user]);

  if (!form) return <div className="container-tight py-24 text-center text-teal-soft">…</div>;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const saveEntity = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setSaved(false);
    try {
      const { data } = await api.put("/entities/me", form);
      setEntity(data); setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) { setError(formatApiError(err)); }
    finally { setLoading(false); }
  };

  return (
    <section className="bg-cream min-h-screen py-10">
      <div className="container-tight">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <p className="eyebrow text-orange">{t.dashboard.welcome}</p>
            <h1 className="font-display text-4xl text-teal-deep mt-1 leading-tight">{form.entity_name || "—"}</h1>
            <p className="text-teal-soft text-sm mt-1">{user?.email} · {t.entities.types[form.entity_type] || form.entity_type}</p>
          </div>
          <button onClick={async () => { await logout(); navigate("/"); }} className="text-red-600 hover:text-red-700 text-sm font-semibold inline-flex items-center gap-2">
            <LogOut size={14} /> {t.nav.logout}
          </button>
        </div>

        {/* Events section */}
        <div className="bg-white rounded-3xl border border-gray-200 p-8 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="eyebrow text-orange">{t.events.mine}</p>
              <h2 className="font-display text-3xl text-teal-deep mt-1 leading-tight">{t.events.title}</h2>
            </div>
            <button onClick={() => { setEditingEvent(null); setShowEventForm(true); }} className="btn-orange" data-testid="entity-new-event">
              <Plus size={16} /> {t.events.create}
            </button>
          </div>

          {showEventForm && (
            <EventForm
              initial={editingEvent}
              onClose={() => { setShowEventForm(false); setEditingEvent(null); }}
              onSaved={() => { loadEvents(); setShowEventForm(false); setEditingEvent(null); }}
              t={t}
            />
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.length === 0 ? (
              <p className="text-teal-soft text-sm col-span-full italic">{t.events.empty}</p>
            ) : events.map((ev) => (
              <div key={ev.id} className="bg-cream rounded-2xl border border-gray-200 overflow-hidden">
                {ev.cover_url && <img src={ev.cover_url} alt="" className="w-full h-32 object-cover" />}
                <div className="p-5">
                  <h3 className="font-display text-xl text-teal-deep leading-tight">{ev.name}</h3>
                  <div className="mt-2 space-y-1 text-sm text-teal-soft">
                    <div className="flex items-center gap-2"><Calendar size={14} className="text-teal" />{ev.date} {ev.time && `· ${ev.time}`}</div>
                    <div className="flex items-center gap-2"><MapPin size={14} className="text-teal" />{ev.location}</div>
                  </div>
                  {ev.needs && (
                    <div className="mt-3 bg-orange/10 rounded-lg px-3 py-2 text-xs text-teal-deep">
                      <strong className="text-orange">Necesidades:</strong> {ev.needs}
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    <button onClick={() => { setEditingEvent(ev); setShowEventForm(true); }} className="text-teal hover:text-orange" data-testid={`edit-event-${ev.id}`}>
                      <Edit3 size={14} />
                    </button>
                    <button onClick={async () => {
                      if (!window.confirm(t.events.confirmDelete)) return;
                      await api.delete(`/events/${ev.id}`); loadEvents();
                    }} className="text-red-500 hover:text-red-700" data-testid={`del-event-${ev.id}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Entity profile form */}
        <div className="bg-white rounded-3xl border border-gray-200 p-8">
          <p className="eyebrow text-orange">{t.dashboard.editProfile}</p>
          <h2 className="font-display text-3xl text-teal-deep mt-1">{form.entity_name}</h2>

          <form onSubmit={saveEntity} className="mt-6 space-y-4" data-testid="entity-dashboard-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t.auth.repName}><input required className="field-input" value={form.rep_name || ""} onChange={set("rep_name")} /></Field>
              <Field label={t.auth.repWhatsapp}><input required className="field-input" value={form.rep_whatsapp || ""} onChange={set("rep_whatsapp")} /></Field>
              <Field label={t.auth.entityName}><input required className="field-input" value={form.entity_name || ""} onChange={set("entity_name")} /></Field>
              <Field label={t.auth.entityEmail}><input type="email" className="field-input" value={form.entity_email || ""} onChange={set("entity_email")} /></Field>
              <Field label={t.auth.entityPhone}><input className="field-input" value={form.entity_phone || ""} onChange={set("entity_phone")} /></Field>
              <Field label={t.auth.entityType}>
                <select className="field-input" value={form.entity_type} onChange={set("entity_type")}>
                  {ENTITY_TYPES.map((k) => (<option key={k} value={k}>{t.entities.types[k]}</option>))}
                </select>
              </Field>
            </div>
            <LocationSelect
              labels={{ country: t.fields.country, state: t.fields.state, city: t.fields.city }}
              value={{ country: form.country, state: form.state, city: form.city }}
              onChange={(loc) => setForm({ ...form, ...loc })}
            />
            <Field label={t.fields.address}><input className="field-input" value={form.address || ""} onChange={set("address")} /></Field>
            <Field label={t.fields.description}><textarea rows={3} className="field-input" value={form.description || ""} onChange={set("description")} /></Field>
            <Field label={t.fields.website}><input className="field-input" value={form.website || ""} onChange={set("website")} /></Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUpload label={t.fields.logoUrl} value={form.logo_url || ""} onChange={(v) => setForm({ ...form, logo_url: v })} aspect="square" />
              <ImageUpload label={t.fields.coverUrl} value={form.cover_url || ""} onChange={(v) => setForm({ ...form, cover_url: v })} aspect="wide" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t.fields.facebook}><input className="field-input" value={form.facebook || ""} onChange={set("facebook")} /></Field>
              <Field label={t.fields.instagram}><input className="field-input" value={form.instagram || ""} onChange={set("instagram")} /></Field>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {saved && <p className="text-teal text-sm font-semibold">✓ {t.dashboard.saved}</p>}
            <button type="submit" disabled={loading} className="btn-orange">
              <Save size={14} /> {loading ? "…" : t.dashboard.saveChanges}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

const EventForm = ({ initial, onClose, onSaved, t }) => {
  const [form, setForm] = useState(initial || { name: "", date: "", time: "", location: "", description: "", needs: "", cover_url: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      if (initial?.id) await api.put(`/events/${initial.id}`, form);
      else await api.post("/events", form);
      onSaved();
    } catch (e2) { setErr(formatApiError(e2)); }
    finally { setLoading(false); }
  };
  return (
    <form onSubmit={save} className="mt-6 bg-teal/5 border-2 border-teal/20 rounded-2xl p-5 space-y-4" data-testid="event-form">
      <h3 className="font-display text-xl text-teal-deep">{initial ? t.events.edit : t.events.create}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t.events.name}><input required className="field-input" value={form.name} onChange={set("name")} data-testid="event-name" /></Field>
        <Field label={t.events.location}><input required className="field-input" value={form.location} onChange={set("location")} data-testid="event-location" /></Field>
        <Field label={t.events.date}><input required type="date" className="field-input" value={form.date} onChange={set("date")} data-testid="event-date" /></Field>
        <Field label={t.events.time}><input type="time" className="field-input" value={form.time} onChange={set("time")} /></Field>
      </div>
      <Field label={t.events.description}><textarea rows={2} className="field-input" value={form.description} onChange={set("description")} /></Field>
      <Field label={t.events.needs}><textarea rows={2} className="field-input" value={form.needs} onChange={set("needs")} placeholder="Voluntarios, insumos, donaciones…" /></Field>
      <ImageUpload label={t.events.cover} value={form.cover_url} onChange={(v) => setForm({ ...form, cover_url: v })} aspect="wide" />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-orange" data-testid="event-save"><CheckCircle2 size={14} /> {loading ? "…" : t.events.save}</button>
        <button type="button" onClick={onClose} className="btn-teal-outline">Cancelar</button>
      </div>
    </form>
  );
};

export default EntityDashboard;
