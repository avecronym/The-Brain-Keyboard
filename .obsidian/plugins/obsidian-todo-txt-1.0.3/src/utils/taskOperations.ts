import { TFile, App } from 'obsidian';
import { TodoTxtSettings } from '../types';

export class TaskOperations {
    constructor(
        private app: App,
        private settings: TodoTxtSettings
    ) { }

    // Extract projects from todo line
    extractProjectsFromLine(line: string): string[] {
        const projects: string[] = [];

        // Remove notes section
        let cleanLine = line;
        const notesIndex = cleanLine.indexOf('||');
        if (notesIndex !== -1) {
            cleanLine = cleanLine.substring(0, notesIndex).trim();
        }

        // Remove todo metadata
        cleanLine = cleanLine.replace(/^x\s+/, ''); // Remove completion marker
        cleanLine = cleanLine.replace(/^KATEX_INLINE_OPEN[A-Z]KATEX_INLINE_CLOSE\s+/, ''); // Remove priority
        cleanLine = cleanLine.replace(/^\d{4}-\d{2}-\d{2}\s+/, ''); // Remove creation date
        cleanLine = cleanLine.replace(/^\d{4}-\d{2}-\d{2}\s+\d{4}-\d{2}-\d{2}\s+/, ''); // Remove completion and creation dates

        // Find project tokens
        const tokens = cleanLine.split(/\s+/);

        for (const token of tokens) {
            // Match +ProjectName only
            if (/^\+\w+$/.test(token)) {
                const project = token.substring(1);
                projects.push(project);
            }
        }

        return projects;
    }

    // Extract contexts from todo line
    extractContextsFromLine(line: string): string[] {
        const contexts: string[] = [];

        // Remove notes section
        let cleanLine = line;
        const notesIndex = cleanLine.indexOf('||');
        if (notesIndex !== -1) {
            cleanLine = cleanLine.substring(0, notesIndex).trim();
        }

        // Remove metadata
        cleanLine = cleanLine.replace(/^x\s+/, ''); // Completion marker
        cleanLine = cleanLine.replace(/^KATEX_INLINE_OPEN[A-Z]KATEX_INLINE_CLOSE\s+/, ''); // Priority
        cleanLine = cleanLine.replace(/^\d{4}-\d{2}-\d{2}\s+/, ''); // Creation date
        cleanLine = cleanLine.replace(/^\d{4}-\d{2}-\d{2}\s+\d{4}-\d{2}-\d{2}\s+/, ''); // Both dates

        // Find contexts at word boundaries only
        const contextMatches = cleanLine.match(/(?:^|\s)@(\S+)/g);
        if (contextMatches) {
            contextMatches.forEach(match => {
                const context = match.trim().substring(1);
                contexts.push(context);
            });
        }

        return contexts;
    }

    // Get projects from file and settings
    async getAvailableProjectsFromFile(file: TFile): Promise<string[]> {
        try {
            const projects = new Set<string>();

            // Add stored projects
            if (this.settings.allKnownProjects && this.settings.allKnownProjects[file.path]) {
                this.settings.allKnownProjects[file.path].forEach(project => {
                    if (project !== 'Inbox') {
                        projects.add(project);
                    }
                });
            }

            const content = await this.app.vault.read(file);
            const lines = content.split('\n').filter(line => line.trim().length > 0);

            lines.forEach(line => {
                const projectsFromLine = this.extractProjectsFromLine(line);
                projectsFromLine.forEach(project => {
                    if (project !== 'Inbox') {
                        projects.add(project);
                    }
                });
            });

            return Array.from(projects).sort();
        } catch (error) {
            console.error('Error reading file for projects:', error);

            // Fallback to stored projects
            if (this.settings.allKnownProjects && this.settings.allKnownProjects[file.path]) {
                return this.settings.allKnownProjects[file.path]
                    .filter(project => project !== 'Inbox')
                    .sort();
            }

            return [];
        }
    }

    // Extract contexts from file
    async getAvailableContextsFromFile(file: TFile): Promise<string[]> {
        try {
            const content = await this.app.vault.read(file);
            const contexts = new Set<string>();

            const lines = content.split('\n').filter(line => line.trim().length > 0);

            lines.forEach(line => {
                // Skip completed tasks
                if (line.trim().startsWith('x ')) {
                    return;
                }

                const contextsFromLine = this.extractContextsFromLine(line);
                contextsFromLine.forEach(context => {
                    contexts.add(context);
                });
            });

            return Array.from(contexts).sort();
        } catch (error) {
            console.error('Error reading file for contexts:', error);
            return [];
        }
    }

    // Convert filter to state
    getStartupState(filter: string): any {
        switch (filter.toLowerCase()) {
            case 'all':
                return { selectedProject: '', selectedTimeFilter: '', archivedFilter: false, completedFilter: false };
            case 'inbox':
                return { selectedProject: 'Inbox', selectedTimeFilter: '', archivedFilter: false, completedFilter: false };
            case 'today':
                return { selectedProject: '', selectedTimeFilter: 'today', archivedFilter: false, completedFilter: false };
            case 'upcoming':
                return { selectedProject: '', selectedTimeFilter: 'upcoming', archivedFilter: false, completedFilter: false };
            case 'archived':
                return { selectedProject: '', selectedTimeFilter: '', archivedFilter: true, completedFilter: false };
            case 'completed':
                return { selectedProject: '', selectedTimeFilter: '', archivedFilter: false, completedFilter: true };
            default:
                // Treat as project name
                return { selectedProject: filter, selectedTimeFilter: '', archivedFilter: false, completedFilter: false };
        }
    }
}