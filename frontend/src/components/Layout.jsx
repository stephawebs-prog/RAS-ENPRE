import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Mail, Phone, Facebook, Instagram, MessageCircle, Globe, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/auth/AuthContext";

const LOGO_ES = "https://customer-assets.emergentagent.com/job_creator-connect-302/artifacts/axnqaied_LOGO-WEB.png";
const LOGO_EN = "https://customer-assets.emergentagent.com/job_creator-connect-302/artifacts/bo1j0zr3_LOGO-RAS.png";

export const Logo = ({ className = "h-14", invert = false }) => {
  const { lang } = useI18n();
  const src = lang === "en" ? LOGO_EN : LOGO_ES;
  return (
    <Link to="/" className="inline-flex items-center" data-testid="brand-logo-link">
      <img
        src={src}
        alt="Red de Amor y Solidaridad"
        className={`${className} w-auto ${invert ? "" : "mix-blend-multiply"}`}
      />
    </Link>
  );
};

const TopBar = () => {
  const { t, lang, toggle } = useI18n();
  return (
    <div className="bg-teal text-white text-sm">
      <div className="container-tight flex flex-wrap items-center justify-between gap-2 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden sm:inline">❤</span>
          <span className="truncate">{t.topbar.tagline}</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="mailto:info@lovesolidarity.com" className="hidden md:inline-flex items-center gap-2 hover:text-orange transition-colors">
            <Mail size={14} /> info@lovesolidarity.com
          </a>
          <a href="tel:+14322584444" className="hidden md:inline-flex items-center gap-2 hover:text-orange transition-colors">
            <Phone size={14} /> +1 (432) 258-4444
          </a>
          <button
            onClick={toggle}
            data-testid="lang-toggle"
            className="inline-flex items-center gap-1 border border-white/30 hover:border-orange hover:text-orange rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Globe size={12} /> {lang === "es" ? "EN" : "ES"}
          </button>
          <div className="flex items-center gap-2">
            <a href="https://www.facebook.com/profile.php?id=61585047449986" target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-orange"><Facebook size={14} /></a>
            <a href="https://www.instagram.com/love_andsolidarity/" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-orange"><Instagram size={14} /></a>
            <a href="https://wa.me/14322584444" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="hover:text-orange"><MessageCircle size={14} /></a>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Navbar = () => {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const linkClass = ({ isActive }) =>
    `text-sm font-semibold uppercase tracking-wider transition-colors ${isActive ? "text-orange" : "text-teal hover:text-orange"}`;

  const handleLogout = async () => { await logout(); navigate("/"); };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
      <TopBar />
      <div className="container-tight flex items-center justify-between py-3">
        <Logo className="h-20" />
        <nav className="hidden lg:flex items-center gap-7">
          <NavLink to="/" end className={linkClass} data-testid="nav-home">{t.nav.home}</NavLink>
          <NavLink to="/directory" className={linkClass} data-testid="nav-directory">{t.nav.directory}</NavLink>
          <NavLink to="/eventos" className={linkClass} data-testid="nav-events">{t.nav.events}</NavLink>
          <NavLink to="/conocenos" className={linkClass} data-testid="nav-about">{t.nav.about}</NavLink>
        </nav>
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              {user.role === "admin" ? (
                <Link to="/admin" className="btn-teal-outline" data-testid="nav-admin">
                  <LayoutDashboard size={14} /> {t.nav.admin}
                </Link>
              ) : user.role === "entrepreneur" ? (
                <Link to="/dashboard" className="btn-teal-outline" data-testid="nav-dashboard">
                  <LayoutDashboard size={14} /> {t.nav.dashboard}
                </Link>
              ) : user.role === "entity" ? (
                <Link to="/entity" className="btn-teal-outline" data-testid="nav-dashboard">
                  <LayoutDashboard size={14} /> {t.nav.dashboard}
                </Link>
              ) : (
                <Link to="/dashboard" className="btn-teal-outline" data-testid="nav-dashboard">
                  <LayoutDashboard size={14} /> {t.nav.dashboard}
                </Link>
              )}
              <button onClick={handleLogout} className="text-teal hover:text-orange text-sm font-semibold" data-testid="nav-logout">
                <LogOut size={14} className="inline" /> {t.nav.logout}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-teal hover:text-orange text-sm font-semibold uppercase tracking-wider" data-testid="nav-login">
                {t.nav.login}
              </Link>
              <Link to="/register" className="btn-orange" data-testid="nav-register">{t.nav.register}</Link>
            </>
          )}
        </div>
        <button
          className="lg:hidden text-teal"
          onClick={() => setOpen((v) => !v)}
          data-testid="mobile-menu-toggle"
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="container-tight py-4 flex flex-col gap-3">
            <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>{t.nav.home}</NavLink>
            <NavLink to="/directory" className={linkClass} onClick={() => setOpen(false)}>{t.nav.directory}</NavLink>
            <NavLink to="/eventos" className={linkClass} onClick={() => setOpen(false)}>{t.nav.events}</NavLink>
            <NavLink to="/conocenos" className={linkClass} onClick={() => setOpen(false)}>{t.nav.about}</NavLink>
            {user ? (
              <>
                <Link to="/dashboard" className="btn-teal-outline w-fit" onClick={() => setOpen(false)}>{t.nav.dashboard}</Link>
                <button onClick={handleLogout} className="text-teal text-left text-sm font-semibold">{t.nav.logout}</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-teal text-sm font-semibold uppercase tracking-wider" onClick={() => setOpen(false)}>{t.nav.login}</Link>
                <Link to="/register" className="btn-orange w-fit" onClick={() => setOpen(false)}>{t.nav.register}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="bg-teal-deep text-white/90 mt-24">
      <div className="container-tight grid grid-cols-1 md:grid-cols-4 gap-10 py-16">
        <div>
          <Logo className="h-16" invert />
          <p className="mt-5 text-white/70 italic font-display text-lg leading-snug">
            {t.footer.tag}
          </p>
          <div className="flex items-center gap-3 mt-5 text-white/70">
            <a href="https://www.facebook.com/profile.php?id=61585047449986" target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-orange"><Facebook size={18} /></a>
            <a href="https://www.instagram.com/love_andsolidarity/" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-orange"><Instagram size={18} /></a>
            <a href="https://wa.me/14322584444" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="hover:text-orange"><MessageCircle size={18} /></a>
          </div>
        </div>
        <div>
          <h4 className="eyebrow text-orange mb-4">{t.footer.links}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-orange">{t.nav.home}</Link></li>
            <li><Link to="/directory" className="hover:text-orange">{t.nav.directory}</Link></li>
            <li><Link to="/eventos" className="hover:text-orange">{t.nav.events}</Link></li>
            <li><Link to="/conocenos" className="hover:text-orange">{t.nav.about}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="eyebrow text-orange mb-4">{t.footer.services}</h4>
          <ul className="space-y-2 text-sm">
            {t.services.items.map((s, i) => (<li key={i}>{s.t}</li>))}
          </ul>
        </div>
        <div>
          <h4 className="eyebrow text-orange mb-4">{t.footer.contactNow}</h4>
          <ul className="space-y-2 text-sm">
            <li>1104 S Crane Ave, Odessa, TX</li>
            <li>+1 (432) 258-4444</li>
            <li>info@lovesolidarity.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © 2026 RED Love and Solidarity · {t.footer.rights}
      </div>
    </footer>
  );
};

export const PageShell = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-white">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);
