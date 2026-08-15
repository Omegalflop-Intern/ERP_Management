/**
 * Generate a modern, executive glassmorphic HTML landing page for the OmniManage API Server root route.
 */
export function getLandingPageHtml(serverInfo = {}) {
  const version = serverInfo.version || '1.0.0';
  const envMode = process.env.NODE_ENV || 'development';
  const nodeVersion = process.version;
  const timestamp = new Date().toUTCString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OmniManage ERP — API Server Gateway</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg-dark: #07090e;
      --bg-card: rgba(17, 24, 39, 0.7);
      --bg-card-hover: rgba(31, 41, 55, 0.8);
      --border-color: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(99, 102, 241, 0.3);
      --primary: #6366f1;
      --primary-glow: rgba(99, 102, 241, 0.4);
      --accent-cyan: #06b6d4;
      --accent-emerald: #10b981;
      --accent-purple: #8b5cf6;
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --text-dim: #6b7280;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-dark);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      position: relative;
    }

    /* Ambient Animated Glow Orbs */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(120px);
      z-index: 0;
      pointer-events: none;
      opacity: 0.4;
      animation: floatOrb 18s ease-in-out infinite alternate;
    }
    .orb-1 {
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, #6366f1 0%, rgba(99, 102, 241, 0) 70%);
      top: -100px;
      left: -100px;
    }
    .orb-2 {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, #06b6d4 0%, rgba(6, 182, 212, 0) 70%);
      bottom: -150px;
      right: -100px;
      animation-delay: -9s;
    }

    @keyframes floatOrb {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(60px, 40px) scale(1.1); }
    }

    .container {
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 0 1.5rem;
      position: relative;
      z-index: 1;
    }

    /* Header Navbar */
    header {
      border-bottom: 1px solid var(--border-color);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      background: rgba(7, 9, 14, 0.75);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .nav-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 72px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--text-main);
    }

    .brand-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--primary), var(--accent-cyan));
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.2rem;
      color: #fff;
      box-shadow: 0 0 20px var(--primary-glow);
    }

    .brand-text {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .brand-tag {
      font-size: 0.75rem;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 600;
      margin-left: 6px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34d399;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--accent-emerald);
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulseDot 2s infinite;
    }

    @keyframes pulseDot {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
      border: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary), #4f46e5);
      color: #fff;
      box-shadow: 0 4px 14px var(--primary-glow);
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-main);
      border: 1px solid var(--border-color);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }

    /* Main Content */
    main {
      flex: 1;
      padding: 3rem 0;
    }

    .hero {
      text-align: center;
      max-width: 800px;
      margin: 0 auto 3.5rem auto;
    }

    .hero-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }

    .hero h1 {
      font-size: 3rem;
      font-weight: 800;
      line-height: 1.15;
      margin-bottom: 1.25rem;
      letter-spacing: -0.03em;
      background: linear-gradient(180deg, #ffffff 0%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero h1 span {
      background: linear-gradient(135deg, #818cf8 0%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero p {
      font-size: 1.15rem;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .hero-buttons {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    /* Stats Grid */
    .grid-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
      margin-bottom: 3.5rem;
    }

    .card {
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
      transition: all 0.25s ease;
    }

    .card:hover {
      border-color: var(--border-accent);
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .card-icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    .card-icon-indigo { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .card-icon-cyan { background: rgba(6, 182, 212, 0.15); color: #38bdf8; }
    .card-icon-emerald { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .card-icon-purple { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }

    .card-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }

    .card-value {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text-main);
      letter-spacing: -0.01em;
    }

    .card-subtext {
      font-size: 0.8rem;
      color: var(--text-dim);
      margin-top: 0.4rem;
    }

    /* Endpoints & Modules Section */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .badge-count {
      font-size: 0.8rem;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 2px 10px;
      border-radius: 999px;
    }

    /* Endpoint List Grid */
    .grid-endpoints {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 1.25rem;
      margin-bottom: 3.5rem;
    }

    .endpoint-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      transition: all 0.2s ease;
      text-decoration: none;
      color: inherit;
    }

    .endpoint-item:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(99, 102, 241, 0.3);
      transform: translateX(3px);
    }

    .endpoint-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .method-get {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .endpoint-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .endpoint-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    /* Modules Grid */
    .modules-container {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 2rem;
      margin-bottom: 3.5rem;
    }

    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 10px;
      margin-top: 1.25rem;
    }

    .module-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.025);
      border: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-muted);
      transition: all 0.2s ease;
    }

    .module-pill:hover {
      background: rgba(99, 102, 241, 0.1);
      border-color: rgba(99, 102, 241, 0.3);
      color: #fff;
    }

    /* Terminal Sandbox */
    .terminal-box {
      background: #030712;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }

    .terminal-bar {
      background: #111827;
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
    }

    .terminal-dots {
      display: flex;
      gap: 8px;
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #f59e0b; }
    .dot-green { background: #10b981; }

    .terminal-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: var(--text-dim);
    }

    .terminal-body {
      padding: 1.5rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #a5f3fc;
      line-height: 1.7;
      overflow-x: auto;
    }

    .json-key { color: #818cf8; }
    .json-string { color: #34d399; }
    .json-number { color: #f472b6; }
    .json-boolean { color: #fbbf24; }

    /* Footer */
    footer {
      border-top: 1px solid var(--border-color);
      padding: 2rem 0;
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-dim);
    }

    .footer-links {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin-top: 10px;
    }

    .footer-links a {
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.2s ease;
    }
    .footer-links a:hover {
      color: var(--primary);
    }

    @media (max-width: 768px) {
      .hero h1 { font-size: 2.2rem; }
      .nav-actions .btn-secondary { display: none; }
      .grid-stats { grid-template-columns: 1fr; }
    }

    @media (max-width: 640px) {
      .nav-wrapper { height: 60px; }
      .brand-text { font-size: 1rem; white-space: nowrap; }
      .brand-tag { display: none; }
      .status-badge span:not(.pulse-dot) { font-size: 0.75rem; }
      .btn { padding: 8px 12px; font-size: 0.8rem; white-space: nowrap; }
    }
  </style>
</head>
<body>

  <!-- Ambient Glow Orbs -->
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>

  <!-- Header -->
  <header>
    <div class="container nav-wrapper">
      <a href="/" class="brand">
        <div class="brand-icon">O</div>
        <div class="brand-text">OmniManage <span class="brand-tag">ERP GATEWAY</span></div>
      </a>

      <div class="nav-actions">
        <div class="status-badge">
          <span class="pulse-dot"></span>
          <span>Server Operational</span>
        </div>
        <a href="/api-docs" class="btn btn-primary">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          Swagger Docs
        </a>
      </div>
    </div>
  </header>

  <!-- Main Section -->
  <main>
    <div class="container">
      
      <!-- Hero Banner -->
      <section class="hero">
        <div class="hero-pill">
          <span>⚡ High-Performance ESM Backend</span>
          <span>•</span>
          <span>v${version}</span>
        </div>
        <h1>Enterprise Microservice <span>API Gateway</span></h1>
        <p>
          Powering OmniManage Gadget Shop ERP with real-time SSE streaming, multi-tenant database isolation, POS sales engine, inventory tracking, and full financial accounting.
        </p>
        <div class="hero-buttons">
          <a href="/api-docs" class="btn btn-primary" style="padding: 12px 24px; font-size: 1rem;">
            Explore API Documentation
          </a>
          <a href="/api/v1/health" class="btn btn-secondary" style="padding: 12px 24px; font-size: 1rem;">
            Check Health Status
          </a>
          <button onclick="copyBaseUrl()" class="btn btn-secondary" id="copyBtn" style="padding: 12px 20px;">
            📋 Copy Base URL
          </button>
        </div>
      </section>

      <!-- System Stats Grid -->
      <section class="grid-stats">
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">SYSTEM STATUS</div>
              <div class="card-value" style="color: #34d399;">ONLINE (200 OK)</div>
            </div>
            <div class="card-icon card-icon-emerald">🟢</div>
          </div>
          <div class="card-subtext">HTTP/1.1 CORS Enabled • RESTful API</div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">RUNTIME & ENGINE</div>
              <div class="card-value">Node.js ${nodeVersion}</div>
            </div>
            <div class="card-icon card-icon-indigo">⚡</div>
          </div>
          <div class="card-subtext">ES Modules • Knex Query Builder</div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">ENVIRONMENT</div>
              <div class="card-value" style="text-transform: capitalize;">${envMode}</div>
            </div>
            <div class="card-icon card-icon-cyan">🌐</div>
          </div>
          <div class="card-subtext">Tenant Subdomain Auto-Extraction</div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">ACTIVE MODULES</div>
              <div class="card-value">32 Micro-Modules</div>
            </div>
            <div class="card-icon card-icon-purple">📦</div>
          </div>
          <div class="card-subtext">Zod Validated • Bearer JWT Auth</div>
        </div>
      </section>

      <!-- Key Endpoints Quick Access -->
      <section style="margin-bottom: 3.5rem;">
        <div class="section-header">
          <h2 class="section-title">
            Key System Endpoints
            <span class="badge-count">Quick Access</span>
          </h2>
          <a href="/?format=json" class="btn btn-secondary" style="font-size: 0.8rem; padding: 6px 12px;">
            Raw JSON Output
          </a>
        </div>

        <div class="grid-endpoints">
          <a href="/api-docs" class="endpoint-item">
            <div class="endpoint-left">
              <span class="method-get">DOCS</span>
              <div>
                <div class="endpoint-path">/api-docs</div>
                <div class="endpoint-desc">Interactive Swagger UI Documentation</div>
              </div>
            </div>
            <span style="color: var(--text-dim);">→</span>
          </a>

          <a href="/api/v1/health" class="endpoint-item">
            <div class="endpoint-left">
              <span class="method-get">GET</span>
              <div>
                <div class="endpoint-path">/api/v1/health</div>
                <div class="endpoint-desc">Microservice Health & Timestamp</div>
              </div>
            </div>
            <span style="color: var(--text-dim);">→</span>
          </a>

          <a href="/healthz" class="endpoint-item">
            <div class="endpoint-left">
              <span class="method-get">GET</span>
              <div>
                <div class="endpoint-path">/healthz</div>
                <div class="endpoint-desc">Database Connectivity & System Uptime</div>
              </div>
            </div>
            <span style="color: var(--text-dim);">→</span>
          </a>

          <a href="/api/v1/plans" class="endpoint-item">
            <div class="endpoint-left">
              <span class="method-get">GET</span>
              <div>
                <div class="endpoint-path">/api/v1/plans</div>
                <div class="endpoint-desc">Public Tenant Subscription Plans</div>
              </div>
            </div>
            <span style="color: var(--text-dim);">→</span>
          </a>
        </div>
      </section>

      <!-- Modules Catalog Grid -->
      <section class="modules-container">
        <div class="section-header" style="margin-bottom: 0;">
          <h2 class="section-title">
            Registered Service Modules
            <span class="badge-count">32 Modules</span>
          </h2>
        </div>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 6px;">
          Modular Architecture registered under <code style="color: #38bdf8;">server/modules/</code>
        </p>

        <div class="modules-grid">
          <div class="module-pill">🔐 Auth & MFA</div>
          <div class="module-pill">👤 User Mgmt</div>
          <div class="module-pill">🛡️ Role & RBAC</div>
          <div class="module-pill">📱 Product Catalog</div>
          <div class="module-pill">🔢 IMEI Tracking</div>
          <div class="module-pill">📦 Stock Mgmt</div>
          <div class="module-pill">🛍️ POS Sales</div>
          <div class="module-pill">📊 Reports & BI</div>
          <div class="module-pill">🚚 Suppliers</div>
          <div class="module-pill">📝 Purchase Orders</div>
          <div class="module-pill">💰 Accounting</div>
          <div class="module-pill">👷 Employee HR</div>
          <div class="module-pill">⏰ Attendance</div>
          <div class="module-pill">🌴 Leave System</div>
          <div class="module-pill">💵 Payroll Engine</div>
          <div class="module-pill">🤝 Customer CRM</div>
          <div class="module-pill">🛡️ Warranty Claim</div>
          <div class="module-pill">🔧 Repair Ticket</div>
          <div class="module-pill">🏢 Branch Outlets</div>
          <div class="module-pill">🏬 Wholesale</div>
          <div class="module-pill">🔔 Realtime SSE</div>
          <div class="module-pill">⚙️ System Settings</div>
          <div class="module-pill">💼 Investors</div>
          <div class="module-pill">💸 Expenses</div>
          <div class="module-pill">🏦 Loan Ledger</div>
          <div class="module-pill">📁 Document Vault</div>
          <div class="module-pill">🏢 Multi-Tenant</div>
          <div class="module-pill">🏷️ SaaS Plans</div>
          <div class="module-pill">📜 Audit Logs</div>
          <div class="module-pill">💬 Support Ticket</div>
          <div class="module-pill">👑 Super Admin</div>
          <div class="module-pill">📞 Contacts</div>
        </div>
      </section>

      <!-- Live JSON Terminal Sandbox -->
      <section>
        <div class="section-header">
          <h2 class="section-title">Root Gateway Response</h2>
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: var(--text-dim);">JSON Payload Preview</span>
        </div>

        <div class="terminal-box">
          <div class="terminal-bar">
            <div class="terminal-dots">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
            </div>
            <div class="terminal-title">GET / HTTP/1.1 200 OK</div>
          </div>
          <div class="terminal-body">
{<br />
&nbsp;&nbsp;<span class="json-key">"success"</span>: <span class="json-boolean">true</span>,<br />
&nbsp;&nbsp;<span class="json-key">"message"</span>: <span class="json-string">"OmniManage API Server is running"</span>,<br />
&nbsp;&nbsp;<span class="json-key">"version"</span>: <span class="json-string">"${version}"</span>,<br />
&nbsp;&nbsp;<span class="json-key">"environment"</span>: <span class="json-string">"${envMode}"</span>,<br />
&nbsp;&nbsp;<span class="json-key">"documentation"</span>: <span class="json-string">"/api-docs"</span>,<br />
&nbsp;&nbsp;<span class="json-key">"health"</span>: <span class="json-string">"/api/v1/health"</span>,<br />
&nbsp;&nbsp;<span class="json-key">"timestamp"</span>: <span class="json-string">"${timestamp}"</span><br />
}
          </div>
        </div>
      </section>

    </div>
  </main>

  <!-- Footer -->
  <footer>
    <div class="container">
      <p>OmniManage ERP Solution • Microservice Server Infrastructure</p>
      <div class="footer-links">
        <a href="/api-docs">API Documentation</a>
        <span>•</span>
        <a href="/api/v1/health">Health Check</a>
        <span>•</span>
        <a href="/healthz">Database Status</a>
        <span>•</span>
        <a href="/?format=json">JSON Output</a>
      </div>
    </div>
  </footer>

  <script>
    function copyBaseUrl() {
      const url = window.location.origin;
      navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.innerText = '✅ Copied!';
        setTimeout(() => {
          btn.innerText = '📋 Copy Base URL';
        }, 2000);
      });
    }
  </script>

</body>
</html>`;
}
