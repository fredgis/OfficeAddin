---
marp: true
theme: default
paginate: true
backgroundColor: #ffffff
color: #1a1a2e
style: |
  section {
    font-family: 'Segoe UI', system-ui, sans-serif;
  }
  section.title {
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    background: linear-gradient(135deg, #0078d4 0%, #5c2d91 100%);
    color: white;
  }
  section.title h1 { font-size: 2.4em; margin-bottom: 0.2em; }
  section.title h2 { font-size: 1.2em; font-weight: 300; opacity: 0.9; }
  section.section-break {
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    background: linear-gradient(135deg, #0078d4 0%, #00bcf2 100%);
    color: white;
  }
  section.section-break h1 { font-size: 2.2em; }
  section.section-break h2 { font-weight: 300; opacity: 0.85; }
  section.dark {
    background: #1a1a2e;
    color: #eaeaea;
  }
  section.dark h1, section.dark h2, section.dark h3 { color: #00bcf2; }
  section.accent {
    background: linear-gradient(135deg, #5c2d91 0%, #b4009e 100%);
    color: white;
  }
  section.accent h1 { color: white; }
  section.green {
    background: linear-gradient(135deg, #107c10 0%, #00b294 100%);
    color: white;
  }
  section.green h1 { color: white; }
  h1 { color: #0078d4; font-size: 1.6em; }
  h2 { color: #5c2d91; font-size: 1.1em; }
  table { font-size: 0.72em; }
  th { background: #0078d4; color: white; }
  strong { color: #0078d4; }
  em { color: #5c2d91; }
  code { background: #f0f0f0; color: #d63384; font-size: 0.85em; }
  blockquote { border-left: 4px solid #0078d4; padding-left: 1em; font-style: italic; color: #555; }
  img { border-radius: 8px; }
  .columns { display: flex; gap: 2em; }
  .col { flex: 1; }
---

<!-- _class: title -->

# Fabric Storyboard Copilot

## De 43 jours-homme à 13 heures avec l'IA
### Comment les agents AI transforment le développement logiciel

---

<!-- _class: title -->

# 🎯 Partie 1
## Le Projet

---

# Fabric Storyboard Copilot

Un **add-in PowerPoint** qui intègre Microsoft Fabric & Power BI

<div class="columns">
<div class="col">

### Fonctionnalités
- 🔐 Authentification Entra ID (SSO + OBO)
- 📊 Navigation workspaces & rapports
- 📸 Export de pages en PNG
- 🖼️ Insertion dans les slides via Office.js
- 🧠 Insights IA avec GPT-4o Vision
- ✨ One-click : image + insights

</div>
<div class="col">

### Stack technique
- **Frontend** : React + Fluent UI v9
- **Backend** : Azure Functions (Node.js)
- **Hosting** : Azure Static Web Apps
- **AI** : Azure OpenAI (GPT-4o Vision)
- **Auth** : MSAL.js + Entra ID

</div>
</div>

---

# L'interface en action

![w:950 center](images/IMG3.png)

*Navigation workspaces, export PNG, prévisualisation, layouts et insights IA*

---

# Insert Page with Insights

![w:950 center](images/IMG1.png)

*Résultat : graphique (60%) + insights IA générés par GPT-4o Vision (40%)*

---

# Architecture

```
┌─────────────────────────────────────────────────────────┐
│  PowerPoint (Desktop / Web)                             │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Taskpane (React + Fluent UI v9)                   │ │
│  │  Auth ─ Browse ─ Export ─ Insert ─ AI Insights     │ │
│  └──────────────────┬─────────────────────────────────┘ │
└─────────────────────┼───────────────────────────────────┘
                      │ HTTPS + X-Fabric-Storyboard-Authorization
┌─────────────────────┼───────────────────────────────────┐
│  Azure Static Web Apps                                  │
│  ┌──────────────────┴─────────────────────────────────┐ │
│  │  Azure Functions API (Node.js)                     │ │
│  │  /workspaces  /reports  /pages  /export  /insights │ │
│  │  Auth Middleware (JWT + JWKS + OBO)                 │ │
│  └──┬──────────┬──────────┬───────────────────────────┘ │
└─────┼──────────┼──────────┼─────────────────────────────┘
      │          │          │
  Entra ID   Power BI   Azure OpenAI
             REST API    GPT-4o Vision
```

---

<!-- _class: section-break -->

# 🏗️ Partie 2
## Comment nous l'avons construit
### De l'estimation à la livraison avec Squad & Copilot CLI

---

# Le défi initial : estimation classique

Un projet estimé à **43 jours-homme** en développement manuel

| Phase | Effort manuel |
|-------|:---:|
| Scaffolding | 3 jours |
| Authentification (Entra ID) | 5 jours |
| Navigation workspaces | 5 jours |
| Export Power BI | 4 jours |
| Insertion Office.js | 4 jours |
| AI Insights | 5 jours |
| UI Polish | 4 jours |
| Infrastructure (Bicep, CI/CD) | 5 jours |
| Testing | 5 jours |
| Documentation | 3 jours |
| **Total** | **43 jours** |

---

# Qu'est-ce que Squad ?

> *"All of us are going to be managers of infinite minds."*
> — Satya Nadella, Davos 2026

**Squad** est un framework d'équipe d'agents IA spécialisés

<div class="columns">
<div class="col">

### Ce que c'est
- ✅ Votre **équipe IA** avec des rôles définis
- ✅ Agents avec charter, mémoire et expertise
- ✅ Exécution **parallèle** coordonnée
- ✅ Connaissance persistante entre sessions

</div>
<div class="col">

### Ce que ce n'est pas
- ❌ Pas un remplacement humain
- ❌ Pas de la magie
- ❌ Pas un générateur de contenu brut
- ❌ Pas un pipeline CI/CD

</div>
</div>

*Squad suit des règles. Si quelque chose n'est pas clair, il s'arrête et demande.*

---

# Notre Squad : 8 agents spécialisés

```
                    🏗️ Lead (Claude Sonnet 4)
                   Architecture, routing, code reviews
                  /    |    |    |    |    \
                 /     |    |    |    |     \
    ⚛️ Frontend  🔧 Backend  🔐 Auth  🧠 AI  🚀 Infra  🧪 Tester
    Sonnet 4     Sonnet 4   Sonnet 4  Sonnet 4  Haiku 4.5  Haiku 4.5

                    📋 Scribe (Claude Haiku 4.5)
                    Logs everything, docs en continu
```

### Modèles LLM distincts par rôle

| Rôle | Modèle | Justification |
|------|--------|---------------|
| Lead, Frontend, Backend, Auth, AI | **Claude Sonnet 4** | Raisonnement complexe, code quality |
| Infra, Tester, Scribe | **Claude Haiku 4.5** | Tâches structurées, coût optimisé |
| Coordinateur | **Claude Opus 4.6** | Orchestration, décisions stratégiques |

---

# Squad ↔ Phases : exécution parallèle

| Phase | Agents mobilisés | Parallélisme |
|-------|-----------------|:---:|
| P1 — Scaffolding | 🏗️ Lead + ⚛️ Frontend + 🔧 Backend | ✅ |
| P2 — Auth | 🔐 Auth + 🔧 Backend | ✅ |
| P3 — Browse | ⚛️ Frontend + 🔧 Backend | ✅ |
| P4 — Export | ⚛️ Frontend + 🔧 Backend | ✅ |
| P5 — Insert | ⚛️ Frontend | — |
| P6 — AI | 🧠 AI + ⚛️ Frontend | ✅ |
| P7 — Polish | ⚛️ Frontend + 🏗️ Lead | ✅ |
| P8 — Infra | 🚀 Infra *(en parallèle dès P1)* | ✅ |
| P9 — Testing | 🧪 Tester + 🏗️ Lead | ✅ |
| P10 — Docs | 📋 Scribe + 🏗️ Lead | ✅ |

> L'infrastructure (P8) s'exécute **en parallèle** avec les phases 2-7

---

# Timeline v0.1 : scaffold en 1h17

| Milestone | Temps écoulé |
|-----------|:---:|
| Init projet (plan, dépendances, Squad setup) | 0h |
| Spec finalisée, exécution commence | +0h |
| Phases 1-3 (scaffolding, auth, browsing) | **+17 min** |
| Phases 4-5 + tests (export, insert, 62/62 pass) | **+30 min** |
| Phase 6 (AI insights) | **+30 min** |
| Phase 7 (UI polish, a11y) | **+1h08** |
| Phase 8 (infra) — en parallèle | — |
| Documentation | **+1h17** |
| **v0.1 scaffold complet** | **~1h17** |

> 57 fichiers TypeScript, 5K+ lignes, 62 tests — en **moins de 80 minutes**

---

# Post-v0.1 : l'intégration réelle

Le scaffold est **~90% correct** mais les 10% restants nécessitent du debugging avec les vrais services cloud

| Problème | Cause racine | Temps |
|----------|-------------|:---:|
| SWA Key Vault | SWA ne supporte pas `@Microsoft.KeyVault()` | ~1h |
| Export 400 | JPEG invalide pour Power BI ExportToFile | ~30min |
| Export 403 | Mauvais endpoint (My Workspace vs groups) | ~1h |
| Header auth | SWA écrase `Authorization` → custom header | ~1h |
| Token JWT | Vérification JWKS avec `jsonwebtoken` | ~1h |
| OpenAI 404 | Double path `/openai/v1/` | ~15min |
| Consent Entra | Scope `user_impersonation` manquant | ~30min |
| **Total intégration** | | **~7.5h** |

---

# v1 : features & polish avec Copilot CLI

| Feature | Description | Temps |
|---------|------------|:---:|
| GPT-4o Vision | Analyse de l'image exportée pour des insights visuels | ~1.5h |
| Combined Insert | Fix GeneralException, goToByIdAsync dans PPT Online | ~2h |
| UI Polish | Headers colorés, cards, icônes, layout | ~1h |
| **Total v1 features** | | **~4.5h** |

### Codebase finale v1

| Métrique | Valeur |
|----------|--------|
| Fichiers TypeScript | **57** |
| Lignes de code TypeScript | **~5 351** |
| Tests passants | **68/68** (23 frontend + 45 backend) |
| Phases complétées | **10/10** |
| Déployé sur | Azure Static Web Apps |

---

<!-- _class: dark -->

# 📊 Le résultat : 43 jours → 13.3 heures

### Décomposition de l'effort réel

| Phase | Durée | Outil |
|-------|:---:|-------|
| 🟢 v0.1 scaffold (Squad) | **1.3h** | Squad (8 agents parallèles) |
| 🔴 Intégration & debugging | **7.5h** | GitHub Copilot CLI |
| 🔵 v1 features & polish | **4.5h** | GitHub Copilot CLI |
| **Total** | **13.3h** | |

### Comparaison des stratégies

| Stratégie | Effort | Accélération |
|-----------|:---:|:---:|
| 🔴 Développement manuel | 43 jours | — |
| 🟡 Copilot agents individuels | ~27 jours | **37%** de réduction |
| 🔵 Squad (planifié) | ~14 jours | **67%** de réduction |
| 🟢 **Squad + Copilot CLI (réel)** | **1.66 jours** | **~26x plus rapide** |

---

# Comparaison par phase

| Phase | Manuel | Agents individuels | Squad | Gain Squad |
|-------|:---:|:---:|:---:|:---:|
| Scaffolding | 3 | 1.8 | 1.2 | 60% |
| Auth | 5 | 3.5 | 2.0 | 60% |
| Browsing | 5 | 3.0 | 1.5 | 70% |
| Export | 4 | 2.8 | 1.5 | 63% |
| Insert | 4 | 2.4 | 1.2 | 70% |
| AI Insights | 5 | 3.5 | 1.5 | 70% |
| Polish | 4 | 3.0 | 1.5 | 63% |
| Infrastructure | 5 | 2.5 | 1.5 | 70% |
| Testing | 5 | 3.0 | 1.5 | 70% |
| Documentation | 3 | 2.0 | 0.5 | 83% |
| **Total** | **43** | **~27** | **~14** | **~67%** |

> Et le réel ? **1.66 jours** au lieu de 14 planifiés — **~8.5x** plus rapide que l'estimation Squad

---

<!-- _class: accent -->

# 💡 Key Learning

### Le scaffold agent est ~90% correct
### Les 10% restants — auth, API formats, quirks cloud — nécessitent du debugging itératif

### Effort total : zero → v1 déployée = **~13.3 heures**
### Estimation manuelle : **43 jours-homme**
### Accélération réelle : **~26x**

---

<!-- _class: section-break -->

# 🛠️ Partie 3
## L'écosystème d'outils
### Copilot CLI, Squad, Agent Store, Speckit

---

# Copilot CLI : la fondation

**GitHub Copilot CLI** est l'interface terminal vers Copilot — la couche plateforme

<div class="columns">
<div class="col">

### Capacités
- Édite le code directement (create, edit, view)
- Lance builds, tests, déploiements
- Gère git (commit, push, branch)
- Déploie sur Azure via SWA CLI
- Debug itératif : lit les erreurs → fix → retest

</div>
<div class="col">

### Sur ce projet
- **Modèle** : Claude Opus 4.6
- **Rôle** : Tout le post-v0.1
- Intégration debugging (7.5h)
- GPT-4o Vision integration
- UI polish itérations
- Office.js fixes
- Déploiement production

</div>
</div>

> Copilot CLI est la fondation. Squad s'exécute **par-dessus** Copilot CLI.

---

# Copilot CLI + Squad : complémentaires

> *"People often assume they're competing tools. They're not."*
> — Dina Berry, Squad for Content

```
┌──────────────────────────────────────────┐
│  Squad                                   │
│  Équipe d'agents spécialisés             │
│  Routing, mémoire, coordination          │
│  ┌────────────────────────────────────┐  │
│  │  GitHub Copilot CLI                │  │
│  │  Auth, context, model access       │  │
│  │  Tool execution, integrations      │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

| | Copilot CLI | Squad |
|---|---|---|
| **Nature** | Plateforme / Runtime | Framework d'orchestration |
| **Agents** | Un seul agent | Équipe de spécialistes |
| **Mémoire** | Session unique | Persistante (`decisions.md`, `history.md`) |
| **Coordination** | Manuelle | Automatique (Lead route les tâches) |

---

# Fleet vs Squad : quand utiliser quoi ?

| Critère | Copilot Fleet | Squad |
|---------|:---:|:---:|
| **Nombre d'agents** | Multiples, ad-hoc | Équipe structurée et persistante |
| **Contexte partagé** | ❌ Reset entre sessions | ✅ `decisions.md` partagé |
| **Spécialisation** | Généralistes | Charters par domaine |
| **Parallélisme** | Un agent à la fois | Coordinateur lance en parallèle |
| **Knowledge compounding** | Repart de zéro | S'améliore avec le temps |
| **Coordination** | Vous êtes le coordinateur | Le Lead route automatiquement |
| **Documentation** | Afterthought | Scribe documente en continu |

### Pourquoi nous avons choisi Squad

✅ Projet multi-domaine (Auth + Power BI + Office.js + AI + Infra)
✅ Besoin de parallélisme réel (Frontend + Backend + Infra simultanés)
✅ Spécialisations profondes nécessaires par domaine

---

# Agent vs Skill dans Squad

<div class="columns">
<div class="col">

### 🤖 Agent (10%) — Acteur
- Charter et expertise domaine
- Prend des décisions
- Utilise tous les outils disponibles
- Travaille jusqu'à complétion
- **Quand ?** Expertise + analyse + décisions

</div>
<div class="col">

### ⚙️ Skill (90%) — Action
- Liste d'étapes à exécuter
- Tout agent peut l'utiliser
- Scope limité et défini
- Réutilisable et améliorable
- **Quand ?** Tâches répétitives et structurées

</div>
</div>

> **Routing** : le coordinateur scanne **toutes les skills** avant de spawner un agent
> Les skills pertinentes sont injectées dans le contexte de l'agent
> Pas de skill pertinente ? L'agent travaille normalement

---

# Speckit : l'approche orientée spécification

Le vrai changement de paradigme : **passer du code-first au spec-first**

<div class="columns">
<div class="col">

### Approche traditionnelle
1. Réunion de cadrage
2. Rédaction de specs (jours/semaines)
3. Développement (semaines/mois)
4. Tests
5. Déploiement

</div>
<div class="col">

### Approche Speckit
1. **Écrire la spec** (markdown structuré)
2. **L'agent génère** le code complet
3. Debug & intégration
4. Déployé ✅

</div>
</div>

> Avec Speckit, la **spécification EST le livrable principal**
> Le code devient un **artefact dérivé** de la spec
> La valeur humaine se concentre sur le **quoi**, pas le **comment**

---

# Scaling Squad : une progression de confiance

> *"Autonomy is not a switch — it's a progression."* — Tamir Dresher

| Niveau | Mode | Description |
|:---:|------|-------------|
| 1️⃣ | **Observer** | Squad en lecture seule — comprendre les patterns |
| 2️⃣ | **Assister** | Squad rédige, l'humain décide (PRs, analyses) |
| 3️⃣ | **Agir** | Squad exécute des tâches scoped, gardé par les règles du repo |
| 4️⃣ | **Coordonner** | Squad gère les workflows (PRs ↔ issues, routing) |
| 5️⃣ | **Autonomiser** | L'humain définit l'intention, Squad exécute end-to-end |

> Chaque étape augmente la **confiance**, pas le **risque**
> On ne commence pas par l'autonomie. **On la mérite.**

---

# Agent Store : la marketplace

L'**Agent Store** est la marketplace où l'on trouve et publie des agents spécialisés

<div class="columns">
<div class="col">

### Concept
- Agents pré-packagés par domaine
- Prêts à intégrer dans Squad ou Fleet
- Configurables avec des skills
- Marketplace communautaire

</div>
<div class="col">

### Exemples d'agents
- 🔐 Agent Auth (Entra ID, OAuth)
- 📊 Agent Power BI (REST API, DAX)
- 🎨 Agent Fluent UI (composants React)
- 🚀 Agent Azure Deploy (Bicep, SWA)
- 🧪 Agent Testing (Jest, mocks)

</div>
</div>

> **Chaque agent du Store a son modèle LLM optimal**
> Un agent de test n'a pas besoin d'Opus — Haiku suffit
> Un agent d'architecture a besoin de raisonnement profond → Sonnet/Opus

---

<!-- _class: section-break -->

# 💰 Partie 4
## Le modèle de coût
### Premium Requests et optimisation

---

# Premium Requests : le nouveau coût

Chaque interaction avec un agent consomme des **premium requests**

| Modèle | Coût relatif | Usage optimal |
|--------|:---:|------|
| Claude Haiku 4.5 | **1x** | Tâches simples, structurées, scripting |
| GPT-4.1 | **1x** | Tâches rapides, formatting |
| Claude Sonnet 4 | **2-3x** | Code complexe, raisonnement, review |
| Claude Opus 4.6 | **5-10x** | Orchestration, architecture, décisions |

### Sur notre projet (estimation)

| Ressource | Détail |
|-----------|--------|
| Coordinateur (Opus) | ~20-30 requests |
| Agents Sonnet (5 agents) | ~40-60 requests |
| Agents Haiku (3 agents) | ~20-30 requests |
| **Total estimé** | **~80-120 premium requests** |

---

# Optimisation : le bon modèle au bon endroit

```
                    Opus 4.6 ⭐ (5-10x)
                    Coordinateur / Architecte
                    Décisions stratégiques
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         Sonnet 4     Sonnet 4   Sonnet 4
         (2-3x)       (2-3x)     (2-3x)
         Frontend     Backend      Auth
         Code         API          Sécurité
              │          │          │
              ▼          ▼          ▼
         Haiku 4.5   Haiku 4.5  Haiku 4.5
          (1x)        (1x)       (1x)
          Tests       Infra       Docs
```

> **Principe** : utiliser le modèle le plus économique capable de faire le travail
> Notre Squad : **3 tiers de modèles** pour optimiser coût vs qualité

---

# Coût projet : agents vs humains

### Fabric Storyboard Copilot — comparaison

| | Développement manuel | Avec agents |
|---|:---:|:---:|
| **Effort** | 43 jours-homme | 13.3 heures |
| **Coût humain** (600€/jour) | **25 800€** | **~1 000€** (2 jours) |
| **Coût agents** | 0€ | **~50-100€** (premium requests) |
| **Coût Azure** (mensuel) | ~70€/mois | ~70€/mois |
| **Total première année** | **~26 640€** | **~1 940€** |
| **Délai** | ~9 semaines | **~2 jours** |

> **Économie** : ~25 000€ et 8.5 semaines sur un seul projet
> Le coût des agents est **négligeable** par rapport au coût humain

---

<!-- _class: section-break -->

# 🏢 Partie 5
## Transformation des ESN
### Du monde des jours-homme au monde des agents

---

<!-- _class: dark -->

# Le monde d'hier

### Le modèle ESN traditionnel

```
  Client                        ESN
    │                            │
    │  "J'ai besoin d'un        │
    │   add-in PowerPoint"      │
    │ ─────────────────────────► │
    │                            │  Estimation : 43 jours-homme
    │  Devis : 43 × 600€        │  Équipe : 2-3 développeurs
    │  = 25 800€                 │  Durée : 6-9 semaines
    │ ◄───────────────────────── │
    │                            │
    │  Livraison dans 2 mois    │  Marge : ~30% = 7 740€
    │ ◄───────────────────────── │
```

### Le problème
- 💰 **Revenu = jours × tarif** — plafonné par les heures humaines
- 📈 Marge limitée à **25-35%**
- ⏰ Délais longs = risque de scope creep

---

# Le monde de demain

### Le nouveau modèle : jours-homme + heures d'agents

```
  Client                        ESN
    │                            │
    │  "J'ai besoin d'un        │
    │   add-in PowerPoint"      │
    │ ─────────────────────────► │
    │                            │  Agents : 13h + 2 jours humain
    │  Devis : 15 000€           │  (supervision, validation, UX)
    │  (valeur livrée, pas       │
    │   heures facturées)        │  Coût réel : ~1 100€
    │ ◄───────────────────────── │
    │                            │
    │  Livraison dans 1 semaine │  Marge : ~93% = 13 900€
    │ ◄───────────────────────── │
```

### Le changement
- 💰 **Revenu = valeur livrée**, pas heures facturées
- 📈 Marge peut atteindre **70-90%**
- ⚡ Délais réduits = **avantage compétitif**

---

# L'impact sur les marges

| Scénario | CA | Coût interne | Marge | Taux |
|----------|:---:|:---:|:---:|:---:|
| **Ancien modèle** (43 j/h) | 25 800€ | 18 060€ | 7 740€ | **30%** |
| **Nouveau modèle** (valeur) | 15 000€ | 1 100€ | 13 900€ | **93%** |
| **Nouveau + volume** (×10 projets) | 150 000€ | 11 000€ | 139 000€ | **93%** |

### Le paradoxe gagnant-gagnant

| | Client | ESN |
|---|---|---|
| **Prix** | 15 000€ au lieu de 25 800€ | ✅ **-42%** |
| **Délai** | 1 semaine au lieu de 9 | ✅ **-89%** |
| **Marge** | — | 13 900€ au lieu de 7 740€ | ✅ **+80%** |

> Le client paye **moins** et reçoit **plus vite**
> L'ESN gagne **plus** avec **moins de risque**

---

# Le nouveau modèle de vente

### De la vente de jours-homme à la vente de solutions

<div class="columns">
<div class="col">

### 🔴 Hier
- Vente de **temps** (TJM)
- Équipes dédiées sur site
- Revenus linéaires
- Marge plafonnée
- Difficulté à scaler

</div>
<div class="col">

### 🟢 Demain
- Vente de **résultats**
- Squads IA + supervision humaine
- Revenus exponentiels
- Marges élevées
- Scale quasi-infini

</div>
</div>

### La chaîne d'outils

```
Speckit (spec) → Squad / Fleet (dev) → Agent Store (composants) → Copilot CLI (exécution)
```

> La **spécification** devient le livrable client
> Le **code** est généré par les agents
> L'**humain** supervise, valide et apporte l'expertise métier

---

# Les nouvelles compétences ESN

### Ce qui disparaît vs ce qui émerge

| Compétence en déclin | Compétence émergente |
|---|---|
| Codage manuel ligne par ligne | **Prompt engineering** et rédaction de specs |
| Estimation en jours-homme | **Estimation en valeur livrée** |
| Gestion d'équipe on-site | **Gestion de Squad** (agents + humains) |
| Expertise technique pointue | **Expertise domaine métier** |
| Revue de code manuelle | **Supervision et validation d'output** |
| Documentation post-delivery | **Spécifications as code** (Speckit) |

### Les 3 profils clés de demain

1. 🎯 **Squad Manager** — orchestre les agents, définit les specs, valide les outputs
2. 🧠 **Domain Expert** — apporte l'expertise métier que les agents n'ont pas
3. 🔧 **Integration Engineer** — connecte les agents aux vrais services cloud

---

<!-- _class: dark -->

# La réalité du terrain

### Ce que nous avons appris sur ce projet

| Étape | Qui fait quoi |
|-------|------|
| **Spécification** | 🧑 Humain définit les besoins (plan détaillé en markdown) |
| **Scaffolding** | 🤖 Squad génère 90% du code en 1.3h |
| **Intégration** | 🧑+🤖 Copilot CLI debug les 10% restants (7.5h) |
| **Polish** | 🧑+🤖 Copilot CLI itère sur le design et les features (4.5h) |
| **Validation** | 🧑 Humain teste dans PowerPoint, valide le résultat |
| **Déploiement** | 🤖 Copilot CLI déploie sur Azure SWA |

> L'humain passe de **développeur** à **superviseur et validateur**
> Le temps humain réel : **~4 heures** de supervision active
> Le reste est fait par les agents

---

# Microsoft Fabric IQ : le contexte business

> *Fabric IQ crée une fondation sémantique pour alimenter votre business et l'IA*

<div class="columns">
<div class="col">

### Ce que Fabric IQ apporte
- Unifie la sémantique business
- Insights temps-réel contextualisés
- Alimente les agents IA dans Foundry
- Exploite les modèles Power BI existants

</div>
<div class="col">

### Pourquoi c'est pertinent
- Notre add-in **connecte** PPT à Fabric
- Les insights IA utilisent le **contexte business**
- Fabric IQ + Foundry = agents qui **comprennent** les données
- Pattern réplicable pour tout client Fabric

</div>
</div>

> **Fabric Storyboard Copilot** est un exemple concret d'application Fabric IQ
> Construit en 13h par des agents — prêt pour la démo client

---

<!-- _class: green -->

# 🚀 Conclusion

### Le développement logiciel est en train de changer fondamentalement

---

# Ce que nous avons démontré

<div class="columns">
<div class="col">

### 📊 Les chiffres
- **43 jours** → **13.3 heures**
- **26x** plus rapide
- **57 fichiers**, **5 351 lignes**
- **68 tests** passants
- **8 agents** IA spécialisés
- **~100** premium requests

</div>
<div class="col">

### 🎯 Les insights
- Le scaffold est **~90% correct**
- L'intégration cloud reste **le vrai défi**
- Copilot CLI + Squad sont **complémentaires**
- Le bon modèle au bon endroit = **coût optimisé**
- La spec-first approach (Speckit) est **l'avenir**

</div>
</div>

### La chaîne complète

```
Speckit ──► Squad (scaffold) ──► Copilot CLI (intégration) ──► Agent Store (composants) ──► Production
  spec          ~10% du temps         ~60% du temps              réutilisable               déployé
```

---

<!-- _class: title -->

# Merci

## De 43 jours-homme à 13 heures
### La transformation est déjà là

**Fabric Storyboard Copilot** — github.com/fredgis/OfficeAddin

🛠️ GitHub Copilot CLI · Squad · Agent Store · Speckit

