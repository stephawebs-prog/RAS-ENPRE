import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Briefcase, ArrowRight } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

const RegisterChoice = () => {
  const { t } = useI18n();
  return (
    <section className="min-h-[80vh] bg-cream py-16">
      <div className="container-tight max-w-4xl">
        <div className="text-center">
          <p className="eyebrow text-orange">{t.nav.register}</p>
          <h1 className="font-display text-5xl md:text-6xl text-teal-deep leading-tight mt-3" data-testid="choice-title">
            {t.auth.chooseTitle}
          </h1>
          <p className="text-teal-soft text-lg mt-3 max-w-xl mx-auto">{t.auth.chooseSub}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/register/client"
            className="group bg-white rounded-3xl border border-gray-200 p-10 hover:border-orange transition-all hover:-translate-y-1 hover:shadow-xl"
            data-testid="choice-client"
          >
            <span className="w-16 h-16 rounded-full bg-teal text-white flex items-center justify-center">
              <ShoppingBag size={26} />
            </span>
            <h2 className="font-display text-3xl text-teal-deep mt-6 leading-tight">{t.auth.asClient}</h2>
            <p className="text-teal-soft mt-2">{t.auth.asClientDesc}</p>
            <span className="inline-flex items-center gap-2 mt-6 text-orange font-bold uppercase tracking-wider text-sm">
              {t.auth.asClient} <ArrowRight size={14} />
            </span>
          </Link>
          <Link
            to="/register/business"
            className="group bg-teal text-white rounded-3xl p-10 hover:-translate-y-1 hover:shadow-xl transition-all"
            data-testid="choice-business"
          >
            <span className="w-16 h-16 rounded-full bg-orange text-white flex items-center justify-center">
              <Briefcase size={26} />
            </span>
            <h2 className="font-display text-3xl text-white mt-6 leading-tight">{t.auth.asEntrepreneur}</h2>
            <p className="text-white/80 mt-2">{t.auth.asEntrepreneurDesc}</p>
            <span className="inline-flex items-center gap-2 mt-6 text-orange font-bold uppercase tracking-wider text-sm">
              {t.auth.asEntrepreneur} <ArrowRight size={14} />
            </span>
          </Link>
        </div>

        <p className="text-center text-sm text-teal-soft mt-8">
          {t.auth.hasAccount} <Link to="/login" className="text-orange font-bold hover:underline">{t.auth.loginLink}</Link>
        </p>
      </div>
    </section>
  );
};

export default RegisterChoice;
