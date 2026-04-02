targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@description('Entra ID Client ID')
param entraClientId string = ''

@description('Entra ID Tenant ID')
param entraTenantId string = ''

@secure()
@description('Entra ID Client Secret')
param entraClientSecret string = ''

@description('Azure OpenAI endpoint')
param openAiEndpoint string = ''

@description('Azure OpenAI deployment name')
param openAiDeployment string = 'gpt-4o'

@description('Deploy a new Azure OpenAI resource (false = reference existing)')
param deployOpenAi bool = false

var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var tags = { 'azd-env-name': environmentName, project: 'OfficeAddin', environment: environmentName }
var swaName = '${abbrs.webStaticSites}${resourceToken}'
var openAiResourceName = 'oai-${resourceToken}'

var rgName = 'rg-fabricaddin-${resourceToken}'

resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: rgName
  location: location
  tags: tags
}

module keyVault './modules/keyvault.bicep' = {
  name: 'keyvault'
  scope: rg
  params: {
    name: '${abbrs.keyVaultVaults}${resourceToken}'
    location: location
    tags: tags
    entraClientSecret: entraClientSecret
  }
}

module monitoring './modules/monitoring.bicep' = {
  name: 'monitoring'
  scope: rg
  params: {
    name: '${abbrs.insightsComponents}${resourceToken}'
    location: location
    tags: tags
  }
}

module openAi './modules/openai.bicep' = if (deployOpenAi) {
  name: 'openai'
  scope: rg
  params: {
    name: openAiResourceName
    location: location
    tags: tags
    deploymentName: openAiDeployment
    swaPrincipalId: web.outputs.principalId
  }
}

module web './modules/staticwebapp.bicep' = {
  name: 'staticwebapp'
  scope: rg
  params: {
    name: swaName
    location: location
    tags: union(tags, { 'azd-service-name': 'web' })
    appInsightsConnectionString: monitoring.outputs.connectionString
    entraClientId: entraClientId
    entraTenantId: entraTenantId
    keyVaultName: keyVault.outputs.name
    openAiEndpoint: deployOpenAi ? 'https://${openAiResourceName}.openai.azure.com/' : openAiEndpoint
    openAiDeployment: openAiDeployment
  }
}

module kvRbac './modules/keyvault-rbac.bicep' = {
  name: 'keyvault-rbac'
  scope: rg
  params: {
    keyVaultName: keyVault.outputs.name
    principalId: web.outputs.principalId
  }
}

output AZURE_STATIC_WEB_APP_NAME string = web.outputs.name
output AZURE_STATIC_WEB_APP_URL string = web.outputs.url
output AZURE_KEY_VAULT_NAME string = keyVault.outputs.name
output AZURE_APP_INSIGHTS_NAME string = monitoring.outputs.name
output AZURE_RESOURCE_GROUP string = rgName
// azd service-to-resource mapping
output SERVICE_WEB_RESOURCE_NAME string = web.outputs.name
