# ADR-008: Selection of Ollama for Hyperlocal AI Matching

## Status
Accepted (Phase 2+)

## Context
JobNest V2 matches worker profiles to nearby opportunities using AI-powered semantic analysis. The AI model must run locally or in private clouds to avoid latency, reduce API costs, and guarantee privacy.

We evaluated OpenAI API vs local LLM execution.

## Decision
We chose **Ollama** as the local model runner.

## Consequences
*   **Privacy & Compliance**: Worker profiles are analyzed entirely inside our cloud network, protecting data.
*   **Cost Control**: No pay-per-token API fees.
*   **Decoupled Integration**: Handled via standard JSON APIs through our HTTP Client.
