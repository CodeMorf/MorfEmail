$ErrorActionPreference = 'Stop'
$installer = (Resolve-Path 'src-tauri\target\release\bundle\nsis\MorfEmail_2.2.0_x64-setup.exe').Path
$destination = Join-Path $env:TEMP 'morfemail-install-smoke-20260828'
if (Test-Path -LiteralPath $destination) {
  Remove-Item -LiteralPath $destination -Recurse -Force
}

$process = Start-Process -FilePath $installer -ArgumentList @('/S', "/D=$destination") -PassThru -Wait
Write-Output "installerExit=$($process.ExitCode)"
if (-not (Test-Path -LiteralPath $destination)) {
  throw 'El instalador no creó la carpeta de destino.'
}

$required = @(
  'morfemail-desktop.exe',
  'uninstall.exe',
  'resources\runtime\node.exe',
  'resources\runtime\server.cjs',
  'resources\runtime\ms-playwright'
)
foreach ($relative in $required) {
  $exists = Test-Path -LiteralPath (Join-Path $destination $relative)
  Write-Output "$relative => $exists"
  if (-not $exists) { throw "Falta $relative en la instalación." }
}

$total = (Get-ChildItem -LiteralPath $destination -Recurse -File | Measure-Object -Property Length -Sum).Sum
Write-Output "installedSizeMb=$([math]::Round($total / 1MB, 1))"
