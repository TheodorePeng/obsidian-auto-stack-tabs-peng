import {
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  type App,
  type WorkspaceContainer,
  type WorkspaceTabs,
} from 'obsidian';
import { AutoStackController, stackGroupIfNeeded } from './stack-controller';

interface AutoStackSettings {
  autoStackEnabled: boolean;
}

const DEFAULT_SETTINGS: AutoStackSettings = { autoStackEnabled: true };

export default class AutoStackTabsPlugin extends Plugin {
  settings: AutoStackSettings = { ...DEFAULT_SETTINGS };
  private controller!: AutoStackController<WorkspaceContainer, WorkspaceTabs>;
  private stackFailureReported = false;
  private unloaded = false;

  async onload(): Promise<void> {
    // A hot reload or an enable during an existing session must not restack a user's layout.
    const layoutWasReady = this.app.workspace.layoutReady;
    const saved = (await this.loadData()) as Partial<AutoStackSettings> | null;
    this.settings.autoStackEnabled =
      typeof saved?.autoStackEnabled === 'boolean'
        ? saved.autoStackEnabled
        : DEFAULT_SETTINGS.autoStackEnabled;

    this.controller = new AutoStackController(
      (target) => this.collectEditorGroups(target),
      (group) => this.stackGroup(group),
    );
    this.controller.setEnabled(this.settings.autoStackEnabled);

    this.addCommand({
      id: 'enable-auto-stack',
      name: 'Enable Auto Stack',
      callback: () => { void this.setAutoStackEnabled(true); },
    });
    this.addCommand({
      id: 'disable-auto-stack',
      name: 'Disable Auto Stack',
      callback: () => { void this.setAutoStackEnabled(false); },
    });
    this.addCommand({
      id: 'stack-current-window-now',
      name: 'Stack Current Window Now',
      callback: () => this.stackCurrentWindowNow(),
    });
    this.addSettingTab(new AutoStackSettingTab(this.app, this));

    this.registerEvent(this.app.workspace.on('window-open', (target) => {
      this.controller.initialize(target);
    }));
    this.registerEvent(this.app.workspace.on('window-close', (target) => {
      this.controller.forget(target);
    }));

    if (!layoutWasReady) {
      this.app.workspace.onLayoutReady(() => {
        if (this.unloaded || !this.settings.autoStackEnabled) return;
        const windows = new Set<WorkspaceContainer>([this.app.workspace.rootSplit]);
        this.app.workspace.iterateAllLeaves((leaf) => windows.add(leaf.getContainer()));
        for (const target of windows) this.controller.initialize(target);
      });
    }
  }

  onunload(): void {
    this.unloaded = true;
    this.controller?.dispose();
  }

  async setAutoStackEnabled(enabled: boolean): Promise<void> {
    if (this.settings.autoStackEnabled === enabled) return;
    const previous = this.settings.autoStackEnabled;
    this.settings.autoStackEnabled = enabled;
    this.controller.setEnabled(enabled);

    try {
      await this.saveData(this.settings);
      new Notice(enabled ? 'Auto Stack enabled for future windows.' : 'Auto Stack disabled.');
    } catch (error) {
      this.settings.autoStackEnabled = previous;
      this.controller.setEnabled(previous);
      console.error('[Auto Stack Tabs] Could not save the setting.', error);
      new Notice('Auto Stack setting could not be saved.');
    }
  }

  private collectEditorGroups(target: WorkspaceContainer): WorkspaceTabs[] {
    const groups = new Set<WorkspaceTabs>();
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.getContainer() !== target) return;
      // Side docks are outside the editor root, including in a restored layout.
      if (!leaf.view.containerEl.closest('.workspace-split.mod-root')) return;
      groups.add(leaf.parent as WorkspaceTabs);
    });
    return [...groups];
  }

  private stackGroup(group: WorkspaceTabs): void {
    try {
      if (stackGroupIfNeeded(group) === 'unsupported') this.reportStackFailure();
    } catch (error) {
      this.reportStackFailure(error);
    }
  }

  private reportStackFailure(error?: unknown): void {
    if (this.stackFailureReported) return;
    this.stackFailureReported = true;
    console.error('[Auto Stack Tabs] This Obsidian version cannot set stacked tabs.', error);
    new Notice('Auto Stack could not set stacked tabs in this Obsidian version.');
  }

  private stackCurrentWindowNow(): void {
    let current: WorkspaceContainer | undefined;
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (current) return;
      const container = leaf.getContainer();
      if (container.win === activeWindow) current = container;
    });
    if (!current && this.app.workspace.rootSplit.win === activeWindow) {
      current = this.app.workspace.rootSplit;
    }

    if (!current || this.controller.stackNow(current) === 0) {
      new Notice('No editor tab group in the current window.');
    }
  }
}

class AutoStackSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: AutoStackTabsPlugin) {
    super(app, plugin);
  }

  display(): void {
    this.containerEl.empty();
    new Setting(this.containerEl)
      .setName('Auto Stack Enabled')
      .setDesc('Stack existing editor tab groups once when the Vault or a new window initializes.')
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.autoStackEnabled)
        .onChange(async (enabled) => {
          await this.plugin.setAutoStackEnabled(enabled);
          this.display();
        }));
  }
}
