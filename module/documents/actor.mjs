import { TO_CHANGE } from "../config.mjs";

/**
 * To Change 角色 Actor。
 * 衍生資料:每屬性抽牌數、目前蛻化量、全角色蛻化總量、十字對稱（供正義 face）。
 */
export class ToChangeActor extends Actor {

  /** @override */
  prepareBaseData() {
    super.prepareBaseData();
    const sys = this.system;
    // 正規化:max 至少 1,damage / changed 夾在 [0, max]
    const clamp = (v, lo, hi) => Math.min(Math.max(Number(v) || 0, lo), hi);
    for (const key of TO_CHANGE.attributeKeys) {
      const attr = sys.attributes?.[key];
      if (!attr) continue;
      attr.max = Math.max(1, Number(attr.max) || 3);
      attr.damage = clamp(attr.damage, 0, attr.max);
      attr.changed = clamp(attr.changed, 0, attr.max);
    }
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    const sys = this.system;
    if (this.type !== "character") return;

    let totalChange = 0;
    let totalDamage = 0;

    for (const key of TO_CHANGE.attributeKeys) {
      const attr = sys.attributes[key];

      // 目前蛻化量:輪盤模式取輪盤格數,十字模式取 changed
      const wheelCount = (sys.wheel?.[key] ?? []).filter(Boolean).length;
      attr.changeCount = sys.layout === "wheel" ? wheelCount : attr.changed;

      // 抽牌數 = max − 已受損格數（蛻化不影響抽牌數）
      attr.draw = Math.max(0, attr.max - attr.damage);

      // 是否完全耗盡
      attr.depleted = attr.damage >= attr.max;
      // 是否完全蛻化
      attr.fullyChanged = attr.changeCount >= attr.max;

      totalChange += attr.changeCount;
      totalDamage += attr.damage;
    }

    if (sys.permanence?.changed) totalChange += 1;

    sys.totalChange = totalChange;
    sys.totalDamage = totalDamage;

    // 可承受蛻化的「未蛻化」屬性點數（供蛻變判定）
    sys.changeRoom = TO_CHANGE.attributeKeys.reduce((acc, key) => {
      const attr = sys.attributes[key];
      return acc + Math.max(0, attr.max - attr.changeCount);
    }, 0);

    // 十字對稱偵測（正義 face 能力）
    const c = TO_CHANGE.attributeKeys.reduce((o, k) => {
      o[k] = sys.attributes[k].changeCount; return o;
    }, {});
    const horizontal = (c.ma === c.mf) && (c.pa === c.pf);
    const vertical = (c.ma === c.pa) && (c.mf === c.pf);
    sys.crossSymmetric = totalChange > 0 && (horizontal || vertical);

    // 死亡建議:某屬性 3 點傷害 + 永恆受損
    const anyAttrMaxed = TO_CHANGE.attributeKeys.some(k => sys.attributes[k].depleted);
    sys.deathSuggested = anyAttrMaxed && sys.permanence?.damaged;
  }

  /**
   * 對某屬性套用 N 點蛻化（由外而內,十字模式;輪盤模式回傳待玩家指定的格數）。
   * @returns {Promise<void>}
   */
  async applyChange(attrKey, amount = 1) {
    const sys = this.system;
    const attr = sys.attributes[attrKey];
    if (!attr) return;
    if (sys.layout === "wheel") {
      // 輪盤模式:不自動指定,僅提示玩家於角色卡上點選
      ui.notifications?.info(game.i18n.format("TOCHANGE.Notify.wheelChangePending",
        { attr: game.i18n.localize(TO_CHANGE.attributes[attrKey].label), n: amount }));
      return;
    }
    const next = Math.min(attr.max, attr.changed + amount);
    await this.update({ [`system.attributes.${attrKey}.changed`]: next });
  }

  /** 對某屬性套用 N 點傷害 */
  async applyDamage(attrKey, amount = 1) {
    const attr = this.system.attributes[attrKey];
    if (!attr) return;
    const next = Math.min(attr.max, attr.damage + amount);
    await this.update({ [`system.attributes.${attrKey}.damage`]: next });
  }
}
