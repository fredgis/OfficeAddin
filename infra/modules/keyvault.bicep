param name string
param location string
param tags object = {}

@secure()
param entraClientSecret string = ''
@secure()
param openAiApiKey string = ''

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: { family: 'A', name: 'standard' }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
  }
}

resource entraSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(entraClientSecret)) {
  parent: keyVault
  name: 'entra-client-secret'
  properties: {
    value: entraClientSecret
  }
}

resource openAiSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(openAiApiKey)) {
  parent: keyVault
  name: 'openai-api-key'
  properties: {
    value: openAiApiKey
  }
}

output name string = keyVault.name
output endpoint string = keyVault.properties.vaultUri
