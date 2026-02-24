"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.saveConfig = saveConfig;
exports.hasValidConfig = hasValidConfig;
exports.getSystemContext = getSystemContext;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const GOGI_DIR = path_1.default.join(os_1.default.homedir(), '.gogi');
const CONFIG_FILE = path_1.default.join(GOGI_DIR, 'config.json');
const SYSTEM_FILE = path_1.default.join(GOGI_DIR, 'system.md');
function getConfig() {
    if (!fs_1.default.existsSync(CONFIG_FILE)) {
        return { tokens: {} };
    }
    try {
        const data = fs_1.default.readFileSync(CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        if (!parsed.tokens)
            parsed.tokens = {};
        return parsed;
    }
    catch {
        return { tokens: {} };
    }
}
function saveConfig(config) {
    if (!fs_1.default.existsSync(GOGI_DIR)) {
        fs_1.default.mkdirSync(GOGI_DIR, { recursive: true });
    }
    const currentConfig = getConfig();
    const newConfig = { ...currentConfig, ...config };
    fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
}
function hasValidConfig() {
    const config = getConfig();
    if (config.openaiApiKey)
        return true; // legacy
    return !!(config.activeProvider && config.tokens && config.tokens[config.activeProvider]);
}
function getSystemContext() {
    if (!fs_1.default.existsSync(SYSTEM_FILE)) {
        const defaultContent = `You are running on a ${os_1.default.type()} (${os_1.default.release()}) machine.
Architecture: ${os_1.default.arch()}
CPU: ${os_1.default.cpus()[0]?.model}
Home directory: ${os_1.default.homedir()}
Default shell: ${process.env.SHELL || 'unknown'}

Please tailor your commands and suggestions to this specific environment.`;
        if (!fs_1.default.existsSync(GOGI_DIR)) {
            fs_1.default.mkdirSync(GOGI_DIR, { recursive: true });
        }
        fs_1.default.writeFileSync(SYSTEM_FILE, defaultContent, 'utf-8');
        return defaultContent;
    }
    return fs_1.default.readFileSync(SYSTEM_FILE, 'utf-8');
}
