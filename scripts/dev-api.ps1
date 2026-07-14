param(
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$Python = Join-Path $Root "apps\api\.venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $Python)) {
    throw "Backend virtual environment not found. Run: python -m venv apps\api\.venv; apps\api\.venv\Scripts\python.exe -m pip install -r apps\api\requirements.txt"
}

& $Python -m uvicorn api.main:app --app-dir (Join-Path $Root "apps\api") --reload --reload-dir (Join-Path $Root "apps\api\api") --host 0.0.0.0 --port $Port
