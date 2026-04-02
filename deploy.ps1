<#
.SYNOPSIS
    One-click deployment for Fabric Storyboard Copilot.
.DESCRIPTION
    Automates the complete deployment pipeline:
      1. Validates prerequisites (Node.js, npm, az CLI, azd)
      2. Authenticates with Azure
      3. Creates or reuses an Entra ID app registration
      4. Installs dependencies, builds, and tests
      5. Provisions Azure infrastructure via Bicep (azd)
      6. Deploys the application to Azure Static Web Apps
      7. Generates the production Office Add-in manifest
      8. Configures local development settings
.PARAMETER EnvironmentName
    Azure environment name (e.g., dev, staging, prod). Determines resource group name.
.PARAMETER Location
    Azure region (e.g., eastus2, westeurope). Default: eastus2.
.PARAMETER EntraClientId
    Existing Entra ID Application (client) ID. If omitted, a new app is registered.
.PARAMETER EntraClientSecret
    Existing Entra client secret. If omitted and a new app is created, one is generated.
.PARAMETER OpenAiEndpoint
    Existing Azure OpenAI endpoint URL. If omitted, a new resource is deployed.
.PARAMETER OpenAiDeployment
    Azure OpenAI model deployment name. Default: gpt-4o.
.PARAMETER SkipTests
    Skip running the test suite before deployment.
.PARAMETER SkipBuild
    Skip the build step (assume already built).
