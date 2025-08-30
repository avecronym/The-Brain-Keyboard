import { TFile } from 'obsidian';
import TodoTxtPlugin from '../main';

export class ProjectPersistence {
    constructor(private plugin: TodoTxtPlugin) {}

    // Save pinned projects to settings
    async savePinnedProjects(file: TFile | null, pinnedProjects: string[]): Promise<void> {
        if (!file) return;

        if (!this.plugin.settings.pinnedProjects) {
            this.plugin.settings.pinnedProjects = {};
        }

        this.plugin.settings.pinnedProjects[file.path] = [...pinnedProjects];
        await this.plugin.saveSettings();
    }

    // Load pinned projects from settings
    loadPinnedProjects(file: TFile | null): string[] {
        if (!file) return [];

        if (this.plugin.settings.pinnedProjects && this.plugin.settings.pinnedProjects[file.path]) {
            return [...this.plugin.settings.pinnedProjects[file.path]];
        }
        return [];
    }

    // Save all known projects to settings
    async saveAllKnownProjects(file: TFile | null, allKnownProjects: string[]): Promise<void> {
        if (!file) return;

        if (!this.plugin.settings.allKnownProjects) {
            this.plugin.settings.allKnownProjects = {};
        }

        this.plugin.settings.allKnownProjects[file.path] = [...allKnownProjects];
        await this.plugin.saveSettings();
    }

    // Load all known projects from settings
    loadAllKnownProjects(file: TFile | null): string[] {
        if (!file) return [];

        if (this.plugin.settings.allKnownProjects && this.plugin.settings.allKnownProjects[file.path]) {
            return [...this.plugin.settings.allKnownProjects[file.path]];
        }
        return [];
    }

    // Save project icons to settings
    async saveProjectIcons(file: TFile | null, projectIcons: Map<string, string>): Promise<void> {
        if (!file) return;

        if (!this.plugin.settings.projectIcons) {
            this.plugin.settings.projectIcons = {};
        }

        this.plugin.settings.projectIcons[file.path] = Object.fromEntries(projectIcons);
        await this.plugin.saveSettings();
    }

    // Load project icons from settings
    loadProjectIcons(file: TFile | null): Map<string, string> {
        if (!file) return new Map();

        if (this.plugin.settings.projectIcons && this.plugin.settings.projectIcons[file.path]) {
            return new Map(Object.entries(this.plugin.settings.projectIcons[file.path]));
        }
        return new Map();
    }
}