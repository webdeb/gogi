import { getModel, complete, Context, Tool, Type, AssistantMessage } from '@mariozechner/pi-ai';
import { getConfig, getSystemContext } from './config';
import { confirm } from '@inquirer/prompts';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function runAgent(prompt: string) {
  const config = getConfig();
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
    model = getModel('openai-codex', 'gpt-5.1-codex-mini');
  } else if (providerToUse === 'gemini') {
    model = getModel('google-gemini-cli', 'gemini-2.5-flash');
  } else if (providerToUse === 'github') {
    model = getModel('github-copilot', 'gpt-4o');
  } else {
    console.warn(`Unknown provider ${providerToUse}, falling back to openai gpt-4o`);
    model = getModel('openai', 'gpt-4o');
  }

  const tools: Tool[] = [
    {
      name: 'run_terminal_command',
      description: 'Propose a terminal command for the user to execute.',
      parameters: Type.Object({
        command: Type.String({ description: 'The shell command to propose to the user. Do not wrap in markdown quotes.' })
      })
    }
  ];

  const systemDetails = getSystemContext();

  const context: Context = {
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
    let response: AssistantMessage;
    try {
      response = await complete(model, context, { apiKey });
    } catch (err: any) {
      console.error(`❌ API Error: ${err.message}`);
      process.exit(1);
    }
    
    context.messages.push(response);

    let hasToolCalls = false;

    if (response.content) {
      for (const block of response.content) {
        if (block.type === 'text') {
          console.log(`\n🤖 ${block.text}`);
        } else if (block.type === 'toolCall' && block.name === 'run_terminal_command') {
          hasToolCalls = true;

          // @mariozechner/pi-ai automatically parses arguments
          const cmd = block.arguments.command as string;

          let answer = false;
          try {
            answer = await confirm({ message: `Gogi wants to run:\n  > \x1b[36m${cmd}\x1b[0m\nAllow?`, default: false });
          } catch (e: any) {
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
             } catch (err: any) {
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
          } else {
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