.EXAMPLE
    # Full interactive deployment (prompts for all values):
    .\deploy.ps1

    # Non-interactive with existing Entra app and OpenAI:
    .\deploy.ps1 -EnvironmentName prod -Location westeurope `
        -EntraClientId "00000000-0000-0000-0000-000000000000" `
        -EntraClientSecret "secret" `
        -OpenAiEndpoint "https://my-oai.openai.azure.com/"
#>

[CmdletBinding()]
param(
    [string]$EnvironmentName,
    [string]$Location,
    [string]$EntraClientId,
    [string]$EntraClientSecret,
    [string]$OpenAiEndpoint,
    [string]$OpenAiDeployment = "gpt-4o",
    [switch]$SkipTests,
    [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$RepoRoot = $PSScriptRoot

# ═══════════════════════════════════════════════════════════════════════
# Helper functions
# ═══════════════════════════════════════════════════════════════════════
function Write-Banner  { param([string]$msg) Write-Host "`n$msg" -ForegroundColor Magenta }
function Write-Step    { param([string]$msg) Write-Host "`n▸ $msg" -ForegroundColor Green }
function Write-Info    { param([string]$msg) Write-Host "  $msg" -ForegroundColor Cyan }
function Write-OK      { param([string]$msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn    { param([string]$msg) Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-Fail    { param([string]$msg) Write-Host "  ✗ $msg" -ForegroundColor Red }

function Test-CommandExists {
    param([string]$Name, [string]$Url)
    if (Get-Command $Name -ErrorAction SilentlyContinue) { return $true }
    Write-Fail "$Name not found — install from $Url"
    return $false
}

function Invoke-Step {
    param([string]$Description, [scriptblock]$Action)
    Write-Step $Description
    try { & $Action }
    catch {
        Write-Fail "$Description failed: $_"
        exit 1
    }
}

function Read-OrDefault {
    param([string]$Prompt, [string]$Default)
    $val = Read-Host "  $Prompt [$Default]"
    if ([string]::IsNullOrWhiteSpace($val)) { return $Default }
    return $val
}

# ═══════════════════════════════════════════════════════════════════════
# Banner
# ═══════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║    Fabric Storyboard Copilot — One-Click Deploy         ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Magenta

# ═══════════════════════════════════════════════════════════════════════
# 1. Prerequisites
# ═══════════════════════════════════════════════════════════════════════
Invoke-Step "Checking prerequisites" {
    $ok = $true
    $ok = (Test-CommandExists "node" "https://nodejs.org/") -and $ok
    $ok = (Test-CommandExists "npm"  "https://nodejs.org/") -and $ok
    $ok = (Test-CommandExists "az"   "https://aka.ms/install-azure-cli") -and $ok
    $ok = (Test-CommandExists "azd"  "https://aka.ms/install-azd") -and $ok
    if (-not $ok) { throw "Missing prerequisites" }

    $nodeVer = (node --version).TrimStart('v')
    if ([version]$nodeVer -lt [version]"18.0.0") { throw "Node.js v18+ required (found v$nodeVer)" }

    Write-OK "Node.js v$nodeVer"
    Write-OK "npm v$(npm --version)"
    Write-OK "Azure CLI v$(az version --query '""azure-cli""' -o tsv 2>$null)"
    Write-OK "Azure Developer CLI (azd)"
}

# ═══════════════════════════════════════════════════════════════════════
# 2. Azure Authentication
# ═══════════════════════════════════════════════════════════════════════
Invoke-Step "Authenticating with Azure" {
    $acct = az account show 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
    if (-not $acct) {
        Write-Info "Opening browser for Azure login..."
        az login --output none
        $acct = az account show | ConvertFrom-Json
    }
    Write-OK "Signed in as $($acct.user.name)"
    Write-OK "Subscription: $($acct.name) ($($acct.id))"

    $script:AzTenantId = $acct.tenantId
    $script:AzSubscriptionId = $acct.id

    # Force fresh azd login — cached tokens may have expired refresh tokens
    Write-Info "Authenticating azd (fresh login)..."
    azd auth logout 2>$null
    $azdOut = azd auth login 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "azd auth login failed: $azdOut"
    }
    Write-OK "azd authenticated"
}

# ═══════════════════════════════════════════════════════════════════════
# 3. Configuration (interactive prompts for missing values)
# ═══════════════════════════════════════════════════════════════════════
Invoke-Step "Gathering configuration" {
    if (-not $script:EnvironmentName) {
        $script:EnvironmentName = Read-OrDefault "Environment name (e.g., dev, staging, prod)" "dev"
    }
    Write-OK "Environment: $script:EnvironmentName"

    if (-not $script:Location) {
        $script:Location = Read-OrDefault "Azure region" "eastus2"
    }
    Write-OK "Location: $script:Location"

    $script:DeployOpenAi = $false
    if (-not $script:OpenAiEndpoint) {
        $choice = Read-OrDefault "Deploy a NEW Azure OpenAI resource? (y/n)" "n"
        if ($choice -eq "y") {
            $script:DeployOpenAi = $true
            Write-OK "Will deploy Azure OpenAI resource with $script:OpenAiDeployment"
        } else {
            $script:OpenAiEndpoint = Read-Host "  Existing Azure OpenAI endpoint URL"
            if (-not $script:OpenAiEndpoint) { throw "Azure OpenAI endpoint is required" }
        }
    }
    if ($script:OpenAiEndpoint) { Write-OK "OpenAI endpoint: $script:OpenAiEndpoint" }
    Write-OK "OpenAI deployment: $script:OpenAiDeployment"
}

# ═══════════════════════════════════════════════════════════════════════
# 4. Entra ID App Registration
# ═══════════════════════════════════════════════════════════════════════
Invoke-Step "Configuring Entra ID" {
    $script:CreatedNewApp = $false

    if ($EntraClientId) {
        Write-OK "Using existing Entra app: $EntraClientId"
        if (-not $EntraClientSecret) {
            $secStr = Read-Host "  Client secret" -AsSecureString
            $EntraClientSecret = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secStr))
        }
    } else {
        $choice = Read-OrDefault "Create a NEW Entra ID app registration? (y/n)" "y"
        if ($choice -ne "y") {
            $EntraClientId = Read-Host "  Existing Application (client) ID"
            $secStr = Read-Host "  Client secret" -AsSecureString
            $EntraClientSecret = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secStr))
        } else {
            $appDisplayName = "Fabric Storyboard Copilot ($script:EnvironmentName)"
            Write-Info "Registering app: $appDisplayName"

            # Create app
            $appJson = az ad app create `
                --display-name $appDisplayName `
                --sign-in-audience "AzureADMyOrg" `
                --enable-id-token-issuance false `
                --enable-access-token-issuance false `
                2>$null
            $app = $appJson | ConvertFrom-Json
            $EntraClientId = $app.appId
            $appObjectId = $app.id
            Write-OK "App registered: $EntraClientId"

            # Set Application ID URI
            Write-Info "Setting Application ID URI..."
            az ad app update --id $EntraClientId --identifier-uris "api://$EntraClientId" --output none 2>$null

            # Expose API scope: access_as_user
            Write-Info "Exposing access_as_user scope..."
            $scopeId = [guid]::NewGuid().ToString()
            $apiBody = @{
                api = @{
                    oauth2PermissionScopes = @(@{
                        id                      = $scopeId
                        adminConsentDescription = "Allows the Office Add-in to call the backend on behalf of the user."
                        adminConsentDisplayName = "Access Fabric Storyboard Copilot"
                        userConsentDescription  = "Allow the add-in to access Fabric Storyboard on your behalf."
                        userConsentDisplayName  = "Access Fabric Storyboard Copilot"
                        isEnabled               = $true
                        type                    = "User"
                        value                   = "access_as_user"
                    })
                }
            } | ConvertTo-Json -Depth 5 -Compress
            az rest --method PATCH `
                --uri "https://graph.microsoft.com/v1.0/applications/$appObjectId" `
                --headers "Content-Type=application/json" `
                --body $apiBody --output none 2>$null
            Write-OK "Scope: api://$EntraClientId/access_as_user"

            # Redirect URIs (SPA)
            Write-Info "Adding redirect URIs..."
            $spaBody = @{
                spa = @{ redirectUris = @("https://localhost:3000/dialog.html") }
            } | ConvertTo-Json -Depth 3 -Compress
            az rest --method PATCH `
                --uri "https://graph.microsoft.com/v1.0/applications/$appObjectId" `
                --headers "Content-Type=application/json" `
                --body $spaBody --output none 2>$null

            # API permissions: Graph User.Read
            Write-Info "Adding API permissions..."
            az ad app permission add --id $EntraClientId `
                --api "00000003-0000-0000-c000-000000000000" `
                --api-permissions "e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope" `
                --output none 2>$null

            # Power BI Service: Report.Read.All, Dataset.Read.All, Workspace.Read.All
            az ad app permission add --id $EntraClientId `
                --api "00000009-0000-0000-c000-000000000000" `
                --api-permissions "4ae1bf56-f562-4747-b7bc-2fa0874ed46f=Scope" `
                --output none 2>$null

            # Pre-authorize Office client applications
            Write-Info "Authorizing Office clients..."
            $officeClients = @(
                "ea5a67f6-b6f3-4338-b240-c655ddc3cc8e"   # Office on the web
                "d3590ed6-52b3-4102-aeff-aad2292ab01c"   # Office desktop (Windows)
                "bc59ab01-8403-45c6-8796-ac3ef710b3e3"   # Outlook desktop / mobile
                "57fb890c-0dab-4253-a5e0-7188c88b2bb4"   # Office web (alternate)
                "1fec8e78-bce4-4aaf-ab1b-5451cc387264"   # Microsoft Teams
            )
            $preAuthBody = @{
                api = @{
                    preAuthorizedApplications = $officeClients | ForEach-Object {
                        @{ appId = $_; delegatedPermissionIds = @($scopeId) }
                    }
                }
            } | ConvertTo-Json -Depth 5 -Compress
            az rest --method PATCH `
                --uri "https://graph.microsoft.com/v1.0/applications/$appObjectId" `
                --headers "Content-Type=application/json" `
                --body $preAuthBody --output none 2>$null
            Write-OK "Office clients authorized (SSO)"

            # Create client secret
            Write-Info "Generating client secret..."
            $credJson = az ad app credential reset `
                --id $EntraClientId `
                --display-name "fabric-storyboard-deploy" `
                --years 1 --append 2>$null
            $EntraClientSecret = ($credJson | ConvertFrom-Json).password
            Write-OK "Client secret created (valid 1 year)"

            # Create service principal and grant admin consent
            Write-Info "Creating service principal..."
            az ad sp create --id $EntraClientId --output none 2>$null
            Start-Sleep -Seconds 3
            Write-Info "Granting admin consent..."
            az ad app permission admin-consent --id $EntraClientId --output none 2>$null

            $script:CreatedNewApp = $true
            $script:AppObjectId = $appObjectId
            Write-OK "Entra ID setup complete"
        }
    }
    $script:EntraClientId = $EntraClientId
    $script:EntraClientSecret = $EntraClientSecret
}

# ═══════════════════════════════════════════════════════════════════════
# 5. Install Dependencies
# ═══════════════════════════════════════════════════════════════════════
Invoke-Step "Installing dependencies" {
    Set-Location $RepoRoot
    $output = npm ci 2>&1
    if ($LASTEXITCODE -ne 0) {
        $output | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        throw "Frontend npm ci failed"
    }
    Write-OK "Frontend packages installed"

    Set-Location "$RepoRoot\api"
    $output = npm ci 2>&1
    if ($LASTEXITCODE -ne 0) {
        $output | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        throw "Backend npm ci failed"
    }
    Write-OK "Backend packages installed"

    Set-Location $RepoRoot
}

# ═══════════════════════════════════════════════════════════════════════
# 6. Build
# ═══════════════════════════════════════════════════════════════════════
if (-not $SkipBuild) {
    Invoke-Step "Building application" {
        Set-Location $RepoRoot
        $output = npm run build 2>&1
        if ($LASTEXITCODE -ne 0) {
            $output | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
            throw "Frontend build failed"
        }
        Write-OK "Frontend → dist/"

        Set-Location "$RepoRoot\api"
        $output = npm run build 2>&1
        if ($LASTEXITCODE -ne 0) {
            $output | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
            throw "Backend build failed"
        }
        Write-OK "Backend → api/dist/"

        Set-Location $RepoRoot
    }
}

# ═══════════════════════════════════════════════════════════════════════
# 7. Test (optional)
# ═══════════════════════════════════════════════════════════════════════
if (-not $SkipTests) {
    Invoke-Step "Running tests" {
        Set-Location $RepoRoot
        $output = npm test 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "Frontend tests have failures:"
            $output | Select-Object -Last 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        } else { Write-OK "Frontend tests passed" }

        Set-Location "$RepoRoot\api"
        $output = npm test 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "Backend tests have failures:"
            $output | Select-Object -Last 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        } else { Write-OK "Backend tests passed" }

        Set-Location $RepoRoot
    }
}

# ═══════════════════════════════════════════════════════════════════════
# 8. Provision Azure Infrastructure
# ═══════════════════════════════════════════════════════════════════════
Invoke-Step "Provisioning Azure infrastructure (Bicep via azd)" {
    Set-Location $RepoRoot

    azd env new $script:EnvironmentName --no-prompt 2>$null
    azd env select $script:EnvironmentName 2>$null

    azd env set AZURE_LOCATION            $script:Location            --no-prompt
    azd env set AZURE_SUBSCRIPTION_ID     $script:AzSubscriptionId --no-prompt
    azd env set ENTRA_CLIENT_ID           $script:EntraClientId    --no-prompt
    azd env set ENTRA_TENANT_ID           $script:AzTenantId       --no-prompt
    azd env set ENTRA_CLIENT_SECRET       $script:EntraClientSecret --no-prompt
    azd env set AZURE_OPENAI_DEPLOYMENT   $script:OpenAiDeployment        --no-prompt
    azd env set DEPLOY_OPENAI             "$($script:DeployOpenAi.ToString().ToLower())" --no-prompt

    if ($script:OpenAiEndpoint) {
        azd env set AZURE_OPENAI_ENDPOINT $script:OpenAiEndpoint --no-prompt
    }

    Write-Info "Running azd provision (this may take a few minutes)..."
    azd provision --no-prompt
    if ($LASTEXITCODE -ne 0) { throw "Infrastructure provisioning failed" }

    $script:SwaUrl  = (azd env get-value AZURE_STATIC_WEB_APP_URL  2>$null)
    $script:SwaName = (azd env get-value AZURE_STATIC_WEB_APP_NAME 2>$null)
    $script:KvName  = (azd env get-value AZURE_KEY_VAULT_NAME      2>$null)

    Write-OK "Resource group: rg-$($script:EnvironmentName)"
    Write-OK "Static Web App: $script:SwaName"
    Write-OK "Key Vault: $script:KvName"
    Write-OK "URL: $script:SwaUrl"
}

# ═══════════════════════════════════════════════════════════════════════
# 9. Deploy Application
# ═══════════════════════════════════════════════════════════════════════
Invoke-Step "Deploying application to Azure" {
    Set-Location $RepoRoot
    azd deploy --no-prompt
    if ($LASTEXITCODE -ne 0) { throw "Application deployment failed" }
    Write-OK "Deployed to $script:SwaUrl"
}

# ═══════════════════════════════════════════════════════════════════════
# 10. Generate Production Manifest
# ═══════════════════════════════════════════════════════════════════════
Invoke-Step "Generating production manifest" {
    $src = Join-Path $RepoRoot "manifest.xml"
    $dst = Join-Path $RepoRoot "dist" "manifest-prod.xml"

    $content = (Get-Content $src -Raw) -replace 'https://localhost:3000', $script:SwaUrl
    Set-Content -Path $dst -Value $content -Encoding UTF8
    Write-OK "dist/manifest-prod.xml"
}

# ═══════════════════════════════════════════════════════════════════════
# 11. Update Entra Redirect URIs for Production
# ═══════════════════════════════════════════════════════════════════════
if ($script:CreatedNewApp -and $script:SwaUrl) {
    Invoke-Step "Adding production redirect URI to Entra app" {
        $spaBody = @{
            spa = @{
                redirectUris = @(
                    "https://localhost:3000/dialog.html"
                    "$($script:SwaUrl)/dialog.html"
                )
            }
        } | ConvertTo-Json -Depth 3 -Compress
        az rest --method PATCH `
            --uri "https://graph.microsoft.com/v1.0/applications/$($script:AppObjectId)" `
            --headers "Content-Type=application/json" `
            --body $spaBody --output none 2>$null
        Write-OK "$($script:SwaUrl)/dialog.html"
    }
}

