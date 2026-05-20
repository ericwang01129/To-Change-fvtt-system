import { TO_CHANGE } from "./config.mjs";
import { ARCANA, getArcana, DEATH } from "./arcana.mjs";
import { Deck } from "./deck.mjs";

/**
 * 行動占卜的計算核心。
 * 互動式選擇（月亮抽底牌、世界取棄牌、太陽偷看）由 resolution.mjs 對話框處理;
 * 此模組僅提供決定論的計算。
 */

/**
 * 掃描全部角色,回傳「累積蛻化最多」的屬性鍵（正義牌用)。並列時取固定順序首位。
 * @returns {string}
 */
export function mostChangedAttribute() {
  const totals = { mf: 0, ma: 0, pf: 0, pa: 0 };
  for (const actor of game.actors) {
    if (actor.type !== "character") continue;
    for (const key of TO_CHANGE.attributeKeys) {
      totals[key] += actor.system.attributes?.[key]?.changeCount ?? 0;
    }
  }
  let best = TO_CHANGE.attributeKeys[0];
  for (const key of TO_CHANGE.attributeKeys) {
    if (totals[key] > totals[best]) best = key;
  }
  return best;
}

/**
 * 計算一次占卜的抽牌數。
 * @param {Actor} actor      受測角色
 * @param {string} attrKey   受測屬性
 * @param {object} [opts]
 * @param {number} [opts.assist=0]   援助人數（每人 +1）
 * @returns {{base:number, assist:number, tower:number, justice:number, total:number}}
 */
export function computeDraw(actor, attrKey, opts = {}) {
  const attr = actor.system.attributes[attrKey];
  const base = attr?.draw ?? 0;
  const assist = Math.max(0, Number(opts.assist) || 0);

  // 高塔遺留:上次抽到高塔 → 本次 +2
  const tower = Number(actor.getFlag(TO_CHANGE.ID, "nextDrawBonus")) || 0;

  // 正義 face 能力:面相牌為正義且十字對稱 → 每次抽牌 +1
  const justice = (actor.system.cards?.face === 11 && actor.system.crossSymmetric) ? 1 : 0;

  return { base, assist, tower, justice, total: Math.max(0, base + assist + tower + justice) };
}

/**
 * 取得一張牌「被選用」時的結算結果（已解析正義的風味屬性）。
 * @param {number} cardNum
 * @returns {{result:string, flavorAttr:string|null, tags:string[], card:object}}
 */
export function resolveCard(cardNum) {
  const card = getArcana(cardNum);
  const eff = card.effect;
  let flavorAttr = eff.flavorAttr;
  if (flavorAttr === "mostChanged") flavorAttr = mostChangedAttribute();
  return {
    result: eff.result,
    flavorAttr,
    tags: [...eff.tags],
    noDiscard: eff.noDiscard,
    card
  };
}

/**
 * 翻牌觸發判定:檢查翻開的牌中是否含某角色的昇位/墮位牌。
 * @param {number[]} drawn       已翻開的牌
 * @param {Actor[]} participants 參與此次占卜的角色（抽牌者 + 援助者）
 * @returns {{risingHits:object[], fallingHits:object[]}}
 */
export function checkRiseFall(drawn, participants) {
  const risingHits = [];
  const fallingHits = [];
  for (const actor of participants) {
    const rising = actor.system.cards?.rising;
    const falling = actor.system.cards?.falling;
    if (rising !== null && rising !== undefined && drawn.includes(rising)) {
      risingHits.push({ actor, card: rising });
    }
    if (falling !== null && falling !== undefined && drawn.includes(falling)) {
      fallingHits.push({ actor, card: falling });
    }
  }
  return { risingHits, fallingHits };
}

/**
 * 死神是否可被選用:僅當牠是唯一翻開的牌。
 * @param {number[]} drawn
 * @returns {boolean}
 */
export function deathSelectable(drawn) {
  return drawn.length === 1 && drawn[0] === DEATH;
}

/**
 * 結算後處理牌堆:把翻開的牌依規則歸位。
 * @param {object} state        目前牌堆狀態
 * @param {number[]} drawn      所有翻開的牌
 * @param {number|null} chosen  選用的牌（null = 蛻變,全部洗回)
 * @param {object} [opts]
 * @param {boolean} [opts.towerFace] 高塔 face:翻開的牌全部棄掉
 * @returns {object} 新牌堆狀態
 */
export function settleDeck(state, drawn, chosen, opts = {}) {
  let s = { draw: [...state.draw], discard: [...state.discard] };

  // 蛻變:所有翻開的牌洗回
  if (chosen === null) {
    return Deck.shuffleIntoDraw(s, drawn);
  }

  const others = drawn.filter(c => c !== chosen);

  if (opts.towerFace) {
    // 高塔 face:所有翻開的牌（死神、節制除外)全部棄掉
    for (const c of drawn) s = Deck.discard(s, c);
    return s;
  }

  // 選用的牌:棄掉（死神、節制於 Deck.discard 內自動改為洗回）
  s = Deck.discard(s, chosen);
  // 其餘翻開的牌:洗回牌堆
  s = Deck.shuffleIntoDraw(s, others);
  return s;
}
