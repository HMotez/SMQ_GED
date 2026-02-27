# =============================================================
# SMQ_GED — scripts/configure-docker-mirror.ps1
# Configure Docker Desktop pour utiliser un miroir de registry.
# Résolution permanente du problème "TLS handshake timeout".
#
# Exécuter en tant qu'administrateur depuis PowerShell :
#   .\scripts\configure-docker-mirror.ps1
# =============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "SMQ_GED — Configuration miroir Docker" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Chemin du fichier de configuration Docker Desktop (Windows)
$dockerConfigDir  = "$env:USERPROFILE\.docker"
$daemonJsonPath   = "$dockerConfigDir\daemon.json"

# Contenu de la configuration avec miroirs publics
# mirror.gcr.io = miroir Google (accessible dans la plupart des reseaux entreprise)
$daemonConfig = @{
    "registry-mirrors" = @(
        "https://mirror.gcr.io"
    )
    "dns" = @("8.8.8.8", "8.8.4.4")
} | ConvertTo-Json -Depth 3

# ── Sauvegarder l'ancien fichier si existant ─────────────────
if (Test-Path $daemonJsonPath) {
    $backup = "$daemonJsonPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $daemonJsonPath $backup
    Write-Host "Ancien daemon.json sauvegarde : $backup" -ForegroundColor Yellow
}

# ── Ecrire la nouvelle configuration ─────────────────────────
if (-not (Test-Path $dockerConfigDir)) {
    New-Item -ItemType Directory -Path $dockerConfigDir | Out-Null
}

$daemonConfig | Out-File -FilePath $daemonJsonPath -Encoding utf8
Write-Host "daemon.json mis a jour : $daemonJsonPath" -ForegroundColor Green
Write-Host ""
Write-Host "Contenu :" -ForegroundColor Cyan
Get-Content $daemonJsonPath
Write-Host ""

# ── Instructions pour appliquer les changements ──────────────
Write-Host "IMPORTANT : Redemarrez Docker Desktop pour appliquer les changements." -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Cliquez sur l'icone Docker dans la barre des taches" -ForegroundColor White
Write-Host "2. Selectionnez 'Restart Docker Desktop'" -ForegroundColor White
Write-Host "3. Attendez que Docker redémarre (environ 30 secondes)" -ForegroundColor White
Write-Host "4. Relancez le build normal : docker-compose up --build -d" -ForegroundColor White
Write-Host ""
Write-Host "Miroir configure : https://mirror.gcr.io (Google)" -ForegroundColor Green
Write-Host ""
Write-Host "Si ce miroir est aussi bloque sur votre reseau, editez" -ForegroundColor Yellow
Write-Host "$daemonJsonPath et essayez :" -ForegroundColor Yellow
Write-Host '  "registry-mirrors": ["https://dockerhub.azurecr.io"]' -ForegroundColor White
Write-Host ""
