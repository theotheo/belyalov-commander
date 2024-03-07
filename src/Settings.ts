import BelyalovCommanderPlugin from "./BelyalovCommanderPlugin.ts";
import { App, PluginSettingTab, Setting } from "obsidian";

export class BelyalovCommanderSettingTab extends PluginSettingTab {
  override plugin: BelyalovCommanderPlugin;

  constructor(app: App, plugin: BelyalovCommanderPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h1", { text: "You need to reload plugin after setting change", "cls": "notice" });

    new Setting(containerEl)
      .setName("Unfinished tasks characters")
      .setDesc("a string of characters used in checkboxes for unfinished tasks")
      .addText((text) =>
        text
          .setPlaceholder("")
          .setValue(this.plugin.settings.unfinishedChars)
          .onChange(async (value) => {
            this.plugin.settings.unfinishedChars = value;
            await this.plugin.saveSettings();
          })
      );
  }
}