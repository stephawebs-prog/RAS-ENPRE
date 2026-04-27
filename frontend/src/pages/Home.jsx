import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, HeartHandshake, Users, Sparkles, ShieldCheck, Globe2, Building2, Megaphone, ArrowDownCircle } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { BusinessCard } from "@/components/Cards";
import api, { formatApiError } from "@/lib/api";

const HERO_BG = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=2400&q=80&auto=format&fit=crop";
const ABOUT_IMG = "https://images.pexels.com/photos/3892902/pexels-photo-3892902.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const Hero = () => {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={HERO_BG} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 hero-overlay" />
      </div>
      <div className="relative container-tight py-28 md:py-40 text-white">
        <div className="max-w-4xl fade-up">
          <p className="eyebrow text-orange mb-5" data-testid="hero-eyebrow">{t.hero.eyebrow}</p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl leading-[1.1] tracking-tight">
            {t.hero.titleLines.map((line, i) => (
              <span key={line} className="block">{line}</span>
            ))}
          </h1>
          <p className="mt-7 text-lg md:text-xl text-white/85 max-w-2xl leading-relaxed">{t.hero.subtitle}</p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/register" className="btn-orange" data-testid="hero-cta-register">
              {t.hero.ctaPrimary} <ArrowRight size={16} />
            </Link>
            <Link to="/directory" className="text-white/90 hover:text-orange inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest border-b border-white/30 hover:border-orange pb-1 transition-colors" data-testid="hero-cta-directory">
              {t.hero.ctaSecondary} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
      <a href="#services" className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 hover:text-orange transition-colors animate-bounce">
        <ArrowDownCircle size={28} />
      </a>
    </section>
  );
};

