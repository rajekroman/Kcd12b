import { describe, expect, it } from 'vitest';
import {
  PORTRAIT_DEFINITIONS,
  PORTRAIT_EXPRESSIONS,
  getPortraitDefinition,
  getPortraitFrameIndex,
  getPortraitTextureKey
} from '../data/portraits';
import {
  buildPortraitAtlas,
  buildPortraitFrame,
  validatePortraitFrame
} from '../systems/PortraitSystem';

const portraitSignature = (npcId: (typeof PORTRAIT_DEFINITIONS)[number]['npcId']): string =>
  buildPortraitAtlas(getPortraitDefinition(npcId))
    .flatMap((frame) =>
      frame.pixels.map(
        (pixel) =>
          `${frame.expression}:${pixel.x},${pixel.y},${pixel.width},${pixel.height},${pixel.color},${pixel.alpha ?? 1}`
      )
    )
    .join('|');

describe('PortraitSystem', () => {
  it('definuje deset obyvatel a šest výrazů', () => {
    expect(PORTRAIT_DEFINITIONS).toHaveLength(10);
    expect(new Set(PORTRAIT_DEFINITIONS.map((definition) => definition.npcId)).size).toBe(10);
    expect(PORTRAIT_EXPRESSIONS).toEqual([
      'neutral',
      'warm',
      'stern',
      'concerned',
      'suspicious',
      'proud'
    ]);
  });

  it('všech šedesát portrétních frameů zůstane uvnitř 48 × 56', () => {
    for (const definition of PORTRAIT_DEFINITIONS) {
      const atlas = buildPortraitAtlas(definition);
      expect(atlas).toHaveLength(PORTRAIT_EXPRESSIONS.length);
      for (const frame of atlas) {
        expect(validatePortraitFrame(frame), `${definition.npcId}:${frame.expression}`).toEqual([]);
      }
    }
  });

  it('každý obyvatel má unikátní kompletní portrétní atlas', () => {
    const signatures = PORTRAIT_DEFINITIONS.map((definition) =>
      portraitSignature(definition.npcId)
    );
    expect(new Set(signatures).size).toBe(PORTRAIT_DEFINITIONS.length);
  });

  it('výrazy mění obočí oči nebo ústa', () => {
    const katerina = getPortraitDefinition('trader-katerina');
    const warm = buildPortraitFrame(katerina, 'warm');
    const suspicious = buildPortraitFrame(katerina, 'suspicious');
    const proud = buildPortraitFrame(katerina, 'proud');

    expect(warm.pixels).not.toEqual(suspicious.pixels);
    expect(proud.pixels).not.toEqual(suspicious.pixels);
  });

  it('mapuje stabilní frame indexy a texture keys', () => {
    expect(getPortraitFrameIndex('neutral')).toBe(0);
    expect(getPortraitFrameIndex('proud')).toBe(5);
    expect(getPortraitTextureKey('smith-bohdan')).toBe('portrait:smith-bohdan');
  });

  it('neznámý portrét je explicitní chyba', () => {
    expect(() => getPortraitDefinition('unknown' as never)).toThrow(
      'Unknown portrait definition unknown'
    );
  });
});
