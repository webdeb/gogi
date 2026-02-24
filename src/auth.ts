import { loginOpenAICodex, loginGeminiCli, loginGitHubCopilot } from '@mariozechner/pi-ai';
import { saveConfig, getConfig } from './config';
import open from 'open';
import * as readline from 'readline';

export async function loginFlow(provider: string = 'codex') {
  console.log(`Starting login flow for provider: ${provider}...`);
  
  let credentials;
  
  if (provider === 'codex') {
    credentials = await loginOpenAICodex({
      onAuth: (info) => {
        console.log(`\n🌐 Opening browser for sign-in... If it doesn't open automatically, visit:\n${info.url}`);
        if (info.instructions) console.log(info.instructions);
        console.log(`\nIf you are on a headless machine or the browser doesn't redirect back:`);
        console.log(`1. Open the URL above in any browser`);
        console.log(`2. Complete the sign-in process`);
        console.log(`3. Copy the URL you are redirected to (it will start with http://localhost...)`);
        console.log(`4. Paste it here:`);
        open(info.url);
      },
      onPrompt: async (prompt) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        return new Promise((resolve) => rl.question(`${prompt.message} `, (answer) => { rl.close(); resolve(answer); }));
      },
      onManualCodeInput: async () => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        return new Promise((resolve) => rl.question(`> `, (answer) => { rl.close(); resolve(answer); }));
      }
    });
  } else if (provider === 'gemini') {
    credentials = await loginGeminiCli(
      (info) => {
        console.log(`\n🌐 Opening browser for sign-in... If it doesn't open automatically, visit:\n${info.url}`);
        if (info.instructions) console.log(info.instructions);
        console.log(`\nIf you are on a headless machine or the browser doesn't redirect back:`);
        console.log(`1. Open the URL above in any browser`);
        console.log(`2. Complete the sign-in process`);
        console.log(`3. Copy the URL you are redirected to (it will start with http://localhost...)`);
        console.log(`4. Paste it here:`);
        open(info.url);
      },
      undefined,
      async () => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        return new Promise((resolve) => rl.question(`> `, (answer) => { rl.close(); resolve(answer); }));
      }
    );
  } else if (provider === 'github') {
    credentials = await loginGitHubCopilot({
      onAuth: (url, instructions) => {
        console.log(`\n🌐 Please authenticate GitHub Copilot.`);
        if (instructions) console.log(instructions);
        open(url);
      },
      onPrompt: async (prompt) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        return new Promise((resolve) => rl.question(`${prompt.message} `, (answer) => { rl.close(); resolve(answer); }));
      }
    });
  } else {
    console.error(`❌ Unknown provider: ${provider}. Supported providers: codex, gemini, github.`);
    process.exit(1);
  }

  const currentConfig = getConfig();
  const tokens = currentConfig.tokens || {};
  tokens[provider] = credentials.access;

  saveConfig({
    activeProvider: provider,
    tokens
  });

  console.log(`✅ Successfully authenticated Gogi via ${provider}!`);
}
