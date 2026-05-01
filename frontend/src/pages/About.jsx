import React from "react";
import { Link } from "react-router-dom";
import { Heart, Sparkles, Users, HandshakeIcon, ArrowRight, ShieldCheck, Building2, HeartHandshake } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

const Pillar = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
    <span className="w-12 h-12 rounded-full bg-orange/15 text-orange flex items-center justify-center">
      <Icon size={22} />
    </span>
    <h3 className="font-display text-xl text-teal-deep mt-4 leading-tight">{title}</h3>
    <p className="text-teal-soft text-sm mt-2 leading-relaxed">{children}</p>
  </div>
);

const Stat = ({ num, label }) => (
  <div>
    <div className="font-display text-4xl md:text-5xl text-orange leading-none">{num}</div>
    <div className="text-xs uppercase tracking-wider font-bold text-teal-soft mt-2">{label}</div>
  </div>
);

const About = () => {
  const { t } = useI18n();
  return (
    <section className="bg-cream">
      {/* Hero */}
      <div className="relative overflow-hidden bg-teal-deep text-white py-20 md:py-28">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-orange/15 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-teal/30 blur-3xl"></div>
        <div className="container-tight relative">
          <p className="eyebrow text-orange">{t.nav.about}</p>
          <h1 className="font-display text-4xl md:text-6xl leading-tight mt-3 max-w-3xl">
            Una red que <span className="text-orange">conecta corazones</span>,
            recursos y soluciones.
          </h1>
          <p className="text-white/80 mt-6 text-lg max-w-2xl">
            Somos <strong className="text-white">RAS — Red de Amor y Solidaridad</strong>, una comunidad que une a personas,
            emprendedores y organizaciones para que todos encuentren lo que necesitan,
            cuando lo necesitan, en Odessa y sus alrededores.
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="container-tight py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="eyebrow text-orange">Nuestra misión</p>
            <h2 className="font-display text-3xl md:text-4xl text-teal-deep mt-3 leading-tight">
              No competimos — <span className="text-orange italic">conectamos</span> y coordinamos soluciones.
            </h2>
            <p className="text-teal-soft mt-5 leading-relaxed">
              Creemos que cuando la comunidad trabaja junta, los resultados se multiplican.
              Por eso construimos una sola red donde los emprendedores locales ganan visibilidad,
              las organizaciones encuentran voluntarios y cualquier persona accede a servicios
              de confianza sin intermediarios.
            </p>
            <p className="text-teal-soft mt-3 leading-relaxed">
              Movemos corazones. Unimos esfuerzos. Generamos impacto real.
            </p>
          </div>
          <div className="bg-gradient-to-br from-teal to-teal-deep rounded-3xl p-10 text-white relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-orange/20"></div>
            <Heart size={32} className="text-orange relative" />
            <blockquote className="relative font-display text-xl md:text-2xl mt-5 leading-snug italic">
              "Juntos transformamos. Encuentra aquí todo lo que necesitas, cuando lo necesitas."
            </blockquote>
            <p className="relative text-white/70 text-sm mt-5 uppercase tracking-wider font-bold">— Equipo RAS</p>
          </div>
        </div>
      </div>

      {/* Pillars */}
      <div className="bg-white py-16 md:py-20">
        <div className="container-tight">
          <div className="text-center max-w-2xl mx-auto">
            <p className="eyebrow text-orange">¿Qué hacemos?</p>
            <h2 className="font-display text-3xl md:text-4xl text-teal-deep mt-3 leading-tight">
              Tres formas de formar parte de la RED
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Pillar icon={Users} title="Para usuarios">
              Encuentra servicios, eventos y profesionales de confianza cerca de ti.
              Solo conéctate, explora y contacta directamente con quienes pueden ayudarte.
            </Pillar>
            <Pillar icon={Sparkles} title="Para emprendedores">
              Muestra tu emprendimiento o profesión a toda una comunidad activa.
              Obtén mayor visibilidad, más usuarios y estadísticas de quién te visita.
            </Pillar>
            <Pillar icon={Building2} title="Para entidades comunitarias">
              ONGs, iglesias, fundaciones y centros comunitarios pueden publicar eventos
              y convocar voluntarios de toda la red.
            </Pillar>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="container-tight py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-white rounded-3xl border border-gray-200 p-8">
            <span className="w-12 h-12 rounded-full bg-teal text-white flex items-center justify-center">
              <HeartHandshake size={22} />
            </span>
            <h3 className="font-display text-2xl text-teal-deep mt-4">Solidaridad real</h3>
            <p className="text-teal-soft mt-2 leading-relaxed">
              Cada persona registrada forma parte de un tejido comunitario que se apoya.
              Los voluntarios pueden sumarse a eventos de entidades locales con un solo clic.
            </p>
          </div>
          <div className="bg-white rounded-3xl border border-gray-200 p-8">
            <span className="w-12 h-12 rounded-full bg-orange text-white flex items-center justify-center">
              <ShieldCheck size={22} />
            </span>
            <h3 className="font-display text-2xl text-teal-deep mt-4">Confianza primero</h3>
            <p className="text-teal-soft mt-2 leading-relaxed">
              El directorio es gratuito pero gated: solo miembros registrados pueden ver
              los perfiles completos. Así protegemos a nuestros emprendedores y garantizamos
              contactos reales.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white py-14 border-y border-gray-100">
        <div className="container-tight grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <Stat num="100%" label="Gratuito" />
          <Stat num="2" label="Idiomas" />
          <Stat num="13" label="Tipos de entidad" />
          <Stat num="∞" label="Posibilidades" />
        </div>
      </div>

      {/* CTA */}
      <div className="container-tight py-16 md:py-20 text-center">
        <p className="eyebrow text-orange">Únete hoy</p>
        <h2 className="font-display text-3xl md:text-4xl text-teal-deep mt-3 max-w-2xl mx-auto leading-tight">
          Esto lo estamos construyendo <span className="text-orange italic">contigo</span>.
        </h2>
        <p className="text-teal-soft mt-4 max-w-xl mx-auto">
          Sea cual sea tu rol —usuario, emprendedor o entidad— tienes un lugar en la RED.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register" className="btn-orange" data-testid="about-cta-register">
            Registrarme ahora <ArrowRight size={14} />
          </Link>
          <Link to="/directory" className="btn-teal-outline" data-testid="about-cta-directory">
            Ver el directorio
          </Link>
        </div>
      </div>
    </section>
  );
};

export default About;
