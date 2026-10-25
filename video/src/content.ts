// ============================================================================
// ALL ON-SCREEN TEXT AND SCENE TIMINGS LIVE HERE.
// Timings are in frames at 30 fps (30 frames = 1 second).
// Reading rule used: about 1 s per 3-4 words + 1 s, and at least ~3 s per beat.
// ============================================================================

export const FPS = 30;

// Scene lengths (frames). Scenes overlap by OVERLAP frames for a soft cross-fade.
export const OVERLAP = 12;
export const SCENES = {
  hook: 115, // 1: documents of every kind drift in
  config: 182, // 2: the configurator (incl. theme), "Copy prompt"
  agent: 165, // 3: the agent reads the files: in a terminal (pasted prompt) or in a chat (attached files)
  map: 920, // 4-10: map builds, tour, side panel, tabs/personas, switcher, edit, PDF
  oneFile: 130, // 11: one HTML file: send it, or share a link
  real: 240, // 12: real recording of the Acme example
  end: 105, // 13: end card
};

// Inside the map scene (local frames, 0 = start of the map scene).
export const MAP_BEATS = {
  build: 0, // areas, boxes and connections appear
  tour: 135, // camera glides to tour step 3 ...
  tourStep2: 235, // ... then step 4
  tourEnd: 335, // tour card leaves
  panel: 335, // click a box, side panel slides in (what / why)
  tabs: 455, // "Payments" tab highlights one path
  persona: 525, // persona "Shopper" numbered path
  switcher: 595, // switcher menu -> second diagram (process flow)
  edit: 725, // press E, retype a title, "Saved into the file"
  editEnd: 835, // edit mode ends
  pdf: 835, // press P, pages fan out
};
export type MapBeats = typeof MAP_BEATS;
export const NEVER = 100000; // use for beats a cut leaves out

export const sceneStarts = () => {
  const order = ['hook', 'config', 'agent', 'map', 'oneFile', 'real', 'end'] as const;
  const starts = {} as Record<(typeof order)[number], number> & { total: number };
  let t = 0;
  order.forEach((k, i) => {
    starts[k] = t;
    t += SCENES[k] - (i < order.length - 1 ? OVERLAP : 0);
  });
  starts.total = t;
  return starts;
};

// Subtitles: [scene, from, to, text] (from/to are local frames inside that scene).
export const SUBTITLES: Array<[keyof typeof SCENES, number, number, string]> = [
  ['hook', 6, 111, 'Your architecture lives in 40 docs and 3 repos.'],
  ['config', 8, 178, 'Describe the deck, then copy the prompt.'],
  ['agent', 6, 160, 'Your AI agent reads them, in a terminal or in a chat.'],
  ['map', 10, 133, '…and builds one interactive map.'],
  ['map', 137, 233, 'A guided tour zooms in, step by step.'],
  ['map', 237, 333, 'Each step tells one part of the story.'],
  ['map', 337, 453, 'Click any box to see what it is and why.'],
  ['map', 457, 593, 'Tabs and personas show one path at a time.'],
  ['map', 597, 723, 'One file can hold several diagrams.'],
  ['map', 727, 833, 'Press E to edit it right in the file.'],
  ['map', 837, 920, 'Press P for a PDF deck.'],
  ['oneFile', 6, 128, 'One HTML file, works offline. Send it, or share a link.'],
  ['real', 10, 140, 'This is the real thing.'],
];

// Scene 1: documents of every kind. `type` picks the badge colour (see FILE_TYPES).
export const FILES = [
  { name: 'Q3-strategy.pptx', type: 'PPTX', meta: '42 slides' },
  { name: 'architecture.pdf', type: 'PDF', meta: '18 pages' },
  { name: 'requirements.docx', type: 'DOCX', meta: 'v7 · tracked changes' },
  { name: 'Team wiki export', type: 'WIKI', meta: 'Confluence · 120 pages' },
  { name: 'openapi.yaml', type: 'YAML', meta: 'OpenAPI 3.1' },
  { name: 'README.md', type: 'MD', meta: 'repo: shop-api' },
  { name: 'main.go', type: 'GO', meta: 'repo: checkout' },
  { name: 'k8s/deploy.yaml', type: 'YAML', meta: '6 services' },
  { name: 'roadmap.xlsx', type: 'XLSX', meta: '3 sheets' },
  { name: 'Product notes', type: 'NOTES', meta: 'Notion export' },
] as const;

