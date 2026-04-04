# Code Review Report

**Date:** 2026-04-02  
**Reviewers:** Copilot (4 parallel agents: backend, frontend, infra, docs)  
**Scope:** Full codebase — 56 source files, 19 config/infra files, 7 doc files  
**Commits:** `40a9d6e` (Managed Identity migration) → `71373b6` (review fixes)

---

## Summary

| Severity | Found | Fixed | Remaining |
|----------|-------|-------|-----------|
| 🔴 Critical | 2 | 2 | 0 |
| 🟠 High | 3 | 3 | 0 |
| 🟡 Medium | 10 | 10 | 0 |
| 🔵 Low | 4 | 0 | 4 |
| **Total** | **19** | **15** | **4** |

**Test results after fixes:** 68/68 passing (45 backend, 23 frontend)

---

## 🔴 Critical Issues (Fixed)

### 1. JWT Token — No Signature Verification

**File:** `api/src/middleware/authMiddleware.ts`  
**Risk:** An attacker could craft a JWT with valid claims but no valid signature and bypass auth on all endpoints.

**Before:** Token payload was decoded with `Buffer.from(base64)` — no cryptographic verification. Comment stated *"signature verification delegated to Entra ID during OBO exchange"*.

**Fix:** Installed `jsonwebtoken` + `jwks-rsa`. Token signature is now verified against Microsoft's JWKS public keys (`https://login.microsoftonline.com/common/discovery/v2.0/keys`) before any claim validation. Added a new test case for signature verification failure.

```typescript
// Before (insecure)
payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

// After (verified)
const signingKey = await getSigningKey(decoded.header.kid!);
payload = jwt.verify(token, signingKey, { algorithms: ['RS256'] });
```

Also removed the duplicate MSAL client and unused `getOboToken` function from this file (consolidated in `authService.ts`).

---

### 2. Bicep Circular Dependency — Deployment Failure

**File:** `infra/main.bicep`  
**Risk:** `az deployment` fails with `BCP080: The expression is involved in a cycle`.

**Before:** `openAi` module used `web.outputs.principalId`, and `web` module used `openAi.outputs.endpoint` — circular reference.

**Fix:** Construct the OpenAI endpoint URL from the resource name (predictable pattern `https://{name}.openai.azure.com/`) instead of referencing the module output.

```bicep
// Before (circular)
openAiEndpoint: deployOpenAi ? openAi.outputs.endpoint : openAiEndpoint

// After (no cycle)
var openAiResourceName = 'oai-${resourceToken}'
openAiEndpoint: deployOpenAi ? 'https://${openAiResourceName}.openai.azure.com/' : openAiEndpoint
```

---

## 🟠 High Issues (Fixed)

### 3. Auth Token Refresh Race Condition

**File:** `src/taskpane/services/auth/AuthContext.tsx`  
**Risk:** Multiple simultaneous API calls each triggering `getToken()` → multiple overlapping auth dialogs.

**Fix:** Added a promise-based lock (`refreshLockRef`). If a refresh is in progress, subsequent calls wait for it instead of spawning another.

---

### 4. Batch Insert — All-or-Nothing Failure

**File:** `src/taskpane/components/BatchInsertPanel.tsx`  
**Risk:** If one page export fails, the entire batch aborts and no slides are inserted.

**Fix:** Added per-page `try/catch` inside the export loop. Failures are collected and reported in a summary message while successfully exported pages are still inserted.

---

### 5. Missing Key Vault RBAC for SWA Managed Identity

**File:** `infra/modules/keyvault.bicep` (Key Vault uses `enableRbacAuthorization: true`)  
**Risk:** SWA cannot read the `entra-client-secret` from Key Vault at runtime → app fails to start.

**Fix:** Created `infra/modules/keyvault-rbac.bicep` — assigns the *Key Vault Secrets User* role (`4633458b-17de-408a-b874-0445c86b69e6`) to the SWA's managed identity. Deployed as a separate module in `main.bicep` to avoid circular dependencies.

---

## 🟡 Medium Issues (Fixed)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 6 | `authMiddleware.ts` | Duplicate MSAL singleton (also in `authService.ts`) | Removed from authMiddleware; `authService.ts` is the single source |
| 7 | `errorHandler.ts` | All errors mapped to 401 or 500; lost upstream HTTP codes | Now checks for Axios response status and preserves 403/404/429 |
| 8 | `index.tsx` | Office.js theme handler registered but never cleaned up | Added `removeHandlerAsync` in useEffect cleanup |
| 9 | `AuthContext.tsx` | `auth:expired` custom event dispatched but never listened to | Added event listener in AuthContext; triggers re-login on expiry |
| 10 | `AuthContext.tsx` | `getToken()` updated `tokenRef` but not React state | Now calls `setState` with new token and user after silent refresh |
| 11 | `AuthContext.tsx` | `atob(token.split('.')[1])` — no length validation | Added `parts.length !== 3` check before accessing payload |
| 12 | `officeInsert.ts` | `slides.items[length-1]` without empty array check | Added `if (slides.items.length === 0) throw` guard |
| 13 | `openai.bicep` | Nullable resource access in output expression | Added null-safety: `openAi != null ? ... : ''` |
| 14 | `main.bicep` / `main.parameters.json` | Unused `principalId` parameter | Removed from both files |
| 15 | `api/package.json` | `@azure/openai` and `openai` packages installed but unused | Removed via `npm uninstall` |

