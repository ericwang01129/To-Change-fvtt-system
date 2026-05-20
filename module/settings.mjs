import { TO_CHANGE } from "./config.mjs";

/**
 * 註冊世界設定。
 */
export function registerSettings() {
  const id = TO_CHANGE.ID;

  // 新角色的屬性起始上限（戰役模式可調高）
  game.settings.register(id, "attributeMax", {
    name: "TOCHANGE.Settings.attributeMax.name",
    hint: "TOCHANGE.Settings.attributeMax.hint",
    scope: "world",
    config: true,
    type: Number,
    default: 3,
    range: { min: 3, max: 8, step: 1 }
  });

  // 啟用的故事動作（物件:{ moveKey: boolean }）
  game.settings.register(id, "storyMoves", {
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  // —— 以下為內部狀態,不顯示於設定面板 ——

  // 首次啟動內容是否已建立
  game.settings.register(id, "setupDone", {
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });

  // 預兆牌的機制狀態:抽牌區與棄牌區（皆為大阿爾克那編號陣列 0–21）
  game.settings.register(id, "deckState", {
    scope: "world",
    config: false,
    type: Object,
    default: { draw: [], discard: [] }
  });

  // 可瀏覽的圖示牌組 Cards 文件 id（參考用,非機制狀態）
  game.settings.register(id, "deckId", {
    scope: "world", config: false, type: String, default: ""
  });

  // 隨機表格 RollTable id（表 1–5）
  game.settings.register(id, "tableIds", {
    scope: "world", config: false, type: Object, default: {}
  });
}

/** 取得已啟用的故事動作鍵集合 */
export function getEnabledMoves() {
  const data = game.settings.get(TO_CHANGE.ID, "storyMoves") ?? {};
  return Object.keys(TO_CHANGE.storyMoves).filter(k => data[k]);
}
