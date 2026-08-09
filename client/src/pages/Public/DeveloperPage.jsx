import {
  ArrowLeft,
  ChevronUp,
  Code2,
  Database,
  ExternalLink,
  Github,
  Globe,
  Heart,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Server,
  Shield,
  Smartphone,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DeveloperPage() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const skills = [
    {
      icon: Code2,
      name: 'Full-Stack Development',
      description: 'React, Node.js, Express, MongoDB, MySQL',
    },
    {
      icon: Database,
      name: 'Database Design',
      description: 'Schema design, optimization, migrations',
    },
    {
      icon: Server,
      name: 'Backend Architecture',
      description: 'REST APIs, Authentication, Real-time systems',
    },
    {
      icon: Smartphone,
      name: 'Mobile-First Design',
      description: 'Responsive UI, Progressive Web Apps',
    },
    { icon: Globe, name: 'Cloud Deployment', description: 'Docker, CI/CD, AWS, DigitalOcean' },
    { icon: Shield, name: 'Security', description: 'JWT, OAuth, Data encryption, Best practices' },
  ];

  const projects = [
    {
      name: 'OmniManage ERP',
      description:
        'A comprehensive Mobile Shop ERP system with multi-tenant architecture, real-time updates, and advanced reporting capabilities.',
      tech: ['React', 'Node.js', 'Express', 'MySQL', 'MongoDB', 'Tailwind CSS'],
      features: [
        'Multi-tenant SaaS',
        'Real-time SSE',
        'POS System',
        'Accounting Module',
        'HR Management',
      ],
    },
  ];

  const stats = [
    { label: 'Projects Completed', value: '10+' },
    { label: 'Years Experience', value: '5+' },
    { label: 'Happy Clients', value: '50+' },
    { label: 'Lines of Code', value: '100K+' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      {/* ─── NAVIGATION ──────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="mailto:salahuddin@example.com"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm mb-8">
            <Code2 className="h-4 w-4" />
            Full-Stack Developer
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Salah Uddin Kader
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Passionate full-stack developer crafting scalable web applications with modern
            technologies. Specializing in React, Node.js, and cloud-native solutions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="h-4 w-4 text-indigo-400" />
              Bangladesh
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Phone className="h-4 w-4 text-indigo-400" />
              +880 1700-000000
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Mail className="h-4 w-4 text-indigo-400" />
              salahuddin@example.com
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ───────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SKILLS ──────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Skills & Expertise</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                  <skill.icon className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{skill.name}</h3>
                <p className="text-sm text-slate-400">{skill.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROJECTS ────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Featured Project</h2>
          {projects.map((project, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold">{project.name}</h3>
                <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors">
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
              <p className="text-slate-400 mb-6 leading-relaxed">{project.description}</p>
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-300 mb-3">Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((t, j) => (
                    <span
                      key={j}
                      className="px-3 py-1 text-xs rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3">Key Features</h4>
                <div className="flex flex-wrap gap-2">
                  {project.features.map((f, j) => (
                    <span
                      key={j}
                      className="px-3 py-1 text-xs rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ABOUT ───────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">About Me</h2>
          <p className="text-slate-400 leading-relaxed mb-6">
            I'm a dedicated full-stack developer with a passion for building efficient, scalable,
            and user-friendly applications. With expertise in modern web technologies, I transform
            complex problems into elegant solutions.
          </p>
          <p className="text-slate-400 leading-relaxed">
            When I'm not coding, you'll find me exploring new technologies, contributing to
            open-source projects, and sharing knowledge with the developer community.
          </p>
        </div>
      </section>

      {/* ─── CONTACT ─────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Let's Connect</h2>
          <p className="text-slate-400 mb-8">
            Have a project in mind or want to collaborate? Feel free to reach out!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:salahuddin@example.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <Mail className="h-4 w-4" />
              Send Email
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium transition-all duration-300"
            >
              <Github className="h-4 w-4" />
              View GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer className="py-8 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            &copy; {new Date().getFullYear()} Salah Uddin Kader. Built with
            <Heart className="h-3 w-3 text-indigo-500 fill-indigo-500" />
            using React & Node.js
          </div>
          <button
            onClick={scrollToTop}
            className="hover:text-indigo-400 font-bold flex items-center gap-1 transition-colors"
          >
            Back to Top <ChevronUp className="h-3 w-3" />
          </button>
        </div>
      </footer>

      {/* ─── SCROLL TO TOP ───────────────────────────────────── */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className="fixed bottom-5 right-5 z-50 p-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/30 transition-all duration-300 hover:scale-110 active:scale-95"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
    </div>
  );
}
