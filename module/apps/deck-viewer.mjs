import { TO_CHANGE } from "../config.mjs";
import { getArcana } from "../arcana.mjs";
import { Deck } from "../deck.mjs";
import { toRoman } from "../setup.mjs";

const ID = TO_CHANGE.ID;
const ART = `systems/${ID}/assets/cards`;

/**
 * 牌堆檢視視窗 —— 僅 GM。
 *
 * 純檢視:即時顯示預兆牌目前的抽牌堆順序（由頂到底）與棄牌堆內容,
 * 不提供任何改動牌堆的操作。牌堆狀態（世界設定）一有變動便自動刷新。
 */
export class DeckViewer extends Application {

  constructor(options = {}) {
    super(options);
    // 牌堆狀態變動 → 即時刷新（涵蓋占卜結算、重置、自由抽牌等所有寫入）
    // 用 force:true,避免內部狀態卡在非 RENDERED 時 render 被略過
    this._onSettingUpdate = setting => {
      if (setting?.key === `${ID}.deckState` && this.element.length) this.render(true);
    };
    Hooks.on("updateSetting", this._onSettingUpdate);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["to-change", "deck-viewer"],
      template: `systems/${ID}/templates/apps/deck-viewer.hbs`,
      title: game.i18n?.localize("TOCHANGE.DeckViewer.title") ?? "牌堆檢視",
      width: 460,
      height: 620,
      resizable: true
    });
  }

  /** 開啟視窗（GM 限定）;已開啟則帶到前景。 */
  static open() {
    if (!game.user.isGM) {
      ui.notifications?.warn(game.i18n.localize("TOCHANGE.DeckViewer.gmOnly"));
      return null;
    }
    if (!DeckViewer._instance) DeckViewer._instance = new DeckViewer();
    DeckViewer._instance.render(true);
    return DeckViewer._instance;
  }

  /** @override */
  getData() {
    const state = Deck.state;
    const view = arr => arr.map((num, i) => {
      const a = getArcana(num);
      return {
        pos: i + 1,
        num,
        roman: toRoman(a.num),
        zh: a.zh,
        en: a.en,
        img: `${ART}/${a.art}`
      };
    });
    return {
      draw: view(state.draw),
      discard: view(state.discard),
      drawCount: state.draw.length,
      discardCount: state.discard.length,
      total: state.draw.length + state.discard.length
    };
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    // 重新整理:強制重繪（force:true),確保任何狀態下都會重抓牌堆並刷新
    html.find("[data-action=refresh]").on("click", () => this.render(true));
  }

  /** @override */
  async close(options) {
    Hooks.off("updateSetting", this._onSettingUpdate);
    DeckViewer._instance = null;
    return super.close(options);
  }
}
