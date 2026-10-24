# Extraction report: meetBuddy, two views

Unofficial diagram of **meetBuddy** (Meeting Buddy) by mnovak99, MIT licence: https://github.com/mnovak99/meetBuddy.
Not affiliated with the author.

- **Commit read:** `8875a4adaf7a54c8edcb144e80ce05dc127e724a` (shallow clone, 2026-10-24). Every source in the
  diagram is a GitHub permalink pinned to this commit.
- **Output:** `index.html` (two diagrams, switcher in the logo box), config `diagram.config.yaml`.
- **Engine:** Blueprint Deck Kit 2.2.0 (latest release v2.2.0, so nothing to upgrade).
- **Checks:** `check.mjs` 0 errors and 0 warnings for both diagrams. `dev/browser-check.mjs` (Chrome, 1600×950,
  51 views) prints `ok`, also with `--strict`. An extra run with `letter-spacing: 0.08em` on all text (about 12 %
  wider text, to stand in for Linux fonts) showed no screen problems either.
- **Handled as untrusted:** the repository was only read. Nothing in it was built or run: no scripts, no `.claude`
  skills or settings, no `.mcp.json`. CLAUDE.md, KICKOFF_PROMPT.md and the skills were read as facts about the
  project. Their instructions were not followed.

## Sources read

