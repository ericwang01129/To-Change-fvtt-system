import { TO_CHANGE } from "./config.mjs";
import { ARCANA } from "./arcana.mjs";
import { Deck } from "./deck.mjs";

const ID = TO_CHANGE.ID;
const ART_BASE = `systems/${ID}/assets/cards`;

/**
 * 首次啟動內容建立:預兆牌狀態、可瀏覽的圖示牌組、5 張隨機表格。
 * 由 ready hook 呼叫,僅 GM、僅執行一次（以 setupDone 旗標把關）。
 */
export async function runFirstTimeSetup() {
  if (!game.user.isGM) return;
  if (game.settings.get(ID, "setupDone")) return;

  console.log("To Change | 首次啟動,建立系統內容…");

  // 1. 初始化預兆牌機制狀態
  const state = game.settings.get(ID, "deckState");
  if (!state?.draw?.length && !state?.discard?.length) {
    await Deck.reset();
  }

  // 2. 建立可瀏覽的圖示牌組
  await ensureReferenceDeck();

  // 3. 建立 5 張隨機表格
  await ensureRollTables();

  await game.settings.set(ID, "setupDone", true);
  ui.notifications?.info(game.i18n.localize("TOCHANGE.Notify.setupDone"));
}

/** 重新建立內容（GM 工具,可重複呼叫） */
export async function rebuildContent() {
  await game.settings.set(ID, "setupDone", false);
  await runFirstTimeSetup();
}

/** 建立世界 Cards「預兆牌」牌組（圖示參考用） */
async function ensureReferenceDeck() {
  const existingId = game.settings.get(ID, "deckId");
  if (existingId && game.cards?.get(existingId)) return;

  if (!game.cards) return; // 極舊版本無 Cards;靜默略過

  const cards = ARCANA.map(a => ({
    name: `${toRoman(a.num)} ${a.zh}（${a.en}）`,
    type: "base",
    description: a.effectText,
    faces: [{
      name: `${a.zh} ${a.en}`,
      img: `${ART_BASE}/${a.art}`
    }],
    face: 0,
    value: a.num
  }));

  const deck = await Cards.create({
    name: TO_CHANGE.deckName,
    type: "deck",
    description: "塔羅 22 張大阿爾克那。行動占卜的機制由系統的「占卜」視窗處理;此牌組供桌面瀏覽與查閱牌義。",
    cards
  });
  if (deck) await game.settings.set(ID, "deckId", deck.id);
}

/** 從 tables.json 建立 5 張 RollTable */
async function ensureRollTables() {
  const stored = game.settings.get(ID, "tableIds") ?? {};
  let data;
  try {
    data = await foundry.utils.fetchJsonWithTimeout(`systems/${ID}/assets/data/tables.json`);
  } catch (err) {
    console.error("To Change | 無法載入 tables.json", err);
    return;
  }

  const ids = { ...stored };
  for (const [key, table] of Object.entries(data)) {
    if (ids[key] && game.tables?.get(ids[key])) continue;

    const results = table.rows.map((row, i) => ({
      type: CONST.TABLE_RESULT_TYPES.TEXT,
      text: `${row.join("　／　")}`,
      range: [i + 1, i + 1],
      weight: 1
    }));

    const rt = await RollTable.create({
      name: table.name,
      description: table.desc,
      formula: `1d${table.rows.length}`,
      replacement: true,
      displayRoll: true,
      results
    });
    if (rt) ids[key] = rt.id;
  }
  await game.settings.set(ID, "tableIds", ids);
}

/** 阿拉伯數字 0–21 轉羅馬數字（0 維持 0） */
export function toRoman(n) {
  if (n === 0) return "0";
  const map = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];
  let out = "";
  let x = n;
  for (const [v, s] of map) {
    while (x >= v) { out += s; x -= v; }
  }
  return out;
}
