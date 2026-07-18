export type NpcId =
  | 'smith-bohdan'
  | 'innkeeper-marta'
  | 'guard-vojtech'
  | 'farmer-ondra'
  | 'herbalist-agnes'
  | 'miller-jakub'
  | 'priest-matej'
  | 'trader-katerina'
  | 'stablehand-pavel'
  | 'washerwoman-anna';

export type NpcActivity =
  | 'sleeping'
  | 'eating'
  | 'working'
  | 'serving'
  | 'patrolling'
  | 'praying'
  | 'trading'
  | 'gathering'
  | 'washing'
  | 'socializing'
  | 'closing';

export type NpcLocationId =
  | 'forge'
  | 'smith-home'
  | 'tavern'
  | 'inn-room'
  | 'guard-post'
  | 'guard-barracks'
  | 'market'
  | 'north-field'
  | 'farmer-home'
  | 'herb-garden'
  | 'herbalist-home'
  | 'mill'
  | 'miller-home'
  | 'church'
  | 'priest-house'
  | 'merchant-home'
  | 'stables'
  | 'stable-home'
  | 'wash-bank'
  | 'washer-home'
  | 'well';

export interface WorldPoint {
  x: number;
  y: number;
}

export interface NpcScheduleEntry {
  startHour: number;
  endHour: number;
  locationId: NpcLocationId;
  activity: NpcActivity;
}

export interface NpcDefinition {
  id: NpcId;
  name: string;
  role: string;
  texture: 'smith';
  tint: number;
  movementSpeed: number;
  interactionRadius: number;
  schedule: readonly NpcScheduleEntry[];
}

export const NPC_LOCATIONS: Record<NpcLocationId, WorldPoint> = {
  forge: { x: 355, y: 330 },
  'smith-home': { x: 315, y: 520 },
  tavern: { x: 535, y: 365 },
  'inn-room': { x: 540, y: 285 },
  'guard-post': { x: 755, y: 375 },
  'guard-barracks': { x: 725, y: 305 },
  market: { x: 470, y: 405 },
  'north-field': { x: 665, y: 545 },
  'farmer-home': { x: 620, y: 620 },
  'herb-garden': { x: 145, y: 555 },
  'herbalist-home': { x: 120, y: 505 },
  mill: { x: 930, y: 555 },
  'miller-home': { x: 970, y: 620 },
  church: { x: 175, y: 255 },
  'priest-house': { x: 220, y: 310 },
  'merchant-home': { x: 520, y: 250 },
  stables: { x: 650, y: 300 },
  'stable-home': { x: 690, y: 255 },
  'wash-bank': { x: 545, y: 620 },
  'washer-home': { x: 475, y: 565 },
  well: { x: 430, y: 470 }
};

