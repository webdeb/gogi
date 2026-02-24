"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAgent = runAgent;
const pi_ai_1 = require("@mariozechner/pi-ai");
const config_1 = require("./config");
const prompts_1 = require("@inquirer/prompts");
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const execPromise = util_1.default.promisify(child_process_1.exec);
async function runAgent(prompt) {
    const config = (0, config_1.getConfig)();
    let apiKey = config.openaiApiKey;
    let providerToUse = 'codex';
    if (config.activeProvider && config.tokens && config.tokens[config.activeProvider]) {
        apiKey = config.tokens[config.activeProvider];
        providerToUse = config.activeProvider;
    }
    if (!apiKey) {
        console.error('❌ No API key or token found. Please run `gogi login` first.');
        process.exit(1);
    }
    let model;
    if (providerToUse === 'codex') {
        model = (0, pi_ai_1.getModel)('openai-codex', 'gpt-5.1-codex-mini');
    }
    else if (providerToUse === 'gemini') {
        model = (0, pi_ai_1.getModel)('google-gemini-cli', 'gemini-2.5-flash');
    }
    else if (providerToUse === 'github') {
        model = (0, pi_ai_1.getModel)('github-copilot', 'gpt-4o');
    }
    else {
        console.warn(`Unknown provider ${providerToUse}, falling back to openai gpt-4o`);
        model = (0, pi_ai_1.getModel)('openai', 'gpt-4o');
    }
    const tools = [
        {
            name: 'run_terminal_command',
            description: 'Propose a terminal command for the user to execute.',
            parameters: pi_ai_1.Type.Object({
                command: pi_ai_1.Type.String({ description: 'The shell command to propose to the user. Do not wrap in markdown quotes.' })
            })
        }
    ];
    const systemDetails = (0, config_1.getSystemContext)();
    const context = {
        systemPrompt: `You are Gogi, a helpful terminal assistant running on a Mac terminal.
You can propose shell commands to fulfill user requests using the \`run_terminal_command\` tool.
Wait for the execution result before continuing. If a command fails, try to suggest an alternative or fix the issue.
Keep your textual responses very concise unless asked to explain.

=== SYSTEM CONTEXT ===
${systemDetails}
====================`,
        messages: [
            { role: 'user', content: prompt, timestamp: Date.now() }
        ],
        tools
    };
    console.log('🤔 Gogi is thinking...');
    while (true) {
        let response;
        try {
            response = await (0, pi_ai_1.complete)(model, context, { apiKey });
        }
        catch (err) {
            console.error(`❌ API Error: ${err.message}`);
            process.exit(1);
        }
        context.messages.push(response);
        let hasToolCalls = false;
        if (response.content) {
            for (const block of response.content) {
                if (block.type === 'text') {
                    console.log(`\n🤖 ${block.text}`);
                }
                else if (block.type === 'toolCall' && block.name === 'run_terminal_command') {
                    hasToolCalls = true;
                    // @mariozechner/pi-ai automatically parses arguments
                    const cmd = block.arguments.command;
                    let answer = false;
                    try {
                        answer = await (0, prompts_1.confirm)({ message: `Gogi wants to run:\n  > \x1b[36m${cmd}\x1b[0m\nAllow?`, default: false });
                    }
                    catch (e) {
                        if (e.name === 'ExitPromptError') {
                            console.log('\nGoodbye!');
                            process.exit(0);
                        }
                        throw e;
                    }
                    if (answer) {
                        console.log('\nRunning...');
                        try {
                            const { stdout, stderr } = await execPromise(cmd);
                            let toolOutput = '';
                            if (stdout) {
                                console.log(stdout); // Log STDOUT to the terminal directly
                                toolOutput += `STDOUT:\n${stdout}\n`;
                            }
                            if (stderr) {
                                console.error(`\x1b[31m${stderr}\x1b[0m`); // Log STDERR in red
                                toolOutput += `STDERR:\n${stderr}\n`;
                            }
                            if (!toolOutput) {
                                toolOutput = "Command executed successfully with no output.";
                            }
                            context.messages.push({
                                role: 'toolResult',
                                toolCallId: block.id,
                                toolName: block.name,
                                content: [{ type: 'text', text: toolOutput }],
                                isError: false,
                                timestamp: Date.now()
                            });
                        }
                        catch (err) {
                            console.error(`\x1b[31mExecution Error: ${err.message}\x1b[0m`);
                            context.messages.push({
                                role: 'toolResult',
                                toolCallId: block.id,
                                toolName: block.name,
                                content: [{ type: 'text', text: `Error: ${err.message}` }],
                                isError: true,
                                timestamp: Date.now()
                            });
                        }
                    }
                    else {
                        console.log('❌ Command denied.');
                        context.messages.push({
                            role: 'toolResult',
                            toolCallId: block.id,
                            toolName: block.name,
                            content: [{ type: 'text', text: 'The user denied the execution of this command.' }],
                            isError: true, // Mark as error so the model knows the command was rejected
                            timestamp: Date.now()
                        });
                    }
                }
            }
        }
        if (!hasToolCalls) {
            break;
        }
    }
}
