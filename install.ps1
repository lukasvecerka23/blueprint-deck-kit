# Blueprint Deck Kit installer for Windows: puts the blueprint-deck skill into your coding agents' skills folders.
#
#   irm https://raw.githubusercontent.com/lukasvecerka23/blueprint-deck-kit/main/install.ps1 | iex
#   $installer = irm "https://raw.githubusercontent.com/lukasvecerka23/blueprint-deck-kit/main/install.ps1"
#   & ([scriptblock]::Create($installer)) -Version 0.5.1
#   (the website's short URL https://blueprintdeck.dev/install.ps1 serves this same script)
#   .\install.ps1                     (from a clone of the repository: installs that copy)
#
# Parameters: -Agent claude|codex|gemini|copilot|cursor|grok|agents|all (default: the agents found; with more than one it asks which,
#             Enter = all; Cursor and Grok Build also read the Claude Code and ~\.agents skills, Cursor the Codex ones too,
#             so next to those they get no second copy),
#             -Dir <skills folder>, -Project, -Version <x.y.z> (a specific release),
#             -Ref <branch or tag> (the skill as it is on a branch, e.g. main), -Uninstall, -Yes (don't ask, all found)
# It only copies files: no Node, no Python, nothing else is installed.
param(
  [ValidateSet("", "claude", "codex", "gemini", "copilot", "cursor", "grok", "agents", "all")][string]$Agent = "",
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

# an agent's skills folder; GitHub Copilot uses ~\.copilot\skills, but .github\skills inside a project
function Get-SkillsDir($id) { if ($id -eq "copilot" -and $Project) { Join-Path $Base ".github\skills" } else { Join-Path $Base ".$id\skills" } }

$targets = @()
$shared = @()
if ($Dir) { $targets += $Dir }
else {
  switch ($Agent) {
    "claude" { $targets += Join-Path $Base ".claude\skills" }
    "codex"  { $targets += Join-Path $Base ".codex\skills" }
    "gemini" { $targets += Join-Path $Base ".gemini\skills" }
    "copilot" { $targets += Get-SkillsDir "copilot" }
    "cursor" { $targets += Join-Path $Base ".cursor\skills" }
    "grok"   { $targets += Join-Path $Base ".grok\skills" }
    "agents" { $targets += Join-Path $Base ".agents\skills" }
    "all"    { $targets += @((Join-Path $Base ".claude\skills"), (Join-Path $Base ".codex\skills"), (Join-Path $Base ".gemini\skills"), (Get-SkillsDir "copilot"), (Join-Path $Base ".agents\skills")) }
    default {
      # every agent found on this computer
      $found = @()
      if ((Test-Path (Join-Path $Base ".claude")) -or (Get-Command claude -ErrorAction SilentlyContinue)) { $found += @{ Id = "claude"; Label = "Claude Code" } }
      if ((Test-Path (Join-Path $Base ".codex")) -or (Get-Command codex -ErrorAction SilentlyContinue)) { $found += @{ Id = "codex"; Label = "Codex" } }
      if ((Test-Path (Join-Path $Base ".gemini")) -or (Get-Command gemini -ErrorAction SilentlyContinue)) { $found += @{ Id = "gemini"; Label = "Gemini CLI" } }
      if ((Test-Path (Join-Path $HOME ".copilot")) -or (Get-Command copilot -ErrorAction SilentlyContinue)) { $found += @{ Id = "copilot"; Label = "GitHub Copilot" } }
      if ((Test-Path (Join-Path $HOME ".cursor")) -or (Get-Command cursor-agent -ErrorAction SilentlyContinue) -or (Get-Command cursor -ErrorAction SilentlyContinue)) { $found += @{ Id = "cursor"; Label = "Cursor" } }
      if ((Test-Path (Join-Path $HOME ".grok")) -or (Get-Command grok -ErrorAction SilentlyContinue)) { $found += @{ Id = "grok"; Label = "Grok Build" } }
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
      # Cursor reads the Claude Code, Codex and ~\.agents skills, Grok Build the Claude Code and ~\.agents ones: with one of
      # those installed too they would see the skill twice, so they get their own copy only when they're the only choice
      # (uninstalling removes every copy)
      $ids = @($found | ForEach-Object { $_.Id })
      $readsShared = @{ cursor = @("claude", "codex", "agents"); grok = @("claude", "agents") }
      foreach ($f in $found) {
        if (-not $Uninstall -and $readsShared.ContainsKey($f.Id) -and ($readsShared[$f.Id] | Where-Object { $ids -contains $_ })) { $shared += @($f.Label); continue }
        $targets += Get-SkillsDir $f.Id
      }
    }
  }
}

if ($Uninstall) {
  foreach ($t in $targets) { $p = Join-Path $t $Name; if (Test-Path $p) { Remove-Item -Recurse -Force $p; Write-Host "removed $p" } }
  return
}

$tmp = $null
$here = if ($PSScriptRoot) { $PSScriptRoot } else { "" }
if ($here -and (Test-Path (Join-Path $here "plugins\$Name\skills\$Name\SKILL.md"))) {
  $src = Join-Path $here "plugins\$Name\skills\$Name"
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
  if (-not $src -or -not (Test-Path (Join-Path $src "SKILL.md"))) { throw "download did not contain the $Name skill" }
}

try {
  # VERSION.txt since 0.4.0, VERSION before
  $readVersion = { param($dir) foreach ($f in "VERSION.txt", "VERSION") { $p = Join-Path $dir $f; if (Test-Path $p) { return (Get-Content $p -Raw).Trim() } }; return "" }
  $new = & $readVersion $src; if (-not $new) { $new = "?" }
  $updated = $false
  foreach ($t in $targets) {
    New-Item -ItemType Directory -Force -Path $t | Out-Null
    $dest = Join-Path $t $Name
    $old = & $readVersion $dest
    if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
    Copy-Item -Recurse -Path $src -Destination $dest
    Remove-Item -Recurse -Force (Join-Path $dest ".claude-plugin") -ErrorAction SilentlyContinue   # only for the marketplace
    if (-not $old) { Write-Host "installed Blueprint Deck Kit $new in $dest" }
    elseif ($old -eq $new) { Write-Host "Blueprint Deck Kit $new is up to date in $dest (reinstalled)" }
    else { Write-Host "updated Blueprint Deck Kit $old -> $new in $dest"; $updated = $true }
  }
  if ($shared.Count) { Write-Host ("Skipped " + ($shared -join " and ") + ": already reading the skill installed above.") }
  if ($updated) {
    Write-Host "What's new: $GitHub/releases"
    Write-Host "Existing diagrams keep their engine; to give one the new features, ask your agent to upgrade it."
  }
} finally {
  if ($tmp) { Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue }
}

Write-Host ""
Write-Host "Done. Start a new agent session in your project folder (code or docs), then:"
Write-Host "  1. Describe your diagram: https://blueprintdeck.dev/configurator/"
Write-Host "  2. Paste the prompt it gives you (or ask: 'Use the blueprint-deck skill to make a diagram of these docs')."
Write-Host "  In Claude Code you can also type /$Name."
