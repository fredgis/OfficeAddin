param name string
param location string
param tags object = {}
param appInsightsConnectionString string = ''
param entraClientId string = ''
param entraTenantId string = ''

@secure()
@description('Entra client secret value (SWA does not support Key Vault references)')
param entraClientSecret string = ''

param openAiEndpoint string = ''
param openAiDeployment string = 'gpt-4o'

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    allowConfigFileUpdates: true
    stagingEnvironmentPolicy: 'Enabled'
  }
}

resource appSettings 'Microsoft.Web/staticSites/config@2023-12-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    ENTRA_CLIENT_ID: entraClientId
    ENTRA_TENANT_ID: entraTenantId
    ENTRA_CLIENT_SECRET: entraClientSecret
    AZURE_OPENAI_ENDPOINT: openAiEndpoint
    AZURE_OPENAI_DEPLOYMENT: openAiDeployment
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsightsConnectionString
  }
}

output name string = staticWebApp.name
output url string = 'https://${staticWebApp.properties.defaultHostname}'
output principalId string = staticWebApp.identity.principalId
