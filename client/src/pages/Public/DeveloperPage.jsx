import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronUp,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  Github,
  Globe,
  Heart,
  Layers,
  Linkedin,
  Mail,
  MapPin,
  Rocket,
  Server,
  Sparkles,
  Star,
  Terminal,
  Zap,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

export default function DeveloperPage() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const skills = [
    {
      category: 'Frontend & UI Core',
      bgColor: 'bg-amber-300',
      skills: ['React.js 18', 'Vite 5', 'TailwindCSS v3', 'Neo-Brutalism UI', 'Zustand State', 'TanStack Query'],
    },
    {
      category: 'Backend & APIs',
      bgColor: 'bg-lime-400',
      skills: ['Node.js (ESM)', 'Express.js', 'Python 3', 'Django Framework', 'RESTful APIs', 'SSE Real-time'],
    },
    {
      category: 'Databases & ORM',
      bgColor: 'bg-cyan-300',
      skills: ['MongoDB', 'MySQL / MariaDB', 'PostgreSQL', 'Knex.js Query Builder', 'Mongoose', 'Schema Migrations'],
    },
    {
      category: 'Architecture & DevOps',
      bgColor: 'bg-pink-400',
      skills: ['Multi-Tenancy SaaS', 'JWT & MFA TOTP', 'Docker', 'Git & GitHub', 'Linux Server Admin', 'Clean Architecture'],
    },
  ];

  const featuredProjects = [
    {
      title: 'OmniManage ERP & Multi-Branch POS',
      category: 'Flagship Enterprise SaaS',
      badgeColor: 'bg-yellow-300',
      description:
        'A multi-tenant Mobile Shop ERP system featuring real-time IMEI lifetime passport tracking, thermal billing, inter-branch stock transfers, double-entry accounting, and workforce management.',
      tech: ['MERN Stack', 'Node.js', 'Express', 'React 18', 'MongoDB', 'MySQL', 'TailwindCSS'],
      highlights: [
        'Multi-tenant Subdomain Scoping',
        'IMEI Lifetime History Passport',
        'Inter-Branch Stock Transfer Engine',
        'Double-Entry Chart of Accounts',
      ],
      link: '/',
    },
    {
      title: 'School Management ERP System',
      category: 'Educational Platform',
      badgeColor: 'bg-lime-300',
      description:
        'An all-in-one educational ERP platform managing student enrollment, attendance tracking, fee collection, examination grading, teacher payroll, and parent portal notifications.',
      tech: ['Python', 'Django', 'React', 'PostgreSQL', 'Redis', 'TailwindCSS'],
      highlights: [
        'Automated Fee Invoice Generation',
        'Student Attendance Analytics',
        'Report Card Generation Engine',
        'Role-Based Staff Access',
      ],
      link: '#',
    },
    {
      title: 'Enterprise Custom SaaS Solutions',
      category: 'Bespoke Web Systems',
      badgeColor: 'bg-cyan-300',
      description:
        'Custom web applications engineered with modular architecture, high-performance database indexing, audit logging, and responsive neo-brutalist & glassmorphism design modes.',
      tech: ['Node.js', 'Python', 'React', 'PostgreSQL', 'MongoDB', 'REST APIs'],
      highlights: [
        'High-Concurrency API Endpoints',
        'Audit-Grade Security Protocols',
        'Custom Design Theme Engines',
      ],
      link: 'https://salahuddin.codes',
    },
  ];

  const stats = [
    { label: 'Featured ERP Projects', value: '15+', bg: 'bg-yellow-300' },
    { label: 'Core Tech Stack Packs', value: 'MERN + Django', bg: 'bg-lime-300' },
    { label: 'Relational DBs', value: 'MySQL & Postgres', bg: 'bg-cyan-300' },
    { label: 'GitHub Handle', value: '@salahuddingfx', bg: 'bg-pink-300' },
  ];

  return (
    <div className="min-h-screen bg-[#fffbeb] text-black font-sans selection:bg-yellow-300 selection:text-black">
      {/* ─── NEO-BRUTALIST NAVBAR ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-yellow-300 border-b-4 border-black px-4 sm:px-8 py-3 shadow-[0_4px_0_0_#000]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 font-black text-sm uppercase bg-white border-2 border-black px-3.5 py-1.5 rounded-lg shadow-[3px_3px_0px_0px_#000] hover:bg-lime-300 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
          >
            <ArrowLeft className="h-4 w-4 stroke-[3]" />
            Back to App
          </Link>

          <div className="flex items-center gap-2">
            <a
              href="https://salahuddin.codes"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-black text-xs uppercase bg-pink-400 border-2 border-black px-3.5 py-1.5 rounded-lg shadow-[3px_3px_0px_0px_#000] hover:bg-pink-300 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <Globe className="h-3.5 w-3.5 stroke-[3]" />
              salahuddin.codes
            </a>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 border-b-4 border-black bg-[#faf5ff] relative overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="inline-block bg-lime-400 border-3 border-black px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] mb-6">
            ⚡ Neo-Brutalist Architect & Full-Stack Engineer
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-5 text-left flex-1">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-black leading-none drop-shadow-[4px_4px_0px_#facc15]">
                Salah Uddin Kader <span className="bg-cyan-300 border-2 border-black px-2 py-0.5 shadow-[3px_3px_0px_0px_#000]">.codes</span>
              </h1>
              
              <p className="text-base sm:text-lg font-bold text-black max-w-2xl leading-relaxed bg-white border-3 border-black p-4 rounded-xl shadow-[5px_5px_0px_0px_#000]">
                Passionate software developer building enterprise ERP systems, school management suites, and SaaS platforms. Specializing in 
                <span className="bg-yellow-300 border border-black px-1 mx-1">MERN Stack</span>,
                <span className="bg-lime-300 border border-black px-1 mx-1">Python & Django</span>, and
                <span className="bg-cyan-300 border border-black px-1 mx-1">MySQL & PostgreSQL</span>.
              </p>

              {/* Badges and Links */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="https://salahuddin.codes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-black text-xs uppercase bg-yellow-300 border-3 border-black px-4 py-2.5 rounded-xl shadow-[4px_4px_0px_0px_#000] hover:bg-yellow-400 hover:-translate-x-1 hover:-translate-y-1 transition-all"
                >
                  <Globe className="h-4 w-4 stroke-[2.5]" />
                  Portfolio: salahuddin.codes
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <a
                  href="https://github.com/salahuddingfx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-black text-xs uppercase bg-lime-400 border-3 border-black px-4 py-2.5 rounded-xl shadow-[4px_4px_0px_0px_#000] hover:bg-lime-300 hover:-translate-x-1 hover:-translate-y-1 transition-all"
                >
                  <Github className="h-4 w-4 stroke-[2.5]" />
                  GitHub: @salahuddingfx
                </a>

                <a
                  href="mailto:info.salahuddindev@gmail.com"
                  className="flex items-center gap-2 font-black text-xs uppercase bg-pink-400 border-3 border-black px-4 py-2.5 rounded-xl shadow-[4px_4px_0px_0px_#000] hover:bg-pink-300 hover:-translate-x-1 hover:-translate-y-1 transition-all text-black"
                >
                  <Mail className="h-4 w-4 stroke-[2.5]" />
                  info.salahuddindev@gmail.com
                </a>
              </div>
            </div>

            {/* Profile Avatar Card */}
            <div className="relative shrink-0">
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-cyan-300 border-4 border-black p-3 shadow-[8px_8px_0px_0px_#000] flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-xl bg-white border-3 border-black flex items-center justify-center font-black text-3xl shadow-[4px_4px_0px_0px_#000] mb-3">
                  SD
                </div>
                <div className="font-black text-sm uppercase tracking-wider">Salahuddin</div>
                <div className="font-bold text-xs bg-yellow-300 border border-black px-2 py-0.5 rounded-md mt-1">
                  @salahuddingfx
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ───────────────────────────────────────────────────── */}
      <section className="py-10 px-4 sm:px-8 border-b-4 border-black bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`${s.bg} border-3 border-black p-4 rounded-xl shadow-[5px_5px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all text-center`}
            >
              <div className="font-black text-lg sm:text-xl text-black truncate">{s.value}</div>
              <div className="font-bold text-xs uppercase text-black tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SKILLS MATRIX ───────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 border-b-4 border-black bg-[#f0fdf4]">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="bg-yellow-300 border-2 border-black px-3 py-1 font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_#000]">
              Technology Arsenal
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
              Skills Pack & Core Expertise
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skills.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border-4 border-black p-6 rounded-2xl shadow-[6px_6px_0px_0px_#000] hover:shadow-[8px_8px_0px_0px_#000] transition-all space-y-4"
              >
                <div className="flex items-center justify-between border-b-3 border-black pb-3">
                  <h3 className="font-black text-lg uppercase tracking-tight text-black">{item.category}</h3>
                  <span className={`${item.bgColor} border-2 border-black text-xs font-black px-2.5 py-0.5 rounded-md shadow-[2px_2px_0px_0px_#000]`}>
                    Verified
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.skills.map((sk, sIdx) => (
                    <span
                      key={sIdx}
                      className="bg-slate-100 border-2 border-black px-3 py-1 text-xs font-bold rounded-lg shadow-[2px_2px_0px_0px_#000] hover:bg-yellow-300 transition-colors"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED PROJECTS ────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 border-b-4 border-black bg-[#fef2f2]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="bg-cyan-300 border-2 border-black px-3 py-1 font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_#000]">
              Built with Precision
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
              Featured ERP & SaaS Solutions
            </h2>
          </div>

          <div className="space-y-8">
            {featuredProjects.map((proj, i) => (
              <div
                key={i}
                className="bg-white border-4 border-black p-6 sm:p-8 rounded-2xl shadow-[8px_8px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-3 border-black pb-4">
                  <div>
                    <span className={`${proj.badgeColor} border-2 border-black text-xs font-black px-2.5 py-0.5 rounded-md shadow-[2px_2px_0px_0px_#000] uppercase inline-block mb-2`}>
                      {proj.category}
                    </span>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-black">{proj.title}</h3>
                  </div>
                  {proj.link && (
                    <a
                      href={proj.link}
                      target={proj.link.startsWith('http') ? '_blank' : '_self'}
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-black text-xs uppercase bg-yellow-300 border-2 border-black px-4 py-2 rounded-xl shadow-[3px_3px_0px_0px_#000] hover:bg-yellow-400 transition-all self-start sm:self-auto"
                    >
                      <span>Explore</span>
                      <ExternalLink className="h-3.5 w-3.5 stroke-[3]" />
                    </a>
                  )}
                </div>

                <p className="font-bold text-sm text-slate-800 leading-relaxed">{proj.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="font-black text-xs uppercase text-slate-500 mb-2">Tech Stack Used:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {proj.tech.map((t, tIdx) => (
                        <span key={tIdx} className="bg-lime-200 border border-black text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-black text-xs uppercase text-slate-500 mb-2">Key Highlights:</div>
                    <div className="space-y-1">
                      {proj.highlights.map((h, hIdx) => (
                        <div key={hIdx} className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT & CONNECT ────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-yellow-300">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="bg-white border-2 border-black px-3 py-1 font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_#000]">
            Let's Collaborate
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-black">
            Ready to Build Your Next Big Solution?
          </h2>
          <p className="font-bold text-base text-slate-900 max-w-xl mx-auto">
            Looking for a custom ERP solution, School Management suite, or specialized SaaS system? Let's connect!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="mailto:info.salahuddindev@gmail.com"
              className="inline-flex items-center gap-2 font-black text-sm uppercase bg-black text-white border-3 border-black px-6 py-3.5 rounded-xl shadow-[5px_5px_0px_0px_#fff] hover:bg-slate-900 hover:-translate-x-1 hover:-translate-y-1 transition-all"
            >
              <Mail className="h-4 w-4" />
              Email: info.salahuddindev@gmail.com
            </a>
            <a
              href="https://salahuddin.codes"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-black text-sm uppercase bg-white text-black border-3 border-black px-6 py-3.5 rounded-xl shadow-[5px_5px_0px_0px_#000] hover:bg-lime-300 hover:-translate-x-1 hover:-translate-y-1 transition-all"
            >
              <Globe className="h-4 w-4" />
              Visit Portfolio: salahuddin.codes
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="py-6 px-4 sm:px-8 bg-black text-white border-t-4 border-black">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold">
          <div>
            &copy; {new Date().getFullYear()} Salah Uddin Kader (@salahuddingfx) • All Rights Reserved.
          </div>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 bg-yellow-300 text-black border-2 border-white px-3 py-1.5 rounded-lg font-black hover:bg-yellow-400 transition-colors"
          >
            Top <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