# ═══════════════════════════════════════════════════════════════════════
# 12. Configure Local Development
# ═══════════════════════════════════════════════════════════════════════
Invoke-Step "Generating local development settings" {
    $localSettings = @{
        IsEncrypted = $false
        Values = @{
            AzureWebJobsStorage      = ""
            FUNCTIONS_WORKER_RUNTIME = "node"
            ENTRA_CLIENT_ID          = $script:EntraClientId
            ENTRA_TENANT_ID          = $script:AzTenantId
            ENTRA_CLIENT_SECRET      = $script:EntraClientSecret
            AZURE_OPENAI_ENDPOINT    = if ($script:OpenAiEndpoint) { $script:OpenAiEndpoint } else { "https://oai-$($script:EnvironmentName).openai.azure.com/" }
            AZURE_OPENAI_DEPLOYMENT  = $script:OpenAiDeployment
        }
        Host = @{
            CORS            = "https://localhost:3000"
            CORSCredentials = $true
        }
    } | ConvertTo-Json -Depth 3

    $localSettingsPath = Join-Path $RepoRoot "api" "local.settings.json"
    Set-Content -Path $localSettingsPath -Value $localSettings -Encoding UTF8
    Write-OK "api/local.settings.json updated"

    # .env for frontend
    $envContent = @"
ENTRA_CLIENT_ID=$($script:EntraClientId)
ENTRA_TENANT_ID=$($script:AzTenantId)
AZURE_OPENAI_ENDPOINT=$(if ($script:OpenAiEndpoint) { $script:OpenAiEndpoint } else { "https://oai-$($script:EnvironmentName).openai.azure.com/" })
AZURE_OPENAI_DEPLOYMENT=$($script:OpenAiDeployment)
"@
    $envPath = Join-Path $RepoRoot ".env"
    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    Write-OK ".env updated"
}

