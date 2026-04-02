# PowerPoint Office Add-in for Microsoft Fabric & Power BI

## Problem Statement

Build a PowerPoint Office Add-in that allows users to browse their Microsoft Fabric / Power BI workspaces, select reports and pages, export report pages as high-quality images, insert them into PowerPoint slides, and generate AI-powered executive insights — all from within PowerPoint.

## Proposed Approach

- **Frontend**: React + TypeScript taskpane add-in using Office.js
- **Backend**: Azure Functions (Node.js/TypeScript) for API proxying and AI generation
- **Auth**: MSAL.js + Entra ID with Office Dialog API for interactive login
- **Power BI Integration**: Power BI REST API (workspaces, reports, pages, export)
- **AI**: Azure OpenAI (GPT-4o) for generating executive insights from report data
- **Hosting**: Azure Static Web Apps (frontend + integrated Azure Functions backend)
- **Deployment**: Azure Developer CLI (`azd`) for infrastructure-as-code

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                 PowerPoint Desktop / Web              │
│  ┌─────────────────────────────────────────────────┐  │
│  │            Office Add-in Taskpane               │  │
│  │  (React + TypeScript + Office.js + MSAL.js)     │  │
│  │                                                 │  │
│  │  ┌───────────┐ ┌──────────┐ ┌───────────────┐  │  │
│  │  │   Auth    │ │ Workspace│ │  Slide Insert  │  │  │
│  │  │  Module   │ │ Browser  │ │   + AI Panel   │  │  │
│  │  └───────────┘ └──────────┘ └───────────────┘  │  │
│  └───────────────────┬─────────────────────────────┘  │
│                      │ HTTPS                          │
└──────────────────────┼────────────────────────────────┘
                       │
        ┌──────────────▼──────────────────┐
        │   Azure Static Web Apps         │
        │   + Integrated Azure Functions  │
        │                                 │
        │  /api/workspaces    ──► Power BI REST API
        │  /api/reports       ──► Power BI REST API
        │  /api/pages         ──► Power BI REST API
        │  /api/export        ──► Power BI Export API
        │  /api/insights      ──► Azure OpenAI (GPT-4o)
        └─────────────────────────────────┘
                       │
        ┌──────────────▼──────────────────┐
        │          Entra ID               │
        │  (App Registration, OBO flow)   │
        └─────────────────────────────────┘
```

## Auth Flow

1. User opens the add-in in PowerPoint
2. Frontend uses MSAL.js to acquire an access token silently (SSO attempt via `OfficeRuntime.auth.getAccessToken`)
3. If silent auth fails, fallback to Office Dialog API for interactive Entra ID login
4. Frontend sends the token to Azure Functions backend
5. Backend validates the token and uses On-Behalf-Of (OBO) flow to get a delegated token for Power BI REST API and Azure OpenAI
6. Backend calls downstream APIs with the OBO token

---

## Phase 1: Project Scaffolding & Dev Environment

### 1.1 Initialize Office Add-in project
- Use Yeoman Office generator (`yo office`) to scaffold a PowerPoint taskpane add-in with React + TypeScript
- Configure `manifest.xml` with add-in metadata, permissions, and URLs
- Set up the project structure:
  ```
  OfficeAddin/
  ├── src/
  │   ├── taskpane/          # React taskpane app
  │   │   ├── components/    # UI components
  │   │   ├── services/      # API client services
  │   │   ├── hooks/         # Custom React hooks
  │   │   ├── types/         # TypeScript interfaces
  │   │   └── App.tsx        # Main app component
  │   └── commands/          # Office ribbon commands (optional)
  ├── api/                   # Azure Functions backend
  │   ├── src/
  │   │   ├── functions/     # Individual function endpoints
  │   │   ├── services/      # Shared business logic
  │   │   └── middleware/    # Auth validation, error handling
  │   ├── host.json
  │   ├── local.settings.json
  │   ├── package.json
  │   └── tsconfig.json
  ├── infra/                 # Azure infra (Bicep / azd)
  ├── manifest.xml
  ├── webpack.config.js
  ├── package.json
  └── tsconfig.json
  ```

### 1.2 Configure development tooling
- ESLint + Prettier for code quality
- Webpack dev server with HTTPS for local Office.js development
- Environment variable management (`.env` files for local, App Settings for Azure)
- Git hooks (husky + lint-staged) for pre-commit checks

### 1.3 Set up Azure Functions project
- Initialize Azure Functions project (Node.js v4 programming model, TypeScript)
- Configure local.settings.json with Power BI and Azure OpenAI connection settings
- Set up shared middleware for auth token validation and error handling

**Validation**: `npm start` launches the add-in in PowerPoint with a working taskpane; Azure Functions run locally with `func start`.

---

## Phase 2: Authentication with Entra ID

### 2.1 Create Entra ID App Registration
- Register an app in Azure Entra ID
- Configure redirect URIs for:
  - `https://localhost:3000/dialog.html` (local dev)
  - `https://<swa-domain>/dialog.html` (production)