### Additional Medium Fixes

| # | File | Issue | Fix |
|---|------|-------|-----|
| 16 | `powerbiClient.ts` + `insightsClient.ts` | Identical axios interceptor duplicated | Extracted into shared `createApiClient.ts` |
| 17 | `deployment.md` | `npm run dev` command doesn't exist | Changed to `npm start` |
| 18 | `index.tsx` | No error handling in `Office.onReady()` | Added try/catch with user-friendly fallback HTML |

---

## 🔵 Low Issues (Not Fixed — Acceptable Risk)

| # | File | Issue | Justification |
|---|------|-------|---------------|
| L1 | `errorHandler.ts` | String matching on "authorization" is fragile | Mitigated by the new Axios status code checks |
| L2 | `powerbiService.ts` | No per-request timeout on `getExportStatus()` polling | `pollExportToCompletion()` has a 5-min outer timeout |
| L3 | `estimation.md` | `xychart-beta` diagrams may not render on GitHub | Beta Mermaid — no standard alternative |
| L4 | `README.md` | `git clone` URL has `<your-org>` placeholder | Intentional for a template repository |

---

## Files Reviewed — Clean

### Backend (11 clean / 16 total)
`authService.ts`, `openaiService.ts`, `insightPrompt.ts`, `powerbi.ts`, `openai.ts`, `insights.ts` (types), `health.ts`, `workspaces.ts`, `reports.ts`, `pages.ts`, `insights.ts` (function)

### Frontend (26 clean / 32 total)
All type files, all hooks, `App.tsx`, `WorkspaceBrowser.tsx`, `WorkspacePicker.tsx`, `ReportList.tsx`, `PageList.tsx`, `ExportPanel.tsx`, `InsertPanel.tsx`, `InsightsPanel.tsx`, `CombinedInsertPanel.tsx`, `BreadcrumbNav.tsx`, `ErrorBoundary.tsx`, `ssoAuth.ts`, `dialogAuth.ts`, `msalConfig.ts`, `useAuth.ts`, all test files and mocks

### Infrastructure (13 clean / 19 total)
`webpack.config.js`, `tsconfig.json` (both), `staticwebapp.config.json`, `azure.yaml`, `host.json`, `jest.config.js` (both), `ci.yml`, `abbreviations.json`, `monitoring.bicep`, `staticwebapp.bicep`

### Documentation (5 clean / 7 total)
`architecture.md`, `dependencies.md`, `entra-setup.md`, `estimation.md`, `plan.md`

---

## Architectural Observations

1. **Auth flow is solid** — SSO → dialog fallback → OBO exchange for Power BI and OpenAI scopes. The JWT signature verification was the only gap.
2. **Managed Identity for OpenAI is well-implemented** — `DefaultAzureCredential` with OBO-first fallback is the recommended Azure pattern.
3. **Bicep modularity is good** — separate modules for each resource, conditional deployment for OpenAI, RBAC properly scoped.
4. **Frontend separation of concerns** — clean split between API clients, hooks (React Query), and components. Fluent UI used consistently.
5. **Test coverage** — 68 tests cover auth, middleware, services, API clients, and Office.js insertion. Could benefit from component-level tests in the future.

---

## Post-Review Fixes (Integration Phase)

After the initial code review, additional issues were discovered during live integration testing with Azure services:

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| P1 | 🔴 Critical | SWA does not support `@Microsoft.KeyVault()` references; secret was literal string → AADSTS7000215 | Set `ENTRA_CLIENT_SECRET` directly as SWA app setting |
| P2 | 🟠 High | Power BI Export API: JPEG is not a valid format (returns 400) | Changed to PNG only (JPEG and PDF removed) |
| P3 | 🟠 High | Export 403: using `/reports/{id}/ExportTo` (My Workspace only) | Threaded `workspaceId` through entire export flow; use `/groups/{workspaceId}/...` |
| P4 | 🟠 High | SWA overwrites `Authorization` header with internal HS256 token | Switched to custom `X-Fabric-Storyboard-Authorization` header |
| P5 | 🟡 Medium | Azure OpenAI 404: endpoint had `/openai/v1/` suffix, code already builds path | Fixed endpoint to base URL only |
| P6 | 🟡 Medium | Missing Azure Cognitive Services `user_impersonation` scope | Added permission + admin consent |
| P7 | 🟡 Medium | SWA CLI deploy missing `--api-language node --api-version 18` | Added flags to deploy command |
