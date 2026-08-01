export const renderServerLandingPage = (envName = 'development') => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mobile Shop ERP - API Server</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(17, 24, 39, 0.75);
      --card-border: rgba(255, 255, 255, 0.08);
      --primary: #3b82f6;
      --primary-glow: rgba(59, 130, 246, 0.35);
      --accent: #10b981;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(59, 130, 246, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 85% 85%, rgba(16, 185, 129, 0.12) 0%, transparent 40%);
      background-attachment: fixed;
    }
    .container {
      width: 100%;
      max-width: 680px;
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: 24px;
      padding: 2.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.85rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 9999px;
      color: var(--accent);
      font-size: 0.825rem;
      font-weight: 600;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      background-color: var(--accent);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--accent);
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .4; }
    }
    h1 {
      font-size: 1.85rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      background: linear-gradient(135deg, #ffffff 0%, #9ca3af 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    p.subtitle {
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.5;
    }
    .links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }
    .link-card {
      display: flex;
      flex-direction: column;
      padding: 1.25rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      text-decoration: none;
      color: var(--text);
      transition: all 0.2s ease;
    }
    .link-card:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(59, 130, 246, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -5px var(--primary-glow);
    }
    .link-title {
      font-weight: 700;
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .link-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .env-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1.5rem;
      border-top: 1px solid var(--card-border);
      font-size: 0.825rem;
      color: var(--text-muted);
    }
    .env-tag {
      font-family: 'JetBrains Mono', monospace;
      padding: 0.2rem 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      color: #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="status-badge">
        <span class="status-dot"></span>
        API Online
      </div>
    </div>
    
    <h1>Brothers Mobile Shop ERP</h1>
    <p class="subtitle">Enterprise Grade Multi-Branch Point of Sale & Management Backend System</p>
    
    <div class="links-grid">
      <a href="/api-docs" class="link-card">
        <div class="link-title">Swagger OpenAPI <span>↗</span></div>
        <div class="link-desc">Explore live interactive API documentation</div>
      </a>
      <a href="/api/v1/health" class="link-card">
        <div class="link-title">System Health <span>↗</span></div>
        <div class="link-desc">View server status & uptime metric</div>
      </a>
    </div>
    
    <div class="env-info">
      <div>Environment: <span class="env-tag">${envName}</span></div>
      <div>Version: <span class="env-tag">v1.0.0</span></div>
    </div>
  </div>
</body>
</html>`;
};
