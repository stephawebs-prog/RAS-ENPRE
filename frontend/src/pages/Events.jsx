import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, ArrowRight, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { useI18n } from "@/i18n/I18nContext";

const formatDate = (iso, lang) => {
  if (!iso) return "";
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return iso;
  }
};

const groupByMonth = (events, lang) => {
  const groups = {};
  events.forEach((ev) => {
    const d = new Date(ev.date + "T00:00:00");
    const key = d.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(ev);
  });
  return groups;
};

const EventCard = ({ ev, lang }) => {
  const d = new Date(ev.date + "T00:00:00");
  const day = d.getDate();
  const month = d.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { month: "short" });
  return (
    <article
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
      data-testid={`event-card-${ev.id}`}
    >
      {ev.cover_url ? (
        <div className="relative h-40 overflow-hidden">
          <img src={ev.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute top-3 left-3 bg-white rounded-xl shadow-md px-3 py-2 text-center">
            <div className="text-xs uppercase font-bold text-orange tracking-wider">{month}</div>
            <div className="font-display text-2xl text-teal-deep leading-none">{day}</div>
          </div>
        </div>
      ) : (
        <div className="relative h-28 bg-gradient-to-br from-teal to-teal-deep flex items-center px-5">
          <div className="bg-white rounded-xl shadow-md px-3 py-2 text-center mr-3">
            <div className="text-xs uppercase font-bold text-orange tracking-wider">{month}</div>
            <div className="font-display text-2xl text-teal-deep leading-none">{day}</div>
          </div>
          <Sparkles className="text-white/70" size={18} />
        </div>
      )}
      <div className="p-5">
        <h3 className="font-display text-xl text-teal-deep leading-tight line-clamp-2">{ev.name}</h3>
        <p className="text-xs text-teal-soft mt-1 italic">por {ev.entity_name}</p>

        <div className="mt-3 space-y-1.5 text-sm text-teal-soft">
          <div className="flex items-center gap-2"><Calendar size={13} className="text-teal shrink-0" />{formatDate(ev.date, lang)}</div>
          {ev.time && <div className="flex items-center gap-2"><Clock size={13} className="text-teal shrink-0" />{ev.time}</div>}
          <div className="flex items-center gap-2"><MapPin size={13} className="text-teal shrink-0" />{ev.location}</div>
        </div>

        {ev.description && <p className="text-sm text-teal-soft mt-3 line-clamp-3">{ev.description}</p>}

        {ev.needs && (
          <div className="mt-4 bg-orange/10 rounded-xl px-3 py-2.5 text-xs text-teal-deep">
            <strong className="text-orange uppercase tracking-wider">Necesidades:</strong> {ev.needs}
          </div>
        )}
      </div>
    </article>
  );
};

const Events = () => {
  const { t, lang } = useI18n();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/events/public");
        setEvents(data.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const grouped = useMemo(() => groupByMonth(events, lang), [events, lang]);

  return (
    <section className="bg-cream min-h-[80vh] py-14">
      <div className="container-tight">
        <div className="text-center max-w-2xl mx-auto">
          <p className="eyebrow text-orange">{t.events.title}</p>
          <h1 className="font-display text-4xl md:text-5xl text-teal-deep leading-tight mt-3" data-testid="events-title">
            {t.events.publicTitle}
          </h1>
          <p className="text-teal-soft mt-3">{t.events.publicSub}</p>
        </div>

        {loading ? (
          <p className="text-center text-teal-soft mt-12">…</p>
        ) : events.length === 0 ? (
          <div className="mt-14 text-center">
            <Calendar size={48} className="text-teal-soft/40 mx-auto" />
            <p className="mt-4 text-teal-soft italic">{t.events.empty}</p>
            <Link to="/register/entity" className="btn-orange mt-6 inline-flex" data-testid="events-cta-entity">
              {t.auth.asEntity} <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="mt-12 space-y-10">
            {Object.entries(grouped).map(([month, items]) => (
              <div key={month}>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="font-display text-2xl text-teal-deep capitalize">{month}</h2>
                  <div className="flex-1 h-px bg-teal-soft/30"></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-soft bg-white px-3 py-1 rounded-full border border-gray-200">
                    {items.length} {items.length === 1 ? "evento" : "eventos"}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.map((ev) => (<EventCard key={ev.id} ev={ev} lang={lang} />))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA for entities */}
        <div className="mt-20 bg-white rounded-3xl border border-gray-200 p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-orange/10"></div>
          <div className="relative">
            <p className="eyebrow text-orange">{t.auth.asEntity}</p>
            <h3 className="font-display text-3xl text-teal-deep mt-2">¿Organizas eventos comunitarios?</h3>
            <p className="text-teal-soft mt-2 max-w-xl mx-auto">Registra tu entidad y publica eventos para conseguir más participantes y voluntarios.</p>
            <Link to="/register/entity" className="btn-orange mt-6 inline-flex">
              Registrar mi entidad <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Events;
