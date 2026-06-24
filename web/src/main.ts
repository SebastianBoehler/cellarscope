import { callTool, initBridge, initialExplorerState } from "./bridge";
import { renderExplorer } from "./render";
import type { ExplorerState, ToolResult, ViewMode } from "./types";
import { normalizeState } from "./utils";

const root = document.getElementById("root");
let state: ExplorerState = normalizeState(initialExplorerState() ?? window.openai?.widgetState);

initBridge((result: ToolResult) => {
  const next = result?._meta?.explorer ?? result?.structuredContent;
  if (next && typeof next === "object") update(next as Partial<ExplorerState>);
});

function update(next: Partial<ExplorerState>) {
  state = normalizeState({ ...state, ...next });
  window.openai?.setWidgetState?.({
    view: state.view,
    purpose: state.purpose,
    query: state.query,
  });
  render();
}

async function rerunQuery() {
  const textarea = root?.querySelector<HTMLTextAreaElement>("#sparql");
  const query = textarea?.value.trim() || state.query;
  update({ query, error: undefined });

  try {
    const result = await callTool("run_cellar_sparql", {
      query,
      purpose: state.purpose,
      maxRows: 50,
      resultKind: state.view === "network" ? "network" : state.view === "timeline" ? "timeline" : "records",
    });
    if (result.structuredContent) update(result.structuredContent);
  } catch (error) {
    update({ error: error instanceof Error ? error.message : "Query failed." });
  }
}

function render() {
  if (!root) return;
  root.innerHTML = renderExplorer(state);
  bindActions();
  window.openai?.notifyIntrinsicHeight?.(document.body.getBoundingClientRect().height);
}

function bindActions() {
  root?.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((button) => {
    button.addEventListener("click", () => update({ view: button.dataset.view as ViewMode }));
  });
  root?.querySelector<HTMLButtonElement>('[data-action="run"]')?.addEventListener("click", () => void rerunQuery());
  root?.querySelector<HTMLButtonElement>('[data-action="fullscreen"]')?.addEventListener("click", () => {
    void window.openai?.requestDisplayMode?.({ mode: "fullscreen" });
  });
  root?.querySelectorAll<HTMLElement>("[data-open]").forEach((element) => {
    element.addEventListener("click", () => void openUrl(element.dataset.open ?? ""));
  });
}

async function openUrl(url: string) {
  if (!url) return;
  if (window.openai?.openExternal) {
    await window.openai.openExternal({ href: url });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

render();