- Add API permissions:
  - `https://analysis.windows.net/powerbi/api/.default` (Power BI)
  - `https://cognitiveservices.azure.com/.default` (Azure OpenAI)
  - `User.Read` (Microsoft Graph — for user profile)
- Configure the app to expose an API (for OBO flow) with scope `api://<client-id>/access_as_user`
- Generate a client secret (stored in Azure Key Vault for production)

### 2.2 Implement SSO with Office.js
- Use `OfficeRuntime.auth.getAccessToken()` to attempt SSO
- The SSO token is a bootstrap token scoped to the add-in's own API
- Send this token to the backend for OBO exchange

### 2.3 Implement fallback interactive auth
- Create a `dialog.html` page that uses MSAL.js `@azure/msal-browser` for interactive login
- Use `Office.context.ui.displayDialogAsync()` to open the auth dialog
- Dialog sends the auth result back via `Office.context.ui.messageParent()`
- Store the resulting token in memory (not localStorage for security)

### 2.4 Implement OBO flow in Azure Functions
- Create a shared auth middleware for Azure Functions
- Validate the incoming access token from the frontend
- Use `@azure/msal-node` `ConfidentialClientApplication` to exchange the token via OBO for:
  - Power BI API token
  - Azure OpenAI token
- Cache tokens appropriately using MSAL's built-in token cache

### 2.5 Implement token management on the frontend
- Create an `AuthProvider` React context
- Handle token refresh, expiry, and re-authentication
- Show login/logout UI and user profile info

**Validation**: User can sign in via SSO or dialog flow; backend successfully exchanges tokens and calls Power BI API with the OBO token; token refresh works silently.

---

## Phase 3: Power BI Workspace & Report Browsing

### 3.1 Backend — Workspace API endpoints
- `GET /api/workspaces` — List workspaces the user has access to
  - Calls `GET https://api.powerbi.com/v1.0/myorg/groups` with OBO token
  - Returns `{ id, name, type, state }[]`
- `GET /api/workspaces/{workspaceId}/reports` — List reports in a workspace
  - Calls `GET https://api.powerbi.com/v1.0/myorg/groups/{groupId}/reports`
  - Returns `{ id, name, webUrl, embedUrl, datasetId }[]`
- `GET /api/reports/{reportId}/pages` — List pages in a report
  - Calls `GET https://api.powerbi.com/v1.0/myorg/reports/{reportId}/pages`
  - Returns `{ name, displayName, order }[]`

### 3.2 Frontend — API client service
- Create a `PowerBIService` class in `src/taskpane/services/`
- Methods: `getWorkspaces()`, `getReports(workspaceId)`, `getPages(reportId)`
- Attach the auth token to all requests via an Axios/fetch interceptor
- Handle errors (401 → re-auth, 403 → permission message, 429 → retry with backoff)

### 3.3 Frontend — Workspace Browser UI
- **WorkspacePicker** component: dropdown or searchable list of workspaces
- **ReportList** component: card/list view of reports in the selected workspace
  - Show report name, dataset, last refresh date
  - Search/filter capability
- **PageList** component: thumbnail list of pages in the selected report
  - Show page display name and order
- Implement breadcrumb navigation: Workspaces → Reports → Pages
- Loading skeletons and empty states for good UX
- Use React Query (`@tanstack/react-query`) for data fetching, caching, and background refresh

**Validation**: User can browse workspaces, see reports, and drill into report pages; data loads correctly with proper loading/error states.

---

## Phase 4: Report Page Export as Images

### 4.1 Backend — Export endpoint
- `POST /api/export` — Export a report page as an image
  - Request body: `{ reportId, pageName, format: "PNG" | "JPEG", width?, height? }`
  - Uses the Power BI Export API:
    1. `POST https://api.powerbi.com/v1.0/myorg/reports/{reportId}/ExportTo` with:
       ```json
       {
         "format": "PNG",
         "powerBIReportConfiguration": {
           "pages": [{ "pageName": "<pageName>" }]
         }
       }
       ```
    2. Poll `GET https://api.powerbi.com/v1.0/myorg/reports/{reportId}/exports/{exportId}` until status is `Succeeded`
    3. Download the exported file via `GET .../exports/{exportId}/file`
  - Return the image as base64-encoded data or a temporary URL
- Handle export polling with exponential backoff (export can take 10-60s)
- Implement a timeout (max 5 minutes) and proper error messages

