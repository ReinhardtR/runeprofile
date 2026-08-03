import { type LoadedModel, loadModel } from "./load";
import {
  type ModelFile,
  fetchModel,
  formatStamp,
  listModels,
  storeDir,
  storedDir,
} from "./models-dir";
import { type ModelRole, type ViewerStats, Viewer } from "./viewer";

// Anything thrown while wiring up leaves a page that looks fine and does
// nothing, which is impossible to diagnose from the outside. Surfacing it in
// the panel turns a dead UI into a readable error.
main().catch(showBootError);

async function main(): Promise<void> {
  const canvas = requireElement<HTMLCanvasElement>("stage");
  const fileInput = requireElement<HTMLInputElement>("file");
  const dropTarget = requireElement<HTMLDivElement>("drop-target");
  const dirInput = requireElement<HTMLInputElement>("dir");
  const lists: Record<ModelRole, HTMLUListElement> = {
    player: requireElement<HTMLUListElement>("players"),
    pet: requireElement<HTMLUListElement>("pets"),
  };
  const hint = requireElement<HTMLParagraphElement>("hint");
  const info = requireElement<HTMLDListElement>("info");
  const stats = requireElement<HTMLDListElement>("stats");
  const viewer = new Viewer({ canvas, onStats: renderStats });

  let currentDir = storedDir();
  const selected: Partial<Record<ModelRole, string>> = {};
  dirInput.value = currentDir;

  // --- loading -------------------------------------------------------------

  async function open(file: File, role: ModelRole): Promise<void> {
    hint.hidden = false;
    hint.textContent = `Loading ${file.name}…`;
    try {
      const model = await loadModel(file);
      viewer.setModel(model, role);
      selected[role] = file.name;
      if (role === "player") {
        renderInfo(file.name, model);
      }
      hint.hidden = true;
      markSelected();
    } catch (error) {
      hint.hidden = false;
      hint.textContent = `Could not load ${file.name}: ${messageOf(error)}`;
      console.error(error);
    }
  }

  /** Clicking the loaded pet again takes it back off. */
  function clear(role: ModelRole): void {
    viewer.setModel(null, role);
    delete selected[role];
    markSelected();
  }

  async function refresh(autoLoadLatest: boolean): Promise<void> {
    lists.player.replaceChildren();
    lists.pet.replaceChildren();
    hint.hidden = false;
    hint.textContent = "Reading folder…";
    try {
      const listing = await listModels(currentDir);
      if (!currentDir) {
        // Show what the server defaulted to so the box is never a mystery.
        dirInput.placeholder = listing.dir;
      }
      renderFiles(listing.files);

      if (listing.files.length === 0) {
        hint.textContent = `No models in ${listing.dir}. Run ::rpmodel in the client.`;
        return;
      }
      hint.hidden = true;
      if (autoLoadLatest) {
        const latest = listing.files.find(
          (file) => roleOf(file.name) === "player" && file.name.toLowerCase().endsWith(".glb"),
        );
        if (latest) {
          await open(await fetchModel(currentDir, latest.name), "player");
        }
      }
    } catch (error) {
      hint.hidden = false;
      hint.textContent = messageOf(error);
    }
  }

  function renderFiles(files: ModelFile[]): void {
    for (const role of ["player", "pet"] as ModelRole[]) {
      lists[role].replaceChildren(
        ...files
          .filter((file) => roleOf(file.name) === role)
          .map((file) => renderFile(file, role)),
      );
    }
    markSelected();
  }

  function renderFile(file: ModelFile, role: ModelRole): HTMLLIElement {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.file = file.name;
    // The stamp is the useful part of the name; the rest is the role, which the
    // list is already grouped by.
    const stamp = formatStamp(file.name);
    button.title = file.name;
    button.append(
      span("name", stamp ?? file.name),
      span("meta", `${(file.bytes / 1024).toFixed(0)} KB`),
    );
    button.addEventListener("click", async () => {
      if (selected[role] === file.name) {
        clear(role);
        return;
      }
      try {
        await open(await fetchModel(currentDir, file.name), role);
      } catch (error) {
        hint.hidden = false;
        hint.textContent = messageOf(error);
      }
    });

    const item = document.createElement("li");
    item.append(button);
    return item;
  }

  function markSelected(): void {
    for (const role of ["player", "pet"] as ModelRole[]) {
      for (const button of lists[role].querySelectorAll<HTMLButtonElement>("[data-file]")) {
        button.classList.toggle("selected", button.dataset.file === selected[role]);
      }
    }
  }

  // --- controls ------------------------------------------------------------

  dirInput.addEventListener("change", () => {
    currentDir = dirInput.value.trim();
    storeDir(currentDir);
    void refresh(true);
  });

  requireElement<HTMLButtonElement>("refresh").addEventListener("click", () => void refresh(false));

  requireElement<HTMLButtonElement>("open").addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    // A file input fires no change event when the same file is picked twice, so
    // clearing the value keeps re-opening the same path working.
    fileInput.value = "";
    if (file) {
      void open(file, "player");
    }
  });

  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-azimuth]")) {
    button.addEventListener("click", () => viewer.setAzimuth(Number(button.dataset.azimuth)));
  }

  bindCheckbox("orbit", (checked) => viewer.setOrbit(checked));
  bindCheckbox("animate-textures", (checked) => viewer.setAnimateTextures(checked));
  bindCheckbox("idle-spin", (checked) => viewer.setIdleSpin(checked));

  // --- drag and drop over the whole window ---------------------------------

  let dragDepth = 0;
  window.addEventListener("dragenter", (event) => {
    event.preventDefault();
    dragDepth++;
    dropTarget.hidden = false;
  });
  window.addEventListener("dragover", (event) => event.preventDefault());
  window.addEventListener("dragleave", (event) => {
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) {
      dropTarget.hidden = true;
    }
  });
  window.addEventListener("drop", (event) => {
    event.preventDefault();
    dragDepth = 0;
    dropTarget.hidden = true;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      void open(file, roleOf(file.name));
    }
  });

  // --- panels --------------------------------------------------------------

  function renderInfo(name: string, model: LoadedModel): void {
    info.hidden = false;
    info.replaceChildren();
    addRow(info, "File", name);
    addRow(info, "Format", model.format.toUpperCase());
    addRow(info, "Size", `${(model.bytes / 1024).toFixed(1)} KB`);
    addRow(info, "Parsed in", `${model.loadMs} ms`);
    addRow(info, "Triangles", model.triangles.toLocaleString());
    addRow(info, "Meshes", String(model.meshes));
    addRow(info, "Materials", String(model.materials));
    addRow(info, "Textures", String(model.textures));
  }

  function renderStats(current: ViewerStats): void {
    stats.replaceChildren();
    addRow(stats, "FPS", String(current.fps));
    addRow(stats, "Draw calls", String(current.drawCalls));
    addRow(stats, "Triangles drawn", current.triangles.toLocaleString());
    addRow(stats, "Programs", String(current.programs));
  }

  await refresh(true);
}

/** Dumps are named player-<stamp> and pet-<stamp>. */
function roleOf(name: string): ModelRole {
  return name.toLowerCase().startsWith("pet-") ? "pet" : "player";
}

function span(className: string, text: string): HTMLSpanElement {
  const element = document.createElement("span");
  element.className = className;
  element.textContent = text;
  return element;
}

function addRow(list: HTMLDListElement, label: string, value: string): void {
  const term = document.createElement("dt");
  term.textContent = label;
  const definition = document.createElement("dd");
  definition.textContent = value;
  list.append(term, definition);
}

function bindCheckbox(id: string, onChange: (checked: boolean) => void): void {
  const input = requireElement<HTMLInputElement>(id);
  input.addEventListener("change", () => onChange(input.checked));
}

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(
      `Missing #${id}. If the page was open while the tool changed, reload it.`,
    );
  }
  return element as T;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function showBootError(error: unknown): void {
  console.error(error);
  const box = document.getElementById("boot-error");
  if (box) {
    box.hidden = false;
    box.textContent = messageOf(error);
  }
}
