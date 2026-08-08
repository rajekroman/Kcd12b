import type { HorseCommandRejectionCode, HorseTrialResetReason } from '../../contracts/horseRuntime';

const rejectionMessages: Record<HorseCommandRejectionCode, string> = {
  unknown_interaction: 'Tuto akci u Jiskry teď nelze provést.',
  condition_not_met: 'Podmínky pro tuto jezdeckou akci ještě nejsou splněné.',
  duplicate_idempotency_key: 'Tato jezdecká akce už byla potvrzena.',
  wrong_solution: 'Tato akce nepatří ke zvolené cestě získání Jiskry.',
  solution_already_selected: 'Cesta získání Jiskry už byla zvolena.',
  wrong_trial_checkpoint: 'Checkpoint neodpovídá aktuální zkušební trase.',
  trial_not_active: 'Zkušební jízda právě není aktivní.',
  horse_not_claimed: 'Jiskru musíš nejdřív získat.',
  mount_not_unlocked: 'Nasednutí ještě není odemčené.',
  horse_already_mounted: 'Jiskra už má jezdce.',
  horse_not_mounted: 'Na Jiskře právě nikdo nesedí.',
  mount_owner_mismatch: 'Sesednout může pouze aktuální jezdec.',
  quest_failed: 'Jezdecký úkol už selhal.',
  quest_completed: 'Jezdecký úkol je už dokončen.',
  invalid_failure_source: 'Tento stav selhání není pro jezdecký úkol platný.',
};

const resetMessages: Record<HorseTrialResetReason, string> = {
  dismounted: 'Zkušební jízda byla resetována po sesednutí.',
  route_left: 'Opustil jsi zkušební trasu. Checkpointy byly resetovány.',
  wrong_checkpoint_order: 'Checkpointy musíš projet ve správném pořadí. Trasa byla resetována.',
};

export const getHorseRejectionMessage = (code: HorseCommandRejectionCode): string =>
  rejectionMessages[code];

export const getHorseTrialResetMessage = (reason: HorseTrialResetReason): string =>
  resetMessages[reason];
