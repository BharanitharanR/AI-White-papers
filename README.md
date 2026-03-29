# ai-paper-validations

> *Reading research makes you a better engineer — but only if you test it yourself first.*

A curated series of AI/LLM research paper validations by a Principal Backend Engineer.

Each entry in this repo is not a summary. It is a **validation** — the paper's core claim tested locally, with real results, before anything gets published.

---

## Why this repo exists

There is no shortage of AI paper summaries on the internet. What is rare is an engineer's perspective: someone who reads a paper not to understand the math, but to understand **what it means for systems they are building**.

My interest is in context engineering — how to structure what you give an LLM so that it reasons correctly. To get that right, I wanted to go one level deeper and understand how LLMs actually behave with the information you give them. Not from blog posts. From the primary research.

This repo is the result of that process. Every paper here:

- Was chosen because it directly informs how engineers build with LLMs
- Was read in full, not skimmed
- Had its core claim tested locally — on my own machine — before any conclusions were drawn
- Became a published post on Medium and LinkedIn with the experiment results included

---

## Structure

Each paper gets its own folder:

```
/week-01-lost-in-the-middle/
    README.md          ← experiment summary and findings
    playbook.json      ← corpus used in the experiment
    experiment.py      ← the validation script
    snapshots/         ← actual Ollama output screenshots
```

The folder README covers:
- What the paper claims
- How I tested it
- What actually happened
- What it changes in how I think about context engineering

---

## Papers validated so far

| # | Paper | Core claim tested | Model used | Published |
|---|-------|-------------------|------------|-----------|
| 01 | [Lost in the Middle: How Language Models Use Long Contexts](./week-01-lost-in-the-middle/) | LLM accuracy follows a U-curve based on where relevant info sits in context | llama3.1:8b via Ollama | [Medium](#) · [LinkedIn](#) |

---

## The validation standard

A paper is only added to this repo if:

1. The core claim is **testable locally** — no GPU cluster required
2. The experiment is **reproducible** — anyone can clone this repo and run it
3. The result is **honest** — if the model behaves differently from what the paper predicts, that gets documented too

This is not a highlight reel. It is a lab notebook.

---

## Setup

All experiments in this repo run locally using [Ollama](https://ollama.ai).

```bash
# Install Ollama
brew install ollama        # macOS

# Pull the base model used across experiments
ollama pull llama3.1

# Start Ollama server
ollama serve
```

Python dependencies:

```bash
pip install ollama matplotlib tabulate
```

---

## Who this is for

- Engineers building RAG pipelines, agentic systems, or LLM-powered tools
- Anyone who wants to understand LLM behaviour from first principles, not just from benchmarks
- People who are tired of hype and want evidence they can reproduce

---

## Series posts

All validation writeups are published on Medium and cross-posted to LinkedIn.

- Medium: *(link to be added)*
- LinkedIn: [Bharani Tharan R](https://www.linkedin.com/in/)

---

## About

I am a Principal Backend Engineer with 16 years of experience in Java and cloud-native systems. My current focus is on how LLMs behave in production infrastructure — not in demos.

This repo is my way of being rigorous about that.

GitHub: [BharanitharanR](https://github.com/BharanitharanR)

---

*New paper added every week. Watch the repo to follow along.*
