import {
  NPC_LOCATIONS,
  type NpcActivity,
  type NpcDefinition,
  type NpcLocationId,
  type NpcScheduleEntry,
  type WorldPoint
} from '../data/npcs';

export interface NpcScheduleState {
  npcId: NpcDefinition['id'];
  hour: number;
  activity: NpcActivity;
  locationId: NpcLocationId;
  target: WorldPoint;
}

export const normalizeWorldHour = (hour: number): number => {
  if (!Number.isFinite(hour)) return 0;
  return ((hour % 24) + 24) % 24;
};

export const worldClockToHour = (dayClock: number, dayDurationSeconds = 120): number => {
  if (!Number.isFinite(dayClock) || !Number.isFinite(dayDurationSeconds) || dayDurationSeconds <= 0) {
    return 0;
  }
  return normalizeWorldHour((dayClock / dayDurationSeconds) * 24);
};

export const scheduleContainsHour = (entry: NpcScheduleEntry, hour: number): boolean => {
  const current = normalizeWorldHour(hour);
  const start = normalizeWorldHour(entry.startHour);
  const end = entry.endHour === 24 ? 24 : normalizeWorldHour(entry.endHour);

  if (start === end) return true;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
};

export const getNpcScheduleEntry = (
  definition: NpcDefinition,
  hour: number
): NpcScheduleEntry => {
  const entry = definition.schedule.find((candidate) => scheduleContainsHour(candidate, hour));
  if (!entry) {
    throw new Error(`NPC ${definition.id} has no schedule entry for hour ${normalizeWorldHour(hour)}.`);
  }
  return entry;
};

export const getNpcScheduleState = (
  definition: NpcDefinition,
  hour: number
): NpcScheduleState => {
  const normalizedHour = normalizeWorldHour(hour);
  const entry = getNpcScheduleEntry(definition, normalizedHour);
  return {
    npcId: definition.id,
    hour: normalizedHour,
    activity: entry.activity,
    locationId: entry.locationId,
    target: NPC_LOCATIONS[entry.locationId]
  };
};

export const getNpcScheduleStateFromClock = (
  definition: NpcDefinition,
  dayClock: number,
  dayDurationSeconds = 120
): NpcScheduleState =>
  getNpcScheduleState(definition, worldClockToHour(dayClock, dayDurationSeconds));
