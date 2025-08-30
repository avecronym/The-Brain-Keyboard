import { TFile } from 'obsidian';
import { FileService } from './fileService';
import { ProjectManager } from '../managers/projectManager';

export class ProjectService {
    constructor(
        private fileService: FileService,
        private projectManager: ProjectManager
    ) { }

    // Create new empty project
    async createEmptyProject(file: TFile | null, projectName: string): Promise<void> {
        if (!this.projectManager.allKnownProjects.includes(projectName)) {
            this.projectManager.allKnownProjects.push(projectName);
        }
        await this.projectManager.saveAllKnownProjects(file);
    }

    // Rename project everywhere
    async updateProjectName(file: TFile, oldName: string, newName: string): Promise<void> {
        if (oldName === newName) return;

        await this.fileService.replaceProjectName(file, oldName, newName);
        await this.projectManager.renameProject(oldName, newName, file);
    }

    // Delete project and its tasks
    async deleteProject(file: TFile, projectName: string): Promise<void> {
        await this.fileService.removeProjectFromTasks(file, projectName);
        await this.projectManager.deleteProject(projectName, file);
    }

    // Pin or unpin project
    async toggleProjectPin(file: TFile | null, projectName: string, isPinned: boolean): Promise<void> {
        if (isPinned) {
            if (!this.projectManager.pinnedProjects.includes(projectName)) {
                this.projectManager.pinnedProjects.push(projectName);
            }
        } else {
            const index = this.projectManager.pinnedProjects.indexOf(projectName);
            if (index !== -1) {
                this.projectManager.pinnedProjects.splice(index, 1);
            }
        }
        await this.projectManager.savePinnedProjects(file);
    }
}