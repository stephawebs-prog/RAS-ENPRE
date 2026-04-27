import React from "react";
import { Link } from "react-router-dom";
import { MapPin, ArrowRight, Tag, Star } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

const FALLBACK_LOGO = "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=400";

const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");

export const BusinessCard = ({ biz }) => {
  const { t } = useI18n();
  const cat = t.categories[biz.category] || biz.category;
  return (
    <Link
      to={`/entrepreneur/${biz.id}`}
      className="biz-card group"
      data-testid={`biz-card-${biz.id}`}
    >
      <div className="relative h-48 bg-teal-mist overflow-hidden">
        {biz.cover_url ? (
          <img src={biz.cover_url} alt={biz.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center">
            <span className="font-display text-5xl text-white/40">{initials(biz.business_name)}</span>
          </div>
        )}
        {biz.featured && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-orange text-white text-xs font-bold uppercase tracking-wider rounded-full px-3 py-1">
            <Star size={12} /> Featured
          </span>
        )}
      </div>
      <div className="p-6 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 bg-white shrink-0">
            <img src={biz.logo_url || FALLBACK_LOGO} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl text-teal-deep leading-tight truncate">{biz.business_name}</h3>
            <div className="flex items-center gap-3 text-xs text-teal-soft mt-0.5">
              <span className="inline-flex items-center gap-1"><Tag size={11} /> {cat}</span>
              {biz.city && (<span className="inline-flex items-center gap-1"><MapPin size={11} /> {biz.city}{biz.state ? `, ${biz.state}` : ""}</span>)}
            </div>
          </div>
        </div>
        <p className="text-sm text-teal-soft line-clamp-3 leading-relaxed">{biz.description}</p>
        <div className="mt-auto pt-2 inline-flex items-center gap-2 text-orange font-bold text-sm uppercase tracking-wider">
          {t.directory.view} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

export const CategoryChip = ({ value, label, active, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(value)}
    className={`chip ${active ? "active" : ""}`}
    data-testid={`chip-${value}`}
  >
    {label}
  </button>
);
