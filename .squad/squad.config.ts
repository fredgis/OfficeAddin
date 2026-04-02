import { defineSquad, defineTeam, defineAgent } from '@bradygaster/squad-sdk';

export default defineSquad({
  team: defineTeam({
    name: 'Fabric Add-in Squad',
    members: ['@lead', '@frontend', '@backend', '@auth', '@ai', '@infra', '@tester', '@scribe']
  }),
  agents: [
    defineAgent({ name: 'lead', role: 'Tech Lead & Architect', model: 'claude-sonnet-4' }),
    defineAgent({ name: 'frontend', role: 'React + Office.js + Fluent UI Specialist', model: 'claude-sonnet-4' }),
    defineAgent({ name: 'backend', role: 'Azure Functions + Power BI API Specialist', model: 'claude-sonnet-4' }),
    defineAgent({ name: 'auth', role: 'Entra ID + MSAL + SSO/OBO Specialist', model: 'claude-sonnet-4' }),
    defineAgent({ name: 'ai', role: 'Azure OpenAI + Prompt Engineering Specialist', model: 'claude-sonnet-4' }),
    defineAgent({ name: 'infra', role: 'Bicep + azd + CI/CD Specialist', model: 'claude-haiku-4.5' }),
    defineAgent({ name: 'tester', role: 'Jest + RTL + Integration Testing Specialist', model: 'claude-haiku-4.5' }),
    defineAgent({ name: 'scribe', role: 'Documentation & Decision Logger', model: 'claude-haiku-4.5' }),
  ],
});
