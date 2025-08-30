import { App, TFile } from 'obsidian';
import { TodoItem } from '../types';
import { AddProjectModal } from '../components/modals/addProjectModal';
import { DeleteProjectModal } from '../components/modals/confirmModals';
import { ProjectPersistence } from '../utils/projectPersistence';
import TodoTxtPlugin from '../main';

export class ProjectManager {
    // Project data stores
    public pinnedProjects: string[] = [];
    public allKnownProjects: string[] = [];
    public projectIcons: Map<string, string> = new Map();

    // Persistence handler
    private persistence: ProjectPersistence;

    // Callback handlers
    public onProjectCreate: (projectName: string, icon?: string) => Promise<void> = async () => { };
    public onProjectUpdate: (oldName: string, newName: string, icon?: string) => Promise<void> = async () => { };
    public onProjectDelete: (projectName: string) => Promise<void> = async () => { };
    public onProjectPin: (projectName: string, isPinned: boolean) => Promise<void> = async () => { };

    constructor(private plugin: TodoTxtPlugin) {
        this.persistence = new ProjectPersistence(plugin);
    }

    // Extract projects from todo items
    updateFromTodoItems(items: TodoItem[]): void {
        const newProjects: string[] = [];

        items.forEach(item => {
            item.projects.forEach(project => {
                if (project !== 'Inbox' && project !== 'Archived') {
                    if (!this.allKnownProjects.includes(project) && !newProjects.includes(project)) {
                        newProjects.push(project);
                    }
                }
            });
        });

        // Add new projects to the end
        this.allKnownProjects.push(...newProjects);
    }

    // Update projects from todo items and save if needed
    async updateAndSaveFromTodoItems(items: TodoItem[], file: TFile | null): Promise<void> {
        const oldProjectsCount = this.allKnownProjects.length;
        this.updateFromTodoItems(items);

        // Save if new projects added
        if (this.allKnownProjects.length > oldProjectsCount) {
            await this.saveAllKnownProjects(file);
        }
    }

    // Count active tasks per project
    getProjectCounts(items: TodoItem[]): { project: string; count: number }[] {
        const projectCounts = new Map<string, number>();

        // Initialize all projects with zero count
        this.allKnownProjects.forEach(project => {
            projectCounts.set(project, 0);
        });

        // Count active tasks per project
        items.filter(item => !item.completed && !item.projects.includes('Archived'))
            .forEach(item => {
                item.projects.forEach(project => {
                    if (project !== 'Archived') {
                        const currentCount = projectCounts.get(project) || 0;
                        projectCounts.set(project, currentCount + 1);
                    }
                });
            });

        // Ensure Inbox exists
        if (!projectCounts.has('Inbox')) {
            projectCounts.set('Inbox', 0);
        }

        const allProjectCounts = Array.from(projectCounts.entries())
            .map(([project, count]) => ({ project, count }))
            .filter(({ project }) => project !== 'Inbox' && project !== 'Archived');

        // Sort by allKnownProjects order
        return allProjectCounts.sort((a, b) => {
            const aIndex = this.allKnownProjects.indexOf(a.project);
            const bIndex = this.allKnownProjects.indexOf(b.project);

            if (aIndex === -1 && bIndex === -1) {
                return a.project.localeCompare(b.project);
            }
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;

            return aIndex - bIndex;
        });
    }

    // Get ordered pinned projects
    getOrderedPinnedProjects(projectCounts: { project: string; count: number }[]): { project: string; count: number }[] {
        const pinnedCounts = projectCounts.filter(p => this.pinnedProjects.includes(p.project));

        return pinnedCounts.sort((a, b) => {
            const aIndex = this.pinnedProjects.indexOf(a.project);
            const bIndex = this.pinnedProjects.indexOf(b.project);

            if (aIndex === -1 && bIndex === -1) {
                return a.project.localeCompare(b.project);
            }
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;

            return aIndex - bIndex;
        });
    }

    // Reorder project in array
    reorderProject(projectName: string, targetIndex: number, isPinned: boolean): void {
        const array = isPinned ? this.pinnedProjects : this.allKnownProjects;
        const sourceIndex = array.indexOf(projectName);

        if (sourceIndex === -1 || sourceIndex === targetIndex) return;
        const [item] = array.splice(sourceIndex, 1);

        let insertIndex = targetIndex;
        if (sourceIndex < targetIndex) {
            insertIndex = targetIndex - 1;
        }

        array.splice(insertIndex, 0, item);
    }

    // Remove duplicates from allKnownProjects
    private removeDuplicates(): void {
        this.allKnownProjects = [...new Set(this.allKnownProjects)];
    }

    // Get all projects for dropdowns
    getAvailableProjects(): string[] {
        const projects = [...this.allKnownProjects];
        projects.push('Archived');
        return projects.sort();
    }

    // Get project icon
    getProjectIcon(projectName: string): string {
        return this.projectIcons.get(projectName) || '';
    }

    // Open modal to create project
    openAddProjectModal(file: TFile | null): void {
        const modal = new AddProjectModal(
            this.plugin.app,
            async (projectName: string, icon?: string) => {
                if (icon !== undefined) {
                    this.projectIcons.set(projectName, icon);
                    await this.saveProjectIcons(file);
                }
                await this.onProjectCreate(projectName, icon);
            }
        );
        modal.open();
    }

