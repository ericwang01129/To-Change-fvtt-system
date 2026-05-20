import { TO_CHANGE } from "./config.mjs";
import { DEATH, TEMPERANCE } from "./arcana.mjs";

const ID = TO_CHANGE.ID;

/**
 * 預兆牌牌堆引擎。
 *
 * 機制狀態存於世界設定 `deckState = { draw:[], discard:[] }`,皆為大阿爾克那
 * 編號（0–21）陣列;`draw` 的 index 0 為牌堆頂。
 *
 * 變換函式皆為純函式:吃一份 state、回傳新的 state,不寫入。實際寫入由
 * `Deck.commit()` 完成（須由 GM 端執行,玩家端經 socket 中繼）。
 */
export class Deck {

  /** 目前狀態的深拷貝 */
  static get state() {
    const s = game.settings.get(ID, "deckState") ?? { draw: [], discard: [] };
    return { draw: [...(s.draw ?? [])], discard: [...(s.discard ?? [])] };
  }

  /** 完整 22 張 */
  static fullDeck() {
    return Array.from({ length: 22 }, (_, i) => i);
  }

  /** Fisher–Yates 洗牌,回傳新陣列 */
  static shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** 全新洗好的牌堆狀態 */
  static freshState() {
    return { draw: this.shuffleArray(this.fullDeck()), discard: [] };
  }

  /** 確保抽牌區至少有 n 張:不足時把棄牌洗回 */
  static ensure(state, n) {
    const s = { draw: [...state.draw], discard: [...state.discard] };
    if (s.draw.length < n && s.discard.length) {
      s.draw = s.draw.concat(this.shuffleArray(s.discard));
      s.discard = [];
    }
    return s;
  }

  /**
   * 自牌堆頂抽 n 張。
   * @returns {{cards:number[], state:object}}
   */
  static drawTop(state, n) {
    const s = this.ensure(state, n);
    const cards = s.draw.slice(0, n);
    return { cards, state: { draw: s.draw.slice(n), discard: [...s.discard] } };
  }

  /** 抽牌堆「底牌」（月亮選項用） */
  static drawBottom(state) {
    const s = this.ensure(state, 1);
    const card = s.draw[s.draw.length - 1];
    return { card, state: { draw: s.draw.slice(0, -1), discard: [...s.discard] } };
  }

  /**
   * 自牌堆「底部」抽 n 張（自由抽牌用）。
   * @returns {{cards:number[], state:object}} cards 由最底張起排列
   */
  static drawBottomCards(state, n) {
    const s = this.ensure(state, n);
    const take = Math.max(0, Math.min(n, s.draw.length));
    const cards = take ? s.draw.slice(s.draw.length - take).reverse() : [];
    return {
      cards,
      state: { draw: s.draw.slice(0, s.draw.length - take), discard: [...s.discard] }
    };
  }

  /** 偷看牌堆頂 n 張（太陽);不改動狀態 */
  static peekTop(state, n) {
    return this.ensure(state, n).draw.slice(0, n);
  }

  /** 偷看牌堆底牌(隨機表格用);會先洗牌 */
  static peekBottomAfterShuffle(state) {
    const draw = this.shuffleArray(this.ensure(state, 1).draw);
    return { card: draw[draw.length - 1], state: { draw, discard: [...state.discard] } };
  }

  /** 把若干張牌洗回抽牌區 */
  static shuffleIntoDraw(state, cards) {
    const draw = this.shuffleArray([...state.draw, ...cards]);
    return { draw, discard: [...state.discard] };
  }

  /** 棄掉一張牌（死神、節制不可棄,改為洗回） */
  static discard(state, card) {
    if (card === DEATH || card === TEMPERANCE) {
      return this.shuffleIntoDraw(state, [card]);
    }
    return { draw: [...state.draw], discard: [...state.discard, card] };
  }

  /** 把所有棄牌洗回抽牌區（節制） */
  static recallAll(state) {
    if (!state.discard.length) return { draw: [...state.draw], discard: [] };
    return { draw: this.shuffleArray([...state.draw, ...state.discard]), discard: [] };
  }

  /** 自棄牌區把某張牌放回並洗牌（世界） */
  static returnFromDiscard(state, card) {
    const discard = [...state.discard];
    const idx = discard.indexOf(card);
    if (idx === -1) return { draw: [...state.draw], discard };
    discard.splice(idx, 1);
    return { draw: this.shuffleArray([...state.draw, card]), discard };
  }

  /** 寫入狀態（須 GM 端;玩家端請改走 socket） */
  static async commit(state) {
    return game.settings.set(ID, "deckState", state);
  }

  /** 重置為全新洗好的牌堆 */
  static async reset() {
    return this.commit(this.freshState());
  }
}
