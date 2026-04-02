# Architecture — Fabric Storyboard Copilot

This document describes the system architecture, component structure, data flows, and deployment topology of the **Fabric Storyboard Copilot** PowerPoint add-in.

---

## System Overview

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#4472C4', 'secondaryColor': '#ED7D31', 'tertiaryColor': '#70AD47'}}}%%
graph TD
    subgraph PPT["PowerPoint Desktop / Web"]
        subgraph Taskpane["Office Add-in Taskpane"]
            AUTH["Auth Module<br/><i>MSAL.js + SSO</i>"]
            BROWSE["Workspace Browser<br/><i>React + Fluent UI</i>"]
            EXPORT["Export & Insert<br/><i>Office.js API</i>"]
            AI_UI["AI Insights Panel<br/><i>Prompt + Insert</i>"]
        end
    end

    subgraph SWA["Azure Static Web Apps"]
        subgraph API["Azure Functions API"]
            FN_WS["/api/workspaces"]
            FN_RPT["/api/reports"]
            FN_PG["/api/pages"]
            FN_EXP["/api/export"]
            FN_INS["/api/insights"]
            FN_QRY["/api/query"]
            MW["Auth Middleware<br/><i>Token Validation + OBO</i>"]
        end
        STATIC["Static Assets<br/><i>HTML / JS / CSS</i>"]
    end

    subgraph AZURE["Azure Services"]
        ENTRA["Entra ID<br/><i>App Registration</i>"]
        KV["Key Vault<br/><i>Secrets</i>"]
        AOAI["Azure OpenAI<br/><i>GPT-4o</i>"]
        APPINS["Application Insights<br/><i>Telemetry</i>"]
    end

    PBI["Power BI REST API"]
    PBIEX["Power BI Export API"]

    Taskpane -- "HTTPS + Bearer Token" --> API
    PPT -- "Load" --> STATIC
    MW --> ENTRA
    FN_WS --> PBI
    FN_RPT --> PBI
    FN_PG --> PBI
    FN_EXP --> PBIEX
    FN_INS --> AOAI
    FN_QRY --> PBI
    API --> KV
    API --> APPINS

    style PPT fill:#E8F0FE,stroke:#4472C4,stroke-width:2px,color:#000
    style Taskpane fill:#D6E4F0,stroke:#2F5496,stroke-width:2px,color:#000
    style AUTH fill:#FFC000,stroke:#BF9000,color:#000
    style BROWSE fill:#4472C4,stroke:#2F5496,color:#fff
    style EXPORT fill:#70AD47,stroke:#548235,color:#fff
    style AI_UI fill:#9B59B6,stroke:#7D3C98,color:#fff
    style SWA fill:#F0E6FF,stroke:#9B59B6,stroke-width:2px,color:#000
    style API fill:#E8D5F5,stroke:#9B59B6,stroke-width:1px,color:#000
    style STATIC fill:#D5A6E6,stroke:#9B59B6,color:#000
    style FN_WS fill:#D5A6E6,stroke:#9B59B6,color:#000
    style FN_RPT fill:#D5A6E6,stroke:#9B59B6,color:#000
    style FN_PG fill:#D5A6E6,stroke:#9B59B6,color:#000
    style FN_EXP fill:#D5A6E6,stroke:#9B59B6,color:#000
    style FN_INS fill:#D5A6E6,stroke:#9B59B6,color:#000
    style FN_QRY fill:#D5A6E6,stroke:#9B59B6,color:#000
    style MW fill:#FFC000,stroke:#BF9000,color:#000
    style AZURE fill:#E6F3E6,stroke:#70AD47,stroke-width:2px,color:#000
    style ENTRA fill:#5B9BD5,stroke:#2E75B6,color:#fff
    style KV fill:#5B9BD5,stroke:#2E75B6,color:#fff
    style AOAI fill:#70AD47,stroke:#548235,color:#fff
    style APPINS fill:#5B9BD5,stroke:#2E75B6,color:#fff
    style PBI fill:#ED7D31,stroke:#C55A11,color:#fff
    style PBIEX fill:#ED7D31,stroke:#C55A11,color:#fff