### 4.2 Frontend — Export service & progress UI
- Add `exportPage(reportId, pageName, format)` to the API client
- Show a progress indicator while the export is running
- Cache recently exported images to avoid redundant API calls
- Allow the user to select image format (PNG/JPEG) and optional resolution

**Validation**: Selecting a report page triggers an export; the image is returned successfully and can be previewed in the taskpane.

---

## Phase 5: Insert Images into PowerPoint Slides

### 5.1 Office.js integration — Image insertion
- Use `Office.context.document.setSelectedDataAsync()` with `Office.CoercionType.Image` to insert base64 images
- Alternatively, use the PowerPoint JavaScript API:
  ```typescript
  await PowerPoint.run(async (context) => {
    const slide = context.presentation.slides.getItemAt(index);
    slide.shapes.addImage(base64Image, { left, top, width, height });
    await context.sync();
  });
  ```
- Support inserting into:
  - The **current slide** at a default position
  - A **new slide** (auto-created)
  - A **specific position** on the slide (drag-to-place or predefined layouts)

### 5.2 Frontend — Insertion UI
- "Insert into Current Slide" button on each page thumbnail
- "Insert into New Slide" button
- Preview modal showing the image before insertion
- Layout options: full-slide, half-slide (left/right), quarter
- Undo support via Office.js (if available) or manual tracking

### 5.3 Batch insertion
- Allow selecting multiple pages and inserting them as a batch
- Each page goes onto a new slide with a consistent layout
- Show progress (e.g., "Inserting 3 of 7 pages...")
- Option to add slide titles from report page names

**Validation**: Images are correctly inserted into PowerPoint slides with proper sizing; batch insertion creates multiple slides; images render at high quality.

---

## Phase 6: AI-Powered Executive Insights

### 6.1 Backend — Insights endpoint
- `POST /api/insights` — Generate executive insights for a report/page
  - Request body: `{ reportId, pageName, dataContext?, customPrompt? }`
  - Flow:
    1. Retrieve report metadata (title, page name, dataset info) from Power BI API
    2. Optionally query the dataset for summary data via Power BI `executeQueries` API (DAX queries)
    3. Call Azure OpenAI GPT-4o with a system prompt + the data context:
       ```
       System: You are an executive insights analyst. Given the following Power BI report data,
       generate 3-5 concise, actionable insights suitable for an executive presentation.
       Format each insight as a bullet point with a bold headline.
       ```
    4. Return the generated insights as structured text/HTML

### 6.2 Backend — DAX query support (optional enrichment)
- `POST /api/query` — Execute a DAX query against a dataset
  - Calls `POST https://api.powerbi.com/v1.0/myorg/datasets/{datasetId}/executeQueries`
  - Used to pull summary statistics that enrich the AI prompt
  - Supports user-defined or auto-generated DAX queries

### 6.3 Frontend — Insights panel UI
- "Generate Insights" button on each report page
- Show a loading animation while AI processes
- Display generated insights in a formatted panel
- "Insert Insights" button to add them as a text box on the current or next slide
- Allow editing insights before insertion
- Insert as a styled text box using Office.js:
  ```typescript
  slide.shapes.addTextBox(insightText, { left, top, width, height });
  ```

### 6.4 Combined insert — Image + Insights on a slide
- One-click "Insert Page with Insights" action
- Creates a new slide with:
  - Report page image (e.g., left 60% of slide)
  - AI insights text box (e.g., right 40% of slide)
  - Slide title from report page name
- Predefined layout templates for consistent branding

**Validation**: AI generates relevant, well-formatted insights from report data; insights are correctly inserted as text boxes; combined image+insights layout looks professional.

---

## Phase 7: UI Polish, Error Handling & Edge Cases

### 7.1 Fluent UI theming
- Use `@fluentui/react-components` (Fluent UI v9) for consistent Microsoft look-and-feel
- Support light/dark/high-contrast themes via Office.js theme detection
- Responsive layout that works in the narrow taskpane (≈300px wide)

### 7.2 Comprehensive error handling
- Network errors: retry with exponential backoff, offline detection
- Auth errors: automatic re-auth flow, clear error messages
- Power BI errors: permission denied, report not found, export throttling
- AI errors: timeout, content filtering, fallback to simpler insights
- Global error boundary with "Report a Problem" option

### 7.3 Loading & empty states
- Skeleton loaders for all list views
- Empty states with helpful messages ("No reports found in this workspace")
- Optimistic UI updates where possible

### 7.4 Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation throughout the taskpane
- Screen reader compatibility
- Minimum touch targets (44x44px)

**Validation**: Add-in works seamlessly with proper error recovery; accessible with keyboard and screen reader; looks native in PowerPoint.

---

## Phase 8: Infrastructure & Deployment

