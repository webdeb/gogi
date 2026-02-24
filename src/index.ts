#!/usr/bin/env node

import { Command } from 'commander';
import { loginFlow } from './auth';
import { runAgent } from './agent';
import { hasValidConfig, getConfig, saveConfig } from './config';

const program = new Command();

program
  .name('gogi')
  .description('Gogi CLI: An AI-powered terminal assistant')
  .version('1.0.0');

program
  .command('login [provider]')
  .description('Authenticate Gogi with a provider (codex, gemini, github)')
  .action(async (provider) => {
    await loginFlow(provider || 'codex');
  });

program
  .command('provider <provider>')
  .description('Switch the active provider (codex, gemini, github)')
  .action((provider) => {
    const config = getConfig();
    const tokens = config.tokens || {};
    if (!tokens[provider] && !(provider === 'codex' && config.openaiApiKey)) {
      console.error(`❌ No token found for provider '${provider}'. Please run \`gogi login ${provider}\` first.`);
      process.exit(1);
    }
    saveConfig({ activeProvider: provider });
    console.log(`✅ Active provider switched to ${provider}`);
  });

program
  .argument('[prompt...]', 'The task you want gogi to perform. Tip: use quotes if your prompt contains ?, *, or other special shell characters.')
  .action(async (promptArr: string[]) => {
    const prompt = promptArr.join(' ').trim();
    if (!prompt) {
      // If no prompt, just output help
      program.help();
      return;
    }

    if (!hasValidConfig()) {
      console.log('You need to log in first. Running `gogi login`...');
      await loginFlow();
    }

    await runAgent(prompt);
  });

program.parse(process.argv);