```

---

## Authentication Flow

The add-in uses a two-stage auth approach: **SSO** first, with a **dialog fallback** for interactive login. The backend performs **On-Behalf-Of (OBO)** token exchange.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'actorBkg': '#4472C4', 'actorTextColor': '#fff'}}}%%
sequenceDiagram
    actor User
    participant Addin as Add-in Taskpane
    participant Dialog as Auth Dialog
    participant Func as Azure Functions
    participant Entra as Entra ID
    participant PBI as Power BI API

    rect rgb(232, 240, 254)
        Note over Addin,Entra: Stage 1 — Acquire Bootstrap Token
        Addin->>Entra: OfficeRuntime.auth.getAccessToken()
        alt SSO succeeds
            Entra-->>Addin: Bootstrap token
        else SSO fails (consent needed, etc.)
            Addin->>Dialog: displayDialogAsync()
            Dialog->>Entra: MSAL acquireTokenByCode (PKCE)
            Entra-->>Dialog: Access token
            Dialog-->>Addin: messageParent(token)
        end
    end

    rect rgb(240, 230, 255)
        Note over Addin,PBI: Stage 2 — OBO Token Exchange
        Addin->>Func: API request + Authorization header
        Func->>Entra: ConfidentialClientApplication.acquireTokenOnBehalfOf()
        Entra-->>Func: Power BI / OpenAI delegated token
        Func->>PBI: Delegated API call
        PBI-->>Func: Response data
        Func-->>Addin: JSON response
    end
```

### Key Auth Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `AuthProvider` / `AuthContext` | `src/taskpane/services/auth/AuthContext.tsx` | React context providing auth state |
| `useAuth` hook | `src/taskpane/services/auth/useAuth.ts` | Hook wrapping AuthContext for components |
| `ssoAuth` | `src/taskpane/services/auth/ssoAuth.ts` | Office SSO token acquisition |
| `dialogAuth` | `src/taskpane/services/auth/dialogAuth.ts` | MSAL dialog fallback flow |
| `msalConfig` | `src/taskpane/services/auth/msalConfig.ts` | MSAL configuration |
| `authService` | `api/src/services/authService.ts` | Backend OBO exchange with `@azure/msal-node` |

---

## Frontend Component Hierarchy

```mermaid
%%{init: {'theme': 'base'}}%%
graph TD
    ROOT["Root<br/><i>FluentProvider + QueryClient + AuthProvider</i>"]
    EB["ErrorBoundary"]
    APP["App"]
    LOGIN["Login Screen"]
    WB["WorkspaceBrowser"]
    BC["BreadcrumbNav"]
    WP["WorkspacePicker"]
    RL["ReportList"]
    PL["PageList"]
    BIP["BatchInsertPanel"]
    EP["ExportPanel"]
    IP["InsertPanel"]
    ISP["InsightsPanel"]
    CIP["CombinedInsertPanel"]

    ROOT --> EB --> APP
    APP -->|not authenticated| LOGIN
    APP -->|authenticated| WB
    WB --> BC
    WB -->|no workspace| WP
    WB -->|workspace selected| RL
    WB -->|report selected| PL
    WB -->|report selected + batch| BIP
    WB -->|page selected| EP
    EP --> IP
    EP --> ISP
    EP --> CIP

    style ROOT fill:#4472C4,stroke:#2F5496,color:#fff
    style EB fill:#E74C3C,stroke:#C0392B,color:#fff
    style APP fill:#5B9BD5,stroke:#2E75B6,color:#fff
    style LOGIN fill:#FFC000,stroke:#BF9000,color:#000
    style WB fill:#70AD47,stroke:#548235,color:#fff
    style BC fill:#A9D18E,stroke:#548235,color:#000
    style WP fill:#A9D18E,stroke:#548235,color:#000
    style RL fill:#A9D18E,stroke:#548235,color:#000
    style PL fill:#A9D18E,stroke:#548235,color:#000
    style BIP fill:#A9D18E,stroke:#548235,color:#000
    style EP fill:#ED7D31,stroke:#C55A11,color:#fff
    style IP fill:#F4B183,stroke:#C55A11,color:#000
    style ISP fill:#9B59B6,stroke:#7D3C98,color:#fff
    style CIP fill:#D5A6E6,stroke:#9B59B6,color:#000
```

---

## Backend API Endpoints

