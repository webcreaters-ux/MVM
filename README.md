# MVM

**MVM — Modular Vision Matrix**

A privacy-first, open-source AI workspace for PC and mobile. MVM is a modular command center combining local AI, remote open-source models, vision, automation, coding tools and extensible plugins behind one responsive interface.

## Current release — 0.4

- **AI Hub:** persistent local chat, provider selection and model selection.
- **Vision Lab:** image/screenshot upload with configurable analysis prompts.
- **Ollama adapter:** local `/api/chat` and vision-image support.
- **OpenAI-compatible adapter:** `/chat/completions` text and image support.
- **Demo mode:** works without an account, API key or network connection.
- **Private local storage:** provider configuration, model choice and chat history stay in browser storage.
- **PC + mobile responsive UI.**
- **Automated CI:** type check, tests and production build.

## Planned capabilities

- Document/PDF understanding
- Code Forge with project files and AI coding actions
- Flow Engine for reusable automations
- Knowledge workspace and local retrieval
- Voice input/output adapters
- Media utilities and AI creative tools
- Plugin/connector architecture
- Optional Android packaging

## Principles

1. Prefer free and open-source software where practical.
2. Never ship provider credentials in source control.
3. Keep modules optional so MVM can run on modest devices.
4. Keep the core provider-agnostic.
5. Every change must pass automated validation before being considered complete.

## Development

The repository is built incrementally. GitHub Actions validates every push and pull request to `main` with TypeScript checks, tests and a production build.

## License

MIT
