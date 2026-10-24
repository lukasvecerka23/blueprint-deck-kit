# Extraction report: How PostgreSQL works

Output: `examples/postgresql/index.html` (one diagram, architecture, technical viewpoint, `paper` theme, `#336791`, square).
Check: `8 zones · 34 boxes · 32 connections · 6 tabs · 14 tour steps · 0 overlays` with 0 errors, 0 warnings.
Not checked in a browser (`#check` screen check not run): the lead does the visual review.

## Sources read

All from the PostgreSQL documentation, current version (the pages were titled "Documentation: 18" when fetched on
2026-10-24). Fetched with `curl` and read as plain text with the section anchors kept. Each cited anchor was checked against the fetched HTML.

| page | used for |
|---|---|
| tutorial-arch.html (1.2 Architectural Fundamentals) | client/server model, process per connection, client kinds |
| query-path.html, connect-estab.html (51.1, 51.2) | path of a query, postmaster, backends, libpq/JDBC |
| parser-stage.html, rule-system.html, planner-optimizer.html, executor.html (51.3–51.6) | parser, rewriter, planner, executor, ModifyTable |
| mvcc-intro.html (13.1) | snapshots; readers and writers don't block each other |
| wal-intro.html, wal-async-commit.html, wal-configuration.html (28.3–28.5) | WAL, commit flush, asynchronous commit, checkpoints, WAL recycling |
| routine-vacuuming.html (24.1) | VACUUM, visibility map, wraparound, autovacuum launcher/workers |
| runtime-config-resource.html (19.4) | shared_buffers, work_mem, maintenance_work_mem, background writer |
| runtime-config-wal.html (19.5) | wal_level, synchronous_commit, wal_buffers, wal_writer_delay, full_page_writes, checkpoints, archiving |
| high-availability.html, warm-standby.html, hot-standby.html (26, 26.2, 26.4) | standby operation, streaming replication, slots, synchronous replication, hot standby |
| continuous-archiving.html (25.3) | WAL archive, base backup, point-in-time recovery |
| logical-replication.html, logical-replication-architecture.html (29, 29.9) | publish/subscribe, walsender + pgoutput, apply worker |
| storage-file-layout.html, storage-page-layout.html, storage-toast.html (66.1, 66.2, 66.6) | PGDATA, per-relation files, forks (_fsm, _vm), pages, t_xmin/t_xmax, TOAST |
| monitoring-ps.html, monitoring-stats.html (27.1, 27.2.1) | process titles in ps, cumulative statistics in shared memory |
| app-psql.html | psql |
| glossary.html | one-line definitions of every process, shared memory, WAL file, heap, checkpoint |

## Structure

Workflow `confirm_structure: false`, so this is the structure as proposed and built:

| area | boundary | boxes | why |
|---|---|---|---|
| Clients | external | Application, psql, Other clients | users' programs, left of the frame |
| Connections | ours | Postmaster, Backend process | process-per-user model (51.2) |
| Path of a query | ours | Parser, Rewriter, Planner / optimizer, Executor | the four stages of 51.1, top to bottom |
| Memory | ours | work_mem, Shared buffers, WAL buffers | shared memory + per-operation memory |
| Background work | ours | Checkpointer, Background writer, Cumulative statistics, Autovacuum launcher, Autovacuum workers | auxiliary processes that touch data pages |
| Storage on disk | ours | Table files, WAL files, TOAST tables, Commit status (pg_xact), Index files, Visibility map | the data directory |
| WAL processes | ours | Replication slots, WAL archiver, WAL sender, WAL writer, Startup process | everything that works on the WAL |
| Other servers | ours, but outside the frame (explicit `frame` x/y/w/h) | WAL receiver, WAL replay, Hot standby, WAL archive, Apply worker, Subscriber | replicas and the archive are other machines |

Edge groups: `connect`, `query` (main flow), `write`, `bg`, `mvcc`, `repl`.

