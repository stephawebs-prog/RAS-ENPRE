import React from "react";
import { Link } from "react-router-dom";
import { Briefcase, ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

const Paywall = () => {
  const { t } = useI18n();

  return (
    <section className="min-h-[80vh] bg-cream py-16">
      <div className="container-tight">
        {/* Header — same title/subtitle as authenticated directory */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="eyebrow text-orange">{t.nav.directory}</p>
          <h1 className="font-display text-5xl md:text-6xl text-teal-deep leading-tight mt-3" data-testid="paywall-title">
            {t.paywall.title}
          </h1>
          <p className="text-teal-soft text-lg mt-3">{t.paywall.subtitle}</p>
        </div>

        {/* Invitation to register */}
        <div className="mt-14 max-w-2xl mx-auto text-center">
          <p className="font-display text-3xl md:text-4xl text-teal-deep leading-tight italic">
            {t.paywall.invite}<br />
            <span className="text-orange">{t.paywall.inviteCta}</span>
          </p>
        </div>

        {/* Two CTAs */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Link
            to="/register/client"
            className="group bg-white rounded-3xl border border-gray-200 p-8 hover:border-orange transition-all hover:-translate-y-1 hover:shadow-xl"
            data-testid="paywall-client-cta"
          >
            <span className="w-14 h-14 rounded-full bg-teal text-white flex items-center justify-center">
              <ShoppingBag size={22} />
            </span>
            <h2 className="font-display text-2xl md:text-3xl text-teal-deep mt-5 leading-tight">{t.paywall.asClient}</h2>
            <p className="text-teal-soft mt-2">{t.paywall.asClientDesc}</p>
            <span className="inline-flex items-center gap-2 mt-6 text-orange font-bold uppercase tracking-wider text-sm group-hover:gap-3 transition-all">
              {t.paywall.registerCta} <ArrowRight size={14} />
            </span>
          </Link>
          <Link
            to="/register/business"
            className="group bg-teal text-white rounded-3xl p-8 hover:-translate-y-1 hover:shadow-xl transition-all"
            data-testid="paywall-business-cta"
          >
            <span className="w-14 h-14 rounded-full bg-orange text-white flex items-center justify-center">
              <Briefcase size={22} />
            </span>
            <h2 className="font-display text-2xl md:text-3xl text-white mt-5 leading-tight">{t.paywall.asEntrepreneur}</h2>
            <p className="text-white/80 mt-2">{t.paywall.asEntrepreneurDesc}</p>
            <span className="inline-flex items-center gap-2 mt-6 text-orange font-bold uppercase tracking-wider text-sm group-hover:gap-3 transition-all">
              {t.paywall.registerCta} <ArrowRight size={14} />
            </span>
          </Link>
        </div>

        <p className="text-center text-sm text-teal-soft mt-8">
          {t.paywall.already} <Link to="/login" className="text-orange font-bold hover:underline">{t.paywall.loginLink}</Link>
        </p>

        <div className="mt-16 max-w-2xl mx-auto bg-white/60 rounded-2xl p-6 border border-gray-200 flex items-start gap-4">
          <ShieldCheck className="text-teal shrink-0" />
          <div>
            <h3 className="font-display text-xl text-teal-deep">{t.paywall.whyTitle}</h3>
            <p className="text-sm text-teal-soft mt-1">{t.paywall.whyText}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Paywall;
