import { TO_CHANGE } from "../config.mjs";
import { ARCANA, getArcana } from "../arcana.mjs";
import { toRoman } from "../setup.mjs";
import { loadSoloRules, getSoloRules, rollDailyEvent } from "../solo-engine.mjs";

const ID = TO_CHANGE.ID;
const ART = `systems/${ID}/assets/cards`;

/**
 * 單人遊玩面板。
 */
export class SoloTracker extends Application {

  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["to-change", "solo-tracker"],
      template: `systems/${ID}/templates/apps/solo-tracker.hbs`,
      width: 520,
      height: "auto",
      resizable: true
    });
  }

  get title() {
    return `${game.i18n.localize("TOCHANGE.Solo.title")} — ${this.actor.name}`;
  }

  /** @override */
  async getData() {
    await loadSoloRules();
    const sys = this.actor.system;
    const startNum = sys.solo?.startingCard;
    const hasStart = startNum !== null && startNum !== undefined;
    const rules = hasStart ? getSoloRules(startNum) : null;
    const a = hasStart ? getArcana(startNum) : null;

    return {
      actor: this.actor,
      day: sys.solo?.day ?? 1,
      totalChange: sys.totalChange ?? 0,
      hasStart,
      startNum,
      startView: a ? {
        zh: a.zh, en: a.en, roman: toRoman(a.num),
        img: `${ART}/${a.art}`,
        startRule: rules?.start ?? ""
      } : null,
      threshold: rules?.threshold ?? null,
      journal: sys.solo?.journal ?? "",
      arcanaList: ARCANA.map(x => ({ num: x.num, label: `${toRoman(x.num)} ${x.zh}` }))
    };
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find("[data-action=set-start]").on("click", () => {
      const v = parseInt(html.find("[name=start-card]").val());
      this.actor.update({ "system.solo.startingCard": v }).then(() => this.render());
    });

    html.find("[data-action=advance]").on("click", () => this._advanceDay());

    html.find("[data-action=save-journal]").on("click", () => {
      const text = html.find("[name=journal]").val();
      this.actor.update({ "system.solo.journal": text });
      ui.notifications.info(game.i18n.localize("TOCHANGE.Solo.journalSaved"));
    });

    html.find("[data-action=reset]").on("click", () => {
      Dialog.confirm({
        title: game.i18n.localize("TOCHANGE.Solo.resetTitle"),
        content: `<p>${game.i18n.localize("TOCHANGE.Solo.resetPrompt")}</p>`,
        yes: () => this.actor.update({ "system.solo.day": 1 }).then(() => this.render())
      });
    });
  }

  /** 進行新的一天 */
  async _advanceDay() {
    // 1. 當天承受一點蛻化（玩家指定屬性）
    const attrKey = await this._pickAttribute();
    if (attrKey === null) return;
    await this.actor.applyChange(attrKey, 1);

    // 2. 抽當天事件
    const event = rollDailyEvent(this.actor);
    if (!event) {
      ui.notifications.warn(game.i18n.localize("TOCHANGE.Solo.noStartCard"));
      return;
    }

    // 3. 推進日數
    const day = (this.actor.system.solo?.day ?? 1);
    await this.actor.update({ "system.solo.day": day + 1, "system.solo.polarity": event.polarity });

    // 4. 發事件聊天卡
    await this._postEvent(day, attrKey, event);
    this.render();
  }

  /** 詢問當天的蛻化分配到哪一項屬性 */
  _pickAttribute() {
    return new Promise(resolve => {
      const opts = TO_CHANGE.attributeKeys.map(k =>
        `<option value="${k}">${game.i18n.localize(TO_CHANGE.attributes[k].label)}</option>`).join("");
      new Dialog({
        title: game.i18n.localize("TOCHANGE.Solo.dailyChangeTitle"),
        content: `<p>${game.i18n.localize("TOCHANGE.Solo.dailyChangePrompt")}</p>
          <select name="attr" style="width:100%">${opts}</select>`,
        buttons: {
          ok: {
            label: game.i18n.localize("TOCHANGE.Common.confirm"),
            callback: html => resolve(html.find("[name=attr]").val())
          }
        },
        default: "ok",
        close: () => resolve(null)
      }).render(true);
    });
  }

  /** 發每日事件聊天卡 */
  async _postEvent(day, attrKey, event) {
    const polarityLabel = game.i18n.localize(`TOCHANGE.Solo.${event.polarity}`);
    const attrLabel = game.i18n.localize(TO_CHANGE.attributes[attrKey].label);
    const content = `
      <div class="to-change solo-event">
        <header class="se-header ${event.polarity}">
          <span class="se-day">${game.i18n.format("TOCHANGE.Solo.dayN", { n: day })}</span>
          <span class="se-polarity ${event.polarity}">${polarityLabel}</span>
        </header>
        <p class="se-change"><i class="fas fa-spa"></i>
          ${game.i18n.format("TOCHANGE.Solo.dailyChangeLog", { attr: attrLabel })}</p>
        <p class="se-card">${toRoman(event.eventCard.num)} ${event.eventCard.zh}（${event.eventCard.en}）</p>
        <p class="se-event">${event.eventText}</p>
        <p class="se-prompt"><i class="fas fa-feather"></i>
          ${game.i18n.localize("TOCHANGE.Solo.writeJournal")}</p>
      </div>`;
    await ChatMessage.create({
      content,
      speaker: ChatMessage.getSpeaker({ actor: this.actor })
    });
  }
}
