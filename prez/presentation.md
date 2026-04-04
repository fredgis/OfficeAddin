---
marp: true
theme: uncover
paginate: true
math: mathjax
style: |
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');

  :root {
    --color-bg: #f8fafc;
    --color-fg: #1e293b;
    --color-primary: #0078d4;
    --color-accent: #6366f1;
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-danger: #ef4444;
  }

  section {
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    background: var(--color-bg);
    color: var(--color-fg);
    padding: 50px 60px;
    line-height: 1.5;
  }

  section::after {
    font-size: 0.6em;
    color: #94a3b8;
  }

  /* ─── COVER ─── */
  section.cover {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0078d4 100%);
    color: white;
    padding: 60px;
  }
  section.cover h1 {
    font-size: 2.6em;
    font-weight: 900;
    letter-spacing: -0.02em;
    margin-bottom: 0.15em;
    background: linear-gradient(90deg, #60a5fa, #a78bfa, #34d399);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  section.cover h2 {
    font-size: 1.3em;
    font-weight: 300;
    opacity: 0.9;
    margin-bottom: 0.3em;
    color: #e2e8f0;
  }
  section.cover h3 {
    font-size: 0.9em;
    font-weight: 300;
    opacity: 0.6;
    color: #cbd5e1;
  }

  /* ─── SECTION DIVIDERS ─── */
  section.divider {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: white;
    padding: 80px;
  }
  section.divider h1 {
    font-size: 2.8em;
    font-weight: 900;
    letter-spacing: -0.02em;
    margin-bottom: 0.1em;
    color: #60a5fa;
  }
  section.divider h2 {
    font-size: 1.1em;
    font-weight: 300;
    color: #94a3b8;
    border-left: 4px solid #6366f1;
    padding-left: 16px;
  }

  /* ─── DARK ─── */
  section.dark {
    background: #0f172a;
    color: #e2e8f0;
  }
  section.dark h1 { color: #60a5fa; }
  section.dark h2 { color: #a78bfa; }
  section.dark strong { color: #34d399; }
  section.dark th { background: #334155; color: #e2e8f0; }

  /* ─── ACCENT ─── */
  section.accent {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: white;
  }
  section.accent h1 { color: white; font-size: 1.8em; }
  section.accent strong { color: #fde68a; }
  section.accent blockquote { border-left-color: #fde68a; color: #e2e8f0; }

  /* ─── SUCCESS ─── */
  section.success {
    background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
    color: white;
  }
  section.success h1 { color: #6ee7b7; }
  section.success strong { color: #fde68a; }

  /* ─── CONTENT STYLES ─── */
  h1 {
    color: #0f172a;
    font-size: 1.7em;
    font-weight: 800;
    letter-spacing: -0.01em;
    border-bottom: 3px solid #6366f1;
    padding-bottom: 8px;
    margin-bottom: 20px;
  }
  h2 { color: #475569; font-weight: 600; font-size: 1em; }
  h3 { color: #6366f1; font-weight: 700; font-size: 0.9em; }

  table { font-size: 0.68em; width: 100%; border-collapse: collapse; }
  th { background: #1e293b; color: white; padding: 8px 12px; font-weight: 600; }
  td { padding: 6px 12px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #f1f5f9; }

  strong { color: #4f46e5; }
  em { color: #7c3aed; font-style: normal; }
  code { background: #f1f5f9; color: #e11d48; padding: 2px 6px; border-radius: 4px; font-size: 0.82em; }

  blockquote {
    border-left: 4px solid #6366f1;
    padding: 8px 16px;
    margin: 12px 0;
    background: #f1f5f9;
    border-radius: 0 8px 8px 0;
    font-style: italic;
    color: #475569;
    font-size: 0.88em;
  }

  .cols { display: flex; gap: 2em; align-items: flex-start; }
  .col { flex: 1; }

  img { border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); }

  /* Mermaid sizing */
  .mermaid { font-size: 0.7em; }

  ul, ol { font-size: 0.88em; }
  li { margin-bottom: 4px; }
---

<!-- _class: cover -->
<!-- _paginate: false -->

# Fabric Storyboard Copilot

## From 43 Man-Days to 13 Hours with AI Agents
### How AI-Powered Development Transforms Software Delivery

---

<!-- _class: divider -->
<!-- _paginate: false -->

# 01 — The Project
## What we built and why it matters

---

# Fabric Storyboard Copilot

A **PowerPoint Office Add-in** connecting Microsoft Fabric & Power BI to slide authoring

<div class="cols">
<div class="col">

### What it does
- 🔐 **Entra ID** authentication (SSO + OBO flow)
- 📊 Browse workspaces, reports & pages
- 📸 Export report pages as **PNG**
- 🖼️ Insert images into slides via **Office.js**
- 🧠 AI-powered insights with **GPT-4o Vision**
- ✨ One-click: image + insights on current slide

</div>
<div class="col">

### Tech Stack
- **Frontend** — React 18 + Fluent UI v9
- **Backend** — Azure Functions (Node.js 18)
- **Hosting** — Azure Static Web Apps
- **AI** — Azure OpenAI GPT-4o Vision
- **Auth** — MSAL.js 2.x + Entra ID
- **IaC** — Bicep + azd + GitHub Actions

</div>
</div>

---

# The Taskpane Experience

![w:920 center](../images/IMG3.png)

*Workspace browser • breadcrumb navigation • PNG export • layout options • AI insights*

---

# Insert Page with Insights

![w:920 center](../images/IMG1.png)

*One-click result: chart image (60%) + GPT-4o Vision insights (40%) on the same slide*

---

# Complete Workflow

![w:920 center](../images/IMG4.png)

*6 slides populated from Retail Analysis report — image export + AI executive insights side-by-side*

---

# Architecture

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#6366f1', 'primaryTextColor': '#fff', 'lineColor': '#64748b', 'secondaryColor': '#f1f5f9'}}}%%
graph TD
    subgraph PPT["PowerPoint Desktop / Web"]
        TP["Taskpane<br/><i>React + Fluent UI v9</i>"]
    end
    subgraph SWA["Azure Static Web Apps"]
        API["Azure Functions API"]
        MW["Auth Middleware<br/><i>JWT + JWKS + OBO</i>"]
    end
    ENTRA["Entra ID"]
    PBI["Power BI<br/>REST API"]
    AOAI["Azure OpenAI<br/>GPT-4o Vision"]

    TP -->|"X-Fabric-Storyboard-Authorization"| API
    MW --> ENTRA
    API --> PBI
    API --> AOAI

    style PPT fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
    style SWA fill:#f1f5f9,stroke:#6366f1,color:#1e293b
    style TP fill:#6366f1,stroke:#4f46e5,color:#fff
    style API fill:#0078d4,stroke:#005a9e,color:#fff
    style MW fill:#f59e0b,stroke:#d97706,color:#000
    style ENTRA fill:#fbbf24,stroke:#b45309,color:#000
    style PBI fill:#10b981,stroke:#059669,color:#fff
    style AOAI fill:#8b5cf6,stroke:#6d28d9,color:#fff
```

---

<!-- _class: divider -->
<!-- _paginate: false -->

# 02 — How We Built It
## Squad, Copilot CLI, and the real numbers

---

# The Challenge: Traditional Estimation

A project estimated at **43 man-days** using conventional development

| Phase | Scope | Manual Effort |
|-------|-------|:---:|
| 1 — Scaffolding | Project setup, deps, config | 3 days |
| 2 — Authentication | Entra ID, MSAL, SSO, OBO | 5 days |
| 3 — Workspace Browsing | API + React tree components | 5 days |
| 4 — Export | Power BI ExportToFile → PNG | 4 days |
| 5 — Insert | Office.js slide manipulation | 4 days |
| 6 — AI Insights | Azure OpenAI, prompt eng. | 5 days |
| 7 — UI Polish | Fluent UI, a11y, UX | 4 days |
| 8 — Infrastructure | Bicep, CI/CD, SWA, Key Vault | 5 days |
| 9 — Testing | Jest, mocks, integration | 5 days |
| 10 — Documentation | Architecture, API docs | 3 days |
| **Total** | | **43 days** |

---

# What is Squad?

> *"All of us are going to be managers of infinite minds."*
> — Satya Nadella, WEF Davos, January 2026

**Squad** is a persistent AI agent team framework built on GitHub Copilot CLI

<div class="cols">
<div class="col">

### What it is
- ✅ Your **AI team** with defined roles & charters
- ✅ Agents with memory, expertise, decision authority
- ✅ **Parallel** coordinated execution
- ✅ Persistent knowledge across sessions
- ✅ Built by Brady Gaster (Microsoft)

</div>
<div class="col">

### What it's not
- ❌ Not a replacement for human judgment
- ❌ Not magic — works with what you give it
- ❌ Not a raw content generator
- ❌ Not a CI/CD pipeline

*Squad follows rules. If something isn't clear, it stops and asks.*

</div>
</div>

---

# Our Squad: 8 Specialized Agents

```mermaid
%%{init: {'theme': 'base'}}%%
graph TD
    subgraph Squad["🎬 Squad — Fabric Storyboard Team"]
        Lead["🏗️ Lead<br/><b>Claude Sonnet 4</b><br/><i>Architecture · Routing<br/>Code Reviews</i>"]
        FE["⚛️ Frontend<br/><b>Claude Sonnet 4</b><br/><i>React · Office.js<br/>Fluent UI</i>"]
        BE["🔧 Backend<br/><b>Claude Sonnet 4</b><br/><i>Azure Functions<br/>Power BI API</i>"]
        Auth["🔐 Auth<br/><b>Claude Sonnet 4</b><br/><i>Entra ID · MSAL<br/>SSO · OBO</i>"]
        AI["🧠 AI<br/><b>Claude Sonnet 4</b><br/><i>Azure OpenAI<br/>Prompt Eng.</i>"]
        Infra["🚀 Infra<br/><b>Claude Haiku 4.5</b><br/><i>Bicep · azd<br/>GitHub Actions</i>"]
        Test["🧪 Tester<br/><b>Claude Haiku 4.5</b><br/><i>Jest · Mocks<br/>Integration</i>"]
        Scribe["📋 Scribe<br/><b>Claude Haiku 4.5</b><br/><i>Decisions Log<br/>Documentation</i>"]
    end

    Lead --> FE & BE & Auth & AI & Infra & Test
    Scribe -.->|"logs everything"| Lead

    style Lead fill:#ef4444,stroke:#dc2626,color:#fff
    style FE fill:#3b82f6,stroke:#2563eb,color:#fff
    style BE fill:#f97316,stroke:#ea580c,color:#fff
    style Auth fill:#eab308,stroke:#ca8a04,color:#000
    style AI fill:#22c55e,stroke:#16a34a,color:#fff
    style Infra fill:#06b6d4,stroke:#0891b2,color:#fff
    style Test fill:#a855f7,stroke:#9333ea,color:#fff
    style Scribe fill:#6b7280,stroke:#4b5563,color:#fff
```

---

# Distinct LLM Models Per Agent Role

Each agent gets the **right model** for its job — not one-size-fits-all

| Tier | Model | Cost | Agents | Rationale |
|:---:|-------|:---:|--------|-----------|
| 🟣 **Premium** | Claude Opus 4.6 | 5-10× | Coordinator | Strategic orchestration, complex decisions |
| 🔵 **Standard** | Claude Sonnet 4 | 2-3× | Lead, Frontend, Backend, Auth, AI | Complex code, deep reasoning |
| 🟢 **Fast** | Claude Haiku 4.5 | 1× | Infra, Tester, Scribe | Structured tasks, cost-optimized |

### Why this matters

> Using Opus for everything would cost **5-10×** more with no quality gain on test writing.
> Using Haiku for architecture decisions would save money but **miss critical design issues**.

**Principle**: Use the **cheapest model capable** of doing the job well.

---

# Squad × Phases: Parallel Execution

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#6366f1'}}}%%
gantt
    title Squad Parallel Execution Timeline
    dateFormat HH:mm
    axisFormat %H:%M

    section Scaffolding
    Lead + Frontend + Backend     :crit, s1, 09:27, 17m
    section Auth
    Auth + Backend (parallel)     :crit, s2, 09:44, 13m
    section Browse + Export
    Frontend + Backend            :crit, s3, 09:44, 13m
    section Insert + AI
    Frontend + AI specialist      :crit, s5, 09:57, 38m
    section UI Polish
    Frontend + Lead review        :crit, s7, 09:57, 38m
    section Infrastructure
    Infra (parallel from start)   :active, s8, 09:27, 68m
    section Testing
    Tester + Lead                 :crit, s9, 10:35, 9m
    section Docs
    Scribe + Lead                 :crit, s10, 10:35, 9m
```

> Infrastructure runs **in parallel** with all other phases from the start

---

# v0.1 Timeline: Scaffold in 77 Minutes

| Milestone | Elapsed |
|-----------|:---:|
| Project init — plan, dependencies, Squad setup | 0h |
| Spec finalized, execution begins | +0h |
| **Phases 1-3** — scaffolding, auth, browsing | **+17 min** |
| **Phases 4-5** + 62 tests — export, insert | **+30 min** |
| **Phase 6** — AI insights committed | **+30 min** |
| **Phase 7** — UI polish, a11y, offline detection | **+1h 08** |
| **Phase 8** — infrastructure (in parallel) | *concurrent* |
| **Phase 10** — documentation | **+1h 17** |
| 🎯 **v0.1 scaffold complete** | **~1h 17min** |

### What was produced

| Metric | Value |
|--------|-------|
| TypeScript files | **57** |
| Lines of code | **~5,351** |
| Passing tests | **62/62** |
| Phases completed | **10/10** |

---

# Post-v0.1: The Real Integration Work

> Agent-generated scaffolds are **~90% correct**. The remaining 10% — auth tokens, API formats, cloud platform quirks — requires iterative debugging with real services.

| Issue | Root Cause | Time |
|-------|-----------|:---:|
| SWA Key Vault | SWA doesn't support `@Microsoft.KeyVault()` refs | ~1h |
| Export 400 | JPEG is not a valid Power BI ExportToFile format | ~30m |
| Export 403 | Wrong endpoint: My Workspace vs `/groups/{id}/` | ~1h |
| Auth header hijack | SWA overwrites `Authorization` → custom header | ~1h |
| JWT verification | Needed `jsonwebtoken` + `jwks-rsa` for JWKS | ~1h |
| OpenAI 404 | Double path `/openai/v1/` in endpoint | ~15m |
| Entra consent | Missing `user_impersonation` scope | ~30m |
| UI redesign | Fluent UI v9 branded header, cards, icons | ~2h |
| **Total integration** | | **~7.5h** |

---

# v1 Features & Polish

Built with **GitHub Copilot CLI** (Claude Opus 4.6) after the Squad scaffold

| Feature | Description | Time |
|---------|------------|:---:|
| 🧠 GPT-4o Vision | Analyze exported report *images* for visual insights | ~1.5h |
| 🔧 Combined Insert | Fix GeneralException, `goToByIdAsync` in PPT Online | ~2h |
| 🎨 UI Polish | Colored headers, card sections, Sparkle/Lightbulb icons | ~1h |
| **Total v1 features** | | **~4.5h** |

### Final v1 Codebase

| Metric | Value |
|--------|-------|
| TypeScript files | **57** |
| Lines of TypeScript | **~5,351** |
| Tests passing | **68/68** (23 frontend + 45 backend) |
| Deployed to | **Azure Static Web Apps** (production) |

---

<!-- _class: dark -->

# 📊 The Result: 43 Days → 13.3 Hours

<div class="cols">
<div class="col">

### Effort Breakdown

| Phase | Duration | Tool |
|-------|:---:|------|
| 🟢 v0.1 scaffold | **1.3h** | Squad (8 agents) |
| 🔴 Integration | **7.5h** | Copilot CLI |
| 🔵 v1 features | **4.5h** | Copilot CLI |
| **Total** | **13.3h** | |

</div>
<div class="col">

### Strategy Comparison

| Strategy | Effort | Speed-up |
|----------|:---:|:---:|
| 🔴 Manual dev | 43 days | — |
| 🟡 Individual agents | ~27 days | 37% less |
| 🔵 Squad (planned) | ~14 days | 67% less |
| **🟢 Squad + CLI (actual)** | **1.66 days** | **~26×** |

</div>
</div>

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'pie1': '#22c55e', 'pie2': '#ef4444', 'pie3': '#3b82f6', 'pieStrokeWidth': '2px'}}}%%
pie title Actual Effort Breakdown (13.3h total)
    "v0.1 Scaffold (Squad) — 1.3h" : 1.3
    "Integration Debugging — 7.5h" : 7.5
    "v1 Features & Polish — 4.5h" : 4.5
```

---

# Phase-by-Phase Comparison

| Phase | Manual | Agents | Squad | Squad Savings |
|-------|:---:|:---:|:---:|:---:|
| Scaffolding | 3 | 1.8 | 1.2 | **60%** |
| Authentication | 5 | 3.5 | 2.0 | **60%** |
| Browsing | 5 | 3.0 | 1.5 | **70%** |
| Export | 4 | 2.8 | 1.5 | **63%** |
| Insert | 4 | 2.4 | 1.2 | **70%** |
| AI Insights | 5 | 3.5 | 1.5 | **70%** |
| UI Polish | 4 | 3.0 | 1.5 | **63%** |
| Infrastructure | 5 | 2.5 | 1.5 | **70%** |
| Testing | 5 | 3.0 | 1.5 | **70%** |
| Documentation | 3 | 2.0 | 0.5 | **83%** |
| **Total** | **43** | **~27** | **~14** | **~67%** |

> Planned Squad: 14 days — **Actual**: 1.66 days → **8.5× faster than plan**

---

<!-- _class: accent -->
<!-- _paginate: false -->

# 💡 Key Learning

### The scaffold is ~90% correct
### The last 10% — auth, API formats, cloud quirks — needs iterative debugging

### Total effort: zero → v1 deployed = **~13.3 hours**
### Manual estimate: **43 man-days**
### Real acceleration: **~26×**

---

<!-- _class: divider -->
<!-- _paginate: false -->

# 03 — The Tooling Ecosystem
## Copilot CLI · Squad · Agent Store · Speckit

---

# GitHub Copilot CLI: The Foundation

**Copilot CLI** is the platform layer — authentication, model access, tool execution

<div class="cols">
<div class="col">

### Capabilities
- 📝 Edits code via file operations
- 🔨 Runs builds, tests, deployments
- 🔀 Manages git commits & pushes
- ☁️ Deploys to Azure (SWA CLI)
- 🐛 Iterative debug: read error → fix → retest

</div>
<div class="col">

### On this project
- **Model**: Claude Opus 4.6
- **Role**: All post-v0.1 work
- Integration debugging (7.5h)
- GPT-4o Vision integration
- UI polish iterations
- Office.js compatibility fixes
- Production deployment

</div>
</div>

> *"Copilot CLI is the foundation. Squad runs **on top of** Copilot CLI."*
> — Dina Berry, Microsoft (Squad for Content)

---

# Copilot CLI + Squad: Complementary, Not Competing

```mermaid
%%{init: {'theme': 'base'}}%%
graph TB
    subgraph SQUAD["Squad Framework"]
        direction TB
        S1["🎯 Team Structure<br/>Agents · Charters · Roles"]
        S2["🔄 Coordination<br/>Routing · Parallel Execution"]
        S3["🧠 Persistent Memory<br/>decisions.md · history.md"]
    end
    subgraph CLI["GitHub Copilot CLI"]
        direction TB
        C1["🔐 Auth & Model Access"]
        C2["🛠️ Tool Execution"]
        C3["📁 Context Management"]
    end

    SQUAD --> CLI

    style SQUAD fill:#f0e7ff,stroke:#7c3aed,color:#1e293b
    style CLI fill:#dbeafe,stroke:#3b82f6,color:#1e293b
    style S1 fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style S2 fill:#a78bfa,stroke:#7c3aed,color:#fff
    style S3 fill:#c4b5fd,stroke:#7c3aed,color:#1e293b
    style C1 fill:#3b82f6,stroke:#2563eb,color:#fff
    style C2 fill:#60a5fa,stroke:#3b82f6,color:#fff
    style C3 fill:#93c5fd,stroke:#3b82f6,color:#1e293b
```

| | Copilot CLI | Squad |
|---|---|---|
| **Nature** | Platform / Runtime | Orchestration Framework |
| **Agents** | Single agent | Team of specialists |
| **Memory** | Session only | Persistent across sessions |
| **Coordination** | Manual (you direct) | Automatic (Lead routes) |

---

# Fleet vs Squad: When to Use Which

| Criteria | Copilot Fleet | Squad |
|----------|:---:|:---:|
| **Agents** | Multiple, ad-hoc | Structured persistent team |
| **Shared context** | ❌ Resets between sessions | ✅ `decisions.md` shared |
| **Specialization** | Generalists | Deep domain charters |
| **Parallelism** | One agent at a time | Coordinator fans out |
| **Knowledge compounding** | Starts fresh | Improves over time |
| **Coordination** | You are the coordinator | Lead auto-routes |
| **Documentation** | Afterthought | Scribe logs continuously |

### Why we chose Squad for this project

✅ **Multi-domain** — Auth + Power BI + Office.js + AI + Infra all at once
✅ **Real parallelism** — Frontend + Backend + Infra agents work simultaneously
✅ **Deep specialization** — Each agent carries domain expertise in its charter

---

# Agents vs Skills in Squad

<div class="cols">
<div class="col">

### 🤖 Agent (10%) — Actor
- Has a **charter** and domain expertise
- Makes **decisions** autonomously
- Uses any available tools
- Works until completion
- **When?** Expertise + analysis + judgment

</div>
<div class="col">

### ⚙️ Skill (90%) — Action
- A **list of steps** to execute
- Any agent can use any skill
- Scoped and deterministic
- Reusable and improvable
- **When?** Repetitive, structured tasks

</div>
</div>

> **Routing**: the coordinator scans **all skills** before spawning agents
> Relevant skills are injected into the agent's context
> No matching skill? The agent works normally

*Skills are shared knowledge — not owned by any agent. Investment is transferable because everything is markdown.*

---

# Scaling Squad: A Trust Progression

> *"Autonomy is not a switch — it's a progression. You don't start with autonomy. You earn it."*
> — Tamir Dresher

```mermaid
%%{init: {'theme': 'base'}}%%
graph LR
    O["1️⃣ Observe<br/><i>Read-only</i>"] --> A["2️⃣ Assist<br/><i>Drafts, you decide</i>"]
    A --> Act["3️⃣ Act<br/><i>Scoped execution</i>"]
    Act --> C["4️⃣ Coordinate<br/><i>Manage workflows</i>"]
    C --> Auto["5️⃣ Autonomize<br/><i>End-to-end</i>"]

    style O fill:#dbeafe,stroke:#3b82f6,color:#1e293b
    style A fill:#bfdbfe,stroke:#2563eb,color:#1e293b
    style Act fill:#93c5fd,stroke:#1d4ed8,color:#fff
    style C fill:#60a5fa,stroke:#1e40af,color:#fff
    style Auto fill:#3b82f6,stroke:#1e3a8a,color:#fff
```

| Level | Mode | You | Squad |
|:---:|------|-----|-------|
| 1 | **Observe** | Full control | Watches and learns patterns |
| 2 | **Assist** | Makes decisions | Drafts PRs, analyses, recommendations |
| 3 | **Act** | Sets guardrails | Executes bounded tasks in repo |
| 4 | **Coordinate** | Defines intent | Links PRs ↔ issues, routes work |
| 5 | **Autonomize** | Sets goals | Handles execution end-to-end |

---

# Speckit: The Spec-First Paradigm

The real paradigm shift: from **code-first** to **specification-first**

<div class="cols">
<div class="col">

### 🔴 Traditional
1. Scoping meeting
2. Write specs (days/weeks)
3. Development (weeks/months)
4. Testing
5. Deployment
6. Documentation

*Spec is throwaway. Code is the deliverable.*

</div>
<div class="col">

### 🟢 Speckit Approach
1. **Write the spec** (structured markdown)
2. **Agent generates** the full codebase
3. Debug & integration
4. Deployed ✅

*Spec IS the deliverable. Code is a derived artifact.*

</div>
</div>

> With Speckit, human value focuses on the **what**, not the **how**
> The agent handles implementation — humans bring **domain expertise**

---

# Agent Store: The Marketplace

Pre-built agents for common domains — ready to integrate into Squad or Fleet

<div class="cols">
<div class="col">

### Concept
- 🏪 Agents packaged by domain
- 🔌 Plug into Squad or Fleet
- ⚙️ Configurable with custom skills
- 🌐 Community marketplace

</div>
<div class="col">

### Example Agents
- 🔐 **Auth Agent** — Entra ID, OAuth, MSAL
- 📊 **Power BI Agent** — REST API, DAX
- 🎨 **Fluent UI Agent** — React components
- 🚀 **Azure Deploy** — Bicep, SWA, ACA
- 🧪 **Testing Agent** — Jest, mocks, E2E

</div>
</div>

> Each Agent Store agent has its **optimal LLM model**
> A testing agent doesn't need Opus — Haiku is enough
> An architecture agent needs deep reasoning → Sonnet or Opus

---

# The Complete Toolchain

```mermaid
%%{init: {'theme': 'base'}}%%
graph LR
    SPEC["📋 Speckit<br/><i>Specification</i>"] --> SQUAD["🎬 Squad / Fleet<br/><i>Development</i>"]
    STORE["🏪 Agent Store<br/><i>Components</i>"] --> SQUAD
    SQUAD --> CLI["⚡ Copilot CLI<br/><i>Execution</i>"]
    CLI --> PROD["🚀 Production<br/><i>Deployed</i>"]

    style SPEC fill:#6366f1,stroke:#4f46e5,color:#fff
    style SQUAD fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style STORE fill:#f59e0b,stroke:#d97706,color:#fff
    style CLI fill:#3b82f6,stroke:#2563eb,color:#fff
    style PROD fill:#22c55e,stroke:#16a34a,color:#fff
```

| Tool | Role | When |
|------|------|------|
| **Speckit** | Define *what* to build | Start of project |
| **Agent Store** | Reusable domain agents | Agent selection |
| **Squad** | Orchestrated team execution | Scaffolding & features |
| **Copilot CLI** | Single-agent execution | Integration & debugging |
| **Fleet** | Multiple ad-hoc agents | Quick tasks, exploration |

---

<!-- _class: divider -->
<!-- _paginate: false -->

# 04 — The Cost Model
## Premium requests and LLM optimization

---

# Premium Requests: The New Currency

Every agent interaction consumes **premium requests** — the cost unit of AI development

| Model | Relative Cost | Best For |
|-------|:---:|---------|
| Claude Haiku 4.5 / GPT-4.1 | **1×** | Structured tasks, formatting, scripting |
| Claude Sonnet 4 | **2-3×** | Complex code, reasoning, reviews |
| Claude Opus 4.6 | **5-10×** | Orchestration, architecture, strategic decisions |

### Our Project Consumption

| Resource | Detail | Est. Requests |
|----------|--------|:---:|
| Coordinator (Opus) | Orchestration, routing | ~20-30 |
| 5× Sonnet agents (Lead, FE, BE, Auth, AI) | Code generation, reviews | ~40-60 |
| 3× Haiku agents (Infra, Test, Scribe) | IaC, tests, docs | ~20-30 |
| **Total estimated** | | **~80-120** |

---

# Cost Optimization: Right Model, Right Job

```mermaid
%%{init: {'theme': 'base'}}%%
graph TD
    OPUS["⭐ Opus 4.6<br/><b>5-10×</b><br/><i>Coordinator</i>"]
    S1["Sonnet 4<br/><b>2-3×</b><br/><i>Frontend</i>"]
    S2["Sonnet 4<br/><b>2-3×</b><br/><i>Backend</i>"]
    S3["Sonnet 4<br/><b>2-3×</b><br/><i>Auth</i>"]
    H1["Haiku 4.5<br/><b>1×</b><br/><i>Tester</i>"]
    H2["Haiku 4.5<br/><b>1×</b><br/><i>Infra</i>"]
    H3["Haiku 4.5<br/><b>1×</b><br/><i>Scribe</i>"]

    OPUS --> S1 & S2 & S3
    OPUS --> H1 & H2 & H3

    style OPUS fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style S1 fill:#3b82f6,stroke:#2563eb,color:#fff
    style S2 fill:#3b82f6,stroke:#2563eb,color:#fff
    style S3 fill:#3b82f6,stroke:#2563eb,color:#fff
    style H1 fill:#22c55e,stroke:#16a34a,color:#fff
    style H2 fill:#22c55e,stroke:#16a34a,color:#fff
    style H3 fill:#22c55e,stroke:#16a34a,color:#fff
```

> **3 tiers of models** optimizing cost vs. quality
> Same architecture pattern applies to any Squad or Agent Store deployment

---

# Project Cost: Agents vs Humans

| | Manual Development | With AI Agents |
|---|:---:|:---:|
| **Effort** | 43 man-days | 13.3 hours |
| **Human cost** (@$700/day) | **$30,100** | **~$1,400** (2 days) |
| **Agent cost** (premium requests) | $0 | **~$50-100** |
| **Azure monthly** | ~$70/mo | ~$70/mo |
| **Total (first year)** | **~$31,000** | **~$2,340** |
| **Time to delivery** | ~9 weeks | **~2 days** |

> **Savings**: ~$28,700 and 8.5 weeks on a **single project**
> Agent cost is **negligible** compared to human cost

---

<!-- _class: divider -->
<!-- _paginate: false -->

# 05 — Transforming Consulting Services
## From selling man-days to selling outcomes

---

<!-- _class: dark -->

# The Old World

### Traditional consulting model

```
  Client                              Consulting Firm
    │                                       │
    │  "I need a PowerPoint add-in"        │
    │ ─────────────────────────────────────►│
    │                                       │  Estimate: 43 man-days
    │  Quote: 43 × $700 = $30,100          │  Team: 2-3 developers
    │ ◄─────────────────────────────────────│  Duration: 6-9 weeks
    │                                       │
    │  Delivery in 2 months                │  Margin: ~30% = $9,030
    │ ◄─────────────────────────────────────│
```

### The constraints
- 💰 **Revenue = days × rate** — capped by human hours
- 📈 Margin limited to **25-35%**
- ⏰ Long timelines = scope creep risk
- 📊 Linear revenue — can't scale without hiring

---

# The New World

### Agent-augmented consulting model

```
  Client                              Consulting Firm
    │                                       │
    │  "I need a PowerPoint add-in"        │
    │ ─────────────────────────────────────►│
    │                                       │  Agents: 13h + 2 days human
    │  Quote: $18,000                      │  (supervision, validation, UX)
    │  (value-based, not hours-based)      │
    │ ◄─────────────────────────────────────│  Real cost: ~$1,500
    │                                       │
    │  Delivery in 1 week                  │  Margin: ~92% = $16,500
    │ ◄─────────────────────────────────────│
```

### The transformation
- 💰 **Revenue = value delivered**, not hours billed
- 📈 Margin can reach **70-90%**
- ⚡ Shorter timelines = **competitive advantage**
- 📊 Near-infinite scale with same team

---

# The Margin Impact

| Scenario | Revenue | Internal Cost | Margin | Rate |
|----------|:---:|:---:|:---:|:---:|
| **Old model** (43 man-days) | $30,100 | $21,070 | $9,030 | **30%** |
| **New model** (value-based) | $18,000 | $1,500 | $16,500 | **92%** |
| **New × 10 projects** | $180,000 | $15,000 | $165,000 | **92%** |

### The Win-Win Paradox

| | Client | Consulting Firm |
|---|---|---|
| **Price** | $18,000 vs $30,100 → **-40%** ✅ | — |
| **Timeline** | 1 week vs 9 weeks → **-89%** ✅ | — |
| **Margin** | — | $16,500 vs $9,030 → **+83%** ✅ |

> Client pays **less** and gets it **faster**
> Firm earns **more** with **less risk**

---

# The New Sales Model

<div class="cols">
<div class="col">

### 🔴 Yesterday
- Selling **time** (daily rate)
- Dedicated on-site teams
- Linear revenue growth
- Margin capped at ~30%
- Scaling requires hiring

</div>
<div class="col">

### 🟢 Tomorrow
- Selling **outcomes**
- AI Squads + human oversight
- Exponential revenue potential
- Margins at 70-90%
- Scale without proportional hiring

</div>
</div>

### The new delivery chain

```
Speckit (spec) → Agent Store (components) → Squad / Fleet (dev) → Copilot CLI (integration) → Production
```

> The **specification** becomes the client deliverable
> **Code** is generated by agents
> **Humans** supervise, validate, and bring business expertise

---

# Emerging Roles in Consulting

### What fades vs what emerges

| Declining Skill | Emerging Skill |
|---|---|
| Manual line-by-line coding | **Prompt engineering** & spec writing |
| Estimating in man-days | **Estimating in value delivered** |
| Managing on-site teams | **Managing Squads** (agents + humans) |
| Deep single-tech expertise | **Cross-domain orchestration** |
| Manual code review | **Output supervision & validation** |
| Post-delivery documentation | **Specifications as code** (Speckit) |

### The 3 key roles of tomorrow

1. 🎯 **Squad Manager** — orchestrates agents, writes specs, validates outputs
2. 🧠 **Domain Expert** — brings the business expertise agents don't have
3. 🔧 **Integration Engineer** — connects agents to real cloud services

---

<!-- _class: dark -->

# What We Learned in Practice

### Real lessons from building Fabric Storyboard Copilot

| Step | Who does what |
|------|------|
| **Specification** | 🧑 Human defines requirements (detailed markdown plan) |
| **Scaffolding** | 🤖 Squad generates 90% of code in 1.3h |
| **Integration** | 🧑+🤖 Copilot CLI debugs the remaining 10% (7.5h) |
| **Polish** | 🧑+🤖 Copilot CLI iterates on design & features (4.5h) |
| **Validation** | 🧑 Human tests in PowerPoint, validates result |
| **Deployment** | 🤖 Copilot CLI deploys to Azure SWA |

> The human shifts from **developer** to **supervisor and validator**
> Actual human active time: **~4 hours** of supervision
> The rest is handled by agents

---

<!-- _class: success -->
<!-- _paginate: false -->

# 🚀 Conclusion

---

# What We Demonstrated

<div class="cols">
<div class="col">

### 📊 The Numbers
- **43 days** → **13.3 hours**
- **26×** faster
- **57 files**, **5,351 lines**
- **68 tests** passing
- **8 AI agents** specialized
- **~100** premium requests

</div>
<div class="col">

### 🎯 The Insights
- Scaffold is **~90% correct**
- Cloud integration remains **the real challenge**
- Copilot CLI + Squad are **complementary**
- Right model at the right place = **optimized cost**
- Spec-first (Speckit) is **the future**

</div>
</div>

### The complete chain

```
Speckit → Squad (scaffold) → Copilot CLI (integration) → Agent Store (components) → Production
   spec       ~10% of time        ~60% of time              reusable               deployed
```

---

<!-- _class: cover -->
<!-- _paginate: false -->

# Thank You

## From 43 Man-Days to 13 Hours
### The transformation is already here

**Fabric Storyboard Copilot** — github.com/fredgis/OfficeAddin

🛠️ GitHub Copilot CLI · Squad · Agent Store · Speckit

