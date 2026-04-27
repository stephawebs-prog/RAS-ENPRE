import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Users, Briefcase, MessageSquare, Star, Download, Trash2, Search, ExternalLink, Eye, MailOpen } from "lucide-react";
import api, { API, formatApiError } from "@/lib/api";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/auth/AuthContext";

const Tabs = ({ value, onChange, items }) => (
  <div className="flex gap-2 flex-wrap border-b border-gray-200">
    {items.map((it) => (
      <button
        key={it.k}
        onClick={() => onChange(it.k)}
        className={`px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors -mb-px border-b-2 ${
          value === it.k ? "text-orange border-orange" : "text-teal-soft border-transparent hover:text-teal"
        }`}
        data-testid={`admin-tab-${it.k}`}
      >
        {it.label}
      </button>
    ))}
  </div>
);

const StatCard = ({ icon: Icon, label, value, color = "teal" }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6">
    <div className="flex items-center gap-3">
      <span className={`w-10 h-10 rounded-full ${color === "orange" ? "bg-orange" : "bg-teal"} text-white flex items-center justify-center`}>
        <Icon size={18} />
      </span>
      <div>
        <div className="text-xs text-teal-soft uppercase tracking-wider font-bold">{label}</div>
        <div className="font-display text-3xl text-teal-deep leading-none mt-1">{value}</div>
      </div>
    </div>
  </div>
);

