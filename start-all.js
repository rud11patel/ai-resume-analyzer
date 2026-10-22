#!/usr/bin/env node

/**
 * AI Resume Analyzer — Multi-Service Orchestrator
 * Starts all three services concurrently in a single terminal with unified logging and graceful shutdown.
 * 
 * Services:
 * 1. Python ML Service (FastAPI)    -> http://127.0.0.1:8000
 * 2. Node.js Backend API (Express)   -> http://localhost:5000
 * 3. React Frontend Client (Vite)   -> http://localhost:5173
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWin = process.platform === 'win32';
const rootDir = __dirname;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

// Locate Python executable for ml-service
function getPythonCommand() {
  const venvWin = path.join(rootDir, 'ml-service', 'venv', 'Scripts', 'python.exe');
  const venvUnix = path.join(rootDir, 'ml-service', 'venv', 'bin', 'python');

  if (fs.existsSync(venvWin)) return venvWin;
  if (fs.existsSync(venvUnix)) return venvUnix;

  // Fallback to system python
  return isWin ? 'python' : 'python3';
}

const npmCmd = isWin ? 'npm.cmd' : 'npm';
const pythonCmd = getPythonCommand();

console.log(`${colors.bold}${colors.cyan}==============================================================${colors.reset}`);
console.log(`${colors.bold} AI Resume Analyzer — Starting All 3 Services${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}==============================================================${colors.reset}`);
console.log(` ${colors.green}[1] Python ML Service :${colors.reset} http://127.0.0.1:8000  (FastAPI / NLP)`);
console.log(` ${colors.cyan}[2] Express API Server :${colors.reset} http://localhost:5000   (Node.js / Mongoose)`);
console.log(` ${colors.yellow}[3] React Web Client   :${colors.reset} http://localhost:5173   (Vite SPA)`);
console.log(`${colors.dim} Python Runtime: ${pythonCmd}${colors.reset}`);
console.log(`${colors.dim} Press Ctrl+C at any time to shut down all 3 services cleanly.${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}==============================================================${colors.reset}\n`);

const services = [
  {
    name: 'ML-API :8000',
    color: colors.green,
    cwd: path.join(rootDir, 'ml-service'),
    command: pythonCmd,
    args: ['-m', 'uvicorn', 'app.main:app', '--reload', '--host', '127.0.0.1', '--port', '8000'],
  },
  {
    name: 'BACKEND:5000',
    color: colors.cyan,
    cwd: path.join(rootDir, 'server'),
    command: npmCmd,
    args: ['run', 'dev'],
  },
  {
    name: 'CLIENT :5173',
    color: colors.yellow,
    cwd: path.join(rootDir, 'client'),
    command: npmCmd,
    args: ['run', 'dev'],
  },
];

const children = [];

function killProcess(pid) {
  try {
    if (isWin) {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch (err) {
    // Process may have already exited
  }
}

let isShuttingDown = false;
function shutdownAll(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${colors.bold}${colors.red}>>> Shutting down all services...${colors.reset}`);

  children.forEach(({ proc, name }) => {
    if (proc && proc.pid && !proc.killed) {
      killProcess(proc.pid);
    }
  });

  setTimeout(() => {
    console.log(`${colors.dim}All services stopped.${colors.reset}`);
    process.exit(exitCode);
  }, 300);
}

// Handle signals for clean exit
process.on('SIGINT', () => shutdownAll(0));
process.on('SIGTERM', () => shutdownAll(0));
process.on('exit', () => shutdownAll(0));

// Start each service
services.forEach((service) => {
  try {
    const proc = spawn(service.command, service.args, {
      cwd: service.cwd,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: isWin,
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    children.push({ proc, name: service.name });

    const prefix = `${service.color}[${service.name}]${colors.reset} `;

    proc.stdout.on('data', (data) => {
      const lines = data.toString().split(/\r?\n/);
      lines.forEach((line) => {
        if (line.trim()) {
          console.log(`${prefix}${line}`);
        }
      });
    });

    proc.stderr.on('data', (data) => {
      const lines = data.toString().split(/\r?\n/);
      lines.forEach((line) => {
        if (line.trim()) {
          console.error(`${prefix}${line}`);
        }
      });
    });

    proc.on('error', (err) => {
      console.error(`${prefix}${colors.red}Failed to start: ${err.message}${colors.reset}`);
    });

    proc.on('close', (code) => {
      if (!isShuttingDown) {
        console.log(`${prefix}${colors.dim}Exited with code ${code}${colors.reset}`);
      }
    });
  } catch (err) {
    console.error(`${service.color}[${service.name}]${colors.reset} ${colors.red}Error: ${err.message}${colors.reset}`);
  }
});