Tabs: Overview · Path of a query · Writing safely (WAL) · MVCC & vacuum · Replication (opens the list "Ways to copy
the data": Streaming replica, WAL archive & PITR, Logical replication) · Processes.

Personas: none (see Assumptions).

Tour (follows one `UPDATE accounts … WHERE id = 42`):
1. One server, many cooperating processes
2. Each connection gets its own backend
3. The UPDATE arrives as plain text
4. The planner picks the cheapest path
5. The executor pulls rows and changes them
6. An UPDATE writes a new row version
7. Log first, change the data later
8. COMMIT waits for one sequential flush
9. Dirty pages reach the disk in the background
10. After a crash, replay from the last checkpoint
11. Vacuum removes the old row version
12. The same WAL streams to a replica
13. Archive it, or copy only some tables
14. Why it holds together (summary, 5 tiles)

## Inventory (id → source)

| id | sources (anchors on postgresql.org/docs/current/) |
|---|---|
| app | connect-estab#CONNECT-ESTAB, tutorial-arch#TUTORIAL-ARCH |
| psql | app-psql#APP-PSQL, tutorial-arch |
| tools | tutorial-arch |
| postmaster | connect-estab, glossary#GLOSSARY-POSTMASTER, tutorial-arch |
| backend | connect-estab, glossary#GLOSSARY-BACKEND, monitoring-ps#MONITORING-PS |
| parser | parser-stage#PARSER-STAGE-PARSER, #PARSER-STAGE-TRANSFORMATION-PROCESS |
| rewriter | rule-system#RULE-SYSTEM, query-path#QUERY-PATH |
| planner | planner-optimizer#PLANNER-OPTIMIZER, #PLANNER-OPTIMIZER-GENERATING-POSSIBLE-PLANS, routine-vacuuming#VACUUM-FOR-STATISTICS |
| executor | executor#EXECUTOR, query-path |
| workmem | runtime-config-resource#GUC-WORK-MEM |
| shbuf | glossary#GLOSSARY-SHARED-MEMORY, runtime-config-resource#GUC-SHARED-BUFFERS, glossary#GLOSSARY-DATA-PAGE |
| walbuf | runtime-config-wal#GUC-WAL-BUFFERS, wal-configuration#WAL-CONFIGURATION |
| checkpointer | glossary#GLOSSARY-CHECKPOINTER, #GLOSSARY-CHECKPOINT, wal-configuration, runtime-config-wal#RUNTIME-CONFIG-WAL-CHECKPOINTS |
| bgwriter | runtime-config-resource#RUNTIME-CONFIG-RESOURCE-BACKGROUND-WRITER, glossary#GLOSSARY-BACKGROUND-WRITER |
| stats | monitoring-stats#MONITORING-STATS-SETUP, glossary#GLOSSARY-CUMULATIVE-STATISTICS |
| avlauncher | routine-vacuuming#AUTOVACUUM, glossary#GLOSSARY-AUTOVACUUM |
| avworkers | routine-vacuuming#AUTOVACUUM, #VACUUM-BASICS, #VACUUM-FOR-SPACE-RECOVERY, runtime-config-resource#GUC-MAINTENANCE-WORK-MEM |
| heap | storage-file-layout#STORAGE-FILE-LAYOUT, storage-page-layout#STORAGE-PAGE-LAYOUT, #STORAGE-TUPLE-LAYOUT, glossary#GLOSSARY-HEAP |
| walfiles | glossary#GLOSSARY-WAL-FILE, wal-intro#WAL-INTRO, wal-configuration, continuous-archiving#CONTINUOUS-ARCHIVING |
| toast | storage-toast#STORAGE-TOAST, #STORAGE-TOAST-ONDISK, glossary#GLOSSARY-TOAST |
| pgxact | storage-file-layout, mvcc-intro#MVCC-INTRO, storage-page-layout#STORAGE-TUPLE-LAYOUT |
| indexes | storage-file-layout, storage-page-layout, routine-vacuuming#VACUUM-FOR-VISIBILITY-MAP |
| maps | storage-file-layout, routine-vacuuming#VACUUM-FOR-VISIBILITY-MAP |
| slots | warm-standby#STREAMING-REPLICATION-SLOTS |
| archiver | glossary#GLOSSARY-WAL-ARCHIVER, runtime-config-wal#RUNTIME-CONFIG-WAL-ARCHIVING, wal-configuration |
| walsender | glossary#GLOSSARY-WAL-SENDER, warm-standby#STREAMING-REPLICATION, #STREAMING-REPLICATION-MONITORING, logical-replication-architecture#LOGICAL-REPLICATION-ARCHITECTURE |
| walwriter | glossary#GLOSSARY-WAL-WRITER, runtime-config-wal#GUC-WAL-WRITER-DELAY, wal-async-commit#WAL-ASYNC-COMMIT |
| startup | glossary#GLOSSARY-STARTUP-PROCESS, wal-configuration, wal-intro |
| walreceiver | glossary#GLOSSARY-WAL-RECEIVER, warm-standby#STREAMING-REPLICATION, #STREAMING-REPLICATION-MONITORING |
| replay | warm-standby#STANDBY-SERVER-OPERATION, glossary#GLOSSARY-STARTUP-PROCESS |
| standby | hot-standby#HOT-STANDBY, high-availability#HIGH-AVAILABILITY, warm-standby#SYNCHRONOUS-REPLICATION |
| archive | continuous-archiving#CONTINUOUS-ARCHIVING, glossary#GLOSSARY-WAL-ARCHIVER |
| apply | logical-replication-architecture |
| subscriber | logical-replication#LOGICAL-REPLICATION, runtime-config-wal#GUC-WAL-LEVEL |

Zones cite the same pages (see `sources` on each zone).

## Conflicts

- **"Stats" as a background process.** The brief listed "stats" among background workers. The current docs (27.2.1)
  say cumulative statistics are collected in shared memory by every process; there is no statistics process. The box
  is "Cumulative statistics · counters in shared memory". It sits in the Background work area next to the autovacuum
  launcher, because autovacuum is what reads it and that keeps the connection short. The panel says it is not a process.
- No disagreements between doc pages were found.

## Gaps

- **Connection poolers**: the pages read do not describe connection pooling. pgpool-II appears only as statement-based
  replication middleware (26.1). Left out.
- **I/O workers** (`io_method = worker`, `io_workers`) are in the current docs (19.4) but are newer and outside the
  story. Left out.
- **Parallel query workers, logger, WAL summarizer** are left out to keep the map readable (they are in the glossary).
- **Lock manager and the data in shared memory beyond buffers**: the docs mention it only briefly. Not drawn.

## Status evidence

Not applicable: `map.status.enabled: false`, and everything shown is part of PostgreSQL as documented.

## Branding

No website fetched and no logo image (trademark). `meta.logo` = `icon:database` (Lucide has no elephant icon).
Primary `#336791`, secondary `#0d9488`, `paper` preset, `square` shape. `scroll-text` (for WAL) was copied from
`reference/lucide-all.json` into `icons`, because it is not one of the 373 bundled icons.
Panel technology follows the viewpoint (`settings.panel.tech` not set, as the mapping table says for `from-viewpoint`).

## Assumptions

- **Numbers** are used only where the docs give them as defaults or typical values: 8 kB pages, 1 GB segments,
  16 MB WAL segments ("typically"), shared_buffers 128 MB / 25 % guidance, work_mem 4 MB, checkpoint_timeout 5 min,
  max_wal_size 1 GB, wal_writer_delay 200 ms, TOAST threshold about 2 kB, streaming lag "typically under one second".
  They are the docs' current values and may change between versions.
- **Example statement**: the tour's `UPDATE accounts … WHERE id = 42` is an illustration, not something from the docs.
- **No personas** (`personas.enabled: false`): the docs define no user roles, and personas are optional for a
  technical view, so none were invented. The audience is engineers in general.
- **Layout**: the frame has explicit `x/y/w/h` so that "Other servers" (a boundary `ours` zone) sits outside it.
  No boundary value fits "another server of the same system", so that zone gets no badge or legend entry.
- **Explicit positions** for the Memory and WAL processes boxes, so that the connections to the storage area stay
  short and don't cross other boxes (executor → shared buffers / WAL buffers; WAL buffers → WAL files; WAL writer → WAL files).
