import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Globe, Phone, MapPin, Facebook, Instagram, Twitter, MessageCircle, Tag } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/auth/AuthContext";
import Paywall from "@/components/Paywall";

const ProfileDetail = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { id } = useParams();
  const [biz, setBiz] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api.get(`/entrepreneurs/${id}`)
      .then(({ data }) => setBiz(data))
      .catch((e) => setError(formatApiError(e)));
  }, [id, user]);

  if (user === null) return <div className="container-tight py-24 text-center text-teal-soft">…</div>;
  if (user === false) return <Paywall />;
  if (error) return <div className="container-tight py-24 text-center text-red-600">{error}</div>;
  if (!biz) return <div className="container-tight py-24 text-center text-teal-soft">Loading…</div>;

  const cat = t.categories[biz.category] || biz.category;
  const socials = [
    { k: "website", url: biz.website, Icon: Globe, label: biz.website },
    { k: "phone", url: biz.phone ? `tel:${biz.phone}` : "", Icon: Phone, label: biz.phone },
    { k: "whatsapp", url: biz.whatsapp ? `https://wa.me/${biz.whatsapp.replace(/\D/g, '')}` : "", Icon: MessageCircle, label: biz.whatsapp },
    { k: "facebook", url: biz.facebook && (biz.facebook.startsWith("http") ? biz.facebook : `https://facebook.com/${biz.facebook}`), Icon: Facebook, label: biz.facebook },
    { k: "instagram", url: biz.instagram && (biz.instagram.startsWith("http") ? biz.instagram : `https://instagram.com/${biz.instagram.replace('@','')}`), Icon: Instagram, label: biz.instagram },
    { k: "twitter", url: biz.twitter && (biz.twitter.startsWith("http") ? biz.twitter : `https://twitter.com/${biz.twitter.replace('@','')}`), Icon: Twitter, label: biz.twitter },
  ].filter((s) => s.label);

  return (
    <article className="bg-white pb-20">
      <div className="relative h-72 md:h-96 bg-teal">
        {biz.cover_url && <img src={biz.cover_url} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="container-tight relative -mt-16 md:-mt-20 z-10">
          <Link to="/directory" className="absolute -top-56 md:-top-80 left-5 text-white/90 hover:text-orange inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest" data-testid="back-to-directory">
            <ArrowLeft size={14} /> {t.nav.directory}
          </Link>
        </div>
      </div>

      <div className="container-tight -mt-20 relative z-20">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 md:p-12">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-teal-mist shrink-0">
              {biz.logo_url ? <img src={biz.logo_url} alt={biz.business_name} className="w-full h-full object-cover" /> : (
                <div className="w-full h-full flex items-center justify-center font-display text-4xl text-teal">
                  {biz.business_name.slice(0,1)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-4xl md:text-5xl text-teal-deep leading-tight" data-testid="profile-title">{biz.business_name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-teal-soft">
                <span className="inline-flex items-center gap-1"><Tag size={13} /> {cat}</span>
                {biz.city && <span className="inline-flex items-center gap-1"><MapPin size={13} /> {biz.city}{biz.state ? `, ${biz.state}` : ""}</span>}
                {biz.owner_name && <span>· {biz.owner_name}</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-10">
            <div className="lg:col-span-2">
              <h2 className="eyebrow text-orange">About</h2>
              <p className="font-display text-2xl text-teal-deep mt-3 leading-relaxed whitespace-pre-line">{biz.description}</p>
            </div>
            <aside className="bg-cream rounded-2xl p-6 border border-gray-200 h-fit">
              <h3 className="eyebrow text-teal">Contact</h3>
              <ul className="mt-4 space-y-3">
                {socials.map(({ k, url, Icon, label }) => (
                  <li key={k}>
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 text-teal hover:text-orange transition-colors break-all" data-testid={`profile-${k}`}>
                        <span className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center"><Icon size={16} /></span>
                        <span className="text-sm">{label}</span>
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-3 text-teal-soft">
                        <span className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center"><Icon size={16} /></span>
                        <span className="text-sm">{label}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProfileDetail;
