import { TO_CHANGE } from "../config.mjs";

const ID = TO_CHANGE.ID;

let _tablesCache = null;

/** 載入並快取 tables.json */
async function loadTables() {
  if (_tablesCache) return _tablesCache;
  try {
    _tablesCache = await foundry.utils.fetchJsonWithTimeout(
      `systems/${ID}/assets/data/tables.json`);
  } catch (err) {
    console.error("To Change | 無法載入 tables.json", err);
    _tablesCache = {};
  }
  return _tablesCache;
}

/**
 * 隨機表格擲表器。
 * 依規則「洗一次預兆牌,查看牌堆底牌的塔羅編號（0–21）」決定結果——
 * 等價於均勻隨機 0–21,保持無骰精神。
 */
export class TableRoller extends Application {

  constructor(options = {}) {
    super(options);
    this.selectedKey = "table1";
    this.lastResult = null;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["to-change", "table-roller"],
      template: `systems/${ID}/templates/apps/table-roller.hbs`,
      width: 480,
      height: "auto",
      resizable: true,
      title: game.i18n?.localize("TOCHANGE.Tables.title") ?? "隨機表格"
    });
  }

  /** @override */
  async getData() {
    const tables = await loadTables();
    const list = Object.entries(tables).map(([key, t]) => ({
      key, name: t.name, selected: key === this.selectedKey
    }));
    const current = tables[this.selectedKey];
    return {
      list,
      current,
      columns: current?.columns ?? [],
      lastResult: this.lastResult
    };
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find("[name=table]").on("change", ev => {
      this.selectedKey = ev.currentTarget.value;
      this.lastResult = null;
      this.render();
    });

    html.find("[data-action=roll]").on("click", () => this._roll());
    html.find("[data-action=post]").on("click", () => this._postChat());
  }

  /** 擲表:洗牌取底牌編號 0–21 */
  async _roll() {
    const tables = await loadTables();
    const table = tables[this.selectedKey];
    if (!table) return;

    const idx = Math.floor(Math.random() * table.rows.length);
    this.lastResult = {
      tableName: table.name,
      index: idx,
      cells: table.rows[idx],
      columns: table.columns
    };
    this.render();
  }

  /** 把結果發到聊天 */
  async _postChat() {
    if (!this.lastResult) return;
    const r = this.lastResult;
    const rows = r.columns.map((c, i) =>
      `<p class="tr-cell"><b>${c}</b>：${r.cells[i] ?? ""}</p>`).join("");
    await ChatMessage.create({
      content: `<div class="to-change table-chat">
        <header class="tc-table-head">${r.tableName} — #${r.index}</header>
        ${rows}
      </div>`
    });
  }
}
