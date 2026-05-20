import { TO_CHANGE } from "./config.mjs";
import { getArcana } from "./arcana.mjs";

const ID = TO_CHANGE.ID;

let _rulesCache = null;

/** 載入並快取 solo-rules.json */
export async function loadSoloRules() {
  if (_rulesCache) return _rulesCache;
  try {
    _rulesCache = await foundry.utils.fetchJsonWithTimeout(
      `systems/${ID}/assets/data/solo-rules.json`);
  } catch (err) {
    console.error("To Change | 無法載入 solo-rules.json", err);
    _rulesCache = {};
  }
  return _rulesCache;
}

/** 取得某起始牌的單人規則 */
export function getSoloRules(cardNum) {
  if (cardNum === null || cardNum === undefined) return null;
  return _rulesCache?.[String(cardNum)] ?? null;
}

/**
 * 產生一天的事件。
 * @param {Actor} actor
 * @returns {{eventCard:object, polarity:string, eventText:string, bucket:string, rules:object}|null}
 */
export function rollDailyEvent(actor) {
  const startCard = actor.system.solo?.startingCard;
  const rules = getSoloRules(startCard);
  if (!rules) return null;

  // 事件牌:單人遊玩每天洗回完整一副,故抽一張全新隨機牌
  const cardNum = Math.floor(Math.random() * 22);
  const polarity = Math.random() < 0.5 ? "upright" : "reversed";

  // 依目前蛻化總量分桶
  const total = actor.system.totalChange ?? 0;
  const bucket = total <= rules.threshold ? "low" : "high";
  const fieldMap = {
    "low-upright": "lowUpright", "low-reversed": "lowReversed",
    "high-upright": "highUpright", "high-reversed": "highReversed"
  };
  const eventText = rules[fieldMap[`${bucket}-${polarity}`]];

  return {
    eventCard: getArcana(cardNum),
    polarity,
    eventText,
    bucket,
    rules
  };
}
