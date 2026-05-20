import { TO_CHANGE } from "../config.mjs";
import { ARCANA, getArcana, DEATH } from "../arcana.mjs";
import { ResolutionDialog } from "../apps/resolution.mjs";
import { SoloTracker } from "../apps/solo-tracker.mjs";
import { toRoman } from "../setup.mjs";

const ID = TO_CHANGE.ID;
const ART = `systems/${ID}/assets/cards`;

/**
 * To Change 角色卡。
 */
export class ToChangeCharacterSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["to-change", "sheet", "actor"],
      template: `systems/${ID}/templates/actor/character-sheet.hbs`,
      width: 720,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
    });
  }

  /** @override */
  async getData(options) {
    const context = await super.getData(options);
    const sys = this.actor.system;
    context.sys = sys;
    context.isCross = sys.layout === "cross";
    context.isWheel = sys.layout === "wheel";
    context.editable = this.isEditable;

    // 屬性面板
    context.attrs = TO_CHANGE.attributeKeys.map(key => {
      const a = sys.attributes[key];
      return {
        key,
        label: game.i18n.localize(TO_CHANGE.attributes[key].label),
        abbr: TO_CHANGE.attributes[key].abbr,
        axis: TO_CHANGE.attributes[key].axis,
        kind: TO_CHANGE.attributes[key].kind,
        max: a.max,
        draw: a.draw,
        damage: a.damage,
        changed: a.changeCount,
        depleted: a.depleted,
        // 由外（index 0）而內排序的格子
        cells: Array.from({ length: a.max }, (_, i) => ({
          index: i,
          changed: i < a.changed,
          damaged: i < a.damage
        })),
        // 傷害點陣（屬性面板用）
        damagePips: Array.from({ length: a.max }, (_, i) => ({ index: i, on: i < a.damage }))
      };
    });

    // 跨性別蛻化輪盤
    context.wheel = TO_CHANGE.attributeKeys.map(key => ({
      key,
      label: game.i18n.localize(TO_CHANGE.attributes[key].label),
      abbr: TO_CHANGE.attributes[key].abbr,
      aspects: TO_CHANGE.wheelAspects[key].map((asp, i) => ({
        index: i,
        roman: asp.roman,
        label: game.i18n.localize(asp.label),
        on: !!sys.wheel?.[key]?.[i]
      }))
    }));

    // 三張角色牌
    context.cardSlots = ["face", "rising", "falling"].map(slot => {
      const num = sys.cards?.[slot];
      const has = num !== null && num !== undefined;
      const a = has ? getArcana(num) : null;
      return {
        slot,
        slotLabel: game.i18n.localize(`TOCHANGE.Cards.${slot}`),
        has,
        num,
        zh: a?.zh ?? "",
        en: a?.en ?? "",
        roman: a ? toRoman(a.num) : "",
        img: a ? `${ART}/${a.art}` : `systems/${ID}/assets/ui/card-empty.svg`,
        ability: a ? a[slot] : ""
      };
    });

    // 故事動作（已啟用者）
    const moves = game.settings.get(ID, "storyMoves") ?? {};
    context.enabledMoves = Object.keys(TO_CHANGE.storyMoves)
      .filter(k => moves[k])
      .map(k => game.i18n.localize(TO_CHANGE.storyMoves[k].label));

    context.layoutChoices = Object.entries(TO_CHANGE.layouts).map(([k, v]) => ({
      key: k, label: game.i18n.localize(v), selected: k === sys.layout
    }));

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    // 十字格子:左鍵 = 蛻化,右鍵 = 傷害
    html.find(".cross-cell").on("click", ev => this._onCell(ev, "changed"));
    html.find(".cross-cell").on("contextmenu", ev => this._onCell(ev, "damage"));

    // 屬性面板傷害點
    html.find(".damage-pip").on("click", ev => this._onCell(ev, "damage"));

    // 永恆之點
    html.find("[data-action=perm-change]").on("click", () =>
      this.actor.update({ "system.permanence.changed": !this.actor.system.permanence.changed }));
    html.find("[data-action=perm-damage]").on("click", () =>
      this.actor.update({ "system.permanence.damaged": !this.actor.system.permanence.damaged }));

    // 輪盤格子
    html.find(".wheel-aspect").on("click", ev => {
      const { attr, index } = ev.currentTarget.dataset;
      const arr = foundry.utils.duplicate(this.actor.system.wheel[attr]);
      arr[parseInt(index)] = !arr[parseInt(index)];
      this.actor.update({ [`system.wheel.${attr}`]: arr });
    });

    // 開啟行動占卜
    html.find("[data-action=resolve]").on("click", ev => {
      const attr = ev.currentTarget.dataset.attr ?? "mf";
      new ResolutionDialog(this.actor, attr).render(true);
    });

    // 選角色牌
    html.find("[data-action=pick-card]").on("click", ev =>
      this._pickArcana(ev.currentTarget.dataset.slot));

    // 清除角色牌
    html.find("[data-action=clear-card]").on("click", ev =>
      this.actor.update({ [`system.cards.${ev.currentTarget.dataset.slot}`]: null }));

    // 單人遊玩面板
    html.find("[data-action=solo]").on("click", () =>
      new SoloTracker(this.actor).render(true));
  }

  /**
   * 點陣互動:點 index i 的格子 → 切換該層計數。
   * @param {Event} ev
   * @param {"changed"|"damage"} layer
   */
  _onCell(ev, layer) {
    ev.preventDefault();
    const el = ev.currentTarget;
    const attr = el.dataset.attr;
    const i = parseInt(el.dataset.index);
    if (!attr || isNaN(i)) return;

    // 輪盤模式下蛻化由輪盤管理,十字格子的蛻化層停用
    if (layer === "changed" && this.actor.system.layout === "wheel") return;

    const field = layer === "changed" ? "changed" : "damage";
    const cur = this.actor.system.attributes[attr][field];
    const next = (cur === i + 1) ? i : i + 1;
    this.actor.update({ [`system.attributes.${attr}.${field}`]: next });
  }

  /** 從 22 張大阿爾克那挑一張作為角色牌 */
  _pickArcana(slot) {
    // 昇位／墮位不能是死神
    const pool = ARCANA.filter(a => slot === "face" || a.num !== DEATH);
    const opts = pool.map(a =>
      `<option value="${a.num}">${toRoman(a.num)} ${a.zh}（${a.en}）</option>`).join("");
    const cur = this.actor.system.cards?.[slot];

    new Dialog({
      title: game.i18n.format("TOCHANGE.Cards.pickTitle",
        { slot: game.i18n.localize(`TOCHANGE.Cards.${slot}`) }),
      content: `<form><div class="form-group"><select name="arc" style="width:100%">
        ${opts}</select></div></form>`,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("TOCHANGE.Common.confirm"),
          callback: html => {
            const v = parseInt(html.find("[name=arc]").val());
            this.actor.update({ [`system.cards.${slot}`]: v });
          }
        }
      },
      default: "ok",
      render: html => { if (cur !== null && cur !== undefined) html.find("[name=arc]").val(cur); }
    }).render(true);
  }
}
