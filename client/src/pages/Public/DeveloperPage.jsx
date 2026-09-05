import {
  ArrowRight,
  Boxes,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  FileCode,
  Globe2,
  Key,
  Layers,
  Lock,
  Radio,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollReveal from '../../components/public/ScrollReveal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function DeveloperPage() {
  useDocumentTitle('Developer API & Platform Architecture - OmniManage ERP');
  const [activeLang, setActiveLang] = useState('curl');
  const [copied, setCopied] = useState(false);

  const codeSnippets = {
    curl: `curl -X POST "https://api.omnimanage.app/api/v1/sales" \\
  -H "Authorization: Bearer YOUR_API_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerId": "cust_90124",
    "items": [
      {
        "productId": "prod_iph15pm",
        "imei": "358102948210941",
        "price": 135000,
        "quantity": 1
      }
    ],
    "paymentMethod": "CASH",
    "receivedAmount": 135000
  }'`,

    js: `import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.omnimanage.app/api/v1',
  headers: {
    Authorization: \`Bearer \${process.env.OMNIMANAGE_API_KEY}\`,
    'Content-Type': 'application/json'
  }
});

// Create sale with unique IMEI attachment
const { data } = await client.post('/sales', {
  customerId: 'cust_90124',
  items: [{
    productId: 'prod_iph15pm',
    imei: '358102948210941',
    price: 135000,
    quantity: 1
  }],
  paymentMethod: 'CASH',
  receivedAmount: 135000
});

console.log('Invoice Generated:', data.data.invoiceNumber);`,

    python: `import requests

url = "https://api.omnimanage.app/api/v1/sales"
headers = {
    "Authorization": "Bearer YOUR_API_JWT_TOKEN",
    "Content-Type": "application/json"
}
payload = {
    "customerId": "cust_90124",
    "items": [{
        "productId": "prod_iph15pm",
        "imei": "358102948210941",
        "price": 135000,
        "quantity": 1
    }],
    "paymentMethod": "CASH",
    "receivedAmount": 135000
}

response = requests.post(url, json=payload, headers=headers)
print("Response:", response.json())`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeLang]);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const stackLayers = [
    {
      title: 'Backend API Engine',
      tech: 'Node.js (ESM) • Express.js',
      desc: 'Modular controller-service-validator architecture. Enforced with Zod schemas and sub-second execution.',
      icon: Server,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-500 dark:text-emerald-400',
    },
    {
      title: 'Relational Database Layer',
      tech: 'MySQL 8 / MariaDB • Knex.js Query Builder',
      desc: 'Strict relational data integrity, multi-tenant schemas, atomic ACID transactions for invoicing and double-entry accounting.',
      icon: Database,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-500 dark:text-blue-400',
    },
    {
      title: 'Real-Time Event Stream',
      tech: 'Server-Sent Events (SSE) • Node EventEmitter',
      desc: 'Lightweight, firewall-friendly real-time updates for stock changes, technician job status, and sale alerts without heavy websocket overhead.',
      icon: Radio,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-500 dark:text-amber-400',
    },
    {
      title: 'Frontend Client Architecture',
      tech: 'React 18 • Vite 5 • TailwindCSS v3 • Zustand',
      desc: 'Ultra-fast single-page app with TanStack Query caching, offline indexedDB queueing, and smooth 60fps micro-animations.',
      icon: Cpu,
      color: 'from-purple-500/20 to-violet-500/20 text-purple-500 dark:text-purple-400',
    },
  ];

  const endpoints = [
    { method: 'POST', path: '/api/v1/auth/login-direct', desc: 'Direct JWT auth exchange with role claims' },
    { method: 'GET', path: '/api/v1/products', desc: 'Query stock catalogue, barcode filters, and prices' },
    { method: 'GET', path: '/api/v1/imei/:imei/history', desc: 'Query complete device lifecycle passport' },
    { method: 'POST', path: '/api/v1/sales', desc: 'Process POS invoice, attach IMEIs, update ledger' },
    { method: 'POST', path: '/api/v1/repair', desc: 'Generate repair ticket and assign lab technician' },
    { method: 'GET', path: '/api/v1/sse', desc: 'Subscribe to real-time shop notification events' },
  ];

  return (
    <div className="relative overflow-hidden font-sans">
      {/* ─── HERO HEADER ──────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 bg-gradient-to-b from-blue-50/50 via-transparent to-transparent dark:from-slate-900/40 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <ScrollReveal animation="fade-down">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 text-xs font-bold">
              <Code2 className="w-3.5 h-3.5" />
              <span>Developer Hub & Integration Specs</span>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={150}>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Built for Developers,{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Engineered for Speed
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={300}>
            <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Integrate your e-commerce storefront, custom hardware kiosks, or enterprise data warehouses with
              OmniManage's REST APIs and SSE streaming engine.
            </p>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={450}>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/api-docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all active:scale-95"
              >
                <span>Explore OpenAPI / Swagger</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="#code-sample"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>View Code Samples</span>
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── TECH STACK ARCHITECTURE ─────────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="fade-up" className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            System Architecture
          </h2>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            High-Performance Stack
          </h3>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stackLayers.map((layer, idx) => {
            const Icon = layer.icon;
            return (
              <ScrollReveal
                key={layer.title}
                animation="fade-up"
                delay={idx * 100}
                className="h-full"
              >
                <div className="h-full p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between hover:border-blue-500/40 hover:shadow-lg transition-all">
                  <div className="space-y-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${layer.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{layer.title}</h4>
                    <p className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                      {layer.tech}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{layer.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ─── CODE SAMPLE & ENDPOINTS ─────────────────────────────────────────── */}
      <section id="code-sample" className="py-16 bg-slate-100/70 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Left: Endpoint List */}
            <ScrollReveal animation="fade-right" className="space-y-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Core REST Endpoints</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Authenticate requests via Bearer JWT token header or httpOnly cookies.
                </p>
              </div>

              <div className="space-y-2.5">
                {endpoints.map((ep) => (
                  <div
                    key={ep.path}
                    className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-blue-500/40 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          ep.method === 'GET'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{ep.path}</span>
                    </div>
                    <span className="text-slate-500 text-[11px]">{ep.desc}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            {/* Right: Code Snippet Card */}
            <ScrollReveal animation="fade-left" delay={200} className="rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-[11px] text-slate-400">create-sale-example</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-800 rounded-lg p-0.5 font-mono text-[10px]">
                    {['curl', 'js', 'python'].map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setActiveLang(lang)}
                        className={`px-2 py-1 rounded-md transition-colors ${
                          activeLang === lang ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    aria-label="Copy Code"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Code display */}
              <pre className="p-5 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                <code>{codeSnippets[activeLang]}</code>
              </pre>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
}
