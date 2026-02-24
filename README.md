# 🍖 Gogi CLI

Gogi is a lightweight, AI-powered terminal assistant built with Node.js. It runs locally on your machine and helps you accomplish tasks directly in your terminal by translating natural language into executable shell commands.

Unlike other CLI assistants that require you to manage your own paid API keys, Gogi leverages the open-source `@mariozechner/pi-ai` library to implement **native Device-Code OAuth flows**. This means you can plug Gogi directly into your existing AI subscriptions (like ChatGPT Plus or GitHub Copilot)

## ✨ Features

**Natural Language to Shell**: Tell Gogi what you want to do 
`gogi how much space is left on my machine`

**Safe Execution Loop**: Gogi intercepts the AI's proposed commands and explicitly asks for your permission (`Allow? (y/N)`) before running anything. It will capture the `stdout` and `stderr` and feed it back to the LLM so it can learn from mistakes or chain commands together.

**Multi-Provider OAuth**: Sign in securely using your existing AI accounts. Supported providers include:
  - `codex` (ChatGPT Plus/Pro subscription)
  - `gemini` (Google Cloud)
  - `github` (GitHub Copilot)

**Auto-Generated System Context**: On first run, Gogi automatically profiles your machine (OS, architecture, shell) and generates a `~/.gogi/system.md` file. It injects this into the LLM's system prompt so the AI always knows what operating system and shell it's working with.

---

## 🚀 Installation

Install the package globally via npm:

```bash
npm install -g @webdeb/gogi
```

You can now use the `gogi` command from anywhere in your terminal!

---

## 🔑 Authentication

Before using Gogi, you must authenticate it with a provider.

```bash
# Login with ChatGPT (Default)
gogi login

# Or specify a provider: 
gogi login codex
gogi login gemini
gogi login github
```

This will trigger a standard OAuth flow. Gogi will open your browser, ask you to log in, and then securely store the resulting `access_token` in `~/.gogi/config.json`.

Once you have logged into multiple providers, you can quickly switch the active provider being used for commands:

```bash
gogi provider gemini
gogi provider codex
```

---

## 💡 Usage

Simply type `gogi` followed by your request:

```bash
gogi find all the .ts files in the current directory
```

```bash
🤔 Gogi is thinking...
✔ Gogi wants to run:
  > find . -name "*.ts"
Allow? Yes    

Running...
./src/index.ts
./src/config.ts
./src/agent.ts
./src/auth.ts
```

If a command fails (e.g., a missing dependency), Gogi will read the error output and can automatically propose a follow-up command to fix the issue!

---

## ⚙️ Configuration

Gogi stores its configuration in your home directory at `~/.gogi/`:

- `~/.gogi/config.json`: Stores your active provider and OAuth access tokens securely.
- `~/.gogi/system.md`: A markdown file containing context about your machine (OS, CPU, Shell). You can edit this file to give Gogi additional context or permanent custom instructions (e.g., "Always use fd instead of find").
