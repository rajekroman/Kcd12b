import { describe, expect, it } from 'vitest';
import { NPC_BY_ID, NPC_DEFINITIONS, NPC_LOCATIONS } from '../data/npcs';
import {
  getNpcScheduleEntry,
  getNpcScheduleState,
  normalizeWorldHour,
  scheduleContainsHour,
  worldClockToHour
} from '../systems/NpcScheduleSystem';

describe('NpcScheduleSystem', () => {
  it('definuje přesně deset jedinečných obyvatel', () => {
    expect(NPC_DEFINITIONS).toHaveLength(10);
    expect(new Set(NPC_DEFINITIONS.map((npc) => npc.id)).size).toBe(10);
    expect(Object.keys(NPC_BY_ID)).toHaveLength(10);
  });

  it('každý rozvrh pokrývá celý den bez mrtvé čtvrthodiny', () => {
    for (const npc of NPC_DEFINITIONS) {
      for (let hour = 0; hour < 24; hour += 0.25) {
        expect(() => getNpcScheduleEntry(npc, hour), `${npc.id} at ${hour}`).not.toThrow();
      }
    }
  });

  it('správně vyhodnotí úsek přes půlnoc', () => {
    const sleeping = NPC_BY_ID['innkeeper-marta'].schedule[0];

    expect(scheduleContainsHour(sleeping, 23.5)).toBe(true);
    expect(scheduleContainsHour(sleeping, 2)).toBe(true);
    expect(scheduleContainsHour(sleeping, 12)).toBe(false);
  });

  it('převede herní čas na hodinu v rozsahu 0–24', () => {
    expect(worldClockToHour(0)).toBe(0);
    expect(worldClockToHour(30)).toBe(6);
    expect(worldClockToHour(60)).toBe(12);
    expect(worldClockToHour(120)).toBe(0);
    expect(normalizeWorldHour(-1)).toBe(23);
  });

  it('vrátí aktivitu a skutečný cíl z mapy lokací', () => {
    const state = getNpcScheduleState(NPC_BY_ID['smith-bohdan'], 9);

    expect(state.activity).toBe('working');
    expect(state.locationId).toBe('forge');
    expect(state.target).toEqual(NPC_LOCATIONS.forge);
  });

  it('večer přesune obyvatele na jiné aktivity', () => {
    expect(getNpcScheduleState(NPC_BY_ID['guard-vojtech'], 21).activity).toBe('socializing');
    expect(getNpcScheduleState(NPC_BY_ID['priest-matej'], 19).activity).toBe('praying');
    expect(getNpcScheduleState(NPC_BY_ID['farmer-ondra'], 23).activity).toBe('sleeping');
  });
});
