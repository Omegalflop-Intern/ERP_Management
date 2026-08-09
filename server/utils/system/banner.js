import os from 'os';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  brightCyan: '\x1b[1;36m',
  green: '\x1b[32m',
  brightGreen: '\x1b[1;32m',
  yellow: '\x1b[33m',
  brightYellow: '\x1b[1;33m',
  blue: '\x1b[34m',
  brightBlue: '\x1b[1;34m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const c = colors;

export const printAsciiBanner = () => {
  const logo = `
${c.brightBlue} ╔══════════════════════════════════════════════════════════════════════════════════╗${c.reset}
${c.brightBlue} ║${c.brightCyan}   ___  __  __ _   _ _____ __  __    _    _   _    _    ____ _____           ${c.brightBlue}║${c.reset}
${c.brightBlue} ║${c.brightCyan}  / _ \\|  \\/  | \\ | |_   _|  \\/  |  / \\  | \\ | |  / \\  / ___| ____|          ${c.brightBlue}║${c.reset}
${c.brightBlue} ║${c.brightCyan} | | | | |\\/| |  \\| | | | | |\\/| | / _ \\ |  \\| | / _ \\| |  _|  _|            ${c.brightBlue}║${c.reset}
${c.brightBlue} ║${c.brightCyan} | |_| | |  | | |\\  | | | | |  | |/ ___ \\| |\\  |/ ___ \\ |_| | |___           ${c.brightBlue}║${c.reset}
${c.brightBlue} ║${c.brightCyan}  \\___/|_|  |_|_| \\_| |_| |_|  |_/_/   \\_\\_| \\_/_/   \\_\\____|_____|          ${c.brightBlue}║${c.reset}
${c.brightBlue} ╚══════════════════════════════════════════════════════════════════════════════════╝${c.reset}
${c.gray}    >> ${c.brightBlue}Enterprise Multi-Tenant SaaS ERP Platform${c.reset}
`;
  console.log(logo);
};

export const printServerInfo = (port, env, protocol = 'http') => {
  const nodeVer = process.version;
  const platform = `${os.platform()} (${os.arch()})`;
  const ram = `${(os.freemem() / 1024 ** 3).toFixed(1)} GB free / ${(os.totalmem() / 1024 ** 3).toFixed(1)} GB`;
  const apiUrl =
    process.env.NODE_ENV === 'production'
      ? `${process.env.APP_URL || `${protocol}://localhost:${port}`}/api/v1`
      : `${protocol}://localhost:${port}/api/v1`;
  const clientUrl =
    process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL || process.env.APP_URL || `${protocol}://localhost:3000`
      : `${protocol}://localhost:3000`;

  console.log(` ${c.gray}┌────────────────────────────────────────────────────────────────────────────────┐${c.reset}`);
  console.log(` ${c.gray}│${c.reset}  ${c.brightBlue}🚀 Server Status${c.reset}   : ${c.brightGreen}ONLINE & READY${c.reset}${' '.repeat(34)}${c.gray}│${c.reset}`);
  console.log(` ${c.gray}│${c.reset}  ${c.brightBlue}📡 API Endpoint${c.reset}   : ${c.brightYellow}${apiUrl}${c.reset}${' '.repeat(Math.max(0, 57 - apiUrl.length))}${c.gray}│${c.reset}`);
  console.log(` ${c.gray}│${c.reset}  ${c.brightBlue}💻 Client URL${c.reset}     : ${c.brightYellow}${clientUrl}${c.reset}${' '.repeat(Math.max(0, 51 - clientUrl.length))}${c.gray}│${c.reset}`);
  console.log(` ${c.gray}│${c.reset}  ${c.brightBlue}🛠  Environment${c.reset}    : ${c.brightCyan}${env.toUpperCase()}${c.reset}${' '.repeat(Math.max(0, 44 - env.length))}${c.gray}│${c.reset}`);
  console.log(` ${c.gray}│${c.reset}  ${c.brightBlue}⚡ Node Engine${c.reset}    : ${c.white}${nodeVer}${c.reset} | ${c.white}${platform}${c.reset}${' '.repeat(Math.max(0, 41 - nodeVer.length - platform.length))}${c.gray}│${c.reset}`);
  console.log(` ${c.gray}│${c.reset}  ${c.brightBlue}🧠 System Memory${c.reset}  : ${c.gray}${ram}${c.reset}${' '.repeat(Math.max(0, 44 - ram.length))}${c.gray}│${c.reset}`);
  console.log(` ${c.gray}└────────────────────────────────────────────────────────────────────────────────┘${c.reset}\n`);
};

export const logStep = async (stepName, actionFn) => {
  process.stdout.write(` ${c.gray}▸${c.reset} Initializing ${c.brightBlue}${stepName}${c.reset} ... `);
  try {
    const res = await actionFn();
    console.log(`${c.brightGreen}✔ OK${c.reset}`);
    return res;
  } catch (err) {
    console.log(`${c.white}✘ FAILED (${err.message})${c.reset}`);
    throw err;
  }
};
