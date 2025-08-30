import { SuggestionHandler } from './suggestionHandler';
import { MenuSuggestions } from './menuSuggestions';
import { TaskDataHandler } from '../modals/taskDataHandler';
import { TaskModalUI } from '../modals/taskModalUI';
import { calculateDueDate, getRepeatSyntax } from '../../utils/dateUtils';
import { WikiLinkHandler } from './wikiLinkHandler';
import { App } from 'obsidian';

export class SuggestionManager {
    contextHandler: SuggestionHandler;
    priorityHandler: SuggestionHandler;
    projectHandler: SuggestionHandler;
    dueDateHandler: SuggestionHandler;
    mainMenuHandler: MenuSuggestions;
    wikiLinkHandler: WikiLinkHandler;

    private activeHandler: SuggestionHandler | WikiLinkHandler | null = null;
    private isInRepeatMode: boolean = false;

    constructor(
        private dataHandler: TaskDataHandler,
        private ui: TaskModalUI,
        private app: App,
        private onProjectChange?: (projectName: string) => Promise<void>
    ) {
        this.contextHandler = this.createContextHandler();
        this.priorityHandler = this.createPriorityHandler();
        this.projectHandler = this.createProjectHandler();
        this.dueDateHandler = this.createDueDateHandler();
        this.wikiLinkHandler = new WikiLinkHandler(app);

        // Main menu handler with its own complex logic
        this.mainMenuHandler = new MenuSuggestions(
            dataHandler,
            ui,
            () => this.getOrderedProjectsForSuggestions(),
            onProjectChange
        );
    }

    // Context suggestions (@)
    private createContextHandler(): SuggestionHandler {
        return new SuggestionHandler({
            type: 'context',
            items: this.dataHandler.availableContexts,
            symbol: '@',
            onSelect: (context: string, symbolPosition: number, cursorPosition: number) => {
                const input = this.ui.getTaskInputElement();
                if (!input) return true;

                const value = input.value;
                const beforeAt = value.substring(0, symbolPosition);
                const afterCursor = value.substring(cursorPosition);

                const newValue = beforeAt + `@${context} ` + afterCursor;
                input.value = newValue;
                this.dataHandler.taskDescription = newValue;

                const newCursorPosition = symbolPosition + context.length + 2;
                input.setSelectionRange(newCursorPosition, newCursorPosition);
                input.focus();

                this.activeHandler = null;
                return true;
            }
        });
    }

    // Priority suggestions (!)
    private createPriorityHandler(): SuggestionHandler {
        return new SuggestionHandler({
            type: 'priority',
            items: ['A', 'B', 'C', ''],
            symbol: '!',
            customFilter: (item: string, searchTerm: string) => {
                const priorityMap: { [key: string]: string } = {
                    'A': 'high',
                    'B': 'medium',
                    'C': 'low',
                    '': 'none'
                };
                const displayText = priorityMap[item] || item.toLowerCase();
                const searchLower = searchTerm.toLowerCase();
                return item.toLowerCase().includes(searchLower) || displayText.includes(searchLower);
            },
            onSelect: (priority: string, symbolPosition: number, cursorPosition: number) => {
                const input = this.ui.getTaskInputElement();
                if (!input) return true;

                const value = input.value;
                const beforeExclamation = value.substring(0, symbolPosition);
                const afterCursor = value.substring(cursorPosition);

                const newValue = beforeExclamation + afterCursor;
                input.value = newValue;
                this.dataHandler.taskDescription = newValue;

                this.dataHandler.priority = priority;
                this.ui.updatePriority(priority);

                input.setSelectionRange(symbolPosition, symbolPosition);
                input.focus();

                this.activeHandler = null;
                return true;
            }
        });
    }

