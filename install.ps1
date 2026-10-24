# Blueprint Deck Kit installer for Windows: puts the blueprint-deck skill into your coding agents' skills folders.
#
#   irm https://blueprint-deck.lukasvecerka.dev/install.ps1 | iex
#   & ([scriptblock]::Create((irm https://blueprint-deck.lukasvecerka.dev/install.ps1))) -Agent codex
#   .\install.ps1                     (from a clone of the repository: installs that copy)
#
# Parameters: -Agent claude|codex|agents|all, -Dir <skills folder>, -Project, -Ref <branch or tag>, -Uninstall
# It only copies files: no Node, no Python, nothing else is installed.
param(
  [ValidateSet("", "claude", "codex", "agents", "all")][string]$Agent = "",
  [string]$Dir = "",
  [switch]$Project,
  [string]$Ref = $(if ($env:BLUEPRINT_DECK_REF) { $env:BLUEPRINT_DECK_REF } else { "main" }),
  [switch]$Uninstall
)
$ErrorActionPreference = "Stop"
$Repo = "lukasvecerka23/blueprint-deck-kit"
$Site = if ($env:BLUEPRINT_DECK_SITE) { $env:BLUEPRINT_DECK_SITE } else { "https://blueprint-deck.lukasvecerka.dev" }
$Name = "blueprint-deck"
$Base = if ($Project) { (Get-Location).Path } else { $HOME }

$targets = @()
if ($Dir) { $targets += $Dir }
else {
  switch ($Agent) {
    "claude" { $targets += Join-Path $Base ".claude\skills" }
    "codex"  { $targets += Join-Path $Base ".codex\skills" }
    "agents" { $targets += Join-Path $Base ".agents\skills" }
    "all"    { $targets += @((Join-Path $Base ".claude\skills"), (Join-Path $Base ".codex\skills"), (Join-Path $Base ".agents\skills")) }
    default {
      if ((Test-Path (Join-Path $Base ".claude")) -or (Get-Command claude -ErrorAction SilentlyContinue)) { $targets += Join-Path $Base ".claude\skills" }
      if ((Test-Path (Join-Path $Base ".codex")) -or (Get-Command codex -ErrorAction SilentlyContinue)) { $targets += Join-Path $Base ".codex\skills" }
      if (Test-Path (Join-Path $Base ".agents")) { $targets += Join-Path $Base ".agents\skills" }
      if ($targets.Count -eq 0) { $targets += Join-Path $Base ".agents\skills" }
    }
  }
}

if ($Uninstall) {
  foreach ($t in $targets) { $p = Join-Path $t $Name; if (Test-Path $p) { Remove-Item -Recurse -Force $p; Write-Host "removed $p" } }
  return
}

$tmp = $null
$here = if ($PSScriptRoot) { $PSScriptRoot } else { "" }
if ($here -and (Test-Path (Join-Path $here "skill\$Name\SKILL.md"))) {
  $src = Join-Path $here "skill\$Name"
} else {
  $tmp = Join-Path ([IO.Path]::GetTempPath()) ("blueprint-deck-" + [guid]::NewGuid())
  New-Item -ItemType Directory -Path $tmp | Out-Null
  $zip = Join-Path $tmp "kit.zip"
  # the website's copy of the skill first (the latest release); GitHub as the fallback, or for a specific -Ref
  $fromSite = $false
  if ($Ref -eq "main") {
    try { Invoke-WebRequest -UseBasicParsing -Uri "$Site/blueprint-deck-skill.zip" -OutFile $zip; $fromSite = $true; Write-Host "Downloaded the skill from $Site" } catch { }
  }
  if (-not $fromSite) {
    Write-Host "Downloading $Repo ($Ref) from GitHub..."
    Invoke-WebRequest -UseBasicParsing -Uri "https://codeload.github.com/$Repo/zip/$Ref" -OutFile $zip
  }
  Expand-Archive -Path $zip -DestinationPath $tmp
  $src = Get-ChildItem -Path $tmp -Directory -Recurse -Filter $Name | Where-Object { Test-Path (Join-Path $_.FullName "SKILL.md") } | Select-Object -First 1 -ExpandProperty FullName
  if (-not $src -or -not (Test-Path (Join-Path $src "SKILL.md"))) { throw "download did not contain skill\$Name" }
}

try {
  foreach ($t in $targets) {
    New-Item -ItemType Directory -Force -Path $t | Out-Null
    $dest = Join-Path $t $Name
    if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
    Copy-Item -Recurse -Path $src -Destination $dest
    Write-Host "installed $dest"
  }
} finally {
  if ($tmp) { Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue }
}

Write-Host ""
Write-Host "Done. Start a new agent session in your repository, then:"
Write-Host "  1. Describe your diagram: https://blueprint-deck.lukasvecerka.dev/configurator/"
Write-Host "  2. Paste the prompt it gives you (or ask: 'Use the blueprint-deck skill to make a diagram of this repo')."
Write-Host "  In Claude Code you can also type /$Name."
