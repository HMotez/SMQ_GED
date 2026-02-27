# =============================================================
# SMQ_GED — scripts/build-offline.ps1
# Rebuild des containers sans accès à Docker Hub.
# Exécuter depuis la racine du projet :
#   .\scripts\build-offline.ps1
# =============================================================

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "SMQ_GED — Build offline (sans Docker Hub)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ── Vérifier que les images de base existent localement ──────
$requiredImages = @("smq_ged-backend:latest", "smq_ged-frontend:latest", "postgres:16-alpine")
foreach ($img in $requiredImages) {
    $exists = docker image inspect $img 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERREUR : Image manquante '$img'" -ForegroundColor Red
        Write-Host "Un premier build en ligne est necessaire pour initialiser les images de base." -ForegroundColor Yellow
        Write-Host "Connectez-vous a un reseau avec acces a Docker Hub et lancez :" -ForegroundColor Yellow
        Write-Host "  docker-compose up --build" -ForegroundColor White
        exit 1
    }
    Write-Host "OK : $img trouvee localement" -ForegroundColor Green
}

Write-Host ""
Write-Host "Demarrage du build offline..." -ForegroundColor Cyan
Write-Host ""

# ── Build avec les Dockerfiles offline ───────────────────────
Set-Location $ProjectRoot

docker-compose `
    -f docker-compose.yml `
    -f docker-compose.offline.yml `
    up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Build et demarrage reussis !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Services actifs :" -ForegroundColor Cyan
    docker-compose ps
    Write-Host ""
    Write-Host "Frontend : http://localhost" -ForegroundColor White
    Write-Host "Backend  : http://localhost:4000" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "ERREUR lors du build." -ForegroundColor Red
    Write-Host "Consultez les logs : docker-compose logs -f" -ForegroundColor Yellow
    exit 1
}
