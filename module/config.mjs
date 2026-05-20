/**
 * 《To Change 蛻化》系統常數
 */
export const TO_CHANGE = {};

/** 系統 id */
TO_CHANGE.ID = "to-change";

/**
 * 四項屬性。
 * axis: mental / physical;  kind: fortitude（韌性,被動）/ aptitude（天賦,主動）
 */
TO_CHANGE.attributes = {
  mf: { label: "TOCHANGE.Attr.mf", abbr: "MF", axis: "mental", kind: "fortitude" },
  ma: { label: "TOCHANGE.Attr.ma", abbr: "MA", axis: "mental", kind: "aptitude" },
  pf: { label: "TOCHANGE.Attr.pf", abbr: "PF", axis: "physical", kind: "fortitude" },
  pa: { label: "TOCHANGE.Attr.pa", abbr: "PA", axis: "physical", kind: "aptitude" }
};

/** 屬性鍵的固定順序 */
TO_CHANGE.attributeKeys = ["mf", "ma", "pf", "pa"];

/**
 * 跨性別蛻化輪盤 —— 12 格,每屬性 3 格（依原書 p024 輪盤圖）。
 * roman 為輪盤上的羅馬數字標記。
 */
TO_CHANGE.wheelAspects = {
  pa: [
    { roman: "X", label: "TOCHANGE.Wheel.pa.0" },
    { roman: "XI", label: "TOCHANGE.Wheel.pa.1" },
    { roman: "XII", label: "TOCHANGE.Wheel.pa.2" }
  ],
  ma: [
    { roman: "I", label: "TOCHANGE.Wheel.ma.0" },
    { roman: "II", label: "TOCHANGE.Wheel.ma.1" },
    { roman: "III", label: "TOCHANGE.Wheel.ma.2" }
  ],
  pf: [
    { roman: "IV", label: "TOCHANGE.Wheel.pf.0" },
    { roman: "V", label: "TOCHANGE.Wheel.pf.1" },
    { roman: "VI", label: "TOCHANGE.Wheel.pf.2" }
  ],
  mf: [
    { roman: "VII", label: "TOCHANGE.Wheel.mf.0" },
    { roman: "VIII", label: "TOCHANGE.Wheel.mf.1" },
    { roman: "IX", label: "TOCHANGE.Wheel.mf.2" }
  ]
};

/** 角色卡版面 */
TO_CHANGE.layouts = {
  cross: "TOCHANGE.Layout.cross",
  wheel: "TOCHANGE.Layout.wheel"
};

/** 故事動作（14 條）。automatable 標記引擎可自動化者。 */
TO_CHANGE.storyMoves = {
  weakening: { label: "TOCHANGE.Move.weakening", automatable: true },
  strengthening: { label: "TOCHANGE.Move.strengthening", automatable: true },
  conditional: { label: "TOCHANGE.Move.conditional", automatable: false },
  infectious: { label: "TOCHANGE.Move.infectious", automatable: false },
  shared: { label: "TOCHANGE.Move.shared", automatable: false },
  reversible: { label: "TOCHANGE.Move.reversible", automatable: false },
  initial: { label: "TOCHANGE.Move.initial", automatable: false },
  environmental: { label: "TOCHANGE.Move.environmental", automatable: false },
  progressive: { label: "TOCHANGE.Move.progressive", automatable: false },
  living: { label: "TOCHANGE.Move.living", automatable: false },
  rules: { label: "TOCHANGE.Move.rules", automatable: false },
  levels: { label: "TOCHANGE.Move.levels", automatable: false },
  healing: { label: "TOCHANGE.Move.healing", automatable: false },
  mirrored: { label: "TOCHANGE.Move.mirrored", automatable: false }
};

/** 預設牌堆名稱 */
TO_CHANGE.deckName = "預兆牌 Future Deck";
TO_CHANGE.discardName = "棄牌堆 Discard";
