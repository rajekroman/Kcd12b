import { describe, expect, it } from "vitest";

import { firstHorseQuestContent } from "./horseQuestContent";

const duplicateValues = (values: readonly string[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates];
};

describe("firstHorseQuestContent", () => {
  it("uses unique quest, stage, dialogue and choice identifiers", () => {
    expect(duplicateValues(firstHorseQuestContent.stages.map((stage) => stage.id))).toEqual([]);
    expect(duplicateValues(firstHorseQuestContent.dialogues.map((node) => node.id))).toEqual([]);
    expect(
      duplicateValues(
        firstHorseQuestContent.dialogues.flatMap((node) => node.choices.map((choice) => choice.id)),
      ),
    ).toEqual([]);
  });

  it("references only declared NPC speakers", () => {
    for (const dialogue of firstHorseQuestContent.dialogues) {
      expect(firstHorseQuestContent.npcIds).toContain(dialogue.speakerId);
    }
  });

  it("keeps dialogue links resolvable", () => {
    const dialogueIds = new Set(firstHorseQuestContent.dialogues.map((node) => node.id));

    for (const choice of firstHorseQuestContent.dialogues.flatMap((node) => node.choices)) {
      if (choice.nextNodeId) {
        expect(dialogueIds.has(choice.nextNodeId)).toBe(true);
      }
    }
  });

  it("contains two mechanically distinct acquisition solutions", () => {
    const allEffects = firstHorseQuestContent.dialogues.flatMap((node) =>
      node.choices.map((choice) => ({ id: choice.id, effects: choice.effects })),
    );
    const lawful = allEffects.find(({ id }) => id === "choice.lawful_service");
    const covert = allEffects.find(({ id }) => id === "choice.covert_release");

    expect(lawful).toBeDefined();
    expect(covert).toBeDefined();
    expect(lawful?.effects).not.toEqual(covert?.effects);
    expect(covert?.effects).toContainEqual({
      kind: "set_flag",
      target: "stable.radovesice.owner_hostile",
      value: true,
    });
  });

  it("declares every persistent flag used by the quest contract", () => {
    const declaredFlags = new Set(firstHorseQuestContent.worldFlags);
    const persistentPrefixes = ["horse.quest.", "horse.jiskra.", "stable.radovesice."];
    const usedFlags = [
      ...firstHorseQuestContent.stages.flatMap((stage) => [
        ...stage.startWhen.map((condition) => condition.flag),
        ...stage.completeWhen.map((condition) => condition.flag),
        ...(stage.failureWhen ?? []).map((condition) => condition.flag),
        ...stage.onComplete
          .filter((effect) => effect.kind === "set_flag")
          .map((effect) => effect.target),
      ]),
      ...firstHorseQuestContent.dialogues.flatMap((node) =>
        node.choices.flatMap((choice) => [
          ...(choice.requires ?? []).map((condition) => condition.flag),
          ...choice.effects
            .filter((effect) => effect.kind === "set_flag")
            .map((effect) => effect.target),
        ]),
      ),
    ].filter((flag) => persistentPrefixes.some((prefix) => flag.startsWith(prefix)));

    expect(usedFlags.filter((flag) => !declaredFlags.has(flag))).toEqual([]);
  });
});