# ═══════════════════════════════════════════════════════════════════════
# 13. RBAC for Local Development
# ═══════════════════════════════════════════════════════════════════════
Invoke-Step "Setting up RBAC for local dev (Cognitive Services OpenAI User)" {
    $currentUser = az ad signed-in-user show --query "id" -o tsv 2>$null
    if ($currentUser) {
        if ($script:OpenAiEndpoint) {
            $oaiId = az cognitiveservices account list `
                --query "[?properties.endpoint=='$($script:OpenAiEndpoint)'].id | [0]" -o tsv 2>$null
            if ($oaiId) {
                az role assignment create --assignee $currentUser `
                    --role "Cognitive Services OpenAI User" `
                    --scope $oaiId --output none 2>$null
                Write-OK "Role assigned on existing OpenAI resource"
            } else {
                Write-Warn "Could not find OpenAI resource — assign role manually"
            }
        } elseif ($script:DeployOpenAi) {
            Write-Info "Role was assigned via Bicep (Managed Identity). For local dev, run:"
            Write-Host "    az role assignment create --assignee $currentUser --role 'Cognitive Services OpenAI User' --scope <openai-resource-id>" -ForegroundColor Gray
        }
    }
}

# ═══════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           ✅  Deployment Complete!                       ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Application URL       $script:SwaUrl" -ForegroundColor White
Write-Host "  Environment           $($script:EnvironmentName)" -ForegroundColor White
Write-Host "  Resource Group        rg-$($script:EnvironmentName)" -ForegroundColor White
Write-Host "  Entra Client ID       $script:EntraClientId" -ForegroundColor White
Write-Host "  Entra Client Secret   $script:EntraClientSecret" -ForegroundColor White
Write-Host "  Tenant ID             $script:AzTenantId" -ForegroundColor White
Write-Host "  Key Vault             $script:KvName" -ForegroundColor White
Write-Host "  Production Manifest   dist/manifest-prod.xml" -ForegroundColor White
Write-Host ""
Write-Host "  ── Redeploy Command ──" -ForegroundColor Yellow
Write-Host "  .\deploy.ps1 -EnvironmentName $($script:EnvironmentName) -Location $($script:Location) ``" -ForegroundColor Gray
Write-Host "      -EntraClientId `"$($script:EntraClientId)`" ``" -ForegroundColor Gray
Write-Host "      -EntraClientSecret `"$($script:EntraClientSecret)`" ``" -ForegroundColor Gray
if ($script:OpenAiEndpoint) {
    Write-Host "      -OpenAiEndpoint `"$($script:OpenAiEndpoint)`"" -ForegroundColor Gray
}
Write-Host ""
Write-Host "  ── Next Steps ──" -ForegroundColor Yellow
Write-Host "  1. Sideload dist/manifest-prod.xml in PowerPoint (Insert → My Add-ins)" -ForegroundColor Gray
Write-Host "  2. Or deploy org-wide via M365 Admin Center → Integrated Apps" -ForegroundColor Gray
Write-Host "  3. For local dev: run 'npm start' (frontend) + 'cd api && npm start' (backend)" -ForegroundColor Gray
Write-Host ""
