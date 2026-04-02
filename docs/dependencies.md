# Task Dependencies — PowerPoint Office Add-in

## Dependency Graph (Mermaid)

```mermaid
graph TD
    P1["<b>Phase 1</b><br/>Project Scaffolding<br/>& Dev Environment"]
    P2["<b>Phase 2</b><br/>Authentication<br/>Entra ID"]
    P3["<b>Phase 3</b><br/>Workspace & Report<br/>Browsing"]
    P4["<b>Phase 4</b><br/>Report Page<br/>Export as Images"]
    P5["<b>Phase 5</b><br/>Insert Images into<br/>PowerPoint Slides"]
    P6["<b>Phase 6</b><br/>AI Executive<br/>Insights"]
    P7["<b>Phase 7</b><br/>UI Polish &<br/>Error Handling"]
    P8["<b>Phase 8</b><br/>Infrastructure<br/>& Deployment"]
    P9["<b>Phase 9</b><br/>Testing & QA"]
    P10["<b>Phase 10</b><br/>Documentation<br/>& Handoff"]

    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
    P3 --> P6
    P5 --> P6
    P6 --> P7
    P7 --> P9
    P1 --> P8
    P9 --> P10

    style P1 fill:#4472C4,stroke:#2F5496,color:#fff
    style P2 fill:#ED7D31,stroke:#C55A11,color:#fff
    style P3 fill:#A5A5A5,stroke:#7F7F7F,color:#fff
    style P4 fill:#FFC000,stroke:#BF9000,color:#000
    style P5 fill:#5B9BD5,stroke:#2E75B6,color:#fff
    style P6 fill:#70AD47,stroke:#548235,color:#fff
    style P7 fill:#9B59B6,stroke:#7D3C98,color:#fff
    style P8 fill:#4472C4,stroke:#2F5496,color:#fff
    style P9 fill:#E74C3C,stroke:#C0392B,color:#fff
    style P10 fill:#1ABC9C,stroke:#16A085,color:#fff
```

## Critical Path vs. Parallel Track

```mermaid
graph LR
    subgraph Critical["🔴 Critical Path"]
        direction LR
        CP1["P1<br/>Scaffold"] --> CP2["P2<br/>Auth"] --> CP3["P3<br/>Browse"] --> CP4["P4<br/>Export"] --> CP5["P5<br/>Insert"] --> CP6["P6<br/>AI"] --> CP7["P7<br/>Polish"] --> CP9["P9<br/>Test"] --> CP10["P10<br/>Docs"]
    end

    subgraph Parallel["🟢 Parallel Track"]
        direction LR
        PP1["P1<br/>Scaffold"] --> PP8["P8<br/>Infra & Deploy"]
    end

    style CP1 fill:#E74C3C,stroke:#C0392B,color:#fff
    style CP2 fill:#E74C3C,stroke:#C0392B,color:#fff
    style CP3 fill:#E74C3C,stroke:#C0392B,color:#fff
    style CP4 fill:#E74C3C,stroke:#C0392B,color:#fff
    style CP5 fill:#E74C3C,stroke:#C0392B,color:#fff
    style CP6 fill:#E74C3C,stroke:#C0392B,color:#fff
    style CP7 fill:#E74C3C,stroke:#C0392B,color:#fff
    style CP9 fill:#E74C3C,stroke:#C0392B,color:#fff
    style CP10 fill:#E74C3C,stroke:#C0392B,color:#fff
    style PP1 fill:#27AE60,stroke:#1E8449,color:#fff
    style PP8 fill:#27AE60,stroke:#1E8449,color:#fff
```

> **Phase 8 (Infrastructure)** can be developed **in parallel** with Phases 2–7, reducing the overall timeline.

## Gantt Chart (Parallel Execution)

