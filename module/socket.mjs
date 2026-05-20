import { TO_CHANGE } from "./config.mjs";
import { Deck } from "./deck.mjs";

const CHANNEL = `system.${TO_CHANGE.ID}`;

/**
 * GM 權威 socket。
 *
 * 世界設定只有 GM 能寫入,且 ChatMessage 由發起者建立即可;但牌堆狀態
 * 必須由 GM 統一寫入以避免衝突。玩家端把「占卜結果」打包送給 GM,
 * 由第一位在線 GM 套用牌堆狀態。
 */
export function registerSocket() {
  game.socket.on(CHANNEL, async (msg) => {
    if (!game.user.isGM) return;
    // 僅由「第一位」在線 GM 處理,避免重複
    const firstGM = game.users.find(u => u.isGM && u.active);
    if (firstGM?.id !== game.user.id) return;

    try {
      if (msg.action === "commitDeck") {
        await Deck.commit(msg.deckState);
      }
    } catch (err) {
      console.error("To Change | socket handler error", err);
    }
  });
}

/** 是否有在線 GM */
export function hasActiveGM() {
  return game.users.some(u => u.isGM && u.active);
}

/**
 * 套用新的牌堆狀態:GM 直接寫入,玩家透過 socket 請 GM 寫入。
 * @param {object} deckState
 */
export async function commitDeckState(deckState) {
  if (game.user.isGM) {
    return Deck.commit(deckState);
  }
  if (!hasActiveGM()) {
    ui.notifications?.warn(game.i18n.localize("TOCHANGE.Notify.noGM"));
    return;
  }
  game.socket.emit(CHANNEL, { action: "commitDeck", deckState });
}
