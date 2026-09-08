param([string]$PostgresBin = 'C:\Program Files\PostgreSQL\18\bin', [switch]$IncludeMap)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$clusterPath = Join-Path $projectRoot '.local\postgres-stage1'
$credentials = Get-Content -Raw (Join-Path $projectRoot '.local\stage1-credentials.json') | ConvertFrom-Json
$psql = Join-Path $PostgresBin 'psql.exe'
$previousPgPassword = $env:PGPASSWORD
try {
    $env:PGPASSWORD = $credentials.databasePassword
    $actualDataDirectory = & $psql -h 127.0.0.1 -p 55432 -U cp_stage1 -d controlparental_stage1 -Atc 'SHOW data_directory'
    if ($LASTEXITCODE -ne 0 -or [IO.Path]::GetFullPath($actualDataDirectory) -ne [IO.Path]::GetFullPath($clusterPath)) {
        throw 'La instancia no corresponde al clúster aislado; no se insertarán datos.'
    }
    & $psql -h 127.0.0.1 -p 55432 -U cp_stage1 -d controlparental_stage1 -v ON_ERROR_STOP=1 -f (Join-Path $PSScriptRoot 'seed-isolated-devices.sql')
    if ($LASTEXITCODE -ne 0) { throw 'Falló la carga de dispositivos ficticios. Inicie antes el backend aislado.' }
    if ($IncludeMap) {
        & $psql -h 127.0.0.1 -p 55432 -U cp_stage1 -d controlparental_stage1 -v ON_ERROR_STOP=1 -f (Join-Path $PSScriptRoot 'seed-isolated-map.sql')
        if ($LASTEXITCODE -ne 0) { throw 'Falló la carga del mapa ficticio.' }
    }
} finally {
    $env:PGPASSWORD = $previousPgPassword
}
