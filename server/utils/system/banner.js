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
  magenta: '\x1b[35m',
  brightMagenta: '\x1b[1;35m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const c = colors;

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const typeWriter = async (text, speed = 8) => {
  for (let i = 0; i < text.length; i++) {
    process.stdout.write(text[i]);
    await sleep(speed);
  }
  process.stdout.write('\n');
};

export const printAsciiBanner = async () => {
  const logo = `
${c.brightCyan} ╔══════════════════════════════════════════════════════════════════════════════════╗${c.reset}
${c.brightCyan} ║${c.brightMagenta}   ____  ____   ___ _____ _  _ _____ ____  ____   __  __  ___  ____  ___ _     _____ ${c.brightCyan}║${c.reset}
${c.brightCyan} ║${c.brightMagenta}  | __ )|  _ \\ / ___|_   _| || | ____|  _ \\/ ___| |  \\/  |/ _ \\| __ )|_ _| |   | ____|${c.brightCyan}║${c.reset}
${c.brightCyan} ║${c.brightMagenta}  |  _ \\| |_) | |     | | | || |  _| | |_) \\___ \\ | |\\/| | | | |  _ \\ | || |   |  _|  ${c.brightCyan}║${c.reset}
${c.brightCyan} ║${c.brightMagenta}  | |_) |  _ <| |___  | | | __ | |___|  _ < ___) || |  | | |_| | |_) || || |___| |___ ${c.brightCyan}║${c.reset}
${c.brightCyan} ║${c.brightMagenta}  |____/|_| \\_\\\\____| |_| |_||_|_____|_| \\_\\____/ |_|  |_|\\___/|____/|___|_____|_____|${c.brightCyan}║${c.reset}
${c.brightCyan} ╚══════════════════════════════════════════════════════════════════════════════════╝${c.reset}
  `;
  console.log(logo);

  const tagline = `${c.gray}    >> ${c.brightYellow}Enterprise Mobile Store Management & Point of Sale System${c.reset}`;
  await typeWriter(tagline, 6);
  console.log('');
};

export const printServerInfo = (port, env, protocol = 'http') => {
  const nodeVer = process.version;
  const platform = `${os.platform()} (${os.arch()})`;
  const ram = `${(os.freemem() / (1024 ** 3)).toFixed(1)} GB free / ${(os.totalmem() / (1024 ** 3)).toFixed(1)} GB`;
  const apiUrl = `${protocol}://localhost:${port}/api/v1`;
  const clientUrl = `${protocol}://localhost:3000`;
  const apiPad = ' '.repeat(Math.max(0, 57 - apiUrl.length));
  const clientPad = ' '.repeat(Math.max(0, 51 - clientUrl.length));

  console.log(` ${c.gray}┌────────────────────────────────────────────────────────────────────────────────┐${c.reset}`);
  console.log(` ${c.gray}│${c.reset}  ${c.brightCyan}🚀 Server Status${c.reset}   : ${c.brightGreen}ONLINE & READY${c.reset}${' '.repeat(34)}${c.gray}│${c.reset}`);
  console.log(` ${c.gray}│${c.reset}  ${c.brightCyan}📡 API Endpoint${c.reset}   : ${c.brightYellow}${apiUrl}${c.reset}${apiPad}${c.gray}│${c.reset}`);
  console.log(` ${c.gray}│${c.reset}  ${c.brightCyan}💻 Client URL${c.reset}     : ${c.brightYellow}${clientUrl}${c.reset}${clientPad}${c.gray}│${c.reset}`);
  console.log(` ${c.gray}│${c.reset}  ${c.brightCyan}🛠  Environment${c.reset}    : ${c.brightMagenta}${env.toUpperCase()}${c.reset}${' '.repeat(44 - env.length)}${c.gray}│${c.reset}`);
  console.log(` ${c.gray}│${c.reset}  ${c.brightCyan}⚡ Node Engine${c.reset}    : ${c.white}${nodeVer}${c.reset} | ${c.white}${platform}${c.reset}${' '.repeat(44 - nodeVer.length - platform.length - 3)}${c.gray}│${c.reset}`);
  console.log(` ${c.gray}│${c.reset}  ${c.brightCyan}🧠 System Memory${c.reset}  : ${c.gray}${ram}${c.reset}${' '.repeat(44 - ram.length)}${c.gray}│${c.reset}`);
  console.log(` ${c.gray}│${c.reset}  ${c.brightCyan}👨‍💻 Developer${c.reset}      : ${c.bold}${c.white}Salah Uddin Kader${c.reset} (${c.brightCyan}https://salahuddin.codes${c.reset})${c.gray}│${c.reset}`);
  console.log(` ${c.gray}└────────────────────────────────────────────────────────────────────────────────┘${c.reset}\n`);
};

export const logStep = async (stepName, actionFn) => {
  process.stdout.write(` ${c.gray}▸${c.reset} Initializing ${c.brightCyan}${stepName}${c.reset} ... `);
  try {
    const res = await actionFn();
    console.log(`${c.brightGreen}✔ OK${c.reset}`);
    return res;
  } catch (err) {
    console.log(`${c.red}✘ FAILED (${err.message})${c.reset}`);
    throw err;
  }
};
