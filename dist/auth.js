"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginFlow = loginFlow;
const pi_ai_1 = require("@mariozechner/pi-ai");
const config_1 = require("./config");
const open_1 = __importDefault(require("open"));
const readline = __importStar(require("readline"));
async function loginFlow(provider = 'codex') {
    console.log(`Starting login flow for provider: ${provider}...`);
    let credentials;
    if (provider === 'codex') {
        credentials = await (0, pi_ai_1.loginOpenAICodex)({
            onAuth: (info) => {
                console.log(`\n🌐 Opening browser for sign-in... If it doesn't open automatically, visit:\n${info.url}`);
                if (info.instructions)
                    console.log(info.instructions);
                (0, open_1.default)(info.url);
            },
            onPrompt: async (prompt) => {
                const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
                return new Promise((resolve) => rl.question(`${prompt.message} `, (answer) => { rl.close(); resolve(answer); }));
            }
        });
    }
    else if (provider === 'gemini') {
        credentials = await (0, pi_ai_1.loginGeminiCli)((info) => {
            console.log(`\n🌐 Opening browser for sign-in... If it doesn't open automatically, visit:\n${info.url}`);
            if (info.instructions)
                console.log(info.instructions);
            (0, open_1.default)(info.url);
        });
    }
    else if (provider === 'github') {
        credentials = await (0, pi_ai_1.loginGitHubCopilot)({
            onAuth: (url, instructions) => {
                console.log(`\n🌐 Please authenticate GitHub Copilot.`);
                if (instructions)
                    console.log(instructions);
                (0, open_1.default)(url);
            },
            onPrompt: async (prompt) => {
                const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
                return new Promise((resolve) => rl.question(`${prompt.message} `, (answer) => { rl.close(); resolve(answer); }));
            }
        });
    }
    else {
        console.error(`❌ Unknown provider: ${provider}. Supported providers: codex, gemini, github.`);
        process.exit(1);
    }
    const currentConfig = (0, config_1.getConfig)();
    const tokens = currentConfig.tokens || {};
    tokens[provider] = credentials.access;
    (0, config_1.saveConfig)({
        activeProvider: provider,
        tokens
    });
    console.log(`✅ Successfully authenticated Gogi via ${provider}!`);
}
