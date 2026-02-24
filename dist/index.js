#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const auth_1 = require("./auth");
const agent_1 = require("./agent");
const config_1 = require("./config");
const program = new commander_1.Command();
program
    .name('gogi')
    .description('Gogi CLI: An AI-powered terminal assistant')
    .version('1.0.0');
program
    .command('login [provider]')
    .description('Authenticate Gogi with a provider (codex, gemini, github)')
    .action(async (provider) => {
    await (0, auth_1.loginFlow)(provider || 'codex');
});
program
    .command('provider <provider>')
    .description('Switch the active provider (codex, gemini, github)')
    .action((provider) => {
    const config = (0, config_1.getConfig)();
    const tokens = config.tokens || {};
    if (!tokens[provider] && !(provider === 'codex' && config.openaiApiKey)) {
        console.error(`❌ No token found for provider '${provider}'. Please run \`gogi login ${provider}\` first.`);
        process.exit(1);
    }
    (0, config_1.saveConfig)({ activeProvider: provider });
    console.log(`✅ Active provider switched to ${provider}`);
});
program
    .argument('[prompt...]', 'The task you want gogi to perform. Tip: use quotes if your prompt contains ?, *, or other special shell characters.')
    .action(async (promptArr) => {
    const prompt = promptArr.join(' ').trim();
    if (!prompt) {
        // If no prompt, just output help
        program.help();
        return;
    }
    if (!(0, config_1.hasValidConfig)()) {
        console.log('You need to log in first. Running `gogi login`...');
        await (0, auth_1.loginFlow)();
    }
    await (0, agent_1.runAgent)(prompt);
});
program.parse(process.argv);
