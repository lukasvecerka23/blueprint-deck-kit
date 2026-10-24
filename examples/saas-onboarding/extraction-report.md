# Extraction report: Northwind Insights onboarding journey (examples/saas-onboarding/index.html)

**Fictional company, made up for this example.** The only source is `source/brief.md`, written for this example; every
number in it and in the diagram is illustrative.

Generated unattended (`workflow.confirm_structure: false`), so the proposed structure is recorded here instead of being
confirmed first. Check result: `10 zones · 20 boxes · 24 connections · 6 tabs · 12 tour steps · 1 overlays`,
0 errors, 0 warnings. No browser check was run (see Assumptions).

## Sources read

- `examples/saas-onboarding/source/brief.md` (sections 1–5). Nothing else; `sources.invent: never`.

## Structure (proposed and used)

Type `journey`, viewpoint `product` (`settings.panel.tech: off`: no technology section in the panels).

Stages left to right (one zone each, numbered as the brief numbers them):
1 · Discover · 2 · Start a trial · 3 · Connect data · 4 · First dashboard · 5 · Invite the team · 6 · Go paid · 7 · Expand

Bottom row, under the stage each one serves:
- Email provider (`external`), under stages 1–2
- The customer's systems: POS, ERP (`customer`), under stages 3–4
- Payment provider (`external`), under stages 6–7

Status tags ("Who leads"): Self-serve / Human-led. Human-led = success manager call, annual invoice, business review
(brief §1). External boxes have no status.

Personas and paths:
- **Head of Operations** (buyer): website → pricing page → trial signup → invite IT admin → first dashboard → success
  manager call → plans & billing → business review
- **Analyst** (user): trial signup → onboarding emails → sample data → in-app checklist → first dashboard → team invite
- **IT admin** (connects data): invite your IT admin → data connectors → POS system (also lights ERP and email delivery)

Tabs: Overview · Typical path · Time to first insight · Pain points (a list, one pain per stage) · Outside parties ·
Personas (automatic).

Sheet: "Numbers to watch" (one illustrative metric per stage + the team's priority).

Tour (12 steps):
1. Seven stages from first visit to expansion
2. Discover: the price per store decides the click
3. A trial in two minutes, followed by four emails
4. Connecting data is where trials stall (the team's priority, as the config comment asks)
5. The first dashboard with real data is the activation moment
6. Trials that bring the team convert
7. Card for smaller chains, invoice for larger ones
8. Revenue grows with the store rollout
9. Three people, three different paths (personas list)
10. One pain per stage (pain list)
11. Numbers to watch (sheet)
12. Why this journey matters (summary tiles)

Edge groups: `journey` (main flow: the typical path), `buyer` and `user` (the extra connections the personas' paths
need), `data`, `email`, `money`. The overview shows only the main flow (`overview_edges: main`).

## Inventory

All sources are `examples/saas-onboarding/source/brief.md`; section given.

| id | section |
|---|---|
| website, pricing | §3 (1 · Discover), §1 (plans) |
| signup, emails | §3 (2 · Start a trial), §2 (analyst signs up first) |
| sample, itinvite, connectors | §3 (3 · Connect data), §2, §4 |
| checklist, dashboard | §3 (4 · First dashboard) |
| invite, csm | §3 (5 · Invite the team) |
| billing, invoice | §3 (6 · Go paid), §1 |
| stores, modules, qbr | §3 (7 · Expand), §1 |
| mailer, pos, erp, psp | §4 External parties |
| personas | §2 Personas |
| pains list, metrics sheet | the Pain / Metric sentences in §3, §5 (priority) |

## Conflicts

None (single source written for this example).

## Gaps

- The brief gives no numbers for the in-app checklist itself (completion rate) or for the add-on modules; their
  panels show no metric rather than an invented one.
- The IT-admin setup link and the weekly digest are sent through the email provider (§4), but no connection is drawn
  from stages 3 and 5 to it: such a line would cross the whole map. It is said in the email box's text and lit for the
  IT admin persona instead.

## Status evidence

From the brief's §1 ("three touchpoints are human-led"); everything else in the journey is self-serve.

## Branding

Fictional company, no website. Theme `light`, primary `#2563eb`, secondary `#f97316`, shape `square`, logo
`icon:chart-column-big`, all from the config.

## Assumptions

- Every metric is shown with "(illustrative)" or under an "illustrative" heading, per the config comment.
- Pains and metrics are in each touchpoint's panel as `extra` sections ("Pain", "Metric (illustrative)"), as the style
  guide suggests for journeys.
- No visual check in a browser (not allowed for this run). Connections only run between neighbouring stages or
  straight down to the bottom row, so none passes another box (the checker agrees), and every persona path has an
  edge between each pair of consecutive steps.
