/**
 * 預兆牌 —— 塔羅 22 張大阿爾克那。
 *
 * 每張牌:
 *  - num / key / zh / en : 識別資訊
 *  - art            : assets/cards 下的圖檔名
 *  - effectText     : 行動占卜中被「選用」時的規則文字（顯示用）
 *  - effect         : 機讀指令,供 resolution-engine 自動化
 *  - face/rising/falling : 角色建立時的牌義（角色卡顯示用）
 *
 * effect 欄位:
 *  result      success | fail | gm | redraw
 *  flavorAttr  mf|ma|pf|pa —— 成功所「依憑」的屬性（風味）;
 *              mostChanged —— 全場累積蛻化最多的屬性（正義）; null —— 無
 *  selectable  false 代表有特殊選用限制（死神）
 *  noDiscard   true 代表使用後不棄掉（死神、節制）
 *  tags        額外自動化標記
 */

export const ARCANA = [
  {
    num: 0, key: "fool", zh: "愚者", en: "The Fool", art: "00-fool.jpg",
    effectText: "成功,但永遠是以最糟的方式（受傷、出糗、額外的麻煩）。",
    effect: { result: "success", flavorAttr: null, selectable: true, noDiscard: false, tags: ["worstWay"] },
    face: "你是「喜悅」。每當你抽牌失敗時,若愚者位於棄牌堆中,將他放回牌堆並重新洗牌。",
    rising: "自由是你的核心;沒有任何一扇門對你關上。",
    falling: "羞恥將是你的崩落;難堪如影隨形。"
  },
  {
    num: 1, key: "magician", zh: "魔術師", en: "The Magician", art: "01-magician.jpg",
    effectText: "以心靈天賦（MA）取得成功。",
    effect: { result: "success", flavorAttr: "ma", selectable: true, noDiscard: false, tags: [] },
    face: "你是「創造」。每當你選用魔術師時,你在所有屬性上取得成功,且你的成功充滿奇幻色彩,在外行人眼中宛如奇蹟。",
    rising: "靈感是你的核心;創作的衝動如雷電擊中你。",
    falling: "猶豫將是你的崩落;對失敗的恐懼在每個轉角拉住你。"
  },
  {
    num: 2, key: "high-priestess", zh: "女祭司", en: "The High Priestess", art: "02-high-priestess.jpg",
    effectText: "以心靈韌性（MF）取得成功。",
    effect: { result: "success", flavorAttr: "mf", selectable: true, noDiscard: false, tags: [] },
    face: "你是「映照」。每當你選用女祭司時,你在所有屬性上取得成功,且你的成功源自你的過去,會喚起一段失落的記憶。",
    rising: "直覺是你的核心;你信任自己一路所學。",
    falling: "懷疑將是你的崩落;質疑自己,一切便失控。"
  },
  {
    num: 3, key: "empress", zh: "皇后", en: "The Empress", art: "03-empress.jpg",
    effectText: "以心靈天賦（MA）取得成功。",
    effect: { result: "success", flavorAttr: "ma", selectable: true, noDiscard: false, tags: [] },
    face: "你是「關懷」。每當你選用皇后時,你在所有屬性上取得成功,且你的成功是為了他人之利,與身邊每個人共享。",
    rising: "陪伴是你的核心;那些你親近的朋友是你力量的來源。",
    falling: "孤獨將是你的崩落;你總緊緊倚賴他人的協助。"
  },
  {
    num: 4, key: "emperor", zh: "皇帝", en: "The Emperor", art: "04-emperor.jpg",
    effectText: "以心靈韌性（MF）取得成功。",
    effect: { result: "success", flavorAttr: "mf", selectable: true, noDiscard: false, tags: [] },
    face: "你是「指揮」。每當你選用皇帝時,你在所有屬性上取得成功,且你的成功將你的意志加諸於他人之上,標誌你為一名領導者。",
    rising: "信任是你的核心;可以倚靠的同袍是最大的寶藏。",
    falling: "背叛將是你的崩落;連最親近的朋友都顯得可疑。"
  },
  {
    num: 5, key: "hierophant", zh: "教皇", en: "The Hierophant", art: "05-hierophant.jpg",
    effectText: "以肉體韌性（PF）取得成功。",
    effect: { result: "success", flavorAttr: "pf", selectable: true, noDiscard: false, tags: [] },
    face: "你是「博學」。每當你選用教皇時,你在所有屬性上取得成功,且你的成功具有教育意義,留給對方一道難忘的教訓。",
    rising: "紀律是你的核心;對每個問題你都有一套系統。",
    falling: "失序將是你的崩落;干擾總在最糟的時刻擊中你。"
  },
  {
    num: 6, key: "lovers", zh: "戀人", en: "The Lovers", art: "06-lovers.jpg",
    effectText: "以肉體韌性（PF）取得成功。",
    effect: { result: "success", flavorAttr: "pf", selectable: true, noDiscard: false, tags: [] },
    face: "你是「愛慕」。每當你選用戀人時,你在所有屬性上取得成功,且你的成功會把迷戀引向你,餵養著愛之火。",
    rising: "熱情是你的核心;愛的火柴將你點成熊熊烈焰。",
    falling: "渴慕將是你的崩落;你憎惡自己無法擁有的事物。"
  },
  {
    num: 7, key: "chariot", zh: "戰車", en: "The Chariot", art: "07-chariot.jpg",
    effectText: "以肉體韌性（PF）取得成功。",
    effect: { result: "success", flavorAttr: "pf", selectable: true, noDiscard: false, tags: [] },
    face: "你是「驅力」。每當你選用戰車時,你在所有屬性上取得成功,且你的成功無可否認,沒有人能質疑。",
    rising: "競爭是你的核心;沒有競賽就沒有勝利。",
    falling: "倦怠將是你的崩落;要鼓起動力總是不易。"
  },
  {
    num: 8, key: "strength", zh: "力量", en: "Strength", art: "08-strength.jpg",
    effectText: "以肉體天賦（PA）取得成功。",
    effect: { result: "success", flavorAttr: "pa", selectable: true, noDiscard: false, tags: [] },
    face: "你是「力」。每當你選用力量時,你在所有屬性上取得成功,且你的成功宛如超人,搏動著能量與原始的力。",
    rising: "意志是你的核心;不可摧的意念裹覆你的骨頭。",
    falling: "怯懦將是你的崩落;恐慌讓你的雙腿背叛你。"
  },
  {
    num: 9, key: "hermit", zh: "隱者", en: "The Hermit", art: "09-hermit.jpg",
    effectText: "以心靈韌性（MF）取得成功。",
    effect: { result: "success", flavorAttr: "mf", selectable: true, noDiscard: false, tags: [] },
    face: "你是「好奇」。每當你選用隱者時,你在所有屬性上取得成功,且你的成功只屬於你自己——沒有人能搶走你行動的功勞。",
    rising: "指引是你的核心;身為老師,便是帶著目的地學習。",
    falling: "歸咎將是你的崩落;指責縈繞於你的惡夢之中。"
  },
  {
    num: 10, key: "wheel", zh: "命運之輪", en: "Wheel of Fortune", art: "10-wheel.jpg",
    effectText: "以肉體天賦（PA）取得成功。",
    effect: { result: "success", flavorAttr: "pa", selectable: true, noDiscard: false, tags: [] },
    face: "你是「幸運」。每當你選用命運之輪時,你在所有屬性上取得成功,且你的成功預示著「運勢之潮即將翻轉」。",
    rising: "流動是你的核心;你能掌握那些看不見的機運之線。",
    falling: "兇兆將是你的崩落;厄運潛伏在每一道陰影中。"
  },
  {
    num: 11, key: "justice", zh: "正義", en: "Justice", art: "11-justice.jpg",
    effectText: "在「全體玩家中累積最多蛻化、或並列最多」的那項屬性上取得成功。",
    effect: { result: "success", flavorAttr: "mostChanged", selectable: true, noDiscard: false, tags: [] },
    face: "你是「責任」。每當你的蛻化十字上水平或垂直對稱地分布著已蛻化的屬性點時,你的每次抽牌都多翻開一張牌。",
    rising: "自制是你的核心;情緒在你血管中冷靜流動。",
    falling: "敵意將是你的崩落;憤怒與盛怒攫住你的手。"
  },
  {
    num: 12, key: "hanged-man", zh: "倒吊人", en: "The Hanged Man", art: "12-hanged-man.jpg",
    effectText: "以肉體天賦（PA）取得成功。",
    effect: { result: "success", flavorAttr: "pa", selectable: true, noDiscard: false, tags: [] },
    face: "你是「自由」。每當你選用倒吊人時,你在所有屬性上取得成功,且你的成功是以「只有你才能理解的方式」運作。",
    rising: "視野是你的核心;正確的角度能看穿任何困境。",
    falling: "束縛將是你的崩落;自由表達是你的氧氣。"
  },
  {
    num: 13, key: "death", zh: "死神", en: "Death", art: "13-death.jpg",
    effectText: "無可逃避者。不能被選用——除非牠是這次占卜中唯一翻開的一張。一旦被選用,視為成功,且不會被棄掉。任何一次抽牌中只要翻出死神且最終成功,你便承受一次蛻化。",
    effect: { result: "success", flavorAttr: null, selectable: false, noDiscard: true, tags: ["deathChange"] },
    face: "你是什麼?每當任何一張牌被使用並棄掉時,你都可以讓那張牌成為你的面相牌——獲得它的能力、並取代你目前的面相牌。",
    rising: "（死神不能作為昇位牌。）",
    falling: "（死神不能作為墮位牌。）"
  },
  {
    num: 14, key: "temperance", zh: "節制", en: "Temperance", art: "14-temperance.jpg",
    effectText: "失敗,但希望未滅。所有已棄掉的牌全部洗回牌堆。",
    effect: { result: "fail", flavorAttr: null, selectable: true, noDiscard: true, tags: ["recallAll"] },
    face: "你是「靜定」。每當你承受一次蛻化時,你都可以選擇將它變為「永久」。",
    rising: "接受是你的核心;自身的任何一部分對你而言都不陌生。",
    falling: "悔恨將是你的崩落;過去的爪子陷在你的皮膚裡。"
  },
  {
    num: 15, key: "devil", zh: "惡魔", en: "The Devil", art: "15-devil.jpg",
    effectText: "成功,且你承受一次蛻化。你可以對敘事者許願,指定這次轉化的具體樣貌。",
    effect: { result: "success", flavorAttr: null, selectable: true, noDiscard: false, tags: ["change", "wish"] },
    face: "你是「狂野」。當你選用惡魔時,由你決定「有多少屬性點被蛻化」與「具體是哪幾點」,即使順序不依規則也行。",
    rising: "本能是你的核心;感官從不引你走錯路。",
    falling: "衝動將是你的崩落;慾望輕易便能掀翻你的意志。"
  },
  {
    num: 16, key: "tower", zh: "高塔", en: "The Tower", art: "16-tower.jpg",
    effectText: "災難性失敗,並引發一場全新危機。你下一次抽牌時,要多翻開兩張牌。",
    effect: { result: "fail", flavorAttr: null, selectable: true, noDiscard: false, tags: ["nextDrawBonus2"] },
    face: "你是「災難」。當你選用一張牌之後,所有翻開的牌（除了死神與節制）都會被棄掉,而非僅棄掉你使用的那張。",
    rising: "莽撞是你的核心;後果只會拖慢你的腳步。",
    falling: "必朽將是你的崩落;對死亡的念頭讓你癱瘓。"
  },
  {
    num: 17, key: "star", zh: "星星", en: "The Star", art: "17-star.jpg",
    effectText: "以心靈天賦（MA）取得成功。",
    effect: { result: "success", flavorAttr: "ma", selectable: true, noDiscard: false, tags: [] },
    face: "你是「天賦」。每當你選用星星時,你在所有屬性上取得成功,且你的成功是「純粹的天才之筆」。",
    rising: "表演是你的核心;取悅群眾是你的專長。",
    falling: "脆弱將是你的崩落;無助是你的自我實現預言。"
  },
  {
    num: 18, key: "moon", zh: "月亮", en: "The Moon", art: "18-moon.jpg",
    effectText: "失敗——或是選擇從牌堆底部抽出一張新牌,並必須改用那張牌。然後將那張牌與月亮一同棄掉。",
    effect: { result: "fail", flavorAttr: null, selectable: true, noDiscard: false, tags: ["bottomDraw"] },
    face: "你是「神祕」。每次占卜中你可一次將任何一張牌（除了死神或節制）視為「月亮」對待。",
    rising: "隱密是你的核心;嫻熟於行走那些被遺忘的路徑。",
    falling: "審視將是你的崩落;你心上的傷疤渴望被藏起。"
  },
  {
    num: 19, key: "sun", zh: "太陽", en: "The Sun", art: "19-sun.jpg",
    effectText: "成功,並可看到牌堆最上方的下三張牌。",
    effect: { result: "success", flavorAttr: null, selectable: true, noDiscard: false, tags: ["peekTop3"] },
    face: "你是「希望」。每當任何玩家在占卜中成功、且牌堆被洗牌之後,你可以請敘事者讓你看牌堆最上方那一張。",
    rising: "夢想是你的核心;拒絕對未來棄手。",
    falling: "妄念將是你的崩落;你看不清事物本來的樣子。"
  },
  {
    num: 20, key: "judgement", zh: "審判", en: "Judgement", art: "20-judgement.jpg",
    effectText: "是成功還是失敗,由敘事者決定（在雙人或單人遊戲中,由抽牌的玩家自己決定）。",
    effect: { result: "gm", flavorAttr: null, selectable: true, noDiscard: false, tags: [] },
    face: "你是「真誠」。每當審判被選用時,由你而非敘事者來決定成敗。",
    rising: "誠實是你的核心;謊言對你而言不自然。",
    falling: "欺騙將是你的崩落;謊言總在你不備之時擊中你。"
  },
  {
    num: 21, key: "world", zh: "世界", en: "The World", art: "21-world.jpg",
    effectText: "世界介入並重生。從棄牌堆中取出一張牌（世界本身除外）,把它放回牌堆,洗牌後重新抽。",
    effect: { result: "redraw", flavorAttr: null, selectable: true, noDiscard: false, tags: ["worldReturn"] },
    face: "你是「連結」。當你選用世界時,從棄牌堆中取出任意數量的牌（世界本身除外）,把它們放回牌堆——而不是只取一張。",
    rising: "互助是你的核心;支持不是一條街,而是一張網。",
    falling: "流亡將是你的崩落;沒有接納,你便活不下去。"
  }
];

/** 以編號取得牌 */
export function getArcana(num) {
  return ARCANA[num] ?? null;
}

/** 死神 / 節制 編號 —— 永不棄掉 */
export const DEATH = 13;
export const TEMPERANCE = 14;