```mermaid
gantt
    title Implementation Timeline
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d

    section 🔵 Foundation
    Phase 1 - Scaffolding           :crit, p1, 2026-04-03, 3d

    section 🟠 Authentication
    Phase 2 - Entra ID Auth         :crit, p2, after p1, 5d

    section 🟡 Core Features
    Phase 3 - Workspace Browsing    :crit, p3, after p2, 5d
    Phase 4 - Report Export         :crit, p4, after p3, 4d
    Phase 5 - Slide Insertion       :crit, p5, after p4, 4d

    section 🟢 AI & Polish
    Phase 6 - AI Insights           :crit, p6, after p5, 5d
    Phase 7 - UI Polish             :crit, p7, after p6, 4d

    section 🔵 Infrastructure (Parallel)
    Phase 8 - Infra & Deploy        :active, p8, after p1, 8d

    section 🔴 Quality
    Phase 9 - Testing & QA          :crit, p9, after p7, 5d
    Phase 10 - Documentation        :crit, p10, after p9, 3d
```

> 🔴 `crit` = critical path items &nbsp;|&nbsp; 🔵 `active` = parallel track

## Dependency Matrix

### Role Involvement per Phase

```mermaid
%%{init: {'theme': 'base'}}%%
graph TB
    subgraph Phase1["Phase 1 — Scaffolding"]
        P1F["🎨 Frontend"]
        P1B["⚙️ Backend"]
        P1D["🚀 DevOps"]
    end

    subgraph Phase2["Phase 2 — Auth"]
        P2F["🎨 Frontend"]
        P2B["⚙️ Backend"]
        P2A["🔐 Auth"]
    end

    subgraph Phase3["Phase 3 — Browsing"]
        P3F["🎨 Frontend"]
        P3B["⚙️ Backend"]
    end

    subgraph Phase4["Phase 4 — Export"]
        P4F["🎨 Frontend"]
        P4B["⚙️ Backend"]
    end

    subgraph Phase5["Phase 5 — Insert"]
        P5F["🎨 Frontend"]
    end

    subgraph Phase6["Phase 6 — AI"]
        P6F["🎨 Frontend"]
        P6B["⚙️ Backend"]
        P6AI["🧠 AI"]
    end

    subgraph Phase8["Phase 8 — Infra"]
        P8D["🚀 DevOps"]
    end

    Phase1 --> Phase2
    Phase2 --> Phase3
    Phase3 --> Phase4
    Phase4 --> Phase5
    Phase5 --> Phase6
    Phase1 --> Phase8

    style P1F fill:#4472C4,stroke:#2F5496,color:#fff
    style P2F fill:#4472C4,stroke:#2F5496,color:#fff
    style P3F fill:#4472C4,stroke:#2F5496,color:#fff
    style P4F fill:#4472C4,stroke:#2F5496,color:#fff
    style P5F fill:#4472C4,stroke:#2F5496,color:#fff
    style P6F fill:#4472C4,stroke:#2F5496,color:#fff
    style P1B fill:#ED7D31,stroke:#C55A11,color:#fff
    style P2B fill:#ED7D31,stroke:#C55A11,color:#fff
    style P3B fill:#ED7D31,stroke:#C55A11,color:#fff
    style P4B fill:#ED7D31,stroke:#C55A11,color:#fff
    style P6B fill:#ED7D31,stroke:#C55A11,color:#fff
    style P2A fill:#FFC000,stroke:#BF9000,color:#000
    style P6AI fill:#70AD47,stroke:#548235,color:#fff
    style P1D fill:#5B9BD5,stroke:#2E75B6,color:#fff
    style P8D fill:#5B9BD5,stroke:#2E75B6,color:#fff
```

> 🎨 **Blue** = Frontend &nbsp;|&nbsp; ⚙️ **Orange** = Backend &nbsp;|&nbsp; 🔐 **Gold** = Auth &nbsp;|&nbsp; 🧠 **Green** = AI &nbsp;|&nbsp; 🚀 **Light Blue** = DevOps

| Phase | Depends On | Blocks |
|-------|-----------|--------|
| **1 - Scaffolding** | — | 2, 8 |
| **2 - Auth** | 1 | 3 |
| **3 - Browsing** | 2 | 4, 6 |
| **4 - Export** | 3 | 5 |
| **5 - Insert** | 4 | 6 |
| **6 - AI Insights** | 3, 5 | 7 |
| **7 - Polish** | 6 | 9 |
| **8 - Infrastructure** | 1 | — (parallel track) |
| **9 - Testing** | 7 | 10 |
| **10 - Documentation** | 9 | — |
