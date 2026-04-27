import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/auth/AuthContext";
import { BusinessCard, CategoryChip } from "@/components/Cards";
import Paywall from "@/components/Paywall";

const Directory = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categoryKeys = useMemo(() => Object.keys(t.categories), [t]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const handle = setTimeout(() => {
      api.get("/entrepreneurs", { params: { q: q || undefined, category, limit: 60 } })
        .then(({ data }) => { setData(data); setError(""); })
        .catch((e) => setError(formatApiError(e)))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [q, category, user]);

  // While checking auth, show nothing/spinner
  if (user === null) {
    return <div className="container-tight py-24 text-center text-teal-soft">…</div>;
  }
  // Not authenticated → paywall
  if (user === false) {
    return <Paywall />;
  }

  return (
    <section className="section bg-cream min-h-[80vh]">
      <div className="container-tight">
        <div className="text-center max-w-3xl mx-auto">
          <p className="eyebrow text-orange">{t.nav.directory}</p>
          <h1 className="font-display text-5xl md:text-6xl text-teal-deep mt-3 leading-tight">{t.directory.title}</h1>
          <p className="mt-4 text-teal-soft text-lg">{t.directory.subtitle}</p>
        </div>

        <div className="mt-10 max-w-2xl mx-auto relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-soft" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.directory.searchPlaceholder}
            className="field-input pl-11 py-4 rounded-full text-base"
            data-testid="directory-search"
          />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <CategoryChip value="all" label={t.directory.all} active={category === "all"} onClick={setCategory} />
          {categoryKeys.map((k) => (
            <CategoryChip key={k} value={k} label={t.categories[k]} active={category === k} onClick={setCategory} />
          ))}
        </div>

        <div className="mt-6 text-center text-sm text-teal-soft" data-testid="directory-count">
          {data.total} {t.directory.results}
        </div>

        {error && <p className="text-center text-red-600 mt-6">{error}</p>}

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="biz-card animate-pulse h-96 bg-gray-100" />
            ))
          ) : data.items.length ? (
            data.items.map((b) => <BusinessCard key={b.id} biz={b} />)
          ) : (
            <p className="col-span-full text-center text-teal-soft py-16">{t.directory.empty}</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Directory;
