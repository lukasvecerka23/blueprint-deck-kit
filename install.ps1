# Blueprint Deck Kit installer for Windows: puts the blueprint-deck skill into your coding agents' skills folders.
#
#   irm https://raw.githubusercontent.com/lukasvecerka23/blueprint-deck-kit/main/install.ps1 | iex
#   & ([scriptblock]::Create((irm https://raw.githubusercontent.com/lukasvecerka23/blueprint-deck-kit/main/install.ps1))) -Version 2.1.0
#   (the website's short URL https://blueprint-deck.lukasvecerka.dev/install.ps1 serves this same script)
#   .\install.ps1                     (from a clone of the repository: installs that copy)
#
# Parameters: -Agent claude|codex|agents|all (default: the agents found; with more than one it asks which, Enter = all),
#             -Dir <skills folder>, -Project, -Version <x.y.z> (a specific release),
#             -Ref <branch or tag> (the skill as it is on a branch, e.g. main), -Uninstall, -Yes (don't ask, all found)
# It only copies files: no Node, no Python, nothing else is installed.
param(
  [ValidateSet("", "claude", "codex", "agents", "all")][string]$Agent = "",
  [string]$Dir = "",
  [switch]$Project,
  [string]$Ref = $(if ($env:BLUEPRINT_DECK_REF) { $env:BLUEPRINT_DECK_REF } else { "" }),
  [string]$Version = "",
  [switch]$Uninstall,
  [switch]$Yes
)
$ErrorActionPreference = "Stop"
$Repo = "lukasvecerka23/blueprint-deck-kit"
$GitHub = "https://github.com/$Repo"
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
      # every agent found on this computer
      $found = @()
      if ((Test-Path (Join-Path $Base ".claude")) -or (Get-Command claude -ErrorAction SilentlyContinue)) { $found += @{ Id = "claude"; Label = "Claude Code" } }
      if ((Test-Path (Join-Path $Base ".codex")) -or (Get-Command codex -ErrorAction SilentlyContinue)) { $found += @{ Id = "codex"; Label = "Codex" } }
      if (Test-Path (Join-Path $Base ".agents")) { $found += @{ Id = "agents"; Label = "other agents (~\.agents)" } }
      if ($found.Count -eq 0) { $found += @{ Id = "agents"; Label = "other agents (~\.agents)" } }
      # more than one: ask which (Enter = all). Only in an interactive console; never in CI, with -Yes or when uninstalling.
      if ($found.Count -gt 1 -and -not $Yes -and -not $Uninstall -and -not $env:CI -and [Environment]::UserInteractive -and -not [Console]::IsInputRedirected) {
        Write-Host ("Found: " + (($found | ForEach-Object { $_.Label }) -join ", ") + ". Install for:")
        Write-Host "  [1] all of them (default)"
        for ($i = 0; $i -lt $found.Count; $i++) { Write-Host ("  [" + ($i + 2) + "] " + $found[$i].Label) }
        $choice = (Read-Host "Choice [1]").Trim()
        if ($choice -and $choice -ne "1") {
          $n = 0
          if (-not [int]::TryParse($choice, [ref]$n) -or $n -lt 2 -or $n -gt $found.Count + 1) { throw "unknown choice '$choice'" }
          $found = @($found[$n - 2])
        }
      }
      foreach ($f in $found) { $targets += Join-Path $Base (".$($f.Id)\skills") }
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
  # the skill comes from GitHub: the latest published release, a given -Version, or a branch/tag with -Ref
  if ($Ref) {
    Write-Host "Downloading $Repo ($Ref)..."
    Invoke-WebRequest -UseBasicParsing -Uri "https://codeload.github.com/$Repo/zip/$Ref" -OutFile $zip
  } elseif ($Version) {
    $v = $Version.TrimStart("v")
    try { Invoke-WebRequest -UseBasicParsing -Uri "$GitHub/releases/download/v$v/blueprint-deck-skill.zip" -OutFile $zip }
    catch { throw "There is no release $v. Versions: $GitHub/releases" }
  } else {
    try { Invoke-WebRequest -UseBasicParsing -Uri "$GitHub/releases/latest/download/blueprint-deck-skill.zip" -OutFile $zip }
    catch { throw "Could not download the latest release from $GitHub/releases" }
  }
  Expand-Archive -Path $zip -DestinationPath $tmp
  $src = Get-ChildItem -Path $tmp -Directory -Recurse -Filter $Name | Where-Object { Test-Path (Join-Path $_.FullName "SKILL.md") } | Select-Object -First 1 -ExpandProperty FullName
  if (-not $src -or -not (Test-Path (Join-Path $src "SKILL.md"))) { throw "download did not contain skill\$Name" }
}

try {
  $new = if (Test-Path (Join-Path $src "VERSION")) { (Get-Content (Join-Path $src "VERSION") -Raw).Trim() } else { "?" }
  $updated = $false
  foreach ($t in $targets) {
    New-Item -ItemType Directory -Force -Path $t | Out-Null
    $dest = Join-Path $t $Name
    $old = if (Test-Path (Join-Path $dest "VERSION")) { (Get-Content (Join-Path $dest "VERSION") -Raw).Trim() } else { "" }
    if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
    Copy-Item -Recurse -Path $src -Destination $dest
    Remove-Item -Recurse -Force (Join-Path $dest ".claude-plugin") -ErrorAction SilentlyContinue   # only for the marketplace
    if (-not $old) { Write-Host "installed Blueprint Deck Kit $new in $dest" }
    elseif ($old -eq $new) { Write-Host "Blueprint Deck Kit $new is up to date in $dest (reinstalled)" }
    else { Write-Host "updated Blueprint Deck Kit $old -> $new in $dest"; $updated = $true }
  }
  if ($updated) {
    Write-Host "What's new: $GitHub/releases"
    Write-Host "Existing diagrams keep their engine; to give one the new features, ask your agent to upgrade it."
  }
} finally {
  if ($tmp) { Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue }
}

Write-Host ""
Write-Host "Done. Start a new agent session in your project folder (code or docs), then:"
Write-Host "  1. Describe your diagram: https://blueprint-deck.lukasvecerka.dev/configurator/"
Write-Host "  2. Paste the prompt it gives you (or ask: 'Use the blueprint-deck skill to make a diagram of these docs')."
Write-Host "  In Claude Code you can also type /$Name."