    // Open modal to edit project
    private editProject(projectName: string, file: TFile | null): void {
        const currentIcon = this.projectIcons.get(projectName) || '';
        const modal = new AddProjectModal(
            this.plugin.app,
            async (oldName: string, newName: string, icon?: string) => {
                if (oldName !== newName && this.projectIcons.has(oldName)) {
                    this.projectIcons.delete(oldName);
                }
                if (icon !== undefined) {
                    this.projectIcons.set(newName, icon);
                    await this.saveProjectIcons(file);
                }
                await this.onProjectUpdate(oldName, newName, icon);
            },
            projectName,
            currentIcon
        );
        modal.open();
    }

    // Show context menu for project
    showProjectMenu(event: MouseEvent, projectName: string, file: TFile | null): void {
        const existingMenu = document.querySelector('.project-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'project-context-menu';

        // Edit option
        const editOption = menu.createEl('div', {
            text: 'Edit',
            cls: 'project-context-menu-item'
        });
        editOption.addEventListener('click', () => {
            this.editProject(projectName, file);
            menu.remove();
        });

        // Pin/unpin option
        const isPinned = this.pinnedProjects.includes(projectName);
        const pinOption = menu.createEl('div', {
            text: isPinned ? 'Unpin' : 'Pin',
            cls: 'project-context-menu-item'
        });
        pinOption.addEventListener('click', async () => {
            await this.onProjectPin(projectName, !isPinned);
            menu.remove();
        });

        // Delete option
        const deleteOption = menu.createEl('div', {
            text: 'Delete',
            cls: 'project-context-menu-item'
        });
        deleteOption.addEventListener('click', () => {
            this.confirmDeleteProject(projectName);
            menu.remove();
        });

        document.body.appendChild(menu);

        // Calculate position to prevent overflow
        menu.style.setProperty('--menu-left', `${event.clientX}px`);
        menu.style.setProperty('--menu-top', `${event.clientY}px`);

        const menuRect = menu.getBoundingClientRect();
        let menuTop = event.clientY;
        let menuLeft = event.clientX;

        if (menuTop + menuRect.height > window.innerHeight) {
            menuTop = event.clientY - menuRect.height;
        }

        if (menuLeft + menuRect.width > window.innerWidth) {
            menuLeft = event.clientX - menuRect.width;
        }

        menu.style.setProperty('--menu-left', `${menuLeft}px`);
        menu.style.setProperty('--menu-top', `${menuTop}px`);

        // Close menu on outside click
        const closeMenu = (e: MouseEvent) => {
            if (!menu.contains(e.target as Node)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    }

    // Show delete confirmation
    private confirmDeleteProject(projectName: string): void {
        const modal = new DeleteProjectModal(
            this.plugin.app,
            projectName,
            async () => {
                await this.onProjectDelete(projectName);
            }
        );
        modal.open();
    }

    // Update project name in arrays
    async renameProject(oldName: string, newName: string, file: TFile | null): Promise<void> {
        const pinnedIndex = this.pinnedProjects.indexOf(oldName);
        if (pinnedIndex !== -1) {
            this.pinnedProjects[pinnedIndex] = newName;
            await this.savePinnedProjects(file);
        }

        const projectIndex = this.allKnownProjects.indexOf(oldName);
        if (projectIndex !== -1) {
            this.allKnownProjects[projectIndex] = newName;
            this.removeDuplicates();
            await this.saveAllKnownProjects(file);
        }
    }

    // Remove project from all data
    async deleteProject(projectName: string, file: TFile | null): Promise<void> {
        const allIndex = this.allKnownProjects.indexOf(projectName);
        if (allIndex !== -1) {
            this.allKnownProjects.splice(allIndex, 1);
        }

        const pinnedIndex = this.pinnedProjects.indexOf(projectName);
        if (pinnedIndex !== -1) {
            this.pinnedProjects.splice(pinnedIndex, 1);
        }

        this.projectIcons.delete(projectName);

        this.removeDuplicates();

        await this.saveAllKnownProjects(file);
        await this.savePinnedProjects(file);
        await this.saveProjectIcons(file);
    }

    // Persistence delegation methods
    async savePinnedProjects(file: TFile | null): Promise<void> {
        await this.persistence.savePinnedProjects(file, this.pinnedProjects);
    }

    loadPinnedProjects(file: TFile | null): void {
        this.pinnedProjects = this.persistence.loadPinnedProjects(file);
    }

    async saveAllKnownProjects(file: TFile | null): Promise<void> {
        await this.persistence.saveAllKnownProjects(file, this.allKnownProjects);
    }

    loadAllKnownProjects(file: TFile | null): void {
        this.allKnownProjects = this.persistence.loadAllKnownProjects(file);
    }

    async saveProjectIcons(file: TFile | null): Promise<void> {
        await this.persistence.saveProjectIcons(file, this.projectIcons);
    }

    loadProjectIcons(file: TFile | null): void {
        this.projectIcons = this.persistence.loadProjectIcons(file);
    }
}