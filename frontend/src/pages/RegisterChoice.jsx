import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Briefcase, ArrowRight, ShieldCheck, HeartHandshake } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

const RegisterChoice = () => {
  const { t } = useI18n();
  return (
    <section className="min-h-[80vh] bg-cream py-16">
      <div className="container-tight max-w-6xl">
        <div className="text-center">
          <p className="eyebrow text-orange">{t.auth.chooseEyebrow}</p>
          <h1 className="font-display text-4xl md:text-5xl text-teal-deep leading-tight mt-3" data-testid="choice-title">
            {t.auth.chooseTitle}
          </h1>
          <p className="text-teal-soft text-base mt-3 max-w-xl mx-auto">{t.auth.chooseSub}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Usuario — naranja */}
          <Link
            to="/register/client"
            className="group bg-orange text-white rounded-3xl p-7 hover:-translate-y-1 hover:shadow-xl transition-all relative overflow-hidden"
            data-testid="choice-client"
          >
            <span className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10"></span>
            <span className="relative w-14 h-14 rounded-full bg-white text-orange flex items-center justify-center shadow-lg">
              <ShoppingBag size={22} />
            </span>
            <h2 className="relative font-display text-2xl text-white mt-5 leading-tight">{t.auth.asClient}</h2>
            <p className="relative text-white/90 mt-2 text-sm">{t.auth.asClientDesc}</p>
            <span className="relative inline-flex items-center gap-2 mt-6 text-white font-bold uppercase tracking-wider text-xs group-hover:gap-3 transition-all">
              {t.auth.asClient} <ArrowRight size={14} />
            </span>
          </Link>

          {/* Emprendedor — teal */}
          <Link
            to="/register/business"
            className="group bg-teal text-white rounded-3xl p-7 hover:-translate-y-1 hover:shadow-xl transition-all relative overflow-hidden"
            data-testid="choice-business"
          >
            <span className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-orange/20"></span>
            <span className="relative w-14 h-14 rounded-full bg-orange text-white flex items-center justify-center shadow-lg shadow-orange/40">
              <Briefcase size={22} />
            </span>
            <h2 className="relative font-display text-2xl text-white mt-5 leading-tight">{t.auth.asEntrepreneur}</h2>
            <p className="relative text-white/80 mt-2 text-sm">{t.auth.asEntrepreneurDesc}</p>
            <span className="relative inline-flex items-center gap-2 mt-6 text-orange font-bold uppercase tracking-wider text-xs group-hover:gap-3 transition-all">
              {t.auth.asEntrepreneur} <ArrowRight size={14} />
            </span>
          </Link>

          {/* Entidad Comunitaria — teal-deep */}
          <Link
            to="/register/entity"
            className="group rounded-3xl p-7 hover:-translate-y-1 hover:shadow-xl transition-all relative overflow-hidden text-white"
            style={{ backgroundColor: "#163d37" }}
            data-testid="choice-entity"
          >
            <span className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-orange/20"></span>
            <span className="relative w-14 h-14 rounded-full bg-white text-teal-deep flex items-center justify-center shadow-lg">
              <HeartHandshake size={22} />
            </span>
            <h2 className="relative font-display text-2xl text-white mt-5 leading-tight">{t.auth.asEntity}</h2>
            <p className="relative text-white/80 mt-2 text-sm">{t.auth.asEntityDesc}</p>
            <span className="relative inline-flex items-center gap-2 mt-6 text-orange font-bold uppercase tracking-wider text-xs group-hover:gap-3 transition-all">
              {t.auth.asEntity} <ArrowRight size={14} />
            </span>
          </Link>
        </div>

        <p className="text-center text-sm text-teal-soft mt-8">
          {t.auth.hasAccount}{" "}
          <Link to="/login" className="text-orange font-bold hover:underline">
            {t.auth.loginLink}
          </Link>
        </p>

        <div className="mt-12 max-w-2xl mx-auto bg-white/60 rounded-2xl p-5 border border-gray-200 flex items-start gap-3">
          <ShieldCheck className="text-teal shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-teal-soft leading-relaxed">
            Somos una comunidad de confianza. Los miembros se registran para que los negocios sepan quién los contacta.
          </p>
        </div>
      </div>
    </section>
  );
};

export default RegisterChoice;