```mermaid
%%{init: {'theme': 'base'}}%%
graph LR
    subgraph Functions["Azure Functions Endpoints"]
        H["/api/health<br/>GET"]
        W["/api/workspaces<br/>GET"]
        R["/api/workspaces/:id/reports<br/>GET"]
        P["/api/reports/:id/pages<br/>GET"]
        E["/api/export<br/>POST"]
        I["/api/insights<br/>POST"]
        Q["/api/query<br/>POST"]
    end

    subgraph Services["Shared Services"]
        AS["authService<br/><i>OBO token exchange</i>"]
        PS["powerbiService<br/><i>Power BI REST calls</i>"]
        OS["openaiService<br/><i>GPT-4o prompts</i>"]
    end

    W --> AS --> PS
    R --> AS --> PS
    P --> AS --> PS
    E --> AS --> PS
    I --> AS --> OS
    Q --> AS --> PS

    style Functions fill:#F0E6FF,stroke:#9B59B6,stroke-width:2px,color:#000
    style Services fill:#E6F3E6,stroke:#70AD47,stroke-width:2px,color:#000
    style H fill:#A9D18E,stroke:#548235,color:#000
    style W fill:#D5A6E6,stroke:#9B59B6,color:#000
    style R fill:#D5A6E6,stroke:#9B59B6,color:#000
    style P fill:#D5A6E6,stroke:#9B59B6,color:#000
    style E fill:#ED7D31,stroke:#C55A11,color:#fff
    style I fill:#9B59B6,stroke:#7D3C98,color:#fff
    style Q fill:#9B59B6,stroke:#7D3C98,color:#fff
    style AS fill:#FFC000,stroke:#BF9000,color:#000
    style PS fill:#4472C4,stroke:#2F5496,color:#fff
    style OS fill:#70AD47,stroke:#548235,color:#fff
```

### API Details

| Endpoint | Method | Description | Upstream API |
|----------|--------|-------------|--------------|
| `/api/health` | GET | Health check | — |
| `/api/workspaces` | GET | List user workspaces | Power BI `GET /v1.0/myorg/groups` |
| `/api/workspaces/:id/reports` | GET | List reports in workspace | Power BI `GET /v1.0/myorg/groups/:id/reports` |
| `/api/reports/:id/pages` | GET | List pages in report | Power BI `GET /v1.0/myorg/reports/:id/pages` |
| `/api/export` | POST | Export page as image (PNG/JPEG) | Power BI Export API (async polling) |
| `/api/insights` | POST | Generate AI executive insights | Azure OpenAI GPT-4o |
| `/api/query` | POST | Execute DAX query on dataset | Power BI `executeQueries` |

---

## Data Flow — Export & Insert

```mermaid
%%{init: {'theme': 'base'}}%%
sequenceDiagram
    participant User
    participant UI as Taskpane UI
    participant API as Azure Functions
    participant PBI as Power BI Export API
    participant PPT as PowerPoint

    User->>UI: Select page → "Export"
    UI->>API: POST /api/export {reportId, pageName, format}
    API->>PBI: POST /reports/:id/ExportTo
    PBI-->>API: exportId

    loop Poll until complete
        API->>PBI: GET /reports/:id/exports/:exportId
        PBI-->>API: status: Running | Succeeded
    end

    API->>PBI: GET /exports/:exportId/file
    PBI-->>API: Image binary
    API-->>UI: {image: base64, mimeType}

    User->>UI: "Insert into Slide"
    UI->>PPT: Office.js addImage(base64)
    PPT-->>UI: Success
```

---

## Data Flow — AI Insights

```mermaid
%%{init: {'theme': 'base'}}%%
sequenceDiagram
    participant User
    participant UI as Taskpane UI
    participant API as Azure Functions
    participant PBI as Power BI API
    participant AOAI as Azure OpenAI

    User->>UI: "Generate Insights"
    UI->>API: POST /api/insights {reportId, pageName}
    API->>PBI: Get report metadata + dataset info
    PBI-->>API: Report context

    opt DAX enrichment
        API->>PBI: POST /datasets/:id/executeQueries
        PBI-->>API: Summary statistics
    end

    API->>AOAI: Chat completion (system prompt + context)
    AOAI-->>API: Executive insights (3-5 bullet points)
    API-->>UI: {insights: [{headline, body}], summary}

    User->>UI: "Insert Insights"
    UI->>UI: Format as text
    UI->>UI: Office.js addTextBox(text)
```

---

## Infrastructure Topology

```mermaid
%%{init: {'theme': 'base'}}%%
graph TB
    subgraph RG["Azure Resource Group"]
        SWA["Azure Static Web App<br/><i>Frontend + API</i>"]
        KV["Azure Key Vault<br/><i>Client Secret, API Keys</i>"]
        AOAI["Azure OpenAI<br/><i>GPT-4o Deployment</i>"]
        AI["Application Insights<br/><i>Monitoring & Logs</i>"]
    end

    subgraph EXTERNAL["External Services"]
        ENTRA["Entra ID<br/><i>App Registration</i>"]
        PBI["Power BI Service"]
    end

    GH["GitHub Actions<br/><i>CI/CD Pipeline</i>"]

    GH -->|"azd deploy"| SWA
    SWA --> KV
    SWA --> AOAI
    SWA --> AI
    SWA --> ENTRA
    SWA --> PBI

    style RG fill:#E6F3E6,stroke:#70AD47,stroke-width:2px,color:#000
    style SWA fill:#9B59B6,stroke:#7D3C98,color:#fff
    style KV fill:#5B9BD5,stroke:#2E75B6,color:#fff
    style AOAI fill:#70AD47,stroke:#548235,color:#fff
    style AI fill:#5B9BD5,stroke:#2E75B6,color:#fff
    style EXTERNAL fill:#FFF3E0,stroke:#ED7D31,stroke-width:2px,color:#000
    style ENTRA fill:#FFC000,stroke:#BF9000,color:#000
    style PBI fill:#ED7D31,stroke:#C55A11,color:#fff
    style GH fill:#24292E,stroke:#000,color:#fff
```

