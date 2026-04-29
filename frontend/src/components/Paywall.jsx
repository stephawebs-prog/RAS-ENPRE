import React from "react";
import { Link } from "react-router-dom";
import { Briefcase, ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

const ChoiceCard = ({ to, icon: Icon, title, desc, cta, accent, testid }) => (
  <Link
    to={to}
    className="group relative bg-white rounded-3xl border border-gray-200 p-8 hover:border-orange transition-all hover:-translate-y-1 hover:shadow-xl overflow-hidden"
    data-testid={testid}
  >
    <span
      className={`absolute top-0 left-0 w-full h-1.5 ${accent === "teal" ? "bg-teal" : "bg-orange"}`}
    />
    <span
      className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
        accent === "teal" ? "bg-teal/10 text-teal" : "bg-orange/10 text-orange"
      }`}
    >
      <Icon size={24} />
    </span>
    <h2 className="font-display text-2xl text-teal-deep mt-6 leading-tight">{title}</h2>
    <p className="text-teal-soft mt-2 text-sm leading-relaxed">{desc}</p>
    <span className="inline-flex items-center gap-2 mt-6 text-orange font-bold uppercase tracking-wider text-xs group-hover:gap-3 transition-all">
      {cta} <ArrowRight size={14} />
    </span>
  </Link>
);

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

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          <ChoiceCard
            to="/register/client"
            icon={ShoppingBag}
            title={t.paywall.asClient}
            desc={t.paywall.asClientDesc}
            cta={t.paywall.registerCta}
            accent="teal"
            testid="paywall-client-cta"
          />
          <ChoiceCard
            to="/register/business"
            icon={Briefcase}
            title={t.paywall.asEntrepreneur}
            desc={t.paywall.asEntrepreneurDesc}
            cta={t.paywall.registerCta}
            accent="orange"
            testid="paywall-business-cta"
          />
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
