import React from "react";
import { Link } from "react-router-dom";
import { Lock, Briefcase, ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { BusinessCard } from "@/components/Cards";
import api from "@/lib/api";

const Paywall = () => {
  const { t } = useI18n();
  const [previews, setPreviews] = React.useState([]);

  React.useEffect(() => {
    api.get("/entrepreneurs/preview", { params: { limit: 3 } })
      .then(({ data }) => setPreviews(data.items))
      .catch(() => {});
  }, []);

  return (
    <section className="min-h-[80vh] bg-cream py-16">
      <div className="container-tight">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-orange/20 text-orange rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest">
            <Lock size={14} /> {t.paywall.eyebrow}
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-teal-deep leading-tight mt-5" data-testid="paywall-title">
            {t.paywall.title}
          </h1>
          <p className="text-teal-soft text-lg mt-4">{t.paywall.subtitle}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Link
            to="/register/client"
            className="group bg-white rounded-3xl border border-gray-200 p-8 hover:border-orange transition-all hover:-translate-y-1 hover:shadow-xl"
            data-testid="paywall-client-cta"
          >
            <span className="w-14 h-14 rounded-full bg-teal text-white flex items-center justify-center">
              <ShoppingBag size={22} />
            </span>
            <h2 className="font-display text-3xl text-teal-deep mt-5 leading-tight">{t.paywall.asClient}</h2>
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
            <h2 className="font-display text-3xl text-white mt-5 leading-tight">{t.paywall.asEntrepreneur}</h2>
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
            <h3 className="font-display text-2xl text-teal-deep">{t.paywall.whyTitle}</h3>
            <p className="text-sm text-teal-soft mt-1">{t.paywall.whyText}</p>
          </div>
        </div>

        {previews.length > 0 && (
          <div className="mt-16">
            <p className="eyebrow text-orange text-center">A peek inside</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-7 relative">
              {previews.map((b, i) => (
                <div key={b.id} className={i === 2 ? "relative" : ""}>
                  <div className={i === 2 ? "blur-sm pointer-events-none select-none" : "pointer-events-none select-none"}>
                    <BusinessCard biz={b} />
                  </div>
                </div>
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/60 to-transparent" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Paywall;