const ServiceStrip = () => {
  const { t } = useI18n();
  const icons = [Building2, Users, HeartHandshake];
  return (
    <section id="services" className="bg-white border-b border-gray-100">
      <div className="container-tight grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
        {t.services.items.map((s, i) => {
          const Icon = icons[i];
          return (
            <div key={i} className="flex items-center gap-4" data-testid={`service-${i}`}>
              <span className="w-14 h-14 rounded-full bg-orange flex items-center justify-center shrink-0 shadow-md shadow-orange/20">
                <Icon className="text-white" size={24} />
              </span>
              <div>
                <h3 className="font-display text-2xl text-teal-deep leading-tight">{s.t}</h3>
                <p className="text-sm text-teal-soft">{s.d}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const WhyJoin = () => {
  const { t } = useI18n();
  const icons = [Sparkles, Megaphone, ShieldCheck, Globe2];
  return (
    <section className="section bg-cream">
      <div className="container-tight grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">
        <div className="lg:col-span-5">
          <p className="eyebrow text-orange">{t.why.eyebrow}</p>
          <h2 className="font-display text-4xl md:text-5xl text-teal-deep leading-tight mt-3">{t.why.title}</h2>
          <p className="mt-5 text-teal-soft text-lg leading-relaxed">{t.why.subtitle}</p>
          <Link to="/register" className="btn-orange mt-8" data-testid="why-cta">
            {t.why.cta} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {t.why.bullets.map((b, i) => {
            const Icon = icons[i];
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-teal transition-colors">
                <span className="w-11 h-11 rounded-full bg-teal-mist text-teal flex items-center justify-center">
                  <Icon size={20} />
                </span>
                <h3 className="font-display text-2xl text-teal-deep mt-4 leading-tight">{b.t}</h3>
                <p className="text-sm text-teal-soft mt-2 leading-relaxed">{b.d}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const FeaturedDirectory = () => {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/entrepreneurs/preview", { params: { limit: 6 } })
      .then(({ data }) => setItems(data.items))
      .catch((e) => console.error(formatApiError(e)));
  }, []);
  if (!items.length) return null;
  return (
    <section className="section bg-white">
      <div className="container-tight">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
          <div>
            <p className="eyebrow text-orange">{t.directoryPreview.eyebrow}</p>
            <h2 className="font-display text-4xl md:text-5xl text-teal-deep leading-tight mt-3">{t.directoryPreview.title}</h2>
          </div>
          <Link to="/directory" className="btn-teal-outline" data-testid="featured-see-all">
            {t.directoryPreview.seeAll} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {items.map((b) => <BusinessCard key={b.id} biz={b} />)}
        </div>
      </div>
    </section>
  );
};

const About = () => {
  const { t } = useI18n();
  return (
    <section id="about" className="section bg-teal-mist/40">
      <div className="container-tight grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6">
          <div className="rounded-3xl overflow-hidden border-8 border-white shadow-xl">
            <img src={ABOUT_IMG} alt="" className="w-full h-[480px] object-cover" />
          </div>
        </div>
        <div className="lg:col-span-6">
          <p className="eyebrow text-orange">{t.about.eyebrow}</p>
          <h2 className="font-display text-4xl md:text-5xl text-teal-deep leading-tight mt-3">{t.about.title}</h2>
          <p className="mt-5 text-teal-soft text-lg leading-relaxed italic font-display">{t.about.body}</p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-display text-2xl text-teal">{t.about.mission.t}</h3>
              <p className="text-sm text-teal-soft mt-2 leading-relaxed">{t.about.mission.d}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-display text-2xl text-teal">{t.about.vision.t}</h3>
              <p className="text-sm text-teal-soft mt-2 leading-relaxed">{t.about.vision.d}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ContactSection = () => {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", role: "", contribution: "", message: "" });
  const [status, setStatus] = useState({ loading: false, ok: false, error: "" });
  const onChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, ok: false, error: "" });
    try {
      await api.post("/contact", form);
      setStatus({ loading: false, ok: true, error: "" });
      setForm({ name: "", email: "", role: "", contribution: "", message: "" });
    } catch (err) {
      setStatus({ loading: false, ok: false, error: formatApiError(err) });
    }
  };
  return (
    <section id="contact" className="section bg-white">
      <div className="container-tight grid grid-cols-1 lg:grid-cols-2 gap-14">
        <div>
          <p className="eyebrow text-orange">{t.contact.eyebrow}</p>
          <h2 className="font-display text-4xl md:text-5xl text-teal-deep leading-tight mt-3">{t.contact.title}</h2>
          <p className="mt-4 text-teal-soft text-lg">{t.contact.subtitle}</p>
          <div className="mt-10 space-y-6 text-sm">
            <div>
              <h4 className="eyebrow text-teal">{t.contact.address}</h4>
              <p className="mt-1 text-teal-soft">126 S Dixie Blvd<br />Odessa, TX 79761</p>
            </div>
            <div>
              <h4 className="eyebrow text-teal">{t.contact.hours}</h4>
              <p className="mt-1 text-teal-soft">Monday – Friday · 8AM – 5PM</p>
            </div>
            <div>
              <h4 className="eyebrow text-teal">{t.contact.contacts}</h4>
              <p className="mt-1 text-teal-soft">info@lovesolidarity.com</p>
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="bg-cream rounded-3xl p-8 border border-gray-200" data-testid="contact-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.contact.name}</label>
              <input className="field-input mt-1" required value={form.name} onChange={onChange("name")} data-testid="contact-name" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.contact.email}</label>
              <input type="email" className="field-input mt-1" required value={form.email} onChange={onChange("email")} data-testid="contact-email" />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.contact.role}</label>
            <select className="field-input mt-1" value={form.role} onChange={onChange("role")} data-testid="contact-role">
              <option value="">—</option>
              {t.contact.roles.map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <div className="mt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.contact.contribution}</label>
            <select className="field-input mt-1" value={form.contribution} onChange={onChange("contribution")} data-testid="contact-contribution">
              <option value="">—</option>
              {t.contact.contributions.map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <div className="mt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-teal">{t.contact.message}</label>
            <textarea rows={5} className="field-input mt-1" required value={form.message} onChange={onChange("message")} data-testid="contact-message" />
          </div>
          {status.error && <p className="text-red-600 text-sm mt-3" data-testid="contact-error">{status.error}</p>}
          {status.ok && <p className="text-teal text-sm mt-3 font-semibold" data-testid="contact-success">{t.contact.sent}</p>}
          <button type="submit" disabled={status.loading} className="btn-orange mt-6" data-testid="contact-submit">
            {status.loading ? "…" : t.contact.send}
          </button>
        </form>
      </div>
    </section>
  );
};

const FinalCta = () => {
  const { t } = useI18n();
  return (
    <section className="bg-teal text-white">
      <div className="container-tight py-16 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-display text-3xl md:text-4xl leading-tight">{t.why.title}</h3>
          <p className="text-white/75 mt-2">{t.why.subtitle}</p>
        </div>
        <Link to="/register" className="btn-orange shrink-0" data-testid="final-cta">
          {t.hero.ctaPrimary} <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
};

const Home = () => (
  <>
    <Hero />
    <ServiceStrip />
    <WhyJoin />
    <FeaturedDirectory />
    <About />
    <FinalCta />
    <ContactSection />
  </>
);

export default Home;
