import React, { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Globe, Phone, MapPin, Facebook, Instagram, Twitter, MessageCircle, Tag, Trash2 } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/auth/AuthContext";
import Paywall from "@/components/Paywall";
import StarRating from "@/components/StarRating";

const ProfileDetail = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { id } = useParams();
  const [biz, setBiz] = useState(null);
  const [error, setError] = useState("");
  const [ratings, setRatings] = useState({ items: [], avg_rating: 0, ratings_count: 0 });
  const [myStars, setMyStars] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [savingRating, setSavingRating] = useState(false);
  const [ratingErr, setRatingErr] = useState("");

  const loadRatings = useCallback(async () => {
    try {
      const { data } = await api.get(`/entrepreneurs/${id}/ratings`);
      setRatings(data);
    } catch (err) { console.error("Failed to load ratings:", err); }
  }, [id]);

  const loadMyRating = useCallback(async () => {
    if (!user || user === false) return;
    try {
      const { data } = await api.get(`/entrepreneurs/${id}/my-rating`);
      setMyStars(data.stars || 0);
      setMyComment(data.comment || "");
    } catch (err) { console.error("Failed to load my rating:", err); }
  }, [id, user]);

  useEffect(() => {
    if (!user) return;
    api.get(`/entrepreneurs/${id}`)
      .then(({ data }) => setBiz(data))
      .catch((e) => setError(formatApiError(e)));
    loadRatings();
    loadMyRating();
  }, [id, user, loadRatings, loadMyRating]);

  if (user === null) return <div className="container-tight py-24 text-center text-teal-soft">…</div>;
  if (user === false) return <Paywall />;
  if (error) return <div className="container-tight py-24 text-center text-red-600">{error}</div>;
  if (!biz) return <div className="container-tight py-24 text-center text-teal-soft">Loading…</div>;

  const trackClick = (kind) => {
    api.post(`/entrepreneurs/${id}/contact-click?kind=${encodeURIComponent(kind)}`).catch(() => {});
  };

  const isOwner = biz.user_id === user.id;
  const canRate = user && user.role !== "admin" && !isOwner;

  const submitRating = async (e) => {
    e.preventDefault();
    if (myStars < 1) { setRatingErr(t.ratings.pickStars); return; }
    setSavingRating(true); setRatingErr("");
    try {
      await api.post(`/entrepreneurs/${id}/rate`, { stars: myStars, comment: myComment });
      await loadRatings();
    } catch (err) { setRatingErr(formatApiError(err)); }
    finally { setSavingRating(false); }
  };

  const deleteMyRating = async () => {
    if (!window.confirm(t.ratings.confirmDelete)) return;
    try {
      await api.delete(`/entrepreneurs/${id}/rate`);
      setMyStars(0); setMyComment("");
      await loadRatings();
    } catch (err) { setRatingErr(formatApiError(err)); }
  };

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
              {ratings.ratings_count > 0 && (
                <div className="mt-3" data-testid="profile-rating-summary">
                  <StarRating value={ratings.avg_rating} count={ratings.ratings_count} showValue size={18} />
                </div>
              )}
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
                      <a href={url} target="_blank" rel="noreferrer" onClick={() => trackClick(k)} className="inline-flex items-center gap-3 text-teal hover:text-orange transition-colors break-all" data-testid={`profile-${k}`}>
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

          {/* Ratings section */}
          <div className="mt-12 pt-10 border-t border-gray-100" data-testid="ratings-section">
            <div className="flex items-baseline justify-between flex-wrap gap-3">
              <div>
                <h2 className="eyebrow text-orange">{t.ratings.title}</h2>
                <h3 className="font-display text-3xl text-teal-deep mt-1 leading-tight">
                  {ratings.ratings_count > 0
                    ? <>{t.ratings.avgLabel}: <span className="text-orange">{ratings.avg_rating.toFixed(1)}</span> <span className="text-base text-teal-soft font-normal">· {ratings.ratings_count} {ratings.ratings_count === 1 ? t.ratings.reviewSingular : t.ratings.reviewPlural}</span></>
                    : t.ratings.noneTitle}
                </h3>
                {ratings.ratings_count === 0 && <p className="text-teal-soft text-sm mt-1">{t.ratings.noneSub}</p>}
              </div>
            </div>

            {/* Rate form */}
            {canRate && (
              <form onSubmit={submitRating} className="mt-6 bg-cream rounded-2xl p-5 border border-gray-200" data-testid="rate-form">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-bold text-teal-deep">{myStars > 0 ? t.ratings.yourRating : t.ratings.leaveRating}:</span>
                  <StarRating value={myStars} onChange={setMyStars} size={28} testid="rate" />
                </div>
                <textarea
                  rows={2}
                  className="field-input mt-3"
                  placeholder={t.ratings.commentPlaceholder}
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  maxLength={500}
                  data-testid="rate-comment"
                />
                {ratingErr && <p className="text-red-600 text-sm mt-2">{ratingErr}</p>}
                <div className="flex items-center gap-3 mt-3">
                  <button type="submit" disabled={savingRating} className="btn-orange" data-testid="rate-submit">
                    {savingRating ? "…" : t.ratings.submit}
                  </button>
                  {myStars > 0 && (
                    <button type="button" onClick={deleteMyRating} className="text-sm text-red-500 hover:text-red-700 inline-flex items-center gap-1" data-testid="rate-delete">
                      <Trash2 size={14} /> {t.ratings.removeMine}
                    </button>
                  )}
                </div>
              </form>
            )}
            {isOwner && <p className="mt-4 text-sm text-teal-soft italic">{t.ratings.ownProfileNote}</p>}

            {/* Reviews list */}
            {ratings.items.length > 0 && (
              <div className="mt-8 space-y-4">
                {ratings.items.map((r) => (
                  <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <StarRating value={r.stars} size={14} />
                      <span className="text-sm font-bold text-teal-deep">{r.user_name || t.ratings.anonymous}</span>
                      <span className="text-xs text-teal-soft ml-auto">{(r.created_at || "").slice(0, 10)}</span>
                    </div>
                    {r.comment && <p className="text-sm text-teal-soft mt-2 leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProfileDetail;