### Bicep Modules

| Module | Resource | Purpose |
|--------|----------|---------|
| `infra/main.bicep` | Root template | Orchestrates all modules |
| `infra/modules/staticwebapp.bicep` | Static Web App | Hosts frontend + Azure Functions |
| `infra/modules/keyvault.bicep` | Key Vault | Stores secrets (client secret, OpenAI key) |
| `infra/modules/openai.bicep` | Azure OpenAI | GPT-4o deployment for insights |
| `infra/modules/monitoring.bicep` | Application Insights | Telemetry and logging |

---

## Project Structure

```
OfficeAddin/
├── src/
│   └── taskpane/
│       ├── components/        # React UI components
│       │   ├── App.tsx                 # Main app (auth gate + layout)
│       │   ├── WorkspaceBrowser.tsx    # Navigation orchestrator
│       │   ├── WorkspacePicker.tsx     # Workspace selection (Combobox)
│       │   ├── ReportList.tsx          # Report card list with filter
│       │   ├── PageList.tsx            # Page card list with export
│       │   ├── BreadcrumbNav.tsx       # Workspace > Report > Page nav
│       │   ├── ExportPanel.tsx         # Export page to image
│       │   ├── InsertPanel.tsx         # Insert image into slide
│       │   ├── InsightsPanel.tsx       # AI insights generation
│       │   ├── CombinedInsertPanel.tsx # Image + Insights one-click
│       │   ├── BatchInsertPanel.tsx    # Multi-page batch insert
│       │   └── ErrorBoundary.tsx       # Global error boundary
│       ├── hooks/
│       │   ├── usePowerBI.ts           # React Query hooks for Power BI
│       │   └── useInsights.ts          # React Query hooks for AI
│       ├── services/
│       │   ├── api/
│       │   │   ├── powerbiClient.ts    # Axios-based API client
│       │   │   └── insightsClient.ts   # Insights API client
│       │   ├── auth/
│       │   │   ├── AuthContext.tsx      # Auth React context + provider
│       │   │   ├── useAuth.ts          # Auth hook
│       │   │   ├── ssoAuth.ts          # Office SSO flow
│       │   │   ├── dialogAuth.ts       # MSAL dialog fallback
│       │   │   └── msalConfig.ts       # MSAL configuration
│       │   └── officeInsert.ts         # Office.js slide insertion service
│       ├── types/                      # TypeScript interfaces
│       └── index.tsx                   # Entry point (FluentProvider + theme)
├── api/
│   └── src/
│       ├── functions/                  # Azure Function endpoints
│       │   ├── workspaces.ts
│       │   ├── reports.ts
│       │   ├── pages.ts
│       │   ├── export.ts
│       │   ├── insights.ts
│       │   ├── query.ts
│       │   └── health.ts
│       ├── services/
│       │   ├── authService.ts          # OBO token exchange
│       │   ├── powerbiService.ts       # Power BI API client
│       │   └── openaiService.ts        # Azure OpenAI client
│       ├── middleware/                  # Auth validation
│       └── types/                      # Backend type definitions
├── infra/                              # Bicep IaC templates
├── docs/                               # Documentation
├── manifest.xml                        # Office Add-in manifest
├── azure.yaml                          # azd deployment config
├── webpack.config.js                   # Frontend bundling
└── package.json                        # Root dependencies
```

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI Framework | Fluent UI v9 | Native Microsoft look-and-feel, theme-aware |
| State Management | React Query | Built-in caching, retry, background refresh |
| Auth Strategy | SSO + Dialog fallback | Best UX with SSO, reliable fallback for consent |
| Backend Pattern | Azure Functions (v4) | Integrated with Static Web Apps, serverless |
| Token Flow | On-Behalf-Of (OBO) | Delegated access, respects user permissions |
| Export Approach | Power BI Export API (async) | High-quality images, supports all visuals |
| AI Model | GPT-4o | Best quality/speed balance for insights |
| IaC | Bicep + azd | First-class Azure support, repeatable deployments |
