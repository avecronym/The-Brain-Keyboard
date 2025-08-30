import { TaskDataHandler } from '../modals/taskDataHandler';
import { TaskModalUI } from '../modals/taskModalUI';
import { SuggestionManager } from './suggestionManager';

export class TaskInputHandler {
    constructor(
        private dataHandler: TaskDataHandler,
        private ui: TaskModalUI,
        private suggestionManager: SuggestionManager
    ) { }

    // Handle text changes and show suggestions
    handleTaskDescriptionChange(value: string, cursorPosition: number): void {
        this.dataHandler.taskDescription = value;
        this.dataHandler.parsePriorityFromDescription();

        // Update priority display if found
        if (this.dataHandler.priority) {
            this.ui.updatePriority(this.dataHandler.priority);
        }

        // Check for WikiLink trigger [[
        const wikiLinkPosition = value.lastIndexOf('[[', cursorPosition - 1);

        // Find trigger symbols before cursor
        const atPosition = value.lastIndexOf('@', cursorPosition - 1);
        const exclamationPosition = value.lastIndexOf('!', cursorPosition - 1);
        const plusPosition = value.lastIndexOf('+', cursorPosition - 1);
        const asteriskPosition = value.lastIndexOf('*', cursorPosition - 1);
        const slashPosition = value.lastIndexOf('/', cursorPosition - 1);

        // Sort by closest to cursor
        const positions = [
            { pos: wikiLinkPosition, handler: this.suggestionManager.wikiLinkHandler, symbol: '[[', length: 2 },
            { pos: atPosition, handler: this.suggestionManager.contextHandler, symbol: '@', length: 1 },
            { pos: exclamationPosition, handler: this.suggestionManager.priorityHandler, symbol: '!', length: 1 },
            { pos: plusPosition, handler: this.suggestionManager.projectHandler, symbol: '+', length: 1 },
            { pos: asteriskPosition, handler: this.suggestionManager.dueDateHandler, symbol: '*', length: 1 },
            { pos: slashPosition, handler: this.suggestionManager.mainMenuHandler, symbol: '/', length: 1 }
        ].filter(p => p.pos !== -1)
            .sort((a, b) => b.pos - a.pos);

        // Reset modes if handler no longer active
        const activeHandler = this.suggestionManager.getActiveHandler();
        if (activeHandler === this.suggestionManager.dueDateHandler &&
            (positions.length === 0 || positions[0].handler !== this.suggestionManager.dueDateHandler)) {
            this.suggestionManager.resetModes();
        }

        if (activeHandler === this.suggestionManager.mainMenuHandler &&
            (positions.length === 0 || positions[0].handler !== this.suggestionManager.mainMenuHandler)) {
            this.suggestionManager.resetModes();
        }

        // Show suggestions for closest trigger
        if (positions.length > 0 && positions[0].pos < cursorPosition) {
            const { pos, handler, symbol, length } = positions[0];
            const searchTerm = value.substring(pos + length, cursorPosition);

            // Check if WikiLink is already closed
            if (symbol === '[[' && value.substring(pos, cursorPosition).includes(']]')) {
                this.hideAllSuggestions();
                this.suggestionManager.setActiveHandler(null);
                return;
            }

            const hasSpaceAfter = searchTerm.includes(' ') && symbol !== '[[';

            // Show only if no space after trigger (except WikiLinks)
            if (!hasSpaceAfter) {
                this.hideAllSuggestionsExcept(handler);

                const hasSuggestions = handler.showSuggestions(
                    searchTerm.toLowerCase(),
                    this.ui.getTaskInputElement()!,
                    cursorPosition
                );

                this.suggestionManager.setActiveHandler(hasSuggestions ? handler : null);
            } else {
                this.hideAllSuggestions();
                this.suggestionManager.setActiveHandler(null);
                this.suggestionManager.resetModes();
            }
        } else {
            this.hideAllSuggestions();
            this.suggestionManager.setActiveHandler(null);
            this.suggestionManager.resetModes();
        }
    }

    // Handle keyboard navigation and submission
    handleKeyDown(e: KeyboardEvent, onSubmit: () => void): void {
        const activeHandler = this.suggestionManager.getActiveHandler();
        if (activeHandler && e.key !== 'Enter') {
            activeHandler.handleKeyNavigation(e);
        }
    }

    // Show suggestions on trigger symbol typed
    handleKeyUp(e: KeyboardEvent): void {
        if (e.key === '@' || e.key === '!' || e.key === '+' || e.key === '*' || e.key === '/') {
            setTimeout(() => {
                const input = this.ui.getTaskInputElement();
                if (input) {
                    const cursorPosition = input.selectionStart || 0;
                    const value = input.value;

                    // Map symbols to handlers
                    const handlerMap: { [key: string]: any } = {
                        '@': this.suggestionManager.contextHandler,
                        '!': this.suggestionManager.priorityHandler,
                        '+': this.suggestionManager.projectHandler,
                        '*': this.suggestionManager.dueDateHandler,
                        '/': this.suggestionManager.mainMenuHandler
                    };

                    const handler = handlerMap[e.key];
                    const symbolPosition = value.lastIndexOf(e.key, cursorPosition - 1);

                    // Show suggestions for this symbol
                    if (symbolPosition !== -1) {
                        const searchTerm = value.substring(symbolPosition + 1, cursorPosition).toLowerCase();
                        this.suggestionManager.setActiveHandler(handler);
                        handler.showSuggestions(searchTerm, input, cursorPosition);
                    }
                }
            }, 0);
        }
    }

    // Hide all suggestions except the active one
    private hideAllSuggestionsExcept(exceptHandler: any): void {
        const { contextHandler, priorityHandler, projectHandler, dueDateHandler, mainMenuHandler, wikiLinkHandler } = this.suggestionManager;

        if (exceptHandler !== contextHandler) contextHandler.hideSuggestions();
        if (exceptHandler !== priorityHandler) priorityHandler.hideSuggestions();
        if (exceptHandler !== projectHandler) projectHandler.hideSuggestions();
        if (exceptHandler !== dueDateHandler) dueDateHandler.hideSuggestions();
        if (exceptHandler !== mainMenuHandler) mainMenuHandler.hideSuggestions();
        if (exceptHandler !== wikiLinkHandler) wikiLinkHandler.hideSuggestions();
    }

    // Hide all suggestion dropdowns
    private hideAllSuggestions(): void {
        this.suggestionManager.contextHandler.hideSuggestions();
        this.suggestionManager.priorityHandler.hideSuggestions();
        this.suggestionManager.projectHandler.hideSuggestions();
        this.suggestionManager.dueDateHandler.hideSuggestions();
        this.suggestionManager.mainMenuHandler.hideSuggestions();
        this.suggestionManager.wikiLinkHandler.hideSuggestions();
    }
}