export const NPC_DEFINITIONS: readonly NpcDefinition[] = [
  {
    id: 'smith-bohdan',
    name: 'Bohdan',
    role: 'kovář',
    texture: 'smith',
    tint: 0xffffff,
    movementSpeed: 46,
    interactionRadius: 55,
    schedule: [
      { startHour: 0, endHour: 5.5, locationId: 'smith-home', activity: 'sleeping' },
      { startHour: 5.5, endHour: 6.5, locationId: 'tavern', activity: 'eating' },
      { startHour: 6.5, endHour: 12, locationId: 'forge', activity: 'working' },
      { startHour: 12, endHour: 13, locationId: 'tavern', activity: 'eating' },
      { startHour: 13, endHour: 18, locationId: 'forge', activity: 'working' },
      { startHour: 18, endHour: 20, locationId: 'tavern', activity: 'socializing' },
      { startHour: 20, endHour: 24, locationId: 'smith-home', activity: 'sleeping' }
    ]
  },
  {
    id: 'innkeeper-marta',
    name: 'Marta',
    role: 'hostinská',
    texture: 'smith',
    tint: 0xd9a66b,
    movementSpeed: 42,
    interactionRadius: 55,
    schedule: [
      { startHour: 23, endHour: 5.5, locationId: 'inn-room', activity: 'sleeping' },
      { startHour: 5.5, endHour: 7, locationId: 'tavern', activity: 'working' },
      { startHour: 7, endHour: 14, locationId: 'tavern', activity: 'serving' },
      { startHour: 14, endHour: 15, locationId: 'market', activity: 'trading' },
      { startHour: 15, endHour: 23, locationId: 'tavern', activity: 'serving' }
    ]
  },
  {
    id: 'guard-vojtech',
    name: 'Vojtěch',
    role: 'strážný',
    texture: 'smith',
    tint: 0x8896a8,
    movementSpeed: 58,
    interactionRadius: 52,
    schedule: [
      { startHour: 22, endHour: 5, locationId: 'guard-barracks', activity: 'sleeping' },
      { startHour: 5, endHour: 8, locationId: 'guard-post', activity: 'patrolling' },
      { startHour: 8, endHour: 12, locationId: 'market', activity: 'patrolling' },
      { startHour: 12, endHour: 13, locationId: 'tavern', activity: 'eating' },
      { startHour: 13, endHour: 20, locationId: 'guard-post', activity: 'patrolling' },
      { startHour: 20, endHour: 22, locationId: 'tavern', activity: 'socializing' }
    ]
  },
  {
    id: 'farmer-ondra',
    name: 'Ondra',
    role: 'sedlák',
    texture: 'smith',
    tint: 0x9a7d4f,
    movementSpeed: 44,
    interactionRadius: 52,
    schedule: [
      { startHour: 20.5, endHour: 5, locationId: 'farmer-home', activity: 'sleeping' },
      { startHour: 5, endHour: 6, locationId: 'well', activity: 'gathering' },
      { startHour: 6, endHour: 12, locationId: 'north-field', activity: 'working' },
      { startHour: 12, endHour: 13, locationId: 'farmer-home', activity: 'eating' },
      { startHour: 13, endHour: 18.5, locationId: 'north-field', activity: 'working' },
      { startHour: 18.5, endHour: 20.5, locationId: 'tavern', activity: 'socializing' }
    ]
  },
  {
    id: 'herbalist-agnes',
    name: 'Anežka',
    role: 'bylinkářka',
    texture: 'smith',
    tint: 0x78966a,
    movementSpeed: 45,
    interactionRadius: 55,
    schedule: [
      { startHour: 21, endHour: 6, locationId: 'herbalist-home', activity: 'sleeping' },
      { startHour: 6, endHour: 10, locationId: 'herb-garden', activity: 'gathering' },
      { startHour: 10, endHour: 13, locationId: 'market', activity: 'trading' },
      { startHour: 13, endHour: 14, locationId: 'tavern', activity: 'eating' },
      { startHour: 14, endHour: 19, locationId: 'herb-garden', activity: 'working' },
      { startHour: 19, endHour: 21, locationId: 'herbalist-home', activity: 'working' }
    ]
  },
  {
    id: 'miller-jakub',
    name: 'Jakub',
    role: 'mlynář',
    texture: 'smith',
    tint: 0xb3a58b,
    movementSpeed: 43,
    interactionRadius: 54,
    schedule: [
      { startHour: 21.5, endHour: 5.5, locationId: 'miller-home', activity: 'sleeping' },
      { startHour: 5.5, endHour: 12, locationId: 'mill', activity: 'working' },
      { startHour: 12, endHour: 13, locationId: 'miller-home', activity: 'eating' },
      { startHour: 13, endHour: 18, locationId: 'mill', activity: 'working' },
      { startHour: 18, endHour: 20, locationId: 'market', activity: 'trading' },
      { startHour: 20, endHour: 21.5, locationId: 'tavern', activity: 'socializing' }
    ]
  },
  {
    id: 'priest-matej',
    name: 'Matěj',
    role: 'kněz',
    texture: 'smith',
    tint: 0x6e6673,
    movementSpeed: 40,
    interactionRadius: 55,
    schedule: [
      { startHour: 21, endHour: 5, locationId: 'priest-house', activity: 'sleeping' },
      { startHour: 5, endHour: 8, locationId: 'church', activity: 'praying' },
      { startHour: 8, endHour: 11, locationId: 'market', activity: 'socializing' },
      { startHour: 11, endHour: 14, locationId: 'church', activity: 'praying' },
      { startHour: 14, endHour: 18, locationId: 'priest-house', activity: 'working' },
      { startHour: 18, endHour: 21, locationId: 'church', activity: 'praying' }
    ]
  },
  {
    id: 'trader-katerina',
    name: 'Kateřina',
    role: 'kupkyně',
    texture: 'smith',
    tint: 0xaa6f72,
    movementSpeed: 47,
    interactionRadius: 55,
    schedule: [
      { startHour: 22, endHour: 6, locationId: 'merchant-home', activity: 'sleeping' },
      { startHour: 6, endHour: 7, locationId: 'tavern', activity: 'eating' },
      { startHour: 7, endHour: 12, locationId: 'market', activity: 'trading' },
      { startHour: 12, endHour: 13, locationId: 'tavern', activity: 'eating' },
      { startHour: 13, endHour: 19, locationId: 'market', activity: 'trading' },
      { startHour: 19, endHour: 22, locationId: 'merchant-home', activity: 'closing' }
    ]
  },
  {
    id: 'stablehand-pavel',
    name: 'Pavel',
    role: 'podkoní',
    texture: 'smith',
    tint: 0x7f6548,
    movementSpeed: 52,
    interactionRadius: 52,
    schedule: [
      { startHour: 21, endHour: 4.5, locationId: 'stable-home', activity: 'sleeping' },
      { startHour: 4.5, endHour: 11, locationId: 'stables', activity: 'working' },
      { startHour: 11, endHour: 12, locationId: 'tavern', activity: 'eating' },
      { startHour: 12, endHour: 18.5, locationId: 'stables', activity: 'working' },
      { startHour: 18.5, endHour: 21, locationId: 'tavern', activity: 'socializing' }
    ]
  },
  {
    id: 'washerwoman-anna',
    name: 'Anna',
    role: 'pradlena',
    texture: 'smith',
    tint: 0x7896a1,
    movementSpeed: 44,
    interactionRadius: 52,
    schedule: [
      { startHour: 20.5, endHour: 5.5, locationId: 'washer-home', activity: 'sleeping' },
      { startHour: 5.5, endHour: 7, locationId: 'well', activity: 'gathering' },
      { startHour: 7, endHour: 12, locationId: 'wash-bank', activity: 'washing' },
      { startHour: 12, endHour: 13, locationId: 'washer-home', activity: 'eating' },
      { startHour: 13, endHour: 17, locationId: 'wash-bank', activity: 'washing' },
      { startHour: 17, endHour: 19, locationId: 'market', activity: 'socializing' },
      { startHour: 19, endHour: 20.5, locationId: 'washer-home', activity: 'closing' }
    ]
  }
];

export const NPC_BY_ID: Record<NpcId, NpcDefinition> = Object.fromEntries(
  NPC_DEFINITIONS.map((npc) => [npc.id, npc])
) as Record<NpcId, NpcDefinition>;