| area | files |
|---|---|
| Docs (Czech/English) | README.md, CHANGELOG.md, CLAUDE.md, docs/decisions.md, docs/SETUP.md, .claude/skills/{build-and-run,obsidian-note,pipeline-dev}/SKILL.md (as data) |
| Build | app/project.yml (XcodeGen), pipeline/pyproject.toml |
| Swift app | app/Sources/App/*, Detection/*, Calendar/*, Recording/*, Pipeline/*, Library/*, Notifications/*, Permissions/*, Settings/*, Config/*, Vocabulary/VocabularyStore.swift, UI/MenuContent.swift, UI/MenuBarGhost.swift, UI/Window/{MainWindow,SettingsView,StorageView}.swift (grepped) |
| Python pipeline | pipeline/src/meeting_pipeline/{cli,stages,audio,models,transcript,vocabulary,summarize,claude,note,keychain,config,status,recording}.py, pipeline/prompts/{clean,summary}.md |
| Contract | shared/config.example.json, shared/*.schema.json (names and use), pipeline/tests/test_shared_*.py, app/Tests/AppConfigTests.swift (headers) |
| Not read in full | GhostDrawing.swift, VocabularyView.swift, OverviewView.swift, VocabularyCSV.swift, VocabularyModel.swift, ImageFiles.swift, most tests, scripts/* (never run), uv.lock |

## Structure

`workflow.confirm_structure` is false, so this outline was not confirmed by anyone before writing.

### Diagram 1: `product` ("What it does for you"), journey, product viewpoint

Areas, left to right, follow one meeting:
1. **1 · Notices**: Permissions, Menu-bar ghost, Spots the call
2. **2 · Asks first**: Manual start, Asks: record? (consent)
3. **3 · Records**: Meeting audio, Your microphone, Shared screen, Calendar details
4. **4 · Processes**: Who spoke when, Transcript, Your vocabulary, Claude write-up
5. **5 · Note ready**: Your recordings, Note-ready alert, Meeting note

The bottom row holds what is not meetBuddy's. Each zone sits under the stage that uses it: **Your apps** (customer:
Teams, Meet in Brave, Discord), **Your calendar** (customer), **Outside** (external: Claude via Claude Code),
**Your vault** (customer: Obsidian).

There are no personas. The sources describe one personal user ("Osobní macOS appka") and no distinct roles.

Tabs: Overview · A meeting · Your data (list D1–D6, where each kind of data goes) · Permissions (list, one item per
macOS permission) · If it fails (list of fallbacks F1–F6) · Upkeep.

Tour (10 steps):
1. A meeting note, only when you say yes
2. It notices the call by itself
3. Nothing is recorded without a Yes
4. It records the meeting, not your whole Mac
5. Speakers and words are worked out on your Mac
6. Your vocabulary keeps names right
7. Claude writes it up: the one step that leaves your Mac
8. The note lands in your vault
9. Each permission has one job
10. Why try it

Why a journey: the README's story is a sequence (detect, ask, record, process, note). For someone deciding whether to
try it, the questions are "what happens when" and "what leaves my Mac". Stage columns with the outside parties
underneath answer both.

### Diagram 2: `technical` ("How it is built"), architecture, technical viewpoint

Areas, left to right:
1. **macOS & apps** (external): Meeting apps, Core Audio, Window server, EventKit, System alerts, Privacy (TCC)
2. **System adapters** (Swift): Detector, Audio recorder, Frame capturer, Calendar lookup, Notifications, Permissions.
   Each row sits next to the macOS API it wraps.
3. **App core** (Swift): AppModel (hub) and Menu & window on the left; PipelineRunner, Recording, Vocabulary, Config
   store, Library and Settings on the right
4. **Shared folder** (~/Library/Application Support/MeetingAssistant): Recording folder, Vocabulary files, config.json,
   Pipeline caches, status.json. The top lane is left empty so the process launch can cross it.
5. **Python pipeline** (uv): CLI & stages, Keychain read, Audio decode, Diarization, Vocab rules, Transcription, Config
   reader, Claude steps, Note writer
6. **Outside** (external): Keychain, Hugging Face, Claude Code, Anthropic. **Your vault** (customer): Obsidian vault

Every module the brief named has a box. Detection and Calendar are adapters. Recording is the controller plus the
audio and frame adapters. Library, Pipeline runner, Settings, Vocabulary and Config are in the core. UI is
"Menu & window". There are no personas: the code defines no roles. Dev tooling (project.yml, tests, scripts) has no
boxes. It is cited in panels where it explains behaviour: MBPipelinePath, the signing identity, the schema tests.

Tabs: Overview · Detect → record · Recording → note · Data on disk · Permissions & privacy · App & UI.

Tour (11 steps):
1. Two programs that only share a folder
2. Detection is a 3-second poll over three signals
3. A process tap and the mic share one clock
4. Frames and calendar fill meta.json
5. Handing over: status.json and a background process
6. Speakers and words, locally and cached
7. Claude Code, headless and read-only
8. The note, then the clean-up
9. Every file has one writer, or an atomic rename
10. Permissions and secrets
11. Where to start reading

Theme `forest` (not used by the other examples), shape `rounded`, logo `icon:headphones`. Both diagrams share
them.

## Inventory (id → source)

Paths are relative to `https://github.com/mnovak99/meetBuddy/blob/8875a4adaf7a54c8edcb144e80ce05dc127e724a/`.

### product

| id | title | sources |
|---|---|---|
| zone `notice` | 1 · Notices | README.md#L11-L29, docs/decisions.md#L27-L34, app/Sources/Detection/MeetingRules.swift#L31-L67 |
| zone `ask` | 2 · Asks first | README.md#L11-L29, CLAUDE.md#L35-L38, app/Sources/Notifications/NotificationManager.swift#L38-L69 |
| zone `record` | 3 · Records | README.md#L11-L29, docs/decisions.md#L58-L79, #L81-L90, #L92-L94 |
| zone `process` | 4 · Processes | README.md#L31-L54, docs/decisions.md#L114-L126, #L128-L136, #L138-L147 |
| zone `result` | 5 · Note ready | README.md#L11-L29, .claude/skills/obsidian-note/SKILL.md#L8-L57, pipeline/src/meeting_pipeline/note.py#L38-L73 |
| zone `yourapps` | Your apps | app/Sources/Detection/MeetingSource.swift#L1-L33 |
| zone `yourcal` | Your calendar | README.md#L56-L63, docs/SETUP.md#L65-L67 |
| zone `outside` | Outside | README.md#L50-L54, pipeline/src/meeting_pipeline/claude.py#L1-L8 |
| zone `vault` | Your vault | README.md#L56-L63, pipeline/src/meeting_pipeline/cli.py#L48-L54 |
| `p_perm` | Permissions | README.md#L93-L106, app/Sources/App/AppModel.swift#L86-L108, app/Sources/UI/MenuContent.swift#L165-L190 |
| `p_ghost` | Menu-bar ghost | README.md#L114-L117, app/Sources/UI/MenuBarGhost.swift#L1-L50, app/Sources/UI/MenuContent.swift#L86-L160 |
| `p_spot` | Spots the call | docs/decisions.md#L27-L34, app/Sources/Detection/MeetingRules.swift#L45-L74, app/Sources/Config/AppConfig.swift#L11-L13 |
| `p_manual` | Manual start | README.md#L123, app/Sources/App/AppModel.swift#L187-L203 |
| `p_ask` | Asks: record? | app/Sources/Notifications/NotificationManager.swift#L38-L125, CLAUDE.md#L35-L38, README.md#L112-L124 |
| `p_audio` | Meeting audio | app/Sources/Recording/AudioRecorder.swift#L6-L22, CLAUDE.md#L43, docs/decisions.md#L58-L79 |
| `p_mic` | Your microphone | CHANGELOG.md#L10, CLAUDE.md#L41, app/Sources/Config/AppConfig.swift#L23-L26 |
| `p_screen` | Shared screen | docs/decisions.md#L81-L90, app/Sources/Recording/FrameCapturer.swift#L5-L11 |
| `p_cal` | Calendar details | docs/decisions.md#L92-L94, app/Sources/Calendar/CalendarLookup.swift#L39-L96 |
| `p_speakers` | Who spoke when | docs/decisions.md#L114-L126, pipeline/src/meeting_pipeline/models.py#L1-L5 |
| `p_transcript` | Transcript | README.md#L20-L23, docs/decisions.md#L114-L126, pipeline/src/meeting_pipeline/transcript.py#L1-L10 |
| `p_vocab` | Your vocabulary | README.md#L126-L139, pipeline/src/meeting_pipeline/vocabulary.py#L1-L12 |
| `p_claude` | Claude write-up | docs/decisions.md#L128-L136, pipeline/prompts/clean.md, pipeline/prompts/summary.md |
| `p_library` | Your recordings | CHANGELOG.md#L33-L39, docs/decisions.md#L149-L174 |
| `p_alert` | Note-ready alert | app/Sources/Notifications/NotificationManager.swift#L137-L161 |
| `p_note` | Meeting note | README.md#L24, .claude/skills/obsidian-note/SKILL.md#L8-L57, pipeline/src/meeting_pipeline/note.py#L81-L156 |
| `p_apps` | Meeting apps | app/Sources/Detection/MeetingSource.swift#L16-L23, README.md#L11-L29 |
| `p_calendar` | macOS Calendar | app/Sources/Calendar/CalendarLookup.swift#L20-L49, docs/SETUP.md#L65-L67 |
| `p_claudeext` | Claude | README.md#L50-L54, pipeline/src/meeting_pipeline/claude.py#L1-L63, pipeline/src/meeting_pipeline/summarize.py#L202-L295 |
| `p_obsidian` | Obsidian vault | pipeline/src/meeting_pipeline/note.py#L1-L6, .claude/skills/obsidian-note/SKILL.md#L8-L12 |

### technical

| id | title | sources |
|---|---|---|
| zone `macos` | macOS & apps | app/project.yml#L5-L9, #L44-L70, docs/decisions.md#L58-L79 |
| zone `adapters` | System adapters | app/project.yml#L11-L20, app/Sources/Detection/MeetingDetector.swift#L83-L117 |
| zone `hub` | App core | app/Sources/App/MeetingAssistantApp.swift#L1-L52, app/Sources/App/AppModel.swift#L8-L113 |
| zone `files` | Shared folder | README.md#L31-L54, app/Sources/Config/AppPaths.swift#L1-L12, pipeline/src/meeting_pipeline/config.py#L1-L12, shared/config.schema.json |
| zone `py` | Python pipeline | pipeline/pyproject.toml#L1-L13, pipeline/src/meeting_pipeline/stages.py#L1-L2, cli.py#L24-L96 |
| zone `out` | Outside | README.md#L50-L54, pipeline/src/meeting_pipeline/claude.py#L1-L8, keychain.py#L1-L23 |
| zone `vaultz` | Your vault | pipeline/src/meeting_pipeline/note.py#L38-L73, app/Sources/Library/NoteArchiver.swift#L1-L60, app/Sources/App/AppModel.swift#L243-L253 |
| `m_apps` | Meeting apps | app/Sources/Detection/MeetingSource.swift#L1-L33 |
| `m_coreaudio` | Core Audio | app/Sources/Detection/CoreAudioProcesses.swift#L1-L40, docs/decisions.md#L17-L25, #L58-L79 |
| `m_windows` | Window server | docs/decisions.md#L7-L15, app/Sources/Detection/SnapshotProvider.swift#L21-L54 |
| `m_eventkit` | EventKit | app/Sources/Calendar/CalendarLookup.swift#L20-L49 |
| `m_alerts` | System alerts | docs/decisions.md#L36-L42, app/Sources/Notifications/NotificationManager.swift#L4-L69 |
| `m_tcc` | Privacy (TCC) | app/Sources/Permissions/Permissions.swift#L1-L36, app/project.yml#L21-L25 |
| `a_detector` | Detector | Detection/SnapshotProvider.swift#L1-L55, Detection/MeetingRules.swift#L31-L90, Detection/MeetingDetector.swift#L83-L261 |
| `a_audio` | Audio recorder | Recording/AudioRecorder.swift#L6-L22, #L111-L180, #L214-L240, Recording/AACFileWriter.swift#L1-L40 |
| `a_frames` | Frame capturer | Recording/FrameCapturer.swift#L1-L144, Recording/PerceptualHash.swift#L1-L78, docs/decisions.md#L81-L90 |
| `a_calendar` | Calendar lookup | Calendar/CalendarLookup.swift#L1-L97, app/Tests/CalendarMatcherTests.swift |
| `a_notif` | Notifications | Notifications/NotificationManager.swift#L1-L236 |
| `a_perm` | Permissions | Permissions/Permissions.swift#L1-L77, CLAUDE.md#L87 |
| `h_runner` | PipelineRunner | Pipeline/PipelineRunner.swift#L1-L183, Pipeline/PipelineStatus.swift#L51-L112 |
| `h_rc` | Recording | Recording/RecordingController.swift#L1-L185, Recording/RecordingFolder.swift#L1-L83, Recording/RecordingMeta.swift#L1-L60 |
| `h_vocab` | Vocabulary | Vocabulary/VocabularyStore.swift#L1-L180, Vocabulary/VocabularyCSV.swift, shared/vocabulary.schema.json |
| `h_config` | Config store | Config/AppConfig.swift#L1-L123, Config/ConfigStore.swift#L1-L49, app/project.yml#L46-L47 |
| `h_library` | Library | Library/RecordingLibrary.swift#L1-L130, Library/NoteArchiver.swift#L1-L68, UI/Window/StorageView.swift#L1-L106 |
| `h_settings` | Settings | Settings/SystemIntegration.swift#L1-L80, UI/Window/SettingsView.swift#L50-L60 |
| `h_appmodel` | AppModel | App/AppModel.swift#L1-L492, App/MeetingAssistantApp.swift#L28-L52 |
| `h_ui` | Menu & window | UI/MenuContent.swift#L1-L331, UI/Window/MainWindow.swift#L1-L65, UI/MenuBarGhost.swift#L1-L50 |
| `f_folder` | Recording folder | Recording/RecordingMeta.swift#L1-L106, shared/meta.schema.json, pipeline/src/meeting_pipeline/recording.py#L1-L62 |
| `f_vocab` | Vocabulary files | pipeline/src/meeting_pipeline/vocabulary.py#L24-L30, shared/vocabulary.example.json |
| `f_config` | config.json | shared/config.example.json, shared/config.schema.json |
| `f_cache` | Pipeline caches | stages.py#L66-L72, summarize.py#L23-L26, note.py#L20-L72 |
| `f_status` | status.json | status.py#L1-L50, app/Sources/Pipeline/PipelineStatus.swift#L1-L35, shared/status.example.json |
| `y_cli` | CLI & stages | cli.py#L1-L100, stages.py#L42-L160 |
| `y_key` | Keychain read | keychain.py#L1-L23 |
| `y_audio` | Audio decode | audio.py#L1-L95, docs/decisions.md#L115-L116 |
| `y_diar` | Diarization | models.py#L49-L86, stages.py#L93-L107 |
| `y_vocab` | Vocab rules | vocabulary.py#L1-L160 |
| `y_trans` | Transcription | transcript.py#L1-L191, models.py#L89-L120 |
| `y_config` | Config reader | config.py#L1-L35 |
| `y_claude` | Claude steps | summarize.py#L40-L295, claude.py#L21-L78, pipeline/prompts/clean.md, pipeline/prompts/summary.md |
| `y_note` | Note writer | note.py#L1-L215 |
| `o_keychain` | Keychain | keychain.py#L6-L23, app/Sources/Settings/SystemIntegration.swift#L34-L64 |
| `o_hf` | Hugging Face | models.py#L17-L18, README.md#L61, README.md#L81-L84 |
| `o_claude` | Claude Code | claude.py#L29-L63, app/Sources/Pipeline/PipelineStatus.swift#L95-L97 |
| `o_anthropic` | Anthropic | README.md#L9, CLAUDE.md#L55 |
| `o_vault` | Obsidian vault | .claude/skills/obsidian-note/SKILL.md#L8-L12, note.py#L48-L61 |

(Swift paths without a prefix are under `app/Sources/`; Python files without a prefix are under
`pipeline/src/meeting_pipeline/`.)

## Connection evidence

### technical (47 connections)

| from → to | groups | evidence |
|---|---|---|
| h_appmodel → a_detector "poll" | detect | AppModel.swift L358-387: `startPolling` loop, `snapshotProvider.capture`, `detector.process(snapshot, now:)` |
| a_detector → m_apps | detect | SnapshotProvider.swift L10-12: `NSWorkspace.shared.runningApplications`, filtered by MeetingSource bundle IDs |
| a_detector → m_coreaudio | detect | SnapshotProvider.swift L17 → CoreAudioProcesses.swift L13-35 (`kAudioHardwarePropertyProcessObjectList`) |
| a_detector → m_windows | detect | SnapshotProvider.swift L25-29: `CGWindowListCopyWindowInfo([.optionAll, .excludeDesktopElements], …)` |
| h_appmodel → a_notif | detect | AppModel.swift L410-428: `notifications.postMeetingDetected / postMeetingProbablyEnded`; L62-71 choice callbacks |
| a_notif → m_alerts | detect | NotificationManager.swift L38-69 (`UNNotificationCategory`, actions), L175-177 `UNNotificationRequest` |
| h_appmodel → a_calendar | record | AppModel.swift L264: `calendar.event(at: session.acceptedAt ?? .now)` |
| a_calendar → m_eventkit | record | CalendarLookup.swift L23, L32, L43-45: `EKEventStore`, `requestFullAccessToEvents`, `predicateForEvents` |
| h_appmodel → h_rc | record | AppModel.swift L263-286 (`RecordingController(...)`), L288-304 (`recording.finish`) |
| h_rc → a_audio | record | RecordingController.swift L62-67 (`AudioRecorder(...)`), L137-153 (`audio.start()`) |
| h_rc → a_frames | record | RecordingController.swift L155-176 (`FrameCapturer(...)`, `capturer.start()`) |
| a_audio → m_coreaudio | record | AudioRecorder.swift L111-133 (`makeAggregateDevice`), L214-240 (`CATapDescription`, `makeProcessTap`) |
| a_frames → m_windows | record | FrameCapturer.swift L101-113: `SCContentFilter(desktopIndependentWindow:)`, `SCScreenshotManager.captureImage` |
| h_rc → f_folder "writes" | record, disk | RecordingController.swift L45-47 (`RecordingFolder.create`), L178-184 (`RecordingMetaStore.write`); audio/mic file URLs in the folder L62-67; frames dir L158 |
| h_ui → h_appmodel | ui | MenuContent.swift: buttons call `model.record`, `model.stopRecording`, `model.startManualRecording`, `model.retryLastProcessing` (L36, L91-129, L160) |
| h_ui → h_settings | ui, perm | SettingsView.swift L53 (`HuggingFaceToken.isStored`), L183 (`HuggingFaceToken.store`), L236-243 (`setLogin`) |
| h_appmodel → h_config | ui | AppModel.swift L350-356: `ConfigStore.load()` |
| h_appmodel → h_vocab | ui | AppModel.swift L34, L110 (`vocabulary.load()`), L307 (`vocabulary.reloadSuggestions()`) |
| h_appmodel → h_library | ui | AppModel.swift L35, L116-150 (`library.reload`, `expiredAudio`, `trash`) |
| h_appmodel → h_runner | launch | AppModel.swift L33, L82-84 (`enqueue`, `resumePending`), L234, L302, L386 (`pipeline.refresh()`) |
| h_appmodel → a_perm | perm | AppModel.swift L86-108 (`ScreenRecordingPermission`, `MicrophonePermission.request`), L459-464 |
| a_perm → m_tcc | perm | Permissions.swift L8-36: `CGPreflightScreenCaptureAccess`, `CGRequestScreenCaptureAccess`, `AVAudioApplication.requestRecordPermission` |
| h_config → f_config | disk | ConfigStore.swift L12-48 (read, create with defaults, atomic write); AppPaths.swift L9-11 |
| h_vocab → f_vocab | disk | VocabularyStore.swift L19-25 (both file URLs), L146-158 (`save`, atomic), L160-180 (suggestions, re-read before write) |
| h_library → f_folder | disk | RecordingLibrary.swift L52-81 (`scan`, `trashAudio`, `trash`) |
| h_runner → f_status "queued" | launch, disk | PipelineRunner.swift L48 (`PipelineStatus.writeQueued`), L73 (`PipelineStatus.read` every poll), L147 |
| h_runner → y_cli "taskpolicy -b uv run" | launch | PipelineStatus.swift L90-111 (`/usr/sbin/taskpolicy -b <uv> run --project <pipeline> meeting-pipeline [--force] <folder>`, env without ANTHROPIC_API_KEY); PipelineRunner.swift L103-128 (`Process().run()`, log to pipeline.log); pyproject.toml L12-13 (console script) |
| y_cli → f_folder "reads" | launch, pipe, disk | cli.py L38 → recording.py L33-62 (`meta.json`, audio file, `endedAt` required) |
| y_cli → f_status | pipe, disk | cli.py L45-94 (`write_status` for every state) → status.py L24-50 (atomic replace) |
| y_cli → f_cache | pipe, disk | stages.py L62-72 (`clear_caches` with --force), L117-122 (`save_transcript`), L170-172 (diarization.json); summarize.py L214-260, L268-294; note.py L64-72 (note.json) |
| y_vocab → f_vocab | disk | vocabulary.py L24-25, L43-62 (`load_vocabulary`), L114-160 (`merge_suggestions`, temp + replace) |
| y_config → f_config | disk | config.py L12, L28-35 |
| y_cli → y_audio | pipe | stages.py L90-91 (`load_audio`) |
| y_cli → y_key | pipe, perm | stages.py L55-58 (`hf_token()`) |
| y_key → y_diar | pipe | stages.py L58: `models.diarize(samples, token)` |
| y_audio → y_diar | pipe | stages.py L90, L98: decoded samples → `components.diarize(app)` |
| y_diar → y_trans | pipe | stages.py L98-116: turns → `build_transcript(...)` |
| y_vocab → y_trans | pipe | stages.py L112-116 (`initial_prompt(components.vocabulary, …)`) |
| y_trans → y_claude | pipe | stages.py L146-153 (`clean(segments, …)`, `summarize(lines, …)`) |
| y_claude → y_note | pipe | stages.py L157-159 (`write_note(recording, lines, summary, config)`) |
| y_config → y_note | pipe | note.py L42-46 (`config.obsidian_vault_path`), L93 (`config.user_name`) |
| y_key → o_keychain | ext, perm | keychain.py L16-21: `/usr/bin/security find-generic-password -s "MeetingAssistant HF token" -w` |
| y_diar → o_hf "model" | ext | models.py L63: `Pipeline.from_pretrained(DIARIZATION_MODEL, token=token)` |
| y_trans → o_hf | ext | models.py L95-97: `mlx_whisper.transcribe(..., path_or_hf_repo=WHISPER_MODEL)` |
| y_claude → o_claude "claude -p" | ext | claude.py L45-63 (`claude -p --output-format json --json-schema … --no-session-persistence --disallowedTools …`, prompt on stdin); summarize.py L230, L287 |
| o_claude → o_anthropic | ext | README.md L9 ("Jediná služba mimo něj je Claude … přes tvoje předplatné Claude Code"), CLAUDE.md L55; claude.py L3-4. The CLI's own network calls are not in this repository. |
| y_note → o_vault "writes" | ext, pipe | note.py L44-61 (`vault / "Meetings" / YYYY / MM`, `write_text`), L159-169 (`Moje úkoly.md`), L209-215 (attachments) |

Real connections that are **not drawn**, so the map stays readable. Each is described in the panel text instead:
- Settings → Keychain (SystemIntegration.swift L44-48, `security add-generic-password`). It would cross three zones.
  It is in the Keychain box text.
- Settings → login items (SMAppService, SystemIntegration.swift L6-31). It is in the Settings text.
- Library → vault (NoteArchiver moves notes to Meetings/Archiv). It is in the Library and vault text.
- AppModel → Obsidian app (`obsidian://open?path=` in AppModel.swift L243-253). It is in the vault zone text.
- PipelineRunner → Pipeline caches (reads note.json, trashes unselected frames: PipelineRunner.swift L161-182). It is
  in the runner text and tour step 8.
- VocabularyStore → caches (occurrence counts read transcript.json/cleaned.json: VocabularyStore.swift L117-143).
- Claude steps → vocabulary suggestions (summarize.py L249-253 → `merge_suggestions`). It is shown through Vocab
  rules → Vocabulary files.
- Audio decode → afconvert (audio.py L23-40). `afconvert` is named in the box subtitle.

### product (22 connections)

The product edges abstract the same evidence:
- apps → spot: MeetingRules.swift L45-65
- spot → ask "after 9 s": MeetingDetector.swift L191-209, AppConfig.swift L12
- spot → ghost and perm → ghost: MenuBarGhost.swift, MenuContent.swift L165-190
- ghost → manual: MenuContent.swift L34-41
- ask → audio/mic/screen "Yes": AppModel.swift L159-166 → L263-286
- manual → audio: AppModel.swift L187-203
- calendar → cal: CalendarLookup.swift
- audio → speakers: stages.py L98 (diarize on audio.m4a only)
- mic → transcript: transcript.py L100-105 (mic regions become speaker USER)
- speakers → transcript → vocab → Claude: stages.py L112-153; summarize.py L156-170 (`apply_spelling`)
- screen → Claude: summarize.py L272-287 (frames listed, Read tool allowed)
- cal → Claude: summarize.py L182-185, L223-229 (attendees in the prompt)
- Claude → outside "text + frames": claude.py L46-63
- Claude → note, note → vault: stages.py L159, note.py
- note → alert: PipelineRunner.swift L165 → AppModel.swift L306-312 → NotificationManager.swift L138-160
- recordings → processing "re-run": AppModel.swift L116-119 (`enqueue(force:)`)

## Conflicts (docs vs code; the code wins on behaviour)

1. **"Transcripts and frames never leave the Mac"** (README.md L51: "Zvuk, přepisy a snímky neopouštějí Mac").
   The code puts the full transcript lines into both Claude prompts. The summary call also lets Claude open the frame
   files with its Read tool (summarize.py L219-230, L272-287; prompts/summary.md L18-24). Only the audio stays local.
   README L9 does say that Claude is the one outside service. **Resolution:** the product diagram says the transcript
   text goes to Claude and Claude may open the frames: the "Your data" list (D2, D3) and tour step 7. The list intro
   names the conflict.
2. **Teams/Discord detection signals.** CLAUDE.md L34 and README L13 say detection uses the running app, the window
   title and audio. For Teams and Discord the code uses only "running + audio output". The window is just a guess for
   frames (MeetingRules.swift L57-64; docs/decisions.md L28-29 agrees with the code). **Resolution:** code.
3. **Microphone default.** docs/decisions.md L102-103 says a fixed device by name, default "Arctis Nova 7". The code
   default is empty = the system's default input, and the track can be switched off (AppConfig.swift L23-26;
   decisions.md L185 and CHANGELOG L10, L14 record the later change). **Resolution:** code.
4. **Audio retention "7 days".** CLAUDE.md L62 says "audio 7 dní", and the RecordingLibrary.swift L32 comment says
   files "are removed after audioRetentionDays". The code never deletes audio on its own. It counts expired audio,
   shows "Staré audio ke smazání" in the menu, and moves it to the Trash only from Storage after a confirmation
   (AppModel.swift L137, MenuContent.swift L63-65, StorageView.swift L16, L72). **Resolution:** code. The diagram
   says old audio can be moved to the Trash from Storage.
5. **Claude call shape.** The pipeline-dev skill (L30) says `claude -p "<prompt>" --allowedTools "Read"` with the
   prompt as an argument. The code passes the prompt on stdin with `--json-schema`, `--no-session-persistence` and an
   explicit `--disallowedTools` list. The clean step gets no tools; only the summary step gets Read (claude.py L45-56,
   summarize.py L230, L287). **Resolution:** code.
6. **`writing` state.** The pipeline-dev skill (L10) lists `queued → transcribing → summarizing → writing → done`.
   `State.WRITING` exists (status.py L18) but cli.py never writes it: "Zapisuji poznámku" is reported under
   `summarizing` (cli.py L56-70, stages.py L158). **Resolution:** the status.json box says "writing is defined but not
   written".
7. **Calendar requirement wording.** SETUP.md L67 says the note is named by date and time without an event. The code
   names the recording folder after the source (`teams`, …) when there is no event (RecordingController.swift L47).
   The note is titled "Meeting d. m. yyyy HH:MM" with a date-time file name (note.py L49-53, L108). Both docs and code
   agree for the note, so this is not a conflict for the diagram, just a detail.
8. **Model size.** README L81 says "zhruba 2 GB"; SETUP.md L71 says "~3–4 GB místa na modely". Only the README figure
   is quoted (Hugging Face box), as "per the README".

## Gaps

- **"Anthropic API" from the brief:** the code does not use the Anthropic API. It runs the Claude Code CLI and
  removes `ANTHROPIC_API_KEY` from the environment (claude.py L3-4, L45; PipelineStatus.swift L95-97). The diagram
  shows "Claude Code" → "Anthropic (Claude, via subscription)". How the CLI reaches Anthropic is not in this
  repository.
- **The brief's pipeline stages** were "audio, Claude clean/summary, note writing, keychain, config". The code has two
  more heavy stages, diarization (pyannote) and transcription (mlx-whisper), and a vocabulary module. All are drawn.
- **Hugging Face downloads:** the code only calls `from_pretrained` / `path_or_hf_repo`. Where the models are cached
  and how the hub is reached is library behaviour, not in this repository.
- **Personas:** none in the sources (one personal user). None drawn.
- **Release/distribution:** scripts/release.sh and install.sh were not run or read in depth. Distribution is mentioned
  only as "build from source; release zips are not notarized" (README L110, decisions.md L178-182).
- **Tests:** test files were read only for the schema-sync facts. There are no test boxes.

## Status evidence

`map.status.enabled: false` for both diagrams, so no status tags. Everything drawn is in the code at the commit.
README "Stav" (L195-197) says steps 1–4 are done and step 5 is tuning in real use. The diagrams therefore describe the
app as it is (`maturity: running`).

## Branding

No website, so the colours come from the app icon (`app/Resources/Assets.xcassets/AppIcon.appiconset/icon_256x256.png`,
a white ghost with headphones on a lavender-to-periwinkle background): theme `light`, primary `#4a4a9e` (the
headphones), secondary `#8e9df3` (the periwinkle of the background). The icon itself was not copied: the logo is the
Lucide icon `headphones`, so the diagram doesn't look official. Shape `rounded`. `meta.url` links
https://github.com/mnovak99/meetBuddy. Both hero footnotes say: "Unofficial diagram of meetBuddy by mnovak99 (MIT),
read from commit 8875a4a · not affiliated with the author".

## Assumptions

- Language: the docs and the app UI are Czech. The diagram is in English (`language: en`), and a few Czech UI strings
  are quoted with an English gloss ("Nahrávat ručně", "Poznámka je hotová", section names).
- "Customer-owned" (shown with the short tag "Yours") is used for the user's own meeting apps, calendar and Obsidian
  vault. "External" is used for Claude/Anthropic, Hugging Face, the macOS Keychain and the macOS frameworks. The
  macOS & apps zone hides its badge (`boundaryTag: false`) to keep its header short; its dashed border still marks it
  external.
- The technical diagram groups classes into module boxes: Detector = SnapshotProvider + MeetingRules +
  MeetingDetector + CoreAudioProcesses; Recording = RecordingController + RecordingFolder + RecordingMeta. Boxes are
  modules, as the brief asked, not classes.
- Line ranges point at the code that shows the behaviour. Some boxes cite a whole file when the whole file is the
  module.
- Layout: the technical map is wide (about 2500 × 700 world px, wider than the 16:9 the style guide aims for). Each
  adapter sits in the row of the macOS API it wraps, AppModel has free lanes so its spokes don't cross boxes, and the
  launch edge has its own lane through the shared folder. Tabs and tour steps zoom to readable sizes. The overview is
  small text on a 1600 px screen.
