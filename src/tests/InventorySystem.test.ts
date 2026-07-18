import { describe, expect, it } from 'vitest';
import {
  addItem,
  buyItem,
  createInitialEconomyState,
  createInitialInventoryState,
  equipItem,
  getEquipmentStats,
  getInventoryWeight,
  getItemQuantity,
  getItemTradePrice,
  sellItem,
  unequipSlot,
  useConsumable
} from '../systems/InventorySystem';

describe('InventorySystem', () => {
  it('vytvoří startovní inventář s mečem, zásobami a měnou', () => {
    const inventory = createInitialInventoryState();

    expect(inventory.groschen).toBe(85);
    expect(inventory.equipment.weapon).toBe('bohdan-sword');
    expect(getItemQuantity(inventory.items, 'bread')).toBe(2);
    expect(getInventoryWeight(inventory)).toBeCloseTo(4.2);
    expect(getEquipmentStats(inventory)).toEqual({ attack: 5, armor: 0, charisma: 0 });
  });

  it('skládá předměty, ale nepřekročí maximální stack', () => {
    const inventory = createInitialInventoryState();
    const added = addItem(inventory, 'bread', 8);

    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(getItemQuantity(added.value.items, 'bread')).toBe(10);

    const overflow = addItem(added.value, 'bread', 1);
    expect(overflow).toEqual({
      ok: false,
      error: { code: 'stack-full', message: 'Nelze nést více než 10 kusů.' }
    });
  });

  it('odmítne předmět přesahující nosnost beze změny původního stavu', () => {
    const inventory = { ...createInitialInventoryState(), maxWeight: 5 };
    const before = structuredClone(inventory);
    const result = addItem(inventory, 'iron-ingot', 1);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('overweight');
    expect(inventory).toEqual(before);
  });

  it('vybaví předmět do správného slotu a spočítá statistiky', () => {
    const inventory = createInitialInventoryState();
    const withArmor = addItem(inventory, 'padded-jack');
    expect(withArmor.ok).toBe(true);
    if (!withArmor.ok) return;

    const equipped = equipItem(withArmor.value, 'padded-jack');
    expect(equipped.ok).toBe(true);
    if (!equipped.ok) return;

    expect(equipped.value.equipment.armor).toBe('padded-jack');
    expect(getEquipmentStats(equipped.value)).toEqual({ attack: 5, armor: 4, charisma: 0 });
    expect(unequipSlot(equipped.value, 'armor').equipment.armor).toBeNull();
  });

  it('neumožní vybavit spotřební předmět', () => {
    const result = equipItem(createInitialInventoryState(), 'bread');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('not-equippable');
  });

  it('provede neutrální nákup atomicky a převede zboží i peníze', () => {
    const economy = createInitialEconomyState();
    const result = buyItem(economy, 'bandage', 2);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.inventory.groschen).toBe(57);
    expect(getItemQuantity(result.value.inventory.items, 'bandage')).toBe(3);
    expect(getItemQuantity(result.value.merchant.stock, 'bandage')).toBe(3);
    expect(result.value.merchant.groschen).toBe(528);
  });

  it('kladná pověst a charisma použijí stejnou cenu v nabídce i transakci', () => {
    const economy = createInitialEconomyState();
    const context = { factionReputation: 60, charisma: 4 };
    const displayedPrice = getItemTradePrice('wood-axe', 'buy', context);
    const result = buyItem(economy, 'wood-axe', 1, context);

    expect(displayedPrice).toBe(70);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.inventory.groschen).toBe(85 - displayedPrice);
    expect(result.value.merchant.groschen).toBe(500 + displayedPrice);
  });

  it('nepřátelská pověst sníží výkupní cenu', () => {
    const economy = createInitialEconomyState();
    const context = { factionReputation: -80, charisma: 0 };
    const price = getItemTradePrice('bohdan-sword', 'sell', context);
    const result = sellItem(economy, 'bohdan-sword', 1, context);

    expect(price).toBeLessThan(58);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.inventory.groschen).toBe(85 + price);
  });

  it('neúspěšný nákup nezmění žádnou stranu transakce', () => {
    const economy = { ...createInitialEconomyState(), inventory: { ...createInitialInventoryState(), groschen: 1 } };
    const before = structuredClone(economy);
    const result = buyItem(economy, 'padded-jack');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('insufficient-funds');
    expect(economy).toEqual(before);
  });

  it('prodej odebere vybavený poslední kus a vyčistí slot', () => {
    const economy = createInitialEconomyState();
    const result = sellItem(economy, 'bohdan-sword');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.inventory.equipment.weapon).toBeNull();
    expect(getItemQuantity(result.value.inventory.items, 'bohdan-sword')).toBe(0);
    expect(result.value.inventory.groschen).toBe(143);
    expect(getItemQuantity(result.value.merchant.stock, 'bohdan-sword')).toBe(1);
  });

  it('odmítne prodej, pokud obchodník nemá hotovost', () => {
    const economy = createInitialEconomyState();
    economy.merchant.groschen = 1;
    const result = sellItem(economy, 'bohdan-sword');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('merchant-insufficient-funds');
  });

  it('spotřebuje obvaz a vrátí léčivou hodnotu', () => {
    const inventory = createInitialInventoryState();
    const result = useConsumable(inventory, 'bandage');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.healing).toBe(12);
    expect(getItemQuantity(result.value.inventory.items, 'bandage')).toBe(0);
  });

  it('odmítá nulové a desetinné množství', () => {
    const economy = createInitialEconomyState();

    expect(buyItem(economy, 'bread', 0)).toMatchObject({
      ok: false,
      error: { code: 'invalid-quantity' }
    });
    expect(sellItem(economy, 'bread', 1.5)).toMatchObject({
      ok: false,
      error: { code: 'invalid-quantity' }
    });
  });
});
