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

    
      new Setting(containerEl)
      .setName("Max latest notes")
      .setDesc("a maximum items for the view with latest modified notes")
      .addSlider((slider) =>
        slider
          .setLimits(10, 200, 10)
          .setDynamicTooltip()
          .setValue(this.plugin.settings.maxLatestFiles)
          .onChange(async (value) => {
            this.plugin.settings.maxLatestFiles = value;
            await this.plugin.saveSettings();
          })
      );
  }
}