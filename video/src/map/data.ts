// The stylised map (world coordinates, 1600 x 840). Names follow the Acme example.
import {
  Wallet, MapPin, ClipboardCheck, CheckCircle2, Undo2, User, PackageCheck,
  Monitor, Smartphone, Plug, Route, ShoppingCart, Receipt, Tag, ShoppingBasket, CreditCard, ShieldCheck,
  Truck, Mail, Landmark, Package, Send, Headphones, Banknote, ChartLine, GitBranch, Search, Database, Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const WORLD = { w: 1600, h: 840 };

export type Rect = { x: number; y: number; w: number; h: number };

export type Zone = Rect & { id: string; title: string; sub?: string; color: string; tag?: string };
export type MapNode = Rect & {
  id: string; zone: string; title: string; sub: string; icon: LucideIcon; badge?: string; badgeColor?: string; big?: boolean; planned?: boolean;
};
// h: right side -> left side, v: bottom -> top, u: top -> bottom (going up)
export type Edge = { id: string; from: string; to: string; dir: 'h' | 'v' | 'u' };
export type MapDef = { id: string; w: number; h: number; zones: Zone[]; nodes: MapNode[]; edges: Edge[]; order: string[] };

export const ZONES: Zone[] = [
  { id: 'channels', x: 40, y: 80, w: 280, h: 480, title: 'Channels', color: '#94a3b8', tag: 'EXTERNAL' },
  { id: 'core', x: 360, y: 80, w: 820, h: 480, title: 'Commerce core', sub: 'Order path', color: '#a78bfa' },
  { id: 'partners', x: 1220, y: 80, w: 340, h: 480, title: 'Partners', color: '#22d3ee', tag: 'PARTNER' },
  { id: 'backoffice', x: 40, y: 600, w: 280, h: 200, title: 'Back office', color: '#fbbf24' },
  { id: 'ops', x: 360, y: 600, w: 820, h: 200, title: 'Operations', sub: 'Run & observe', color: '#a3e635' },
  { id: 'data', x: 1220, y: 600, w: 340, h: 200, title: 'Data', color: '#34d399' },
];

const col2 = (i: number) => 136 + i * 68;

export const NODES: MapNode[] = [
  { id: 'web', zone: 'channels', x: 64, y: 136, w: 232, h: 60, title: 'Web shop', sub: 'Browser storefront', icon: Monitor },
  { id: 'mobile', zone: 'channels', x: 64, y: 212, w: 232, h: 60, title: 'Mobile app', sub: 'iOS and Android', icon: Smartphone },
  { id: 'partnerapi', zone: 'channels', x: 64, y: 288, w: 232, h: 60, title: 'Partner API', sub: 'B2B resellers', icon: Plug },

  { id: 'api', zone: 'core', x: 384, y: 136, w: 300, h: 72, title: 'Commerce API', sub: 'One public API', icon: Route, badge: 'CORE' },
  { id: 'checkout', zone: 'core', x: 384, y: 286, w: 300, h: 96, title: 'Checkout', sub: 'PlaceOrder · calls 6 services', icon: ShoppingCart, badge: 'HUB', big: true },
  { id: 'orders', zone: 'core', x: 384, y: 462, w: 300, h: 60, title: 'Order service', sub: 'Orders and invoices', icon: Receipt },

  { id: 'catalog', zone: 'core', x: 852, y: col2(0), w: 300, h: 56, title: 'Catalog', sub: 'Products, prices, stock', icon: Tag },
  { id: 'cart', zone: 'core', x: 852, y: col2(1), w: 300, h: 56, title: 'Cart', sub: 'Baskets in Redis', icon: ShoppingBasket },
  { id: 'payments', zone: 'core', x: 852, y: col2(2), w: 300, h: 56, title: 'Payments', sub: 'Authorise and capture', icon: CreditCard },
  { id: 'fraud', zone: 'core', x: 852, y: col2(3), w: 300, h: 56, title: 'Fraud checks', sub: 'Score before capture', icon: ShieldCheck, planned: true },
  { id: 'shipping', zone: 'core', x: 852, y: col2(4), w: 300, h: 56, title: 'Shipping', sub: 'Quotes and labels', icon: Truck },
  { id: 'email', zone: 'core', x: 852, y: col2(5), w: 300, h: 56, title: 'Email', sub: 'Order confirmations', icon: Mail },

  { id: 'psp', zone: 'partners', x: 1244, y: col2(2), w: 292, h: 56, title: 'Payment provider', sub: 'Card network', icon: Landmark },
  { id: 'carrier', zone: 'partners', x: 1244, y: col2(4), w: 292, h: 56, title: 'Carrier', sub: 'Parcel delivery', icon: Package },
  { id: 'mailer', zone: 'partners', x: 1244, y: col2(5), w: 292, h: 56, title: 'Mail provider', sub: 'SMTP relay', icon: Send },

  { id: 'support', zone: 'backoffice', x: 64, y: 656, w: 232, h: 56, title: 'Support desk', sub: 'Refunds, tickets', icon: Headphones },
  { id: 'finance', zone: 'backoffice', x: 64, y: 724, w: 232, h: 56, title: 'Finance', sub: 'Payouts, reports', icon: Banknote },

  { id: 'metrics', zone: 'ops', x: 384, y: 668, w: 244, h: 64, title: 'Metrics & alerts', sub: 'Prometheus · Grafana', icon: ChartLine },
  { id: 'deploys', zone: 'ops', x: 648, y: 668, w: 244, h: 64, title: 'Deployments', sub: 'GitOps with Argo CD', icon: GitBranch },
  { id: 'logs', zone: 'ops', x: 912, y: 668, w: 244, h: 64, title: 'Logs', sub: 'Central search', icon: Search, planned: true },

  { id: 'postgres', zone: 'data', x: 1244, y: 656, w: 292, h: 56, title: 'Orders DB', sub: 'PostgreSQL', icon: Database },
  { id: 'redis', zone: 'data', x: 1244, y: 724, w: 292, h: 56, title: 'Cart store', sub: 'Redis', icon: Layers },
];

export const EDGES: Edge[] = [
  { id: 'web-api', from: 'web', to: 'api', dir: 'h' },
  { id: 'mobile-api', from: 'mobile', to: 'api', dir: 'h' },
  { id: 'partner-api', from: 'partnerapi', to: 'api', dir: 'h' },
  { id: 'api-checkout', from: 'api', to: 'checkout', dir: 'v' },
  { id: 'co-catalog', from: 'checkout', to: 'catalog', dir: 'h' },
  { id: 'co-cart', from: 'checkout', to: 'cart', dir: 'h' },
  { id: 'co-payments', from: 'checkout', to: 'payments', dir: 'h' },
  { id: 'co-fraud', from: 'checkout', to: 'fraud', dir: 'h' },
  { id: 'co-shipping', from: 'checkout', to: 'shipping', dir: 'h' },
  { id: 'co-email', from: 'checkout', to: 'email', dir: 'h' },
  { id: 'co-orders', from: 'checkout', to: 'orders', dir: 'v' },
  { id: 'pay-psp', from: 'payments', to: 'psp', dir: 'h' },
  { id: 'ship-carrier', from: 'shipping', to: 'carrier', dir: 'h' },
  { id: 'email-mailer', from: 'email', to: 'mailer', dir: 'h' },
  { id: 'cart-redis', from: 'cart', to: 'redis', dir: 'h' },
];

export const nodeById = (id: string) => NODES.find((n) => n.id === id)!;
export const zoneById = (id: string) => ZONES.find((z) => z.id === id)!;

export const edgePath = (e: Edge, nodes: MapNode[] = NODES) => {
  const a = nodes.find((n) => n.id === e.from)!;
  const b = nodes.find((n) => n.id === e.to)!;
  if (e.dir === 'u') {
    const x1 = a.x + a.w / 2;
    const y1 = a.y;
    const x2 = b.x + b.w / 2;
    const y2 = b.y + b.h;
    const m = (y1 - y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${y1 - m} ${x2} ${y2 + m} ${x2} ${y2}`;
  }
  if (e.dir === 'v') {
    const x1 = a.x + a.w / 2;
    const y1 = a.y + a.h;
    const x2 = b.x + b.w / 2;
    const y2 = b.y;
    const m = (y2 - y1) / 2;
    return `M ${x1} ${y1} C ${x1} ${y1 + m} ${x2} ${y2 - m} ${x2} ${y2}`;
  }
  const x1 = a.x + a.w;
  const y1 = a.y + a.h / 2;
  const x2 = b.x;
  const y2 = b.y + b.h / 2;
  const m = (x2 - x1) / 2;
  return `M ${x1} ${y1} C ${x1 + m} ${y1} ${x2 - m} ${y2} ${x2} ${y2}`;
};

// Highlight sets used by the tour, the tabs and the persona.
export const FOCUS = {
  overview: { x: 20, y: 60, w: 1560, h: 760 } as Rect,
  checkoutFan: { x: 372, y: 116, w: 796, h: 428 } as Rect,
  payments: { x: 640, y: 250, w: 910, h: 210 } as Rect,
  tourStep3: {
    nodes: ['checkout', 'catalog', 'cart', 'payments', 'fraud', 'shipping', 'email'],
    edges: ['co-catalog', 'co-cart', 'co-payments', 'co-fraud', 'co-shipping', 'co-email'],
  },
  tourStep4: { nodes: ['checkout', 'payments', 'fraud', 'psp'], edges: ['co-payments', 'co-fraud', 'pay-psp'] },
  paymentsTab: { nodes: ['checkout', 'payments', 'fraud', 'psp', 'finance'], edges: ['co-payments', 'co-fraud', 'pay-psp'] },
  persona: { nodes: ['web', 'api', 'checkout', 'payments', 'psp'], edges: ['web-api', 'api-checkout', 'co-payments', 'pay-psp'] },
};

export const ARCH: MapDef = {
  id: 'arch', w: WORLD.w, h: WORLD.h, zones: ZONES, nodes: NODES, edges: EDGES,
  order: ['web', 'mobile', 'partnerapi', 'api', 'checkout', 'orders', 'catalog', 'cart', 'payments', 'fraud', 'shipping', 'email', 'psp', 'carrier', 'mailer', 'support', 'finance', 'metrics', 'deploys', 'logs', 'postgres', 'redis'],
};

// Second diagram in the same file: a process flow (follows the Acme "Checkout process" example).
const AUTO = '#34d399';
const MANUAL = '#fbbf24';
const pz = (i: number) => 40 + i * 380;
const pn = (i: number) => pz(i) + 24;
export const PROCESS: MapDef = {
  id: 'process', w: 1560, h: 700,
  zones: [
    { id: 'p-cart', x: pz(0), y: 80, w: 340, h: 320, title: '1 · Cart', color: '#38bdf8' },
    { id: 'p-pay', x: pz(1), y: 80, w: 340, h: 320, title: '2 · Payment', color: '#a78bfa' },
    { id: 'p-ful', x: pz(2), y: 80, w: 340, h: 320, title: '3 · Fulfilment', color: '#fbbf24' },
    { id: 'p-after', x: pz(3), y: 80, w: 340, h: 320, title: '4 · After sale', color: '#34d399' },
    { id: 'p-parties', x: 40, y: 450, w: 1480, h: 190, title: 'External parties', color: '#94a3b8', tag: 'EXTERNAL' },
  ],
  nodes: [
    { id: 'add', zone: 'p-cart', x: pn(0), y: 150, w: 292, h: 64, title: 'Add to cart', sub: 'Web or app', icon: ShoppingCart, badge: 'AUTOMATED', badgeColor: AUTO },
    { id: 'review', zone: 'p-cart', x: pn(0), y: 262, w: 292, h: 64, title: 'Review basket', sub: 'Price & stock check', icon: ClipboardCheck, badge: 'AUTOMATED', badgeColor: AUTO },
    { id: 'address', zone: 'p-pay', x: pn(1), y: 150, w: 292, h: 64, title: 'Enter address', sub: 'Validated on entry', icon: MapPin, badge: 'AUTOMATED', badgeColor: AUTO },
    { id: 'charge', zone: 'p-pay', x: pn(1), y: 262, w: 292, h: 92, title: 'Pay', sub: 'Card or wallet', icon: Wallet, badge: 'AUTOMATED', badgeColor: AUTO, big: true },
    { id: 'pick', zone: 'p-ful', x: pn(2), y: 150, w: 292, h: 64, title: 'Pick & pack', sub: 'Warehouse team', icon: Package, badge: 'MANUAL', badgeColor: MANUAL },
    { id: 'ship', zone: 'p-ful', x: pn(2), y: 262, w: 292, h: 64, title: 'Ship', sub: 'Label and handover', icon: Truck, badge: 'AUTOMATED', badgeColor: AUTO },
    { id: 'deliver', zone: 'p-after', x: pn(3), y: 150, w: 292, h: 64, title: 'Delivered', sub: 'Tracking closed', icon: CheckCircle2, badge: 'AUTOMATED', badgeColor: AUTO },
    { id: 'ret', zone: 'p-after', x: pn(3), y: 262, w: 292, h: 64, title: 'Return & refund', sub: 'Within 30 days', icon: Undo2, badge: 'MANUAL', badgeColor: MANUAL },
    { id: 'customer', zone: 'p-parties', x: 64, y: 530, w: 440, h: 64, title: 'Customer', sub: 'Places the order', icon: User },
    { id: 'carrier2', zone: 'p-parties', x: 560, y: 530, w: 440, h: 64, title: 'Carrier', sub: 'Delivers parcels', icon: PackageCheck },
    { id: 'psp2', zone: 'p-parties', x: 1056, y: 530, w: 440, h: 64, title: 'Payment provider', sub: 'Authorises cards', icon: CreditCard },
  ],
  edges: [
    { id: 'add-review', from: 'add', to: 'review', dir: 'v' },
    { id: 'review-address', from: 'review', to: 'address', dir: 'h' },
    { id: 'address-charge', from: 'address', to: 'charge', dir: 'v' },
    { id: 'charge-pick', from: 'charge', to: 'pick', dir: 'h' },
    { id: 'pick-ship', from: 'pick', to: 'ship', dir: 'v' },
    { id: 'ship-deliver', from: 'ship', to: 'deliver', dir: 'h' },
    { id: 'deliver-ret', from: 'deliver', to: 'ret', dir: 'v' },
    { id: 'customer-review', from: 'customer', to: 'review', dir: 'u' },
    { id: 'charge-psp', from: 'charge', to: 'psp2', dir: 'v' },
    { id: 'ship-carrier', from: 'ship', to: 'carrier2', dir: 'v' },
  ],
  order: ['add', 'review', 'address', 'charge', 'pick', 'ship', 'deliver', 'ret', 'customer', 'carrier2', 'psp2'],
};
export const PROCESS_OVERVIEW: Rect = { x: 20, y: 60, w: 1520, h: 600 };
