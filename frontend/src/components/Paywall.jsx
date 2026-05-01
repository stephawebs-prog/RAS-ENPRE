import React from "react";
import { Link } from "react-router-dom";
import { Briefcase, ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

const Paywall = () => {
  const { t } = useI18n();
  return (
    <section className="min-h-[80vh] bg-cream py-16">
      <div className="container-tight max-w-4xl">
        <div className="text-center">
          <p className="eyebrow text-orange">{t.nav.directory}</p>
          <h1 className="font-display text-4xl md:text-5xl text-teal-deep leading-tight mt-3" data-testid="paywall-title">
            {t.paywall.title}
          </h1>
          <p className="text-teal-soft text-base mt-3">{t.paywall.subtitle}</p>
        </div>

        <div className="mt-12 max-w-2xl mx-auto text-center">
          <p className="font-display text-2xl md:text-3xl text-teal-deep leading-snug italic">
            {t.paywall.invite}{" "}
            <span className="text-orange not-italic">{t.paywall.inviteCta}</span>
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Usuario — solid orange */}
          <Link
            to="/register/client"
            className="group bg-orange text-white rounded-3xl p-8 hover:-translate-y-1 hover:shadow-xl transition-all relative overflow-hidden"
            data-testid="paywall-client-cta"
          >
            <span className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10"></span>
            <span className="relative w-14 h-14 rounded-full bg-white text-orange flex items-center justify-center shadow-lg">
              <ShoppingBag size={22} />
            </span>
            <h2 className="relative font-display text-2xl text-white mt-5 leading-tight">{t.paywall.asClient}</h2>
            <p className="relative text-white/90 mt-2 text-sm">{t.paywall.asClientDesc}</p>
            <span className="relative inline-flex items-center gap-2 mt-6 text-white font-bold uppercase tracking-wider text-xs group-hover:gap-3 transition-all">
              {t.paywall.registerCta} <ArrowRight size={14} />
            </span>
          </Link>

          {/* Emprendedor — solid teal with orange */}
          <Link
            to="/register/business"
            className="group bg-teal text-white rounded-3xl p-8 hover:-translate-y-1 hover:shadow-xl transition-all relative overflow-hidden"
            data-testid="paywall-business-cta"
          >
            <span className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-orange/20"></span>
            <span className="relative w-14 h-14 rounded-full bg-orange text-white flex items-center justify-center shadow-lg shadow-orange/40">
              <Briefcase size={22} />
            </span>
            <h2 className="relative font-display text-2xl text-white mt-5 leading-tight">{t.paywall.asEntrepreneur}</h2>
            <p className="relative text-white/80 mt-2 text-sm">{t.paywall.asEntrepreneurDesc}</p>
            <span className="relative inline-flex items-center gap-2 mt-6 text-orange font-bold uppercase tracking-wider text-xs group-hover:gap-3 transition-all">
              {t.paywall.registerCta} <ArrowRight size={14} />
            </span>
          </Link>
        </div>

        <p className="text-center text-sm text-teal-soft mt-8">
          {t.paywall.already}{" "}
          <Link to="/login" className="text-orange font-bold hover:underline">
            {t.paywall.loginLink}
          </Link>
        </p>

        <div className="mt-12 max-w-2xl mx-auto bg-white/60 rounded-2xl p-5 border border-gray-200 flex items-start gap-3">
          <ShieldCheck className="text-teal shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-display text-lg text-teal-deep">{t.paywall.whyTitle}</h3>
            <p className="text-sm text-teal-soft mt-1 leading-relaxed">{t.paywall.whyText}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Paywall;
