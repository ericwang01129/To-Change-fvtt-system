/**
 * 《To Change 蛻化》—— Foundry VTT 遊戲系統進入點。
 */
import { TO_CHANGE } from "./module/config.mjs";
import { ToChangeActor } from "./module/documents/actor.mjs";
import { ToChangeCharacterSheet } from "./module/sheets/character-sheet.mjs";
import { registerSettings } from "./module/settings.mjs";
import { registerSocket } from "./module/socket.mjs";
import { runFirstTimeSetup, rebuildContent } from "./module/setup.mjs";
import { Deck } from "./module/deck.mjs";
import { ResolutionDialog } from "./module/apps/resolution.mjs";
import { SoloTracker } from "./module/apps/solo-tracker.mjs";
import { TableRoller } from "./module/apps/table-roller.mjs";
import { StoryMovesConfig } from "./module/apps/story-moves-config.mjs";
import { DeckViewer } from "./module/apps/deck-viewer.mjs";

const ID = TO_CHANGE.ID;

/* -------------------------------------------- */
/*  Init                                        */
/* -------------------------------------------- */

Hooks.once("init", () => {
  console.log("To Change | 初始化《To Change 蛻化》系統");

  CONFIG.TO_CHANGE = TO_CHANGE;
  CONFIG.Actor.documentClass = ToChangeActor;

  // 角色卡
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet(ID, ToChangeCharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "TOCHANGE.Sheet.character"
  });

  registerSettings();

  // 故事動作設定選單
  game.settings.registerMenu(ID, "storyMovesMenu", {
    name: "TOCHANGE.Settings.movesMenu.name",
    label: "TOCHANGE.Settings.movesMenu.label",
    hint: "TOCHANGE.Settings.movesMenu.hint",
    icon: "fas fa-masks-theater",
    type: StoryMovesConfig,
    restricted: true
  });

  // 對外 API
  game.toChange = {
    Deck,
    DeckViewer,
    ResolutionDialog,
    SoloTracker,
    TableRoller,
    rebuildContent,
    openTableRoller: () => new TableRoller().render(true),
    openDeckViewer: () => DeckViewer.open()
  };

  preloadTemplates();
});

/* -------------------------------------------- */
/*  Ready                                       */
/* -------------------------------------------- */

Hooks.once("ready", async () => {
  registerSocket();
  await runFirstTimeSetup();
});

/* -------------------------------------------- */
/*  場景控制按鈕                                  */
/* -------------------------------------------- */

Hooks.on("getSceneControlButtons", controls => {
  // v11/v12:controls 為陣列、tools 為陣列;v13:皆為物件記錄。兩者皆相容。
  const token = Array.isArray(controls)
    ? controls.find(c => c.name === "token")
    : (controls.tokens ?? controls.token);
  if (!token?.tools) return;

  const tools = [{
    name: "tc-table-roller",
    title: game.i18n.localize("TOCHANGE.Tables.title"),
    icon: "fas fa-table-list",
    button: true,
    visible: true,
    order: 90,
    onClick: () => new TableRoller().render(true),
    onChange: () => new TableRoller().render(true)
  }];

  if (game.user.isGM) {
    tools.push({
      name: "tc-deck-viewer",
      title: game.i18n.localize("TOCHANGE.DeckViewer.open"),
      icon: "fas fa-eye",
      button: true,
      visible: true,
      order: 91,
      onClick: () => DeckViewer.open(),
      onChange: () => DeckViewer.open()
    });
    tools.push({
      name: "tc-deck-reset",
      title: game.i18n.localize("TOCHANGE.Deck.reset"),
      icon: "fas fa-shuffle",
      button: true,
      visible: true,
      order: 92,
      onClick: deckResetPrompt,
      onChange: deckResetPrompt
    });
  }

  for (const tool of tools) {
    if (Array.isArray(token.tools)) token.tools.push(tool);
    else token.tools[tool.name] = tool;
  }
});

function deckResetPrompt() {
  return Dialog.confirm({
    title: game.i18n.localize("TOCHANGE.Deck.reset"),
    content: `<p>${game.i18n.localize("TOCHANGE.Deck.resetPrompt")}</p>`,
    yes: () => Deck.reset().then(() =>
      ui.notifications.info(game.i18n.localize("TOCHANGE.Deck.resetDone")))
  });
}

/* -------------------------------------------- */
/*  Helpers                                     */
/* -------------------------------------------- */

function preloadTemplates() {
  const paths = [
    "templates/actor/character-sheet.hbs",
    "templates/apps/resolution.hbs",
    "templates/apps/solo-tracker.hbs",
    "templates/apps/table-roller.hbs",
    "templates/apps/story-moves-config.hbs",
    "templates/apps/deck-viewer.hbs",
    "templates/chat/resolution-result.hbs"
  ].map(p => `systems/${ID}/${p}`);
  return loadTemplates(paths);
}