// Recognisable colours per file type (no vendor logos).
export const FILE_TYPES: Record<string, { color: string; kind: 'slides' | 'doc' | 'code' | 'sheet' }> = {
  PPTX: { color: '#f97316', kind: 'slides' },
  PDF: { color: '#ef4444', kind: 'doc' },
  DOCX: { color: '#3b82f6', kind: 'doc' },
  WIKI: { color: '#2dd4bf', kind: 'doc' },
  NOTES: { color: '#e5e7eb', kind: 'doc' },
  YAML: { color: '#c084fc', kind: 'code' },
  MD: { color: '#94a3b8', kind: 'doc' },
  GO: { color: '#22d3ee', kind: 'code' },
  XLSX: { color: '#22c55e', kind: 'sheet' },
};

// Scene 2: configurator (simplified version of the real one).
export const CONFIG = {
  title: 'Configure your Blueprint Deck',
  audienceLabel: 'Audience',
  audience: ['Executives', 'Architects', 'Engineers', 'Business', 'Investors'],
  audiencePick: 0,
  viewpointLabel: 'Viewpoint',
  viewpoints: ['Product', 'Mixed', 'Technical'],
  viewpointPick: 0,
  tabsLabel: 'Tabs',
  tabs: ['main-flow', 'governance', 'operations', 'deployment', 'data', 'security', 'cost', 'roadmap'],
  tabsPick: [0, 2, 7],
  storyLabel: 'Tour story',
  stories: ['problem-solution', 'use-case'],
  storyPick: 0,
  themeLabel: 'Theme',
  // from the real configurator (THEMES in configurator/index.html)
  themes: [
    { id: 'midnight', mode: 'dark', bg: '#050914', node: '#182142', primary: '#3b82f6', secondary: '#7c3aed' },
    { id: 'blueprint', mode: 'dark', bg: '#06132a', node: '#14284f', primary: '#1f6feb', secondary: '#22b8e6' },
    { id: 'graphite', mode: 'dark', bg: '#0a0b0e', node: '#24262d', primary: '#22d3ee', secondary: '#6366f1' },
    { id: 'forest', mode: 'dark', bg: '#04100c', node: '#123026', primary: '#10b981', secondary: '#0ea5e9' },
    { id: 'ember', mode: 'dark', bg: '#0f0708', node: '#34181b', primary: '#e11d48', secondary: '#f97316' },
    { id: 'light', mode: 'light', bg: '#f4f6fa', node: '#ffffff', primary: '#2563eb', secondary: '#7c3aed' },
    { id: 'paper', mode: 'light', bg: '#f7f3ec', node: '#fffdf9', primary: '#c2410c', secondary: '#0f766e' },
  ],
  themePick: 'blueprint', // the map scenes after the configurator use this theme (midnight or blueprint)
  primaryLabel: 'Primary colour',
  secondaryLabel: 'Secondary colour',
  copy: 'Copy prompt',
  copied: 'Copied',
  promptTitle: 'Your configuration',
};

// Scene 3: agent terminal.
export const AGENT = {
  title: 'your agent · terminal',
  chatTitle: 'chat · any AI app',
  terminalHeading: 'In a terminal',
  chatHeading: 'In a chat',
  chatFiles: [
    { name: 'architecture.pdf', type: 'PDF' },
    { name: 'requirements.docx', type: 'DOCX' },
    { name: 'notes.md', type: 'MD' },
  ],
  chatMessage: 'Make a Blueprint Deck of these docs for our executives.',
  chatReading: 'Reading 3 files…',
  chatReply: 'Here is your Blueprint Deck:',
  chatResult: { name: 'acme-commerce.html', meta: 'Blueprint Deck · map, tour, 2 diagrams' },
  prompt: [
    '/blueprint-deck  make a Blueprint Deck of this repo',
    'audience: executives · viewpoint: product',
    'tabs: main-flow, operations, roadmap',
    'tour: problem-solution · theme: blueprint',
  ],
  lines: ['Reading 40 docs and 3 repos…', '22 boxes · 15 connections · 10 tour steps', 'Wrote acme-commerce.html'],
  agents: 'Claude Code · Codex · Gemini · or a chat in Claude, ChatGPT, Gemini',
};

