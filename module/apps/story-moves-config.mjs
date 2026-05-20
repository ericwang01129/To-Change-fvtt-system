import { TO_CHANGE } from "../config.mjs";

const ID = TO_CHANGE.ID;

/**
 * 故事動作設定選單:勾選本場戰役啟用哪些故事動作。
 * 動作會顯示於每張角色卡的「蛻化記錄」分頁,作為敘事者與玩家的提示。
 */
export class StoryMovesConfig extends FormApplication {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["to-change", "story-moves-config"],
      template: `systems/${ID}/templates/apps/story-moves-config.hbs`,
      title: game.i18n?.localize("TOCHANGE.Settings.movesMenu.label") ?? "故事動作",
      width: 460,
      height: "auto"
    });
  }

  /** @override */
  getData() {
    const enabled = game.settings.get(ID, "storyMoves") ?? {};
    return {
      moves: Object.entries(TO_CHANGE.storyMoves).map(([key, m]) => ({
        key,
        label: game.i18n.localize(m.label),
        hint: game.i18n.localize(`${m.label}.hint`),
        automatable: m.automatable,
        on: !!enabled[key]
      }))
    };
  }

  /** @override */
  async _updateObject(_event, formData) {
    const data = {};
    for (const key of Object.keys(TO_CHANGE.storyMoves)) {
      data[key] = !!formData[key];
    }
    await game.settings.set(ID, "storyMoves", data);
    ui.notifications.info(game.i18n.localize("TOCHANGE.Settings.movesSaved"));
  }
}
