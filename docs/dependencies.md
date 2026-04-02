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

## Critical Path

```mermaid
graph LR
    CP1["Phase 1"] --> CP2["Phase 2"] --> CP3["Phase 3"] --> CP4["Phase 4"] --> CP5["Phase 5"] --> CP6["Phase 6"] --> CP7["Phase 7"] --> CP9["Phase 9"] --> CP10["Phase 10"]

    style CP1 fill:#E74C3C,stroke:#C0392B,color:#fff
    style CP2 fill:#E74C3C,stroke:#C0392B,color:#fff
    style CP3 fill:#E74C3C,stroke:#C0392B,color:#fff
    style CP4 fill:#E74C3C,stroke:#C0392B,color:#fff
    style CP5 fill:#E74C3C,stroke:#C0392B,color:#fff
    style CP6 fill:#E74C3C,stroke:#C0392B,color:#fff
    style CP7 fill:#E74C3C,stroke:#C0392B,color:#fff
    style CP9 fill:#E74C3C,stroke:#C0392B,color:#fff
    style CP10 fill:#E74C3C,stroke:#C0392B,color:#fff
```

> **Phase 8 (Infrastructure)** can be developed **in parallel** with Phases 2–7, reducing the critical path.

## Gantt Chart (Parallel Execution)

```mermaid
gantt
    title Implementation Timeline
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d

    section Foundation
    Phase 1 - Scaffolding           :p1, 2026-04-03, 3d

    section Authentication
    Phase 2 - Entra ID Auth         :p2, after p1, 5d

    section Core Features
    Phase 3 - Workspace Browsing    :p3, after p2, 5d
    Phase 4 - Report Export         :p4, after p3, 4d
    Phase 5 - Slide Insertion       :p5, after p4, 4d

    section AI & Polish
    Phase 6 - AI Insights           :p6, after p5, 5d
    Phase 7 - UI Polish             :p7, after p6, 4d

    section Infrastructure (Parallel)
    Phase 8 - Infra & Deploy        :p8, after p1, 8d

    section Quality
    Phase 9 - Testing & QA          :p9, after p7, 5d
    Phase 10 - Documentation        :p10, after p9, 3d
```

## Dependency Matrix

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
