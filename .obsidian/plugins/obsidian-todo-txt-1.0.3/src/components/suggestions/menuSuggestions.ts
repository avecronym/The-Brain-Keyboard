import { SuggestionHandler } from './suggestionHandler';
import { TaskDataHandler } from '../modals/taskDataHandler';
import { TaskModalUI } from '../modals/taskModalUI';
import { calculateDueDate, getRepeatSyntax } from '../../utils/dateUtils';

export class MenuSuggestions extends SuggestionHandler {
    private mainMenuMode: string = '';

    constructor(
        private dataHandler: TaskDataHandler,
        private ui: TaskModalUI,
        private getOrderedProjects: () => string[],
        private onProjectChange?: (projectName: string) => Promise<void>
    ) {
        super({
            type: 'priority',
            items: ['Date', 'Priority', 'Project', 'Context'],
            symbol: '/',
            getDisplayText: (item: string) => {
                if (this.mainMenuMode === 'Project') {
                    return item.replace(/_/g, ' ');
                }
                return item;
            },
            onSelect: (option: string, symbolPosition: number, cursorPosition: number) => {
                const input = this.ui.getTaskInputElement();
                if (!input) return true;

                const value = input.value;
                const beforeSymbol = value.substring(0, symbolPosition);
                const afterCursor = value.substring(cursorPosition);

                if (this.mainMenuMode) {
                    return this.handleSubmenuSelection(
                        option, symbolPosition, cursorPosition,
                        beforeSymbol, afterCursor, input
                    );
                } else {
                    return this.handleMainSelection(
                        option, value, symbolPosition, cursorPosition, input
                    );
                }
            }
        });
    }

    // Handle main menu selection
    private handleMainSelection(
        option: string,
        value: string,
        symbolPosition: number,
        cursorPosition: number,
        input: HTMLTextAreaElement
    ): boolean {
        this.mainMenuMode = option;

        switch (option) {
            case 'Date':
                this.updateItems(['Today', 'Tomorrow', 'Next Week', 'Next Month', 'Repeat']);
                break;
            case 'Priority':
                this.updateItems(['High', 'Medium', 'Low', 'None']);
                break;
            case 'Project':
                this.updateItems(this.getOrderedProjects());
                break;
            case 'Context':
                this.updateItems(this.dataHandler.availableContexts);
                break;
        }

        const searchTerm = value.substring(symbolPosition + 1, cursorPosition).toLowerCase();
        this.showSuggestions(searchTerm, input, cursorPosition);
        return false;
    }

    // Handle submenu selection
    private handleSubmenuSelection(
        option: string,
        symbolPosition: number,
        cursorPosition: number,
        beforeSymbol: string,
        afterCursor: string,
        input: HTMLTextAreaElement
    ): boolean {
        // Special case: entering repeat submenu
        if (this.mainMenuMode === 'Date' && option === 'Repeat') {
            this.updateItems(['Daily', 'Weekly', 'Monthly', 'Yearly']);
            this.mainMenuMode = 'Date-Repeat';
            const searchTerm = input.value.substring(symbolPosition + 1, cursorPosition).toLowerCase();
            this.showSuggestions(searchTerm, input, cursorPosition);
            return false;
        }

        // Handle selection based on mode
        switch (this.mainMenuMode) {
            case 'Date':
                this.handleDateSelection(option, beforeSymbol, afterCursor, symbolPosition, input);
                break;

            case 'Date-Repeat':
                this.handleRepeatSelection(option, beforeSymbol, afterCursor, input);
                break;

            case 'Priority':
                this.handlePrioritySelection(option, beforeSymbol, afterCursor, symbolPosition, input);
                break;

            case 'Project':
                this.handleProjectSelection(option, beforeSymbol, afterCursor, symbolPosition, input);
                break;

            case 'Context':
                this.handleContextSelection(option, beforeSymbol, afterCursor, symbolPosition, input);
                break;
        }

        this.resetMode();
        return true;
    }

    private handleDateSelection(
        option: string,
        beforeSymbol: string,
        afterCursor: string,
        symbolPosition: number,
        input: HTMLTextAreaElement
    ): void {
        const dueDate = calculateDueDate(option);
        input.value = beforeSymbol + afterCursor;
        this.dataHandler.taskDescription = input.value;
        this.dataHandler.dueDate = dueDate;
        this.ui.updateDueDate(dueDate);
        input.setSelectionRange(symbolPosition, symbolPosition);
        input.focus();
    }

    private handleRepeatSelection(
        option: string,
        beforeSymbol: string,
        afterCursor: string,
        input: HTMLTextAreaElement
    ): void {
        const repeatSyntax = getRepeatSyntax(option);
        const newValue = beforeSymbol + repeatSyntax + ' ' + afterCursor;
        input.value = newValue;
        this.dataHandler.taskDescription = input.value;
        const newPosition = beforeSymbol.length + repeatSyntax.length + 1;
        input.setSelectionRange(newPosition, newPosition);
        input.focus();
    }

    private handlePrioritySelection(
        option: string,
        beforeSymbol: string,
        afterCursor: string,
        symbolPosition: number,
        input: HTMLTextAreaElement
    ): void {
        const priorityMap: { [key: string]: string } = {
            'High': 'A',
            'Medium': 'B',
            'Low': 'C',
            'None': ''
        };
        const priority = priorityMap[option] || '';
        input.value = beforeSymbol + afterCursor;
        this.dataHandler.taskDescription = input.value;
        this.dataHandler.priority = priority;
        this.ui.updatePriority(priority);
        input.setSelectionRange(symbolPosition, symbolPosition);
        input.focus();
    }

    private handleProjectSelection(
        option: string,
        beforeSymbol: string,
        afterCursor: string,
        symbolPosition: number,
        input: HTMLTextAreaElement
    ): void {
        input.value = beforeSymbol + afterCursor;
        this.dataHandler.taskDescription = input.value;
        this.dataHandler.selectedProject = option;
        this.ui.updateProject(option);

        // Non-blocking context update
        if (this.onProjectChange) {
            this.onProjectChange(option).catch(error => {
                console.error('Error updating contexts for project:', error);
            });
        }

        input.setSelectionRange(symbolPosition, symbolPosition);
        input.focus();
    }

    private handleContextSelection(
        option: string,
        beforeSymbol: string,
        afterCursor: string,
        symbolPosition: number,
        input: HTMLTextAreaElement
    ): void {
        const ctxValue = beforeSymbol + `@${option} ` + afterCursor;
        input.value = ctxValue;
        this.dataHandler.taskDescription = input.value;
        const ctxPosition = symbolPosition + option.length + 2;
        input.setSelectionRange(ctxPosition, ctxPosition);
        input.focus();
    }

    resetMode(): void {
        if (this.mainMenuMode) {
            this.mainMenuMode = '';
            this.updateItems(['Date', 'Priority', 'Project', 'Context']);
        }
    }

    updateContextItems(newContexts: string[]): void {
        if (this.mainMenuMode === 'Context') {
            this.updateItems(newContexts);
        }
    }
}