export type HorseQuestStageId =
  | "not_started"
  | "stable_introduction"
  | "trust_earned"
  | "solution_selected"
  | "horse_bonded"
  | "trial_ride"
  | "completed"
  | "failed";

export type HorseQuestSolutionId = "lawful_service" | "covert_release";

export type PortraitEmotion =
  | "neutral"
  | "guarded"
  | "warm"
  | "concerned"
  | "angry"
  | "relieved";

export interface ContentCondition {
  readonly flag: string;
  readonly equals: boolean | number | string;
}

export interface ContentEffect {
  readonly kind: "set_flag" | "reputation" | "reward" | "unlock" | "fail_quest";
  readonly target: string;
  readonly value: boolean | number | string;
}

export interface HorseQuestStage {
  readonly id: HorseQuestStageId;
  readonly objective: string;
  readonly startWhen: readonly ContentCondition[];
  readonly completeWhen: readonly ContentCondition[];
  readonly onComplete: readonly ContentEffect[];
  readonly failureWhen?: readonly ContentCondition[];
}

export interface DialogueChoice {
  readonly id: string;
  readonly text: string;
  readonly requires?: readonly ContentCondition[];
  readonly effects: readonly ContentEffect[];
  readonly nextNodeId?: string;
}

export interface DialogueNode {
  readonly id: string;
  readonly speakerId: string;
  readonly portraitEmotion: PortraitEmotion;
  readonly text: string;
  readonly choices: readonly DialogueChoice[];
}

export interface HorseQuestContentContract {
  readonly questId: string;
  readonly horseId: string;
  readonly stableId: string;
  readonly npcIds: readonly string[];
  readonly stages: readonly HorseQuestStage[];
  readonly dialogues: readonly DialogueNode[];
  readonly requiredInteractions: readonly string[];
  readonly worldFlags: readonly string[];
}

