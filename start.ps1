param(
    [int]$FrontendPort = 3000,
    [int]$BackendPort = 8000
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ApiPython = Join-Path $Root "apps\api\.venv\Scripts\python.exe"
$LogDir = Join-Path $Root ".logs"

if (-not (Test-Path -LiteralPath $ApiPython)) {
    throw "Backend venv not found at apps\api\.venv. Run: apps\api\.venv\Scripts\python.exe -m pip install -r apps\api\requirements.txt"
}

$NextBin = Join-Path $Root "apps\web\node_modules\.bin\next.cmd"
if (-not (Test-Path -LiteralPath $NextBin)) {
    $NextBin = Join-Path $Root "node_modules\.bin\next.cmd"
}
if (-not (Test-Path -LiteralPath $NextBin)) {
    throw "Next.js binary not found. Run: pnpm install"
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

Get-Job -Name CityMateApi, CityMateWeb -ErrorAction SilentlyContinue | Stop-Job -PassThru | Remove-Job -Force

$ApiLog = Join-Path $LogDir "api.log"
$WebLog = Join-Path $LogDir "web.log"

Start-Job -Name CityMateApi -ArgumentList $Root, $ApiPython, $BackendPort -ScriptBlock {
    param($Root, $ApiPython, $BackendPort)
    Set-Location $Root
    & $ApiPython -m uvicorn api.main:app --app-dir "$Root\apps\api" --reload --reload-dir "$Root\apps\api\api" --host 0.0.0.0 --port $BackendPort
} | Out-Null

Start-Job -Name CityMateWeb -ArgumentList $Root, $NextBin, $FrontendPort, $BackendPort -ScriptBlock {
    param($Root, $NextBin, $FrontendPort, $BackendPort)
    $env:CI = "true"
    $EnvPath = Join-Path $Root ".env"
    if (Test-Path -LiteralPath $EnvPath) {
        Get-Content -LiteralPath $EnvPath | ForEach-Object {
            if ($_ -match "^\s*#" -or $_ -notmatch "=") { return }
            $Name, $Value = $_ -split "=", 2
            if ($Name) {
                [System.Environment]::SetEnvironmentVariable($Name.Trim(), $Value.Trim(), "Process")
            }
        }
    }
    if (-not $env:NEXT_PUBLIC_API_BASE_URL) {
        $env:NEXT_PUBLIC_API_BASE_URL = "http://localhost:$BackendPort"
    }
    Set-Location (Join-Path $Root "apps\web")
    & $NextBin dev --turbopack --port $FrontendPort
} | Out-Null

Start-Sleep -Seconds 2

Receive-Job -Name CityMateApi -Keep 6>&1 | Out-File -FilePath $ApiLog -Append
Receive-Job -Name CityMateWeb -Keep 6>&1 | Out-File -FilePath $WebLog -Append

Write-Host "CityMate AI started." -ForegroundColor Green
Write-Host "Frontend: http://localhost:$FrontendPort"
Write-Host "Backend:  http://localhost:$BackendPort/health"
Write-Host "API docs: http://localhost:$BackendPort/docs"
Write-Host ""
Write-Host "Logs:"
Write-Host "  $ApiLog"
Write-Host "  $WebLog"
Write-Host ""
Write-Host "Useful commands:"
Write-Host "  Get-Job CityMateApi, CityMateWeb"
Write-Host "  Receive-Job CityMateApi -Keep"
Write-Host "  Receive-Job CityMateWeb -Keep"
Write-Host "  Stop-Job CityMateApi, CityMateWeb"
