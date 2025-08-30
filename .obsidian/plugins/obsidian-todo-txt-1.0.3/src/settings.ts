import { App, PluginSettingTab, Setting } from 'obsidian';
import { TodoTxtSettings, DEFAULT_SETTINGS } from './types';
import TodoTxtPlugin from './main';

export class TodoTxtSettingTab extends PluginSettingTab {
    plugin: TodoTxtPlugin;

    constructor(app: App, plugin: TodoTxtPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // File path setting
        new Setting(containerEl)
            .setName('Tasks location')
            .setDesc('Enter the .txt file path to open your tasks.')
            .addText(text => text
                .setPlaceholder('folder/file.txt')
                .setValue(this.plugin.settings.todoFilePath)
                .onChange(async (value) => {
                    this.plugin.settings.todoFilePath = value.trim() || DEFAULT_SETTINGS.todoFilePath;
                    await this.plugin.saveSettings();
                })
            );

        // Startup filter setting
        new Setting(containerEl)
            .setName('Startup filter')
            .setDesc('Enter the filter to select on startup.')
            .addText(text => text
                .setPlaceholder('All')
                .setValue(this.plugin.settings.startupFilter)
                .onChange(async (value) => {
                    this.plugin.settings.startupFilter = value.trim();
                    await this.plugin.saveSettings();
                })
            );

        // Auto-open toggle
        new Setting(containerEl)
            .setName('Open on startup')
            .setDesc('Automatically open Todo.txt when Obsidian starts')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.openOnStartup)
                .onChange(async (value) => {
                    this.plugin.settings.openOnStartup = value;
                    await this.plugin.saveSettings();
                })
            );
    }
}