const AdminPanel = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [ents, setEnts] = useState([]);
  const [clients, setClients] = useState([]);
  const [messages, setMessages] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user === false) { navigate("/login"); return; }
    if (user && user.role !== "admin") { navigate("/"); }
  }, [user, navigate]);

  const loadStats = async () => {
    try { const { data } = await api.get("/admin/stats"); setStats(data); }
    catch (e) { setError(formatApiError(e)); }
  };
  const loadEnts = async (search = "") => {
    try { const { data } = await api.get("/admin/entrepreneurs", { params: { q: search || undefined } }); setEnts(data.items); }
    catch (e) { setError(formatApiError(e)); }
  };
  const loadClients = async (search = "") => {
    try { const { data } = await api.get("/admin/clients", { params: { q: search || undefined } }); setClients(data.items); }
    catch (e) { setError(formatApiError(e)); }
  };
  const loadMessages = async () => {
    try { const { data } = await api.get("/admin/messages"); setMessages(data.items); }
    catch (e) { setError(formatApiError(e)); }
  };

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    loadStats();
    if (tab === "entrepreneurs") loadEnts(q);
    else if (tab === "clients") loadClients(q);
    else if (tab === "messages") loadMessages();
    // eslint-disable-next-line
  }, [tab, user]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    const handle = setTimeout(() => {
      if (tab === "entrepreneurs") loadEnts(q);
      else if (tab === "clients") loadClients(q);
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line
  }, [q]);

  const toggleFeatured = async (e) => {
    try {
      await api.patch(`/admin/entrepreneurs/${e.id}`, { featured: !e.featured });
      loadEnts(q); loadStats();
    } catch (err) { setError(formatApiError(err)); }
  };
  const deleteEnt = async (e) => {
    if (!window.confirm(t.admin.confirm)) return;
    try { await api.delete(`/admin/entrepreneurs/${e.id}`); loadEnts(q); loadStats(); }
    catch (err) { setError(formatApiError(err)); }
  };
  const deleteClient = async (c) => {
    if (!window.confirm(t.admin.confirm)) return;
    try { await api.delete(`/admin/clients/${c.id}`); loadClients(q); loadStats(); }
    catch (err) { setError(formatApiError(err)); }
  };
  const markRead = async (m) => {
    try { await api.patch(`/admin/messages/${m.id}/read`); loadMessages(); loadStats(); }
    catch (err) { setError(formatApiError(err)); }
  };
  const deleteMsg = async (m) => {
    if (!window.confirm(t.admin.confirm)) return;
    try { await api.delete(`/admin/messages/${m.id}`); loadMessages(); loadStats(); }
    catch (err) { setError(formatApiError(err)); }
  };

  const exportCsv = (kind) => {
    const token = localStorage.getItem("red.token");
    const url = `${API}/admin/export/${kind}.csv?_=${Date.now()}`;
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${kind}.csv`;
        document.body.appendChild(a); a.click(); a.remove();
      })
      .catch((e) => setError(String(e)));
  };

  if (!user || user.role !== "admin") {
    return <div className="container-tight py-24 text-center text-teal-soft">…</div>;
  }

  return (
    <section className="bg-cream min-h-screen py-10">
      <div className="container-tight">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <p className="eyebrow text-orange">{t.admin.title}</p>
            <h1 className="font-display text-4xl text-teal-deep mt-1 leading-tight">{t.admin.title}</h1>
            <p className="text-teal-soft mt-1 text-sm">{t.admin.subtitle}</p>
          </div>
        </div>

        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { k: "stats", label: t.admin.tabs.stats },
            { k: "entrepreneurs", label: t.admin.tabs.entrepreneurs },
            { k: "clients", label: t.admin.tabs.clients },
            { k: "messages", label: t.admin.tabs.messages },
          ]}
        />

        {error && <p className="text-red-600 text-sm mt-4" data-testid="admin-error">{error}</p>}

        {tab === "stats" && stats && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="admin-stats">
            <StatCard icon={Briefcase} label={t.admin.stats.entrepreneurs} value={stats.entrepreneurs} />
            <StatCard icon={Users} label={t.admin.stats.clients} value={stats.clients} />
            <StatCard icon={MessageSquare} label={t.admin.stats.messages} value={stats.messages} />
            <StatCard icon={MailOpen} label={t.admin.stats.unread} value={stats.unread_messages} color="orange" />
            <StatCard icon={Star} label={t.admin.stats.featured} value={stats.featured} color="orange" />
          </div>
        )}

        {(tab === "entrepreneurs" || tab === "clients") && (
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[260px]">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-soft" />
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder={t.admin.search}
                className="field-input pl-11 rounded-full"
                data-testid="admin-search"
              />
            </div>
            <button onClick={() => exportCsv(tab === "entrepreneurs" ? "entrepreneurs" : "clients")} className="btn-teal-outline" data-testid="admin-export">
              <Download size={14} /> {t.admin.exportCsv}
            </button>
          </div>
        )}

        {tab === "entrepreneurs" && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="admin-ents-table">
                <thead className="bg-cream border-b border-gray-200">
                  <tr className="text-left text-teal">
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.business}</th>
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.email}</th>
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.category}</th>
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.city}</th>
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.source}</th>
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.featured}</th>
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {ents.length === 0 ? (
                    <tr><td className="px-4 py-8 text-center text-teal-soft" colSpan={7}>{t.admin.noResults}</td></tr>
                  ) : ents.map((e) => (
                    <tr key={e.id} className="border-b border-gray-100 hover:bg-cream/40">
                      <td className="px-4 py-3">
                        <div className="font-display text-lg text-teal-deep leading-tight">{e.business_name}</div>
                        <div className="text-xs text-teal-soft">{e.owner_name}</div>
                      </td>
                      <td className="px-4 py-3 text-teal-soft">{e.email}</td>
                      <td className="px-4 py-3 text-teal-soft">{t.categories[e.category] || e.category}</td>
                      <td className="px-4 py-3 text-teal-soft">{e.city}{e.state ? `, ${e.state}` : ""}</td>
                      <td className="px-4 py-3 text-teal-soft text-xs">{e.source || "—"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleFeatured(e)} className={`${e.featured ? "text-orange" : "text-gray-300 hover:text-orange"} transition-colors`} data-testid={`feat-${e.id}`}>
                          <Star size={18} fill={e.featured ? "currentColor" : "none"} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/entrepreneur/${e.id}`} className="text-teal hover:text-orange" title={t.admin.view}>
                            <Eye size={16} />
                          </Link>
                          <button onClick={() => deleteEnt(e)} className="text-red-500 hover:text-red-700" title={t.admin.delete} data-testid={`del-ent-${e.id}`}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "clients" && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="admin-clients-table">
                <thead className="bg-cream border-b border-gray-200">
                  <tr className="text-left text-teal">
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.name}</th>
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.email}</th>
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.phone}</th>
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.city}</th>
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.interests}</th>
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.source}</th>
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.length === 0 ? (
                    <tr><td className="px-4 py-8 text-center text-teal-soft" colSpan={7}>{t.admin.noResults}</td></tr>
                  ) : clients.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-cream/40">
                      <td className="px-4 py-3 font-semibold text-teal-deep">{c.full_name}</td>
                      <td className="px-4 py-3 text-teal-soft">{c.email}</td>
                      <td className="px-4 py-3 text-teal-soft">{c.phone}</td>
                      <td className="px-4 py-3 text-teal-soft">{c.city}{c.state ? `, ${c.state}` : ""}</td>
                      <td className="px-4 py-3 text-teal-soft text-xs">
                        {(c.interests || []).map((k) => t.categories[k] || k).join(", ")}
                      </td>
                      <td className="px-4 py-3 text-teal-soft text-xs">{c.source || "—"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteClient(c)} className="text-red-500 hover:text-red-700" title={t.admin.delete} data-testid={`del-client-${c.id}`}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "messages" && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="admin-messages-table">
                <thead className="bg-cream border-b border-gray-200">
                  <tr className="text-left text-teal">
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.name}</th>
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.email}</th>
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.message}</th>
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.date}</th>
                    <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">{t.admin.th.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.length === 0 ? (
                    <tr><td className="px-4 py-8 text-center text-teal-soft" colSpan={5}>{t.admin.noResults}</td></tr>
                  ) : messages.map((m) => (
                    <tr key={m.id} className={`border-b border-gray-100 ${m.read ? "" : "bg-orange/5"}`}>
                      <td className="px-4 py-3 font-semibold text-teal-deep">
                        {!m.read && <span className="inline-block w-2 h-2 rounded-full bg-orange mr-2" />}
                        {m.name}
                      </td>
                      <td className="px-4 py-3 text-teal-soft">{m.email}</td>
                      <td className="px-4 py-3 text-teal-soft max-w-md"><div className="line-clamp-2">{m.message}</div></td>
                      <td className="px-4 py-3 text-teal-soft text-xs">{(m.created_at || "").slice(0, 16).replace("T", " ")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {!m.read && (
                            <button onClick={() => markRead(m)} className="text-teal hover:text-orange" title={t.admin.contactReadAll}>
                              <MailOpen size={16} />
                            </button>
                          )}
                          <button onClick={() => deleteMsg(m)} className="text-red-500 hover:text-red-700" title={t.admin.delete}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminPanel;
