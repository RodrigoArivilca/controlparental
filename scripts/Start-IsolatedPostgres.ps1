param(
    [string]$PostgresBin = 'C:\Program Files\PostgreSQL\18\bin'
)

# Invocar con dot-sourcing: . .\scripts\Start-IsolatedPostgres.ps1
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$localRoot = Join-Path $projectRoot '.local'
$clusterPath = Join-Path $localRoot 'postgres-stage1'
$credentialsPath = Join-Path $localRoot 'stage1-credentials.json'
$pgCtl = Join-Path $PostgresBin 'pg_ctl.exe'
$psql = Join-Path $PostgresBin 'psql.exe'
if (!(Test-Path $pgCtl)) { throw "No se encontró PostgreSQL en $PostgresBin" }

New-Item -ItemType Directory -Force -Path $localRoot | Out-Null
if (!(Test-Path $credentialsPath)) {
    if (Test-Path $clusterPath) { throw 'Existe un clúster sin credenciales de esta etapa; no se modificará.' }
    @{
        databasePassword = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
        applicationPassword = [Guid]::NewGuid().ToString('N')
    } | ConvertTo-Json | Set-Content -Encoding ASCII -LiteralPath $credentialsPath
}
$credentials = Get-Content -Raw -LiteralPath $credentialsPath | ConvertFrom-Json
if (!(Test-Path $clusterPath)) {
    $passwordFile = Join-Path $localRoot 'initdb-password.tmp'
    try {
        [IO.File]::WriteAllText($passwordFile, $credentials.databasePassword, [Text.Encoding]::ASCII)
        & (Join-Path $PostgresBin 'initdb.exe') -D $clusterPath -U cp_stage1 -A scram-sha-256 --encoding=UTF8 --locale=C "--pwfile=$passwordFile"
        if ($LASTEXITCODE -ne 0) { throw 'Falló initdb del clúster aislado.' }
    } finally {
        if (Test-Path $passwordFile) { Remove-Item -LiteralPath $passwordFile }
    }
}
& $pgCtl -D $clusterPath status *> $null
if ($LASTEXITCODE -ne 0) {
    if (Get-NetTCPConnection -State Listen -LocalPort 55432 -ErrorAction SilentlyContinue) {
        throw 'El puerto 55432 está ocupado. No se utilizará ese servidor.'
    }
    & $pgCtl -D $clusterPath -l (Join-Path $localRoot 'postgres-stage1.log') -o '-h 127.0.0.1 -p 55432' -w start
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar PostgreSQL aislado.' }
}

$previousPgPassword = $env:PGPASSWORD
try {
    $env:PGPASSWORD = $credentials.databasePassword
    $actualDataDirectory = & $psql -h 127.0.0.1 -p 55432 -U cp_stage1 -d postgres -Atc 'SHOW data_directory'
    if ($LASTEXITCODE -ne 0 -or [IO.Path]::GetFullPath($actualDataDirectory) -ne [IO.Path]::GetFullPath($clusterPath)) {
        throw 'La instancia no corresponde al clúster aislado; operación cancelada.'
    }
    $exists = & $psql -h 127.0.0.1 -p 55432 -U cp_stage1 -d postgres -Atc "SELECT 1 FROM pg_database WHERE datname = 'controlparental_stage1'"
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo consultar el clúster aislado.' }
    if ($exists -ne '1') {
        & (Join-Path $PostgresBin 'createdb.exe') -h 127.0.0.1 -p 55432 -U cp_stage1 controlparental_stage1
        if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la base aislada.' }
    }
} finally {
    $env:PGPASSWORD = $previousPgPassword
}

$env:DB_URL = 'jdbc:postgresql://127.0.0.1:55432/controlparental_stage1'
$env:DB_USERNAME = 'cp_stage1'
$env:DB_PASSWORD = $credentials.databasePassword
$env:DB_DDL_AUTO = 'update'
$env:APP_SECURITY_USERNAME = 'stage1_local'
$env:APP_SECURITY_PASSWORD = $credentials.applicationPassword
# Sobrescribir también variables Spring heredadas para evitar otra conexión.
$env:SPRING_DATASOURCE_URL = $env:DB_URL
$env:SPRING_DATASOURCE_USERNAME = $env:DB_USERNAME
$env:SPRING_DATASOURCE_PASSWORD = $env:DB_PASSWORD
$env:SPRING_JPA_HIBERNATE_DDL_AUTO = $env:DB_DDL_AUTO
$env:SERVER_PORT = '8080'
$env:SERVER_ADDRESS = '127.0.0.1'
Write-Host 'PostgreSQL aislado listo en 127.0.0.1:55432/controlparental_stage1. Variables disponibles en esta sesión.'
