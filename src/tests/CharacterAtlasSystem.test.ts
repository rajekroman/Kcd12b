import { describe, expect, it } from 'vitest';
import {
  CHARACTER_ATLAS_DEFINITIONS,
  CHARACTER_FRAME_STATES,
  getCharacterAnimationKey,
  getCharacterAtlasDefinition,
  getCharacterFrameIndex
} from '../data/characterAtlases';
import {
  buildCharacterAtlas,
  buildCharacterFrame,
  validateCharacterFrame
} from '../systems/CharacterAtlasSystem';

const frameSignature = (key: (typeof CHARACTER_ATLAS_DEFINITIONS)[number]['key']): string =>
  buildCharacterAtlas(getCharacterAtlasDefinition(key))
    .flatMap((frame) =>
      frame.pixels.map(
        (pixel) =>
          `${frame.state}:${pixel.x},${pixel.y},${pixel.width},${pixel.height},${pixel.color},${pixel.alpha ?? 1}`
      )
    )
    .join('|');

describe('CharacterAtlasSystem', () => {
  it('definuje dvanáct unikátních postav a šest stavů', () => {
    expect(CHARACTER_ATLAS_DEFINITIONS).toHaveLength(12);
    expect(new Set(CHARACTER_ATLAS_DEFINITIONS.map((definition) => definition.key)).size).toBe(12);
    expect(CHARACTER_FRAME_STATES).toEqual([
      'idle',
      'walk-a',
      'walk-b',
      'action',
      'hurt',
      'sleep'
    ]);
  });

  it('všech 72 snímků zůstane uvnitř pixelového rámce', () => {
    for (const definition of CHARACTER_ATLAS_DEFINITIONS) {
      const atlas = buildCharacterAtlas(definition);
      expect(atlas).toHaveLength(CHARACTER_FRAME_STATES.length);
      for (const frame of atlas) {
        expect(validateCharacterFrame(frame), `${definition.key}:${frame.state}`).toEqual([]);
        expect(frame.pixels.length).toBeGreaterThan(10);
      }
    }
  });

  it('každá role má odlišný kompletní atlas', () => {
    const signatures = CHARACTER_ATLAS_DEFINITIONS.map((definition) =>
      frameSignature(definition.key)
    );
    expect(new Set(signatures).size).toBe(CHARACTER_ATLAS_DEFINITIONS.length);
  });

  it('chůze mění polohu nohou a akce mění siluetu', () => {
    const player = getCharacterAtlasDefinition('player');
    const walkA = buildCharacterFrame(player, 'walk-a');
    const walkB = buildCharacterFrame(player, 'walk-b');
    const action = buildCharacterFrame(player, 'action');
    const idle = buildCharacterFrame(player, 'idle');

    expect(walkA.pixels).not.toEqual(walkB.pixels);
    expect(action.pixels).not.toEqual(idle.pixels);
  });

  it('mapuje stabilní indexy a názvy animací', () => {
    expect(getCharacterFrameIndex('idle')).toBe(0);
    expect(getCharacterFrameIndex('sleep')).toBe(5);
    expect(getCharacterAnimationKey('guard-vojtech', 'walk')).toBe('guard-vojtech:walk');
  });

  it('neznámý atlas je explicitní chyba', () => {
    expect(() => getCharacterAtlasDefinition('unknown' as never)).toThrow(
      'Unknown character atlas unknown'
    );
  });
});
