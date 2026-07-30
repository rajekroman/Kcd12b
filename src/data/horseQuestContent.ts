export type HorseQuestStageId =
  | "not_started"
  | "stable_introduction"
  | "trust_building"
  | "solution_selected"
  | "lawful_service"
  | "covert_release"
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

export type ContentScalar = boolean | number | string;

export interface ContentCondition {
  readonly source: "world_flag" | "counter" | "external";
  readonly target: string;
  readonly operator: "equals" | "not_equals" | "at_least";
  readonly value: ContentScalar;
}

export interface ContentConditionSet {
  readonly mode: "all" | "any";
  readonly conditions: readonly ContentCondition[];
}

export interface ContentEffect {
  readonly kind:
    | "set_flag"
    | "set_counter"
    | "increment_counter"
    | "reputation"
    | "reward"
    | "unlock"
    | "fail_quest";
  readonly target: string;
  readonly value: ContentScalar;
}

export interface HorseQuestStage {
  readonly id: HorseQuestStageId;
  readonly objective: string;
  readonly startWhen: ContentConditionSet;
  readonly completeWhen: ContentConditionSet;
  readonly onComplete: readonly ContentEffect[];
  readonly nextStageIds: readonly HorseQuestStageId[];
  readonly terminal: boolean;
}

export type InteractionIdempotency =
  | "once_per_quest"
  | "once_per_trial_attempt"
  | "ordered_once"
  | "repeatable";

export interface HorseQuestInteraction {
  readonly interactionId: string;
  readonly targetId: string;
  readonly commandId: string;
  readonly confirmedEventId: string;
  readonly solution?: HorseQuestSolutionId;
  readonly requires: ContentConditionSet;
  readonly effects: readonly ContentEffect[];
  readonly idempotency: InteractionIdempotency;
}

export interface DialogueChoice {
  readonly id: string;
  readonly text: string;
  readonly requires?: ContentConditionSet;
  readonly effects: readonly ContentEffect[];
  readonly interactionId?: string;
  readonly nextNodeId?: string;
}

export interface DialogueNode {
  readonly id: string;
  readonly speakerId: string;
  readonly portraitEmotion: PortraitEmotion;
  readonly text: string;
  readonly choices: readonly DialogueChoice[];
}

export interface ProgressContribution {
  readonly interactionId: string;
  readonly amount: number;
}

export interface ProgressModel {
  readonly counterId: string;
  readonly initialValue: number;
  readonly threshold: number;
  readonly contributions: readonly ProgressContribution[];
  readonly completionEffects: readonly ContentEffect[];
  readonly antiFarmingRule: string;
}

export interface TrialRouteContract {
  readonly routeId: string;
  readonly checkpointIds: readonly string[];
  readonly progressCounterId: string;
  readonly startInteractionId: string;
  readonly finishInteractionId: string;
  readonly resetEventIds: readonly string[];
  readonly wrongOrderRule: "reject_and_reset";
}

export interface EventPayloadField {
  readonly name: string;
  readonly type: "string" | "number" | "boolean";
  readonly required: boolean;
  readonly allowedValues?: readonly ContentScalar[];
}

export interface ContentEventContract {
  readonly eventId: string;
  readonly producer: "gameplay" | "detection" | "quest_runtime";
  readonly payload: readonly EventPayloadField[];
  readonly requires: ContentConditionSet;
  readonly effects: readonly ContentEffect[];
}

export interface FailureContract {
  readonly id: string;
  readonly confirmedEventId: string;
  readonly activeWhen: ContentConditionSet;
  readonly ignoredWhen: ContentConditionSet;
  readonly terminalStageId: "failed";
  readonly reason: string;
}

export interface HorseQuestContentContract {
  readonly questId: string;
  readonly horseId: string;
  readonly stableId: string;
  readonly npcIds: readonly string[];
  readonly worldFlags: readonly string[];
  readonly counters: readonly string[];
  readonly externalConditionTargets: readonly string[];
  readonly stages: readonly HorseQuestStage[];
  readonly dialogues: readonly DialogueNode[];
  readonly interactions: readonly HorseQuestInteraction[];
  readonly progressModels: readonly ProgressModel[];
  readonly trialRoute: TrialRouteContract;
  readonly events: readonly ContentEventContract[];
  readonly failures: readonly FailureContract[];
}

