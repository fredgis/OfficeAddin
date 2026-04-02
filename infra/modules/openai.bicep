@description('Name of the Azure OpenAI resource')
param name string

@description('Location for the resource')
param location string

@description('Resource tags')
param tags object = {}

@description('Name of the GPT-4o model deployment')
param deploymentName string = 'gpt-4o'

@description('SKU name for the OpenAI resource')
param skuName string = 'S0'

@description('Capacity for the model deployment (thousands of tokens per minute)')
param deploymentCapacity int = 30

@description('Set to true to reference an existing Azure OpenAI resource instead of creating one')
param useExisting bool = false

@description('Resource ID of an existing Azure OpenAI resource (required when useExisting is true)')
param existingOpenAiResourceId string = ''

resource openAi 'Microsoft.CognitiveServices/accounts@2024-04-01-preview' = if (!useExisting) {
  name: name
  location: location
  tags: tags
  kind: 'OpenAI'
  sku: {
    name: skuName
  }
  properties: {
    customSubDomainName: name
    publicNetworkAccess: 'Enabled'
  }
}

resource gpt4oDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-04-01-preview' = if (!useExisting) {
  parent: openAi
  name: deploymentName
  sku: {
    name: 'Standard'
    capacity: deploymentCapacity
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4o'
      version: '2024-08-06'
    }
  }
}

output endpoint string = !useExisting ? openAi.properties.endpoint : ''
output name string = !useExisting ? openAi.name : ''
output id string = !useExisting ? openAi.id : existingOpenAiResourceId
