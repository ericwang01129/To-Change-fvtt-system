import { TO_CHANGE } from "../config.mjs";
import { ARCANA, getArcana, DEATH, TEMPERANCE } from "../arcana.mjs";
import { Deck } from "../deck.mjs";
import { commitDeckState } from "../socket.mjs";
import {
  computeDraw, resolveCard, checkRiseFall, deathSelectable, settleDeck
} from "../resolution-engine.mjs";

const ID = TO_CHANGE.ID;
const ART = `systems/${ID}/assets/cards`;

/**
 * 行動占卜對話框。
 * 三個階段:setup（設定抽牌）→ reveal（翻牌選牌）→ done。
 */
export class ResolutionDialog extends Application {

  constructor(actor, attrKey = "mf", options = {}) {
    super(options);
    this.actor = actor;
    this.attrKey = attrKey;
    this.assist = 0;
    this.phase = "setup";
    this.drawn = [];          // 翻開的牌
    this.workingState = null; // 抽牌後的牌堆狀態
    this.snapshot = null;     // 抽牌前的牌堆狀態
    this.triggers = [];       // 翻牌觸發訊息
    this.usedTowerBonus = 0;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["to-change", "resolution-dialog"],
      template: `systems/${ID}/templates/apps/resolution.hbs`,
      width: 560,
      height: "auto",
      resizable: true
    });
  }

  get title() {
    return `${game.i18n.localize("TOCHANGE.Resolution.title")} — ${this.actor.name}`;
  }

  /** @override */
  getData() {
    const sys = this.actor.system;
    const attr = sys.attributes[this.attrKey];
    const draw = computeDraw(this.actor, this.attrKey, { assist: this.assist });

    const attrChoices = TO_CHANGE.attributeKeys.map(k => ({
      key: k,
      label: game.i18n.localize(TO_CHANGE.attributes[k].label),
      abbr: TO_CHANGE.attributes[k].abbr,
      selected: k === this.attrKey
    }));

    // 蛻變可行性:十字模式看受測屬性是否還有空間;輪盤模式看整體
    const canSuccumb = sys.layout === "wheel"
      ? sys.changeRoom > 0
      : attr.changeCount < attr.max;

    return {
      phase: this.phase,
      isSetup: this.phase === "setup",
      isReveal: this.phase === "reveal",
      actor: this.actor,
      attrKey: this.attrKey,
      attrLabel: game.i18n.localize(TO_CHANGE.attributes[this.attrKey].label),
      attrChoices,
      assist: this.assist,
      draw,
      canSuccumb,
      drawn: this.drawn.map(num => this._cardView(num)),
      triggers: this.triggers,
      deathOnly: this.drawn.length > 0 && deathSelectable(this.drawn)
    };
  }

  /** 單張牌的顯示資料 */
  _cardView(num) {
    const a = getArcana(num);
    return {
      num,
      zh: a.zh,
      en: a.en,
      roman: this._roman(a.num),
      img: `${ART}/${a.art}`,
      effectText: a.effectText,
      selectable: num !== DEATH || deathSelectable(this.drawn)
    };
  }

  _roman(n) {
    if (n === 0) return "0";
    const m = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let o = "", x = n;
    for (const [v, s] of m) while (x >= v) { o += s; x -= v; }
    return o;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find("[data-attr]").on("click", ev => {
      this.attrKey = ev.currentTarget.dataset.attr;
      this.render();
    });
    html.find("[name=assist]").on("change", ev => {
      this.assist = Math.max(0, parseInt(ev.currentTarget.value) || 0);
      this.render();
    });
    html.find("[data-action=draw]").on("click", () => this._onDraw());
    html.find("[data-action=succumb]").on("click", () => this._onSuccumb());
    html.find("[data-action=cancel]").on("click", () => this.close());
    html.find("[data-card]").on("click", ev => {
      const num = parseInt(ev.currentTarget.dataset.card);
      this._onSelectCard(num);
    });
  }

  /** 設定階段 → 抽牌 */
  async _onDraw() {
    const draw = computeDraw(this.actor, this.attrKey, { assist: this.assist });
    this.usedTowerBonus = draw.tower;

    if (draw.total <= 0) {
      ui.notifications.warn(game.i18n.localize("TOCHANGE.Resolution.zeroDraw"));
      return;
    }

    // 世界重抽時改用本地計算好的狀態,避免 socket 往返延遲造成讀到舊牌堆
    this.snapshot = this._pendingState ?? Deck.state;
    this._pendingState = null;
    const res = Deck.drawTop(this.snapshot, draw.total);
    this.drawn = res.cards;
    this.workingState = res.state;
    this.triggers = [];

    // 翻牌觸發:昇位/墮位（抽牌者本人）
    const { risingHits, fallingHits } = checkRiseFall(this.drawn, [this.actor]);

    for (const hit of fallingHits) {
      // 墮位:把最先翻開的那張洗回
      if (this.drawn.length) {
        const first = this.drawn.shift();
        this.workingState = Deck.shuffleIntoDraw(this.workingState, [first]);
        this.triggers.push(game.i18n.format("TOCHANGE.Resolution.fallingTrigger",
          { card: getArcana(hit.card).zh, first: getArcana(first).zh }));
      }
    }
    for (const hit of risingHits) {
      // 昇位:多翻一張
      const more = Deck.drawTop(this.workingState, 1);
      this.drawn.push(...more.cards);
      this.workingState = more.state;
      this.triggers.push(game.i18n.format("TOCHANGE.Resolution.risingTrigger",
        { card: getArcana(hit.card).zh }));
    }

    // 消耗高塔遺留加牌
    if (this.usedTowerBonus > 0) {
      await this.actor.unsetFlag(ID, "nextDrawBonus");
    }

    this.phase = "reveal";
    this.render();
  }

  /** 蛻變:以受測屬性一點蛻化換成功 */
  async _onSuccumb() {
    await this.actor.applyChange(this.attrKey, 1);

    let finalState;
    if (this.phase === "reveal") {
      // 翻過牌:全部洗回
      finalState = settleDeck(this.workingState, this.drawn, null);
    } else {
      finalState = null; // 未抽牌,牌堆不動
    }

    await this._commit(finalState, {
      mode: "succumb",
      result: "success",
      drawn: this.phase === "reveal" ? this.drawn : [],
      chosen: null,
      notes: [game.i18n.localize("TOCHANGE.Resolution.succumbNote")]
    });
    this.close();
  }

  /** 選用一張牌 */
  async _onSelectCard(num) {
    if (num === DEATH && !deathSelectable(this.drawn)) {
      ui.notifications.warn(game.i18n.localize("TOCHANGE.Resolution.deathLocked"));
      return;
    }

    const outcome = resolveCard(num);
    const notes = [];
    let chosen = num;
    let result = outcome.result;
    let towerFace = this.actor.system.cards?.face === 16; // 高塔 face

    // —— 世界:取棄牌放回 → 重抽 ——
    if (outcome.tags.includes("worldReturn")) {
      await this._handleWorld(num);
      return;
    }

    // —— 月亮:可改抽底牌 ——
    let moonBottom = null;
    if (outcome.tags.includes("bottomDraw")) {
      const useBottom = await this._confirm(
        game.i18n.localize("TOCHANGE.Resolution.moonTitle"),
        game.i18n.localize("TOCHANGE.Resolution.moonPrompt"));
      if (useBottom) {
        const bd = Deck.drawBottom(this.workingState);
        this.workingState = bd.state;
        moonBottom = bd.card;
        const bottomOutcome = resolveCard(moonBottom);
        result = bottomOutcome.result;
        outcome.tags = bottomOutcome.tags;
        notes.push(game.i18n.format("TOCHANGE.Resolution.moonUsed",
          { card: getArcana(moonBottom).zh }));
      }
    }

    // —— 審判:由 GM／抽牌者決定成敗 ——
    if (result === "gm") {
      const ok = await this._confirm(
        game.i18n.localize("TOCHANGE.Resolution.judgementTitle"),
        game.i18n.localize("TOCHANGE.Resolution.judgementPrompt"));
      result = ok ? "success" : "fail";
    }

    // 結算牌堆
    let finalState = settleDeck(this.workingState, this.drawn, chosen, { towerFace });
    // 月亮抽底牌:把底牌也棄掉
    if (moonBottom !== null) finalState = Deck.discard(finalState, moonBottom);

    // —— 各種副作用 ——
    // 高塔:下次抽牌 +2
    if (outcome.tags.includes("nextDrawBonus2")) {
      const cur = Number(this.actor.getFlag(ID, "nextDrawBonus")) || 0;
      await this.actor.setFlag(ID, "nextDrawBonus", cur + 2);
      notes.push(game.i18n.localize("TOCHANGE.Resolution.towerNote"));
    }
    // 節制:所有棄牌洗回
    if (outcome.tags.includes("recallAll")) {
      finalState = Deck.recallAll(finalState);
      notes.push(game.i18n.localize("TOCHANGE.Resolution.temperanceNote"));
    }
    // 惡魔:成功 + 1 蛻化 + 許願
    if (outcome.tags.includes("wish") && result === "success") {
      await this.actor.applyChange(this.attrKey, 1);
      notes.push(game.i18n.localize("TOCHANGE.Resolution.devilNote"));
    }
    // 死神在翻開的牌中且最終成功 → 抽牌者承受一次蛻化
    if (this.drawn.includes(DEATH) && result === "success") {
      await this.actor.applyChange(this.attrKey, 1);
      notes.push(game.i18n.localize("TOCHANGE.Resolution.deathNote"));
    }
    // 太陽:偷看牌堆頂 3 張
    if (outcome.tags.includes("peekTop3")) {
      const top = Deck.peekTop(finalState, 3).map(n => getArcana(n).zh);
      notes.push(game.i18n.format("TOCHANGE.Resolution.sunNote", { cards: top.join("、") }));
    }
    // 愚者 face:抽牌失敗且愚者在棄牌堆 → 放回重洗
    if (this.actor.system.cards?.face === 0 && result === "fail"
        && finalState.discard.includes(0)) {
      finalState = Deck.returnFromDiscard(finalState, 0);
      notes.push(game.i18n.localize("TOCHANGE.Resolution.foolFaceNote"));
    }
    if (towerFace) notes.push(game.i18n.localize("TOCHANGE.Resolution.towerFaceNote"));

    await this._commit(finalState, {
      mode: "resolve",
      result,
      drawn: this.drawn,
      chosen,
      moonBottom,
      notes
    });
    this.close();
  }

  /** 世界:返回棄牌 → 重抽 */
  async _handleWorld(worldNum) {
    // 先把世界以外翻開的牌與世界本身依規則歸位（世界被選用 → 棄掉）
    let state = settleDeck(this.workingState, this.drawn, worldNum);

    // 從棄牌堆挑一張放回（世界除外）
    const candidates = state.discard.filter(c => c !== 21);
    if (candidates.length) {
      const pick = await this._pickCard(
        game.i18n.localize("TOCHANGE.Resolution.worldTitle"),
        game.i18n.localize("TOCHANGE.Resolution.worldPrompt"),
        candidates);
      if (pick !== null) state = Deck.returnFromDiscard(state, pick);
    }
    state = { draw: Deck.shuffleArray(state.draw), discard: state.discard };

    await commitDeckState(state);

    // 重新抽牌:直接沿用本地算好的狀態,不重讀設定
    this.phase = "setup";
    this.drawn = [];
    this.triggers = [];
    this._pendingState = state;
    ui.notifications.info(game.i18n.localize("TOCHANGE.Resolution.worldRedraw"));
    // 自動重抽
    await this._onDraw();
  }

  /** 提交結果:寫入牌堆 + 發聊天卡 */
  async _commit(finalState, chatPayload) {
    if (finalState) await commitDeckState(finalState);
    await this._postChat(chatPayload);
  }

  /** 發占卜結果聊天卡 */
  async _postChat(p) {
    const resultLabel = {
      success: "TOCHANGE.Resolution.success",
      fail: "TOCHANGE.Resolution.fail"
    }[p.result] ?? "TOCHANGE.Resolution.fail";

    const content = await renderTemplate(`systems/${ID}/templates/chat/resolution-result.hbs`, {
      actorName: this.actor.name,
      attrLabel: game.i18n.localize(TO_CHANGE.attributes[this.attrKey].label),
      mode: p.mode,
      isSuccumb: p.mode === "succumb",
      resultLabel: game.i18n.localize(resultLabel),
      resultClass: p.result,
      drawn: (p.drawn ?? []).map(n => ({ ...this._cardView(n), isChosen: n === p.chosen })),
      chosen: p.chosen !== null && p.chosen !== undefined ? this._cardView(p.chosen) : null,
      notes: p.notes ?? []
    });

    await ChatMessage.create({
      content,
      speaker: ChatMessage.getSpeaker({ actor: this.actor })
    });
  }

  /** 是非確認對話框 */
  _confirm(title, content) {
    return Dialog.confirm({ title, content: `<p>${content}</p>`, defaultYes: true });
  }

  /** 從一組牌中挑一張 */
  _pickCard(title, prompt, candidates) {
    return new Promise(resolve => {
      const opts = candidates.map(n =>
        `<option value="${n}">${this._roman(n)} ${getArcana(n).zh}</option>`).join("");
      new Dialog({
        title,
        content: `<p>${prompt}</p><select name="pick" style="width:100%">${opts}</select>`,
        buttons: {
          ok: {
            label: game.i18n.localize("TOCHANGE.Common.confirm"),
            callback: html => resolve(parseInt(html.find("[name=pick]").val()))
          },
          skip: {
            label: game.i18n.localize("TOCHANGE.Common.skip"),
            callback: () => resolve(null)
          }
        },
        default: "ok",
        close: () => resolve(null)
      }).render(true);
    });
  }
}