const all = (...conditions: readonly ContentCondition[]): ContentConditionSet => ({
  mode: "all",
  conditions,
});

const any = (...conditions: readonly ContentCondition[]): ContentConditionSet => ({
  mode: "any",
  conditions,
});

const flag = (
  target: string,
  value: boolean,
  operator: ContentCondition["operator"] = "equals",
): ContentCondition => ({ source: "world_flag", target, operator, value });

const counter = (
  target: string,
  value: number,
  operator: ContentCondition["operator"] = "equals",
): ContentCondition => ({ source: "counter", target, operator, value });

const external = (target: string, value: ContentScalar): ContentCondition => ({
  source: "external",
  target,
  operator: "equals",
  value,
});

export const firstHorseQuestContent: HorseQuestContentContract = {
  questId: "quest.first_horse.oak_and_reins",
  horseId: "horse.dun_mare_jiskra",
  stableId: "location.radovesice_stable",
  npcIds: ["npc.stablemaster_matej", "npc.owner_anezka", "npc.groom_vitek"],
  worldFlags: [
    "horse.quest.first.started",
    "horse.quest.first.solution_choice",
    "horse.quest.first.solution_selected",
    "horse.quest.first.lawful_service",
    "horse.quest.first.covert_release",
    "horse.jiskra.inspected",
    "horse.jiskra.care_available",
    "horse.jiskra.fed",
    "horse.jiskra.groomed",
    "horse.jiskra.trust_earned",
    "horse.jiskra.claimed",
    "horse.jiskra.injured",
    "horse.jiskra.mount_unlocked",
    "horse.jiskra.trial_started",
    "horse.jiskra.trial_completed",
    "stable.radovesice.access",
    "stable.radovesice.gate_repaired",
    "stable.radovesice.herbs_delivered",
    "stable.radovesice.owner_approved",
    "stable.radovesice.gate_opened_covertly",
    "stable.radovesice.covert_detected",
    "stable.radovesice.owner_hostile",
  ],
  counters: ["horse.jiskra.trust_points", "horse.jiskra.trial_checkpoint_index"],
  externalConditionTargets: ["world.time.phase"],
  progressModels: [
    {
      counterId: "horse.jiskra.trust_points",
      initialValue: 0,
      threshold: 3,
      contributions: [
        { interactionId: "interaction.feed_jiskra", amount: 1 },
        { interactionId: "interaction.groom_jiskra", amount: 2 },
      ],
      completionEffects: [
        { kind: "set_flag", target: "horse.jiskra.trust_earned", value: true },
        { kind: "set_flag", target: "horse.quest.first.solution_choice", value: true },
      ],
      antiFarmingRule:
        "Krmení i čištění lze započítat nejvýše jednou za quest; opakování stejné interakce nepřidá další body.",
    },
  ],
  trialRoute: {
    routeId: "route.radovesice.first_ride",
    checkpointIds: [
      "checkpoint.radovesice.meadow_gate",
      "checkpoint.radovesice.shallow_ford",
      "checkpoint.radovesice.old_oak",
    ],
    progressCounterId: "horse.jiskra.trial_checkpoint_index",
    startInteractionId: "interaction.start_trial_ride",
    finishInteractionId: "interaction.finish_trial_ride",
    resetEventIds: [
      "event.horse.trial_dismounted",
      "event.horse.trial_route_left",
      "event.horse.trial_checkpoint_wrong_order",
    ],
    wrongOrderRule: "reject_and_reset",
  },
  stages: [
    {
      id: "not_started",
      objective: "Zjisti, proč je u radověsické stáje rozruch.",
      startWhen: all(),
      completeWhen: all(flag("horse.quest.first.started", true)),
      onComplete: [{ kind: "unlock", target: "stable.radovesice.access", value: true }],
      nextStageIds: ["stable_introduction"],
      terminal: false,
    },
    {
      id: "stable_introduction",
      objective: "Promluv s Matějem a prohlédni si klisnu Jiskru.",
      startWhen: all(flag("horse.quest.first.started", true)),
      completeWhen: all(flag("horse.jiskra.inspected", true)),
      onComplete: [{ kind: "set_flag", target: "horse.jiskra.care_available", value: true }],
      nextStageIds: ["trust_building"],
      terminal: false,
    },
    {
      id: "trust_building",
      objective: "Nakrm Jiskru a vyčisti ji; obě činnosti jsou potřeba k získání důvěry.",
      startWhen: all(flag("horse.jiskra.care_available", true)),
      completeWhen: all(flag("horse.jiskra.trust_earned", true)),
      onComplete: [],
      nextStageIds: ["solution_selected"],
      terminal: false,
    },
    {
      id: "solution_selected",
      objective: "Rozhodni, zda splníš podmínky majitelky, nebo Jiskru tajně odvedeš.",
      startWhen: all(flag("horse.quest.first.solution_choice", true)),
      completeWhen: any(
        flag("horse.quest.first.lawful_service", true),
        flag("horse.quest.first.covert_release", true),
      ),
      onComplete: [{ kind: "set_flag", target: "horse.quest.first.solution_selected", value: true }],
      nextStageIds: ["lawful_service", "covert_release"],
      terminal: false,
    },
    {
      id: "lawful_service",
      objective: "Oprav bránu, přines byliny a požádej Anežku o svolení.",
      startWhen: all(flag("horse.quest.first.lawful_service", true)),
      completeWhen: all(flag("horse.jiskra.claimed", true)),
      onComplete: [],
      nextStageIds: ["horse_bonded"],
      terminal: false,
    },
    {
      id: "covert_release",
      objective: "V noci otevři stáj a odveď Jiskru, aniž tě někdo odhalí.",
      startWhen: all(flag("horse.quest.first.covert_release", true)),
      completeWhen: all(flag("horse.jiskra.claimed", true)),
      onComplete: [],
      nextStageIds: ["horse_bonded"],
      terminal: false,
    },
    {
      id: "horse_bonded",
      objective: "Převezmi Jiskru a připrav se na zkušební jízdu.",
      startWhen: all(flag("horse.jiskra.claimed", true)),
      completeWhen: all(flag("horse.jiskra.mount_unlocked", true)),
      onComplete: [{ kind: "unlock", target: "interaction.mount_request", value: true }],
      nextStageIds: ["trial_ride"],
      terminal: false,
    },
    {
      id: "trial_ride",
      objective: "Projeď tři checkpointy v určeném pořadí a vrať se ke stáji.",
      startWhen: all(flag("horse.jiskra.mount_unlocked", true)),
      completeWhen: all(flag("horse.jiskra.trial_completed", true)),
      onComplete: [
        { kind: "reward", target: "player.mount_access", value: "horse.dun_mare_jiskra" },
        { kind: "reputation", target: "faction.radovesice", value: 4 },
      ],
      nextStageIds: ["completed"],
      terminal: false,
    },
    {
      id: "completed",
      objective: "Jiskra je tvůj první kůň.",
      startWhen: all(flag("horse.jiskra.trial_completed", true)),
      completeWhen: all(),
      onComplete: [],
      nextStageIds: [],
      terminal: true,
    },
    {
      id: "failed",
      objective: "Jiskru už v tomto průchodu nelze bezpečně získat.",
      startWhen: any(
        flag("horse.jiskra.injured", true),
        flag("stable.radovesice.covert_detected", true),
      ),
      completeWhen: all(),
      onComplete: [],
      nextStageIds: [],
      terminal: true,
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
          nextNodeId: "dialogue.vitek.care_lesson",
        },
      ],
    },
    {
      id: "dialogue.vitek.care_lesson",
      speakerId: "npc.groom_vitek",
      portraitEmotion: "warm",
      text: "Jiskra pozná spěch i hrubost. Dej jí krmení z dlaně a potom ji pomalu vyčisti; žádný krok nezkoušej obcházet.",
      choices: [
        {
          id: "choice.accept_care_lesson",
          text: "Budu postupovat opatrně.",
          effects: [],
        },
      ],
    },
    {
      id: "dialogue.anezka.solution_choice",
      speakerId: "npc.owner_anezka",
      portraitEmotion: "concerned",
      text: "Jiskru neprodám někomu, kdo ji vidí jen jako rychlejší nohy. Oprav bránu a dovez léčivé byliny pro ostatní koně.",
      choices: [
        {
          id: "choice.lawful_service",
          text: "Splním vaše podmínky a získám svolení.",
          requires: all(flag("horse.jiskra.trust_earned", true)),
          effects: [{ kind: "set_flag", target: "horse.quest.first.lawful_service", value: true }],
        },
        {
          id: "choice.covert_release",
          text: "Jiskra důvěřuje mně. Odvedu ji v noci.",
          requires: all(flag("horse.jiskra.trust_earned", true)),
          effects: [{ kind: "set_flag", target: "horse.quest.first.covert_release", value: true }],
        },
      ],
    },
    {
      id: "dialogue.anezka.approval",
      speakerId: "npc.owner_anezka",
      portraitEmotion: "relieved",
      text: "Brána drží a koně mají potřebné byliny. Jiskru ti svěřím, ale vrať se po zkušební jízdě ke stáji.",
      choices: [
        {
          id: "choice.accept_jiskra_lawfully",
          text: "Postarám se o ni.",
          requires: all(
            flag("stable.radovesice.gate_repaired", true),
            flag("stable.radovesice.herbs_delivered", true),
          ),
          effects: [],
          interactionId: "interaction.obtain_owner_approval",
        },
      ],
    },
  ],
  interactions: [
    {
      interactionId: "interaction.inspect_jiskra",
      targetId: "horse.dun_mare_jiskra",
      commandId: "command.horse.inspect",
      confirmedEventId: "event.horse.inspected",
      requires: all(flag("horse.quest.first.started", true)),
      effects: [{ kind: "set_flag", target: "horse.jiskra.inspected", value: true }],
      idempotency: "once_per_quest",
    },
    {
      interactionId: "interaction.feed_jiskra",
      targetId: "horse.dun_mare_jiskra",
      commandId: "command.horse.feed",
      confirmedEventId: "event.horse.fed",
      requires: all(
        flag("horse.jiskra.care_available", true),
        flag("horse.jiskra.fed", false),
      ),
      effects: [
        { kind: "set_flag", target: "horse.jiskra.fed", value: true },
        { kind: "increment_counter", target: "horse.jiskra.trust_points", value: 1 },
      ],
      idempotency: "once_per_quest",
    },
    {
      interactionId: "interaction.groom_jiskra",
      targetId: "horse.dun_mare_jiskra",
      commandId: "command.horse.groom",
      confirmedEventId: "event.horse.groomed",
      requires: all(
        flag("horse.jiskra.care_available", true),
        flag("horse.jiskra.groomed", false),
      ),
      effects: [
        { kind: "set_flag", target: "horse.jiskra.groomed", value: true },
        { kind: "increment_counter", target: "horse.jiskra.trust_points", value: 2 },
      ],
      idempotency: "once_per_quest",
    },
    {
      interactionId: "interaction.repair_stable_gate",
      targetId: "object.radovesice.stable_gate",
      commandId: "command.stable.repair_gate",
      confirmedEventId: "event.stable.gate_repaired",
      solution: "lawful_service",
      requires: all(
        flag("horse.quest.first.lawful_service", true),
        flag("stable.radovesice.gate_repaired", false),
      ),
      effects: [{ kind: "set_flag", target: "stable.radovesice.gate_repaired", value: true }],
      idempotency: "once_per_quest",
    },
    {
      interactionId: "interaction.deliver_stable_herbs",
      targetId: "npc.owner_anezka",
      commandId: "command.stable.deliver_herbs",
      confirmedEventId: "event.stable.herbs_delivered",
      solution: "lawful_service",
      requires: all(
        flag("horse.quest.first.lawful_service", true),
        flag("stable.radovesice.herbs_delivered", false),
      ),
      effects: [{ kind: "set_flag", target: "stable.radovesice.herbs_delivered", value: true }],
      idempotency: "once_per_quest",
    },
    {
      interactionId: "interaction.obtain_owner_approval",
      targetId: "npc.owner_anezka",
      commandId: "command.stable.request_horse_approval",
      confirmedEventId: "event.stable.owner_approved_horse",
      solution: "lawful_service",
      requires: all(
        flag("horse.quest.first.lawful_service", true),
        flag("stable.radovesice.gate_repaired", true),
        flag("stable.radovesice.herbs_delivered", true),
        flag("stable.radovesice.owner_approved", false),
      ),
      effects: [
        { kind: "set_flag", target: "stable.radovesice.owner_approved", value: true },
        { kind: "set_flag", target: "horse.jiskra.claimed", value: true },
        { kind: "set_flag", target: "horse.jiskra.mount_unlocked", value: true },
        { kind: "reputation", target: "faction.radovesice", value: 8 },
      ],
      idempotency: "once_per_quest",
    },
    {
      interactionId: "interaction.open_stable_gate_covertly",
      targetId: "object.radovesice.stable_gate",
      commandId: "command.stable.open_gate_covertly",
      confirmedEventId: "event.stable.gate_opened_covertly",
      solution: "covert_release",
      requires: all(
        flag("horse.quest.first.covert_release", true),
        flag("horse.jiskra.trust_earned", true),
        flag("stable.radovesice.covert_detected", false),
        flag("stable.radovesice.gate_opened_covertly", false),
        external("world.time.phase", "night"),
      ),
      effects: [
        { kind: "set_flag", target: "stable.radovesice.gate_opened_covertly", value: true },
      ],
      idempotency: "once_per_quest",
    },
    {
      interactionId: "interaction.lead_jiskra_out",
      targetId: "horse.dun_mare_jiskra",
      commandId: "command.horse.lead_out",
      confirmedEventId: "event.horse.led_out_covertly",
      solution: "covert_release",
      requires: all(
        flag("horse.quest.first.covert_release", true),
        flag("horse.jiskra.trust_earned", true),
        flag("stable.radovesice.gate_opened_covertly", true),
        flag("stable.radovesice.covert_detected", false),
        external("world.time.phase", "night"),
      ),
      effects: [
        { kind: "set_flag", target: "horse.jiskra.claimed", value: true },
        { kind: "set_flag", target: "horse.jiskra.mount_unlocked", value: true },
        { kind: "set_flag", target: "stable.radovesice.owner_hostile", value: true },
        { kind: "reputation", target: "faction.radovesice", value: -12 },
      ],
      idempotency: "once_per_quest",
    },
    {
      interactionId: "interaction.start_trial_ride",
      targetId: "horse.dun_mare_jiskra",
      commandId: "command.horse.start_trial",
      confirmedEventId: "event.horse.trial_started",
      requires: all(
        flag("horse.jiskra.claimed", true),
        flag("horse.jiskra.mount_unlocked", true),
        flag("horse.jiskra.trial_completed", false),
      ),
      effects: [
        { kind: "set_flag", target: "horse.jiskra.trial_started", value: true },
        { kind: "set_counter", target: "horse.jiskra.trial_checkpoint_index", value: 0 },
      ],
      idempotency: "once_per_trial_attempt",
    },
    {
      interactionId: "interaction.trial_checkpoint_meadow_gate",
      targetId: "checkpoint.radovesice.meadow_gate",
      commandId: "command.horse.confirm_trial_checkpoint",
      confirmedEventId: "event.horse.trial_checkpoint_meadow_gate",
      requires: all(
        flag("horse.jiskra.trial_started", true),
        counter("horse.jiskra.trial_checkpoint_index", 0),
      ),
      effects: [
        { kind: "set_counter", target: "horse.jiskra.trial_checkpoint_index", value: 1 },
      ],
      idempotency: "ordered_once",
    },
    {
      interactionId: "interaction.trial_checkpoint_shallow_ford",
      targetId: "checkpoint.radovesice.shallow_ford",
      commandId: "command.horse.confirm_trial_checkpoint",
      confirmedEventId: "event.horse.trial_checkpoint_shallow_ford",
      requires: all(
        flag("horse.jiskra.trial_started", true),
        counter("horse.jiskra.trial_checkpoint_index", 1),
      ),
      effects: [
        { kind: "set_counter", target: "horse.jiskra.trial_checkpoint_index", value: 2 },
      ],
      idempotency: "ordered_once",
    },
    {
      interactionId: "interaction.trial_checkpoint_old_oak",
      targetId: "checkpoint.radovesice.old_oak",
      commandId: "command.horse.confirm_trial_checkpoint",
      confirmedEventId: "event.horse.trial_checkpoint_old_oak",
      requires: all(
        flag("horse.jiskra.trial_started", true),
        counter("horse.jiskra.trial_checkpoint_index", 2),
      ),
      effects: [
        { kind: "set_counter", target: "horse.jiskra.trial_checkpoint_index", value: 3 },
      ],
      idempotency: "ordered_once",
    },
    {
      interactionId: "interaction.finish_trial_ride",
      targetId: "location.radovesice_stable",
      commandId: "command.horse.finish_trial",
      confirmedEventId: "event.horse.trial_completed",
      requires: all(
        flag("horse.jiskra.trial_started", true),
        counter("horse.jiskra.trial_checkpoint_index", 3),
      ),
      effects: [
        { kind: "set_flag", target: "horse.jiskra.trial_completed", value: true },
        { kind: "set_flag", target: "horse.jiskra.trial_started", value: false },
      ],
      idempotency: "once_per_quest",
    },
  ],
  events: [
    {
      eventId: "event.horse.injured_confirmed",
      producer: "gameplay",
      payload: [
        { name: "questId", type: "string", required: true },
        { name: "horseId", type: "string", required: true },
        {
          name: "source",
          type: "string",
          required: true,
          allowedValues: ["care_mishap", "stable_hazard"],
        },
        { name: "severity", type: "number", required: true, allowedValues: [1, 2, 3] },
      ],
      requires: all(
        flag("horse.quest.first.started", true),
        flag("horse.jiskra.claimed", false),
      ),
      effects: [
        { kind: "set_flag", target: "horse.jiskra.injured", value: true },
        { kind: "fail_quest", target: "quest.first_horse.oak_and_reins", value: true },
      ],
    },
    {
      eventId: "event.horse.covert_release_detected",
      producer: "detection",
      payload: [
        { name: "questId", type: "string", required: true },
        { name: "observerId", type: "string", required: true },
      ],
      requires: all(
        flag("horse.quest.first.covert_release", true),
        flag("horse.jiskra.claimed", false),
      ),
      effects: [
        { kind: "set_flag", target: "stable.radovesice.covert_detected", value: true },
        { kind: "set_flag", target: "stable.radovesice.owner_hostile", value: true },
        { kind: "reputation", target: "faction.radovesice", value: -16 },
        { kind: "fail_quest", target: "quest.first_horse.oak_and_reins", value: true },
      ],
    },
    {
      eventId: "event.horse.trial_dismounted",
      producer: "gameplay",
      payload: [{ name: "horseId", type: "string", required: true }],
      requires: all(
        flag("horse.jiskra.trial_started", true),
        flag("horse.jiskra.trial_completed", false),
      ),
      effects: [
        { kind: "set_flag", target: "horse.jiskra.trial_started", value: false },
        { kind: "set_counter", target: "horse.jiskra.trial_checkpoint_index", value: 0 },
      ],
    },
    {
      eventId: "event.horse.trial_route_left",
      producer: "gameplay",
      payload: [{ name: "routeId", type: "string", required: true }],
      requires: all(
        flag("horse.jiskra.trial_started", true),
        flag("horse.jiskra.trial_completed", false),
      ),
      effects: [
        { kind: "set_flag", target: "horse.jiskra.trial_started", value: false },
        { kind: "set_counter", target: "horse.jiskra.trial_checkpoint_index", value: 0 },
      ],
    },
    {
      eventId: "event.horse.trial_checkpoint_wrong_order",
      producer: "quest_runtime",
      payload: [
        { name: "routeId", type: "string", required: true },
        { name: "checkpointId", type: "string", required: true },
        { name: "expectedIndex", type: "number", required: true },
      ],
      requires: all(
        flag("horse.jiskra.trial_started", true),
        flag("horse.jiskra.trial_completed", false),
      ),
      effects: [
        { kind: "set_flag", target: "horse.jiskra.trial_started", value: false },
        { kind: "set_counter", target: "horse.jiskra.trial_checkpoint_index", value: 0 },
      ],
    },
  ],
  failures: [
    {
      id: "failure.first_horse.pre_claim_injury",
      confirmedEventId: "event.horse.injured_confirmed",
      activeWhen: all(
        flag("horse.quest.first.started", true),
        flag("horse.jiskra.claimed", false),
      ),
      ignoredWhen: all(flag("horse.jiskra.claimed", true)),
      terminalStageId: "failed",
      reason:
        "Zranění potvrzené před převzetím Jiskry quest ukončí. Po nastavení claimed už zranění patří do běžného gameplay a nesmí quest zpětně zrušit.",
    },
    {
      id: "failure.first_horse.covert_detection",
      confirmedEventId: "event.horse.covert_release_detected",
      activeWhen: all(
        flag("horse.quest.first.covert_release", true),
        flag("horse.jiskra.claimed", false),
      ),
      ignoredWhen: all(flag("horse.jiskra.claimed", true)),
      terminalStageId: "failed",
      reason: "Odhalení během tajného odvedení uzavře stáj, zhorší reputaci a ukončí quest.",
    },
  ],
};
