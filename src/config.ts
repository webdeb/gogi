import fs from 'fs';
import path from 'path';
import os from 'os';

export interface GogiConfig {
  activeProvider?: string;
  tokens?: Record<string, string>;
  openaiApiKey?: string; // legacy support
}

const GOGI_DIR = path.join(os.homedir(), '.gogi');
const CONFIG_FILE = path.join(GOGI_DIR, 'config.json');
const SYSTEM_FILE = path.join(GOGI_DIR, 'system.md');

export function getConfig(): GogiConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    return { tokens: {} };
  }
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.tokens) parsed.tokens = {};
    return parsed;
  } catch {
    return { tokens: {} };
  }
}

export function saveConfig(config: Partial<GogiConfig>): void {
  if (!fs.existsSync(GOGI_DIR)) {
    fs.mkdirSync(GOGI_DIR, { recursive: true });
  }
  const currentConfig = getConfig();
  const newConfig = { ...currentConfig, ...config };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
}

export function hasValidConfig(): boolean {
  const config = getConfig();
  if (config.openaiApiKey) return true; // legacy
  return !!(config.activeProvider && config.tokens && config.tokens[config.activeProvider]);
}

export function getSystemContext(): string {
  if (!fs.existsSync(SYSTEM_FILE)) {
    const defaultContent = `You are running on a ${os.type()} (${os.release()}) machine.
Architecture: ${os.arch()}
CPU: ${os.cpus()[0]?.model}
Home directory: ${os.homedir()}
Default shell: ${process.env.SHELL || 'unknown'}

Please tailor your commands and suggestions to this specific environment.`;
    
    if (!fs.existsSync(GOGI_DIR)) {
      fs.mkdirSync(GOGI_DIR, { recursive: true });
    }
    fs.writeFileSync(SYSTEM_FILE, defaultContent, 'utf-8');
    return defaultContent;
  }
  return fs.readFileSync(SYSTEM_FILE, 'utf-8');
}