    // Project suggestions (+)
    private createProjectHandler(): SuggestionHandler {
        const projectsForSuggestion = this.getOrderedProjectsForSuggestions();

        return new SuggestionHandler({
            type: 'project',
            items: projectsForSuggestion,
            symbol: '+',
            onSelect: (project: string, symbolPosition: number, cursorPosition: number) => {
                const input = this.ui.getTaskInputElement();
                if (!input) return true;

                const value = input.value;
                const beforePlus = value.substring(0, symbolPosition);
                const afterCursor = value.substring(cursorPosition);

                const newValue = beforePlus + afterCursor;
                input.value = newValue;
                this.dataHandler.taskDescription = newValue;

                this.dataHandler.selectedProject = project;
                this.ui.updateProject(project);

                // Non-blocking context update
                if (this.onProjectChange) {
                    this.onProjectChange(project).catch(error => {
                        console.error('Error updating contexts for project:', error);
                    });
                }

                input.setSelectionRange(symbolPosition, symbolPosition);
                input.focus();

                this.activeHandler = null;
                return true;
            }
        });
    }

    // Due date suggestions (*)
    private createDueDateHandler(): SuggestionHandler {
        return new SuggestionHandler({
            type: 'priority',
            items: ['Today', 'Tomorrow', 'Next Week', 'Next Month', 'Repeat'],
            symbol: '*',
            onSelect: (option: string, symbolPosition: number, cursorPosition: number) => {
                const input = this.ui.getTaskInputElement();
                if (!input) return true;

                const value = input.value;
                const beforeSymbol = value.substring(0, symbolPosition);
                const afterCursor = value.substring(cursorPosition);

                // Handle repeat mode
                if (option === 'Repeat' && !this.isInRepeatMode) {
                    this.isInRepeatMode = true;
                    this.dueDateHandler.updateItems(['Daily', 'Weekly', 'Monthly', 'Yearly']);
                    const searchTerm = value.substring(symbolPosition + 1, cursorPosition).toLowerCase();
                    this.dueDateHandler.showSuggestions(searchTerm, input, cursorPosition);
                    return false;
                }

                if (this.isInRepeatMode) {
                    // Apply repeat syntax
                    const repeatSyntax = getRepeatSyntax(option);
                    const newValue = beforeSymbol + repeatSyntax + ' ' + afterCursor;
                    input.value = newValue;
                    this.dataHandler.taskDescription = input.value;

                    this.isInRepeatMode = false;
                    this.dueDateHandler.updateItems(['Today', 'Tomorrow', 'Next Week', 'Next Month', 'Repeat']);

                    const newPosition = beforeSymbol.length + repeatSyntax.length + 1;
                    input.setSelectionRange(newPosition, newPosition);
                    input.focus();
                } else {
                    // Apply due date
                    const dueDate = calculateDueDate(option);
                    input.value = beforeSymbol + afterCursor;
                    this.dataHandler.taskDescription = input.value;

                    this.dataHandler.dueDate = dueDate;
                    this.ui.updateDueDate(dueDate);

                    input.setSelectionRange(symbolPosition, symbolPosition);
                    input.focus();
                }

                this.activeHandler = null;
                return true;
            }
        });
    }

    // Get projects ordered for display
    private getOrderedProjectsForSuggestions(): string[] {
        const availableProjects = [...this.dataHandler.availableProjects];
        const orderedProjects: string[] = [];

        orderedProjects.push('Inbox');

        const otherProjects = availableProjects.filter(project =>
            project !== 'Inbox' && project !== 'Archived'
        );
        orderedProjects.push(...otherProjects);

        orderedProjects.push('Archived');

        return orderedProjects;
    }

    getActiveHandler(): SuggestionHandler | WikiLinkHandler | null {
        return this.activeHandler;
    }

    setActiveHandler(handler: SuggestionHandler | WikiLinkHandler | null): void {
        this.activeHandler = handler;
    }

    // Reset all states
    resetModes(): void {
        if (this.isInRepeatMode) {
            this.isInRepeatMode = false;
            this.dueDateHandler.updateItems(['Today', 'Tomorrow', 'Next Week', 'Next Month', 'Repeat']);
        }

        this.mainMenuHandler.resetMode();
    }

    // Update contexts
    updateContextItems(newContexts: string[]): void {
        this.contextHandler.updateItems(newContexts);
        this.mainMenuHandler.updateContextItems(newContexts);
    }

    cleanup(): void {
        this.contextHandler.cleanup();
        this.priorityHandler.cleanup();
        this.projectHandler.cleanup();
        this.dueDateHandler.cleanup();
        this.mainMenuHandler.cleanup();
        this.wikiLinkHandler.cleanup();
        this.resetModes();
    }
}