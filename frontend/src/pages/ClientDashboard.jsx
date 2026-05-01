import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, HeartHandshake } from "lucide-react";
import api from "@/lib/api";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/auth/AuthContext";

const ClientDashboard = () => {
  const { t } = useI18n();
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [volunteer, setVolunteer] = useState(false);

  useEffect(() => {
    if (user === false) navigate("/login");
  }, [user, navigate]);

  useEffect(() => { if (user) setVolunteer(!!user.volunteer); }, [user]);

  const toggleVolunteer = async (v) => {
    setVolunteer(v);
    try {
      await api.put("/me/volunteer", { volunteer: v });
      if (user) setUser({ ...user, volunteer: v });
    } catch (err) { console.error(err); }
  };

  if (!user) return <div className="container-tight py-24 text-center text-teal-soft">…</div>;

  return (
    <section className="bg-cream min-h-screen py-12">
      <div className="container-tight max-w-3xl">
        <div className="bg-white rounded-3xl border border-gray-200 p-8 md:p-10">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="eyebrow text-orange">{t.dashboard.welcome}</p>
              <h1 className="font-display text-4xl text-teal-deep mt-1 leading-tight">{user.full_name || user.email}</h1>
              <p className="text-teal-soft text-sm mt-1">{user.email}</p>
            </div>
            <button onClick={async () => { await logout(); navigate("/"); }} className="text-red-600 hover:text-red-700 text-sm font-semibold inline-flex items-center gap-2">
              <LogOut size={14} /> {t.nav.logout}
            </button>
          </div>

          <div className="mt-8">
            <label className="flex items-start gap-3 p-5 rounded-2xl border-2 border-teal/20 hover:border-teal/50 cursor-pointer transition-colors bg-teal/5" data-testid="client-d-volunteer">
              <input
                type="checkbox"
                checked={volunteer}
                onChange={(e) => toggleVolunteer(e.target.checked)}
                className="mt-1 w-5 h-5 accent-orange"
              />
              <div className="flex items-start gap-3">
                <HeartHandshake className="text-orange shrink-0 mt-0.5" size={22} />
                <div>
                  <div className="text-base font-bold text-teal-deep">{t.auth.volunteerLabel}</div>
                  <div className="text-xs text-teal-soft mt-1">{t.auth.volunteerHint}</div>
                </div>
              </div>
            </label>
          </div>

          <div className="mt-8 flex gap-3 flex-wrap">
            <Link to="/directory" className="btn-orange">{t.dashboard.goDirectory}</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientDashboard;