export const firstHorseQuestContent: HorseQuestContentContract = {
  questId: "quest.first_horse.oak_and_reins",
  horseId: "horse.dun_mare_jiskra",
  stableId: "location.radovesice_stable",
  npcIds: ["npc.stablemaster_matej", "npc.owner_anezka", "npc.groom_vitek"],
  worldFlags: [
    "horse.quest.first.started",
    "horse.quest.first.lawful_service",
    "horse.quest.first.covert_release",
    "horse.quest.first.solution_choice",
    "horse.quest.first.solution_selected",
    "horse.jiskra.inspected",
    "horse.jiskra.care_available",
    "horse.jiskra.trust_earned",
    "horse.jiskra.claimed",
    "horse.jiskra.injured",
    "horse.jiskra.trial_completed",
    "stable.radovesice.access",
    "stable.radovesice.owner_hostile",
  ],
  requiredInteractions: [
    "interaction.talk",
    "interaction.inspect_horse",
    "interaction.feed_horse",
    "interaction.groom_horse",
    "interaction.repair_stable_gate",
    "interaction.open_stable_gate",
    "interaction.mount_request",
    "interaction.ride_trial_checkpoint",
    "interaction.return_horse",
  ],
  stages: [
    {
      id: "not_started",
      objective: "Zjisti, proč je u radověsické stáje rozruch.",
      startWhen: [],
      completeWhen: [{ flag: "horse.quest.first.started", equals: true }],
      onComplete: [{ kind: "unlock", target: "stable.radovesice.access", value: true }],
    },
    {
      id: "stable_introduction",
      objective: "Promluv s Matějem a prohlédni si klisnu Jiskru.",
      startWhen: [{ flag: "horse.quest.first.started", equals: true }],
      completeWhen: [{ flag: "horse.jiskra.inspected", equals: true }],
      onComplete: [{ kind: "set_flag", target: "horse.jiskra.care_available", value: true }],
    },
    {
      id: "trust_earned",
      objective: "Získej Jiskřinu důvěru krmením a péčí.",
      startWhen: [{ flag: "horse.jiskra.care_available", equals: true }],
      completeWhen: [{ flag: "horse.jiskra.trust_earned", equals: true }],
      onComplete: [{ kind: "unlock", target: "horse.quest.first.solution_choice", value: true }],
    },
    {
      id: "solution_selected",
      objective: "Rozhodni, jak Jiskru získáš.",
      startWhen: [{ flag: "horse.quest.first.solution_choice", equals: true }],
      completeWhen: [{ flag: "horse.quest.first.solution_selected", equals: true }],
      onComplete: [],
    },
    {
      id: "horse_bonded",
      objective: "Dokonči zvolenou cestu a převezmi Jiskru.",
      startWhen: [{ flag: "horse.quest.first.solution_selected", equals: true }],
      completeWhen: [{ flag: "horse.jiskra.claimed", equals: true }],
      onComplete: [{ kind: "unlock", target: "interaction.mount_request", value: true }],
      failureWhen: [{ flag: "horse.jiskra.injured", equals: true }],
    },
    {
      id: "trial_ride",
      objective: "Projeď zkušební trasu a vrať se ke stáji.",
      startWhen: [{ flag: "horse.jiskra.claimed", equals: true }],
      completeWhen: [{ flag: "horse.jiskra.trial_completed", equals: true }],
      onComplete: [
        { kind: "reward", target: "player.mount_access", value: "horse.dun_mare_jiskra" },
        { kind: "reputation", target: "faction.radovesice", value: 4 },
      ],
    },
    {
      id: "completed",
      objective: "Jiskra je tvůj první kůň.",
      startWhen: [{ flag: "horse.jiskra.trial_completed", equals: true }],
      completeWhen: [],
      onComplete: [],
    },
    {
      id: "failed",
      objective: "Jiskru už nelze bezpečně získat.",
      startWhen: [{ flag: "horse.jiskra.injured", equals: true }],
      completeWhen: [],
      onComplete: [{ kind: "fail_quest", target: "quest.first_horse.oak_and_reins", value: true }],
    },
  ],
  dialogues: [
    {
      id: "dialogue.matej.introduction",
      speakerId: "npc.stablemaster_matej",
      portraitEmotion: "guarded",
      text: "Klisna se leká cizích lidí. Nejdřív mi ukaž, že umíš být užitečný a že se k ní dovedeš chovat.",
      choices: [
        {
          id: "choice.offer_help",
          text: "Pomohu ve stáji a získám si její důvěru.",
          effects: [{ kind: "set_flag", target: "horse.quest.first.started", value: true }],
          nextNodeId: "dialogue.anezka.conditions",
        },
      ],
    },
    {
      id: "dialogue.anezka.conditions",
      speakerId: "npc.owner_anezka",
      portraitEmotion: "concerned",
      text: "Jiskru neprodám někomu, kdo ji vidí jen jako rychlejší nohy. Oprav bránu a dovez léčivé byliny pro ostatní koně.",
      choices: [
        {
          id: "choice.lawful_service",
          text: "Udělám vše řádně a získám vaše svolení.",
          effects: [
            { kind: "set_flag", target: "horse.quest.first.lawful_service", value: true },
            { kind: "set_flag", target: "horse.quest.first.solution_selected", value: true },
            { kind: "reputation", target: "faction.radovesice", value: 8 },
          ],
        },
        {
          id: "choice.covert_release",
          text: "Jiskra patří tomu, komu důvěřuje. Vezmu ji v noci.",
          requires: [{ flag: "horse.jiskra.trust_earned", equals: true }],
          effects: [
            { kind: "set_flag", target: "horse.quest.first.covert_release", value: true },
            { kind: "set_flag", target: "horse.quest.first.solution_selected", value: true },
            { kind: "set_flag", target: "stable.radovesice.owner_hostile", value: true },
            { kind: "reputation", target: "faction.radovesice", value: -12 },
          ],
        },
      ],
    },
  ],
};
