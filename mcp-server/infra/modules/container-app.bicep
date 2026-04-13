// Container App running the MCP server
@description('Name of the container app')
param name string

@description('Location for the resource')
param location string

@description('Tags for the resource')
param tags object = {}

@description('Name of the Container Apps Environment')
param containerAppsEnvironmentName string

@description('Name of the Container Registry')
param containerRegistryName string

@description('Resource ID of the Container Registry (for role assignment)')
param containerRegistryId string

@description('Port the container listens on')
param targetPort int = 3000

@description('Container image to deploy (defaults to hello-world for initial provisioning)')
param imageName string = ''

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' existing = {
  name: containerAppsEnvironmentName
}

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' existing = {
  name: containerRegistryName
}

var defaultImage = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
var containerImage = !empty(imageName) ? imageName : defaultImage
var usePrivateRegistry = !empty(imageName)

// AcrPull role definition ID
var acrPullRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')

resource app 'Microsoft.App/containerApps@2024-03-01' = {
  name: name
  location: location
  tags: union(tags, { 'azd-service-name': 'mcp' })
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: targetPort
        transport: 'http'
        allowInsecure: false
      }
      registries: usePrivateRegistry ? [
        {
          server: containerRegistry.properties.loginServer
          identity: 'system'
        }
      ] : []
    }
    template: {
      containers: [
        {
          name: 'mcp'
          image: containerImage
          env: [
            { name: 'PORT', value: string(targetPort) }
            { name: 'NODE_ENV', value: 'production' }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
        rules: [
          {
            name: 'http-scale'
            http: { metadata: { concurrentRequests: '50' } }
          }
        ]
      }
    }
  }
}

// Grant the Container App's managed identity AcrPull access to the registry
resource acrPullAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerRegistryId, app.id, acrPullRoleId)
  scope: containerRegistry
  properties: {
    principalId: app.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: acrPullRoleId
  }
}

output uri string = 'https://${app.properties.configuration.ingress.fqdn}'
output name string = app.name