### 8.1 Azure infrastructure (Bicep + azd)
- Define infrastructure as code in `infra/` directory:
  - Azure Static Web App (frontend + integrated functions)
  - Azure Key Vault (secrets: client secret, OpenAI key)
  - Azure OpenAI resource (or reference existing)
  - Application Insights (monitoring & telemetry)
- Create `azure.yaml` for `azd` deployment
- Configure environment-specific settings (dev, staging, production)

### 8.2 CI/CD with GitHub Actions
- `.github/workflows/ci.yml`:
  - Lint, type-check, build, test on every PR
- `.github/workflows/deploy.yml`:
  - Deploy to Azure Static Web Apps on merge to `main`
  - Run `azd provision` + `azd deploy`
- Environment secrets managed via GitHub Environments

### 8.3 Manifest & add-in deployment
- Generate production `manifest.xml` with Azure URLs
- Sideload instructions for development/testing
- Admin deployment via Microsoft 365 Admin Center or Teams App Catalog
- Document the centralized deployment process

**Validation**: `azd up` provisions all Azure resources and deploys the app; CI/CD pipeline runs on PRs; add-in can be sideloaded and used in PowerPoint.

---

## Phase 9: Testing & Quality Assurance

### 9.1 Unit tests
- Jest + React Testing Library for frontend components
- Jest for Azure Functions handlers and services
- Mock MSAL, Office.js, and Power BI API responses
- Target: >80% code coverage on business logic

### 9.2 Integration tests
- Test auth flow end-to-end (SSO + fallback)
- Test Power BI API integration with test workspace
- Test Azure OpenAI integration with sample data
- Test Office.js image/text insertion in a real PowerPoint context

### 9.3 Manual testing checklist
- [ ] PowerPoint Desktop (Windows) — sideload and test all features
- [ ] PowerPoint Desktop (Mac) — verify compatibility
- [ ] PowerPoint Online (web) — verify compatibility
- [ ] Different screen sizes / taskpane widths
- [ ] Multiple Entra ID tenants
- [ ] Large workspaces (100+ reports)
- [ ] Slow network conditions
- [ ] Token expiry and refresh during active use

**Validation**: All unit tests pass; integration tests verify end-to-end flows; manual testing covers all target platforms.

---

## Phase 10: Documentation & Handoff

### 10.1 Developer documentation
- `README.md` — Project overview, quick start, architecture
- `CONTRIBUTING.md` — Dev setup, coding standards, PR process
- `docs/architecture.md` — Detailed architecture with diagrams
- `docs/auth.md` — Auth flow documentation and Entra ID setup guide
- `docs/deployment.md` — Deployment guide (local, staging, production)
- `docs/api.md` — Backend API reference

### 10.2 User documentation
- In-app onboarding / first-run experience
- Help panel within the add-in
- Admin guide for deploying to the organization

---

## Dependencies Between Phases

| Phase | Depends On | Reason |
|-------|-----------|--------|
| Phase 2 (Auth) | Phase 1 (Scaffolding) | Need project structure before adding auth |
| Phase 3 (Browsing) | Phase 2 (Auth) | Need authenticated tokens to call Power BI API |
| Phase 4 (Export) | Phase 3 (Browsing) | Need to select a report/page before exporting |
| Phase 5 (Insert) | Phase 4 (Export) | Need exported images to insert into slides |
| Phase 6 (AI Insights) | Phase 3 (Browsing) + Phase 5 (Insert) | Need report data and insertion capability |
| Phase 7 (Polish) | Phases 2-6 | Polish after core features work |
| Phase 8 (Infra) | Phase 1 (Scaffolding) | Can start in parallel after scaffolding |
| Phase 9 (Testing) | Phases 2-7 | Test after features are implemented |
| Phase 10 (Docs) | All phases | Document the final implementation |

## Key Technical Decisions

1. **OBO flow for backend API calls** — The frontend acquires a token scoped to the add-in's API; the backend exchanges it for Power BI and OpenAI tokens. This keeps secrets server-side.
2. **Export API (not embed + screenshot)** — Using Power BI's official Export API ensures high-quality renders without needing to embed reports.
3. **Azure Static Web Apps** — Single deployment unit for frontend + backend; built-in auth integration, custom domains, and staging environments.
4. **Fluent UI v9** — Matches PowerPoint's design language; supports theming out of the box.
5. **React Query** — Handles caching, background refresh, and optimistic updates for a snappy UX.

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Power BI Export API rate limits (max ~50 exports/hour per user) | Cache exports; batch judiciously; show clear throttling messages |
| SSO not available in all Office hosts | Fallback to dialog-based MSAL auth |
| Large reports take long to export | Async polling with timeout; progress indicator; cancel support |
| Azure OpenAI content filtering blocks business content | Use appropriate content filtering configuration; provide manual insight editing |
| Office.js API differences across platforms | Test on Desktop (Win/Mac) and Web; use feature detection |
