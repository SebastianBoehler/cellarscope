import { callTool, initBridge, initialExplorerState } from "./bridge";
import { renderExplorer } from "./render";
import type { ExplorerState, ToolResult, ViewMode } from "./types";
import { normalizeState } from "./utils";

const root = document.getElementById("root");
let state: ExplorerState = normalizeState(initialExplorerState() ?? window.openai?.widgetState);
let userInteracted = false;

initBridge((result: ToolResult, source) => {
  const next = result?._meta?.explorer ?? result?.structuredContent;
  if (source === "globals" && userInteracted) return;
  if (next && typeof next === "object") update(next as Partial<ExplorerState>);
});

function update(next: Partial<ExplorerState>) {
  state = normalizeState({ ...state, ...next });
  render();
}

async function rerunQuery() {
  const textarea = root?.querySelector<HTMLTextAreaElement>("#sparql");
  const query = textarea?.value.trim() || state.query;
  update({ query, error: undefined });

  try {
    const result = await callTool("run_cellar_sparql", {
      query,
      maxRows: 50,
      resultKind: state.view === "network" ? "network" : "records",
    });
    if (result.structuredContent) update(result.structuredContent);
  } catch (error) {
    update({ error: error instanceof Error ? error.message : "Query failed." });
  }
}

function render() {
  if (!root) return;
  root.className = state.expanded ? "shell is-expanded" : "shell";
  root.innerHTML = renderExplorer(state);
  try {
    window.openai?.notifyIntrinsicHeight?.(document.body.getBoundingClientRect().height);
  } catch {
    // Intrinsic height notifications are best-effort host hints.
  }
}

root?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const viewButton = target.closest<HTMLButtonElement>("[data-view]");
  if (viewButton) {
    userInteracted = true;
    update({ view: viewButton.dataset.view as ViewMode });
    return;
  }

  const actionButton = target.closest<HTMLButtonElement>("[data-action]");
  if (actionButton?.dataset.action === "run") {
    userInteracted = true;
    void rerunQuery();
    return;
  }
  if (actionButton?.dataset.action === "expand") {
    userInteracted = true;
    const expanded = !state.expanded;
    update({ expanded });
    void window.openai?.requestDisplayMode?.({ mode: expanded ? "fullscreen" : "inline" }).catch(() => undefined);
    return;
  }

  const openTarget = target.closest<HTMLElement>("[data-open]");
  if (openTarget) void openUrl(openTarget.dataset.open ?? "");
});

root?.addEventListener("change", (event) => {
  const target = event.target;
  if (target instanceof HTMLTextAreaElement && target.id === "sparql") {
    update({ query: target.value });
  }
});

async function openUrl(url: string) {
  if (!url) return;
  if (window.openai?.openExternal) {
    await window.openai.openExternal({ href: url });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

render();