// Scenes 4-10: map chrome, tour, side panel, switcher, edit.
export const MAP_TEXT = {
  deckTitle: 'Acme Commerce',
  deckSub: 'Platform architecture',
  tabs: ['Overview', 'Order path', 'Payments', 'Operations', 'Personas'],
  tourButton: 'Guided tour',
  tour: [
    { step: 3, total: 10, title: 'Checkout calls six services', body: 'One PlaceOrder call reaches six services.' },
    { step: 4, total: 10, title: 'Fraud checks before capture', body: 'Payments asks for a fraud score first.' },
  ],
  panel: {
    node: 'payments',
    title: 'Payments',
    sub: 'Authorise and capture',
    what: 'Authorises and captures every card payment for an order.',
    why: ['Fraud score before every capture', 'One provider, easy to switch'],
    sources: ['src/payments/charge.go#L80', 'docs/architecture.md#payments'],
  },
  persona: { name: 'Shopper', sub: 'Buys a pair of shoes', path: ['web', 'api', 'checkout', 'payments', 'psp'] },
  diagrams: [
    { title: 'Platform architecture', sub: 'Components, connections, personas' },
    { title: 'Checkout process', sub: 'Steps from cart to delivery' },
  ],
  switcherHint: 'Keys 1–2 switch diagrams',
  processTabs: ['Overview', 'Happy path', 'Money flow', 'Returns'],
  edit: { node: 'ret', from: 'Return & refund', to: 'Free returns', banner: 'Editing · press E to finish', toast: 'Saved into the file' },
  pdf: { file: 'acme-commerce.pdf', pages: '14 pages' },
};

// Scene 11.
export const ONE_FILE = {
  file: 'acme-commerce.html',
  pills: ['One file', 'Works offline', 'No server, no install'],
  link: 'claude.ai/public/artifacts/7f3c…',
  linkButton: 'Copy link',
  sendLabel: 'Send the file',
  shareLabel: 'or share a link',
};

// Scene 12: real recording (made by `npm run record`), plus captions for the browser bar.
export const REAL = {
  clip: 'real/acme-clip.mp4',
  startFrom: 2.4, // seconds into the clip (starts around tour step 2)
  captions: [
    { at: 0, text: 'Guided tour · real example' },
    { at: 4.6, text: 'Switching to the second diagram' },
  ],
  url: 'file:///…/examples/acme/index.html',
};

// Scene 13.
export const END = {
  name: 'Blueprint Deck Kit',
  tagline: 'Turn your docs into a deck people will love.',
  license: 'Free & open source · MIT',
  site: 'blueprintdeck.dev',
  repo: 'github.com/lukasvecerka23/blueprint-deck-kit',
};

// Optional background music: put a file at public/music.mp3. It fades in and out.
export const MUSIC = { file: 'music.mp3', volume: 0.55, fadeIn: 30, fadeOut: 60 };

// ============================================================================
// SHORT SOCIAL CUT (PromoShort 1080x1080, PromoShortWide 1920x1080), about 26 s.
// hook -> map builds -> tour (2 steps) -> switcher + edit -> real clip -> end card.
// The map uses the default Midnight brand theme.
// ============================================================================
export const SHORT = {
  scenes: { hook: 110, map: 495, real: 115, end: 100 },
  beats: {
    build: 0, tour: 110, tourStep2: 200, tourEnd: 290,
    panel: NEVER, tabs: NEVER, persona: NEVER,
    switcher: 290, edit: 395, editEnd: 495, pdf: NEVER,
  } as MapBeats,
  subtitles: [
    ['hook', 6, 106, 'Your architecture lives in 40 docs and 3 repos.'],
    ['map', 10, 108, 'Your AI agent turns them into one interactive map.'],
    ['map', 112, 198, 'A guided tour zooms in, step by step.'],
    ['map', 202, 288, 'Each step tells one part of the story.'],
    ['map', 292, 393, 'One file can hold several diagrams.'],
    ['map', 397, 495, 'Press E to edit it right in the file.'],
    ['real', 8, 112, 'This is the real thing.'],
  ] as Array<['hook' | 'map' | 'real' | 'end', number, number, string]>,
  real: { startFrom: 6.6, captions: [{ at: 0, text: 'Switching diagrams · real example' }] },
};
