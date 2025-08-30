export type SuggestionType = 'context' | 'priority' | 'project';

// Configuration for suggestion dropdown
export interface SuggestionConfig {
    type: SuggestionType;
    items: string[];
    onSelect: (item: string, symbolPosition: number, cursorPosition: number) => boolean;
    symbol: string;
    customFilter?: (item: string, searchTerm: string) => boolean;
    getDisplayText?: (item: string) => string;
}

export class SuggestionHandler {
    private config: SuggestionConfig;
    private suggestions: HTMLElement | null = null;
    private selectedSuggestionIndex: number = -1;
    private currentSymbolPosition: number = -1;
    private currentCursorPosition: number = -1;

    constructor(config: SuggestionConfig) {
        this.config = config;
    }

    // Show suggestions if matches found
    showSuggestions(searchTerm: string, textarea: HTMLTextAreaElement, cursorPosition: number): boolean {
        // Filter items by search term
        const filteredItems = this.config.customFilter
            ? this.config.items.filter(item => this.config.customFilter!(item, searchTerm))
            : this.config.items.filter(item =>
                item.toLowerCase().includes(searchTerm)
            );

        if (filteredItems.length > 0) {
            const symbolPosition = textarea.value.lastIndexOf(this.config.symbol, cursorPosition - 1);
            this.currentSymbolPosition = symbolPosition;
            this.currentCursorPosition = cursorPosition;
            this.displaySuggestions(filteredItems, textarea, cursorPosition, symbolPosition);
            return true;
        } else {
            this.hideSuggestions();
            return false;
        }
    }

    // Create and position suggestion dropdown
    private displaySuggestions(items: string[], textarea: HTMLTextAreaElement, cursorPosition: number, symbolPosition: number): void {
        this.hideSuggestions();

        this.currentSymbolPosition = symbolPosition;
        this.currentCursorPosition = cursorPosition;

        // Calculate dropdown position
        const rect = textarea.getBoundingClientRect();
        const cursorCoords = this.getTextareaCaretPosition(textarea, cursorPosition);

        this.suggestions = document.createElement('div');
        this.suggestions.className = `${this.config.type}-suggestions suggestion-container`;
        this.suggestions.style.setProperty('--suggestion-top', `${rect.top + cursorCoords.top + cursorCoords.height + 5}px`);
        this.suggestions.style.setProperty('--suggestion-left', `${rect.left + cursorCoords.left}px`);

        // Create suggestion items
        items.forEach((item, index) => {
            const suggestionEl = document.createElement('div');
            suggestionEl.className = 'suggestion-item';

            // Format display text
            if (this.config.getDisplayText) {
                suggestionEl.textContent = this.config.getDisplayText(item);
            } else if (this.config.type === 'priority') {
                const priorityMap: { [key: string]: string } = {
                    'A': 'High',
                    'B': 'Medium',
                    'C': 'Low',
                    '': 'None'
                };
                suggestionEl.textContent = priorityMap[item] || item;
            } else if (this.config.type === 'project') {
                suggestionEl.textContent = item.replace(/_/g, ' ');
            } else {
                suggestionEl.textContent = item;
            }

            suggestionEl.dataset.index = index.toString();
            suggestionEl.dataset.value = item;

            // Handle selection
            suggestionEl.addEventListener('click', () => {
                this.selectItem(item, this.currentSymbolPosition, this.currentCursorPosition);
            });

            suggestionEl.addEventListener('mouseenter', () => {
                this.selectedSuggestionIndex = index;
                this.updateSuggestionSelection();
            });

            this.suggestions!.appendChild(suggestionEl);
        });

        document.body.appendChild(this.suggestions);

        // Check viewport overflow and adjust position
        const suggestionRect = this.suggestions.getBoundingClientRect();
        let finalTop = rect.top + cursorCoords.top + cursorCoords.height + 5;
        let finalLeft = rect.left + cursorCoords.left;

        // Mobile adjustments
        const isMobile = window.innerWidth <= 768;
        const padding = isMobile ? 10 : 5;

        // Set max-width
        const maxWidth = isMobile ?
            window.innerWidth - (padding * 2) :
            400;
        this.suggestions.style.setProperty('--suggestion-max-width', `${maxWidth}px`);

        // Get updated rect
        const updatedRect = this.suggestions.getBoundingClientRect();

        // Check right overflow
        if (finalLeft + updatedRect.width > window.innerWidth - padding) {
            if (isMobile) {
                // Right-align to screen edge
                finalLeft = window.innerWidth - updatedRect.width - padding;
                finalLeft = Math.max(padding, finalLeft);
            } else {
                // Left-align to cursor
                finalLeft = rect.left + cursorCoords.left - updatedRect.width;
                finalLeft = Math.max(padding, finalLeft);
            }
        }

        finalLeft = Math.max(padding, finalLeft);

        // Check bottom overflow
        if (finalTop + updatedRect.height > window.innerHeight - padding) {
            finalTop = rect.top + cursorCoords.top - updatedRect.height - 5;
            finalTop = Math.max(padding, finalTop);
        }

        // Update position
        this.suggestions.style.setProperty('--suggestion-top', `${finalTop}px`);
        this.suggestions.style.setProperty('--suggestion-left', `${finalLeft}px`);

        // Select first item
        this.selectedSuggestionIndex = 0;
        this.updateSuggestionSelection();
    }

    // Calculate cursor position in textarea
    private getTextareaCaretPosition(textarea: HTMLTextAreaElement, caretPosition: number): { top: number; left: number; height: number } {
        const mirrorDiv = document.createElement('div');
        const computedStyle = window.getComputedStyle(textarea);

        mirrorDiv.className = 'textarea-mirror';

        // Copy essential positioning properties
        mirrorDiv.style.setProperty('--mirror-width', computedStyle.width);
        mirrorDiv.style.setProperty('--mirror-font', computedStyle.font);
        mirrorDiv.style.setProperty('--mirror-line-height', computedStyle.lineHeight);
        mirrorDiv.style.setProperty('--mirror-padding', computedStyle.padding);
        mirrorDiv.style.setProperty('--mirror-border', computedStyle.border);

        // Add text up to cursor
        const textBeforeCursor = textarea.value.substring(0, caretPosition);
        mirrorDiv.textContent = textBeforeCursor;

        // Add cursor marker
        const cursorSpan = document.createElement('span');
        cursorSpan.className = 'textarea-cursor-span';
        cursorSpan.textContent = '|';
        mirrorDiv.appendChild(cursorSpan);

        document.body.appendChild(mirrorDiv);

        // Calculate position
        const cursorRect = cursorSpan.getBoundingClientRect();
        const mirrorRect = mirrorDiv.getBoundingClientRect();

        const left = cursorRect.left - mirrorRect.left;
        const top = cursorRect.top - mirrorRect.top;
        const lineHeight = parseInt(computedStyle.lineHeight) || parseInt(computedStyle.fontSize) || 16;

        document.body.removeChild(mirrorDiv);

        return { top, left, height: lineHeight };
    }

    // Handle keyboard navigation
    handleKeyNavigation(event: KeyboardEvent): boolean {
        if (!this.suggestions) return false;

        const suggestionItems = this.suggestions.querySelectorAll('.suggestion-item');
        if (suggestionItems.length === 0) return false;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (this.selectedSuggestionIndex >= suggestionItems.length - 1) {
                    this.selectedSuggestionIndex = 0;
                } else {
                    this.selectedSuggestionIndex++;
                }
                this.updateSuggestionSelection();
                return true;
            case 'ArrowUp':
                event.preventDefault();
                if (this.selectedSuggestionIndex <= 0) {
                    this.selectedSuggestionIndex = suggestionItems.length - 1;
                } else {
                    this.selectedSuggestionIndex--;
                }
                this.updateSuggestionSelection();
                return true;
            case 'Enter':
                if (this.selectedSuggestionIndex >= 0) {
                    event.preventDefault();
                    const selectedSuggestion = suggestionItems[this.selectedSuggestionIndex] as HTMLElement;
                    if (selectedSuggestion) {
                        const value = selectedSuggestion.dataset.value || '';
                        this.selectItem(value, this.currentSymbolPosition, this.currentCursorPosition);
                    }
                    return true;
                }
                break;
            case 'Escape':
                event.preventDefault();
                this.hideSuggestions();
                return true;
        }

        return false;
    }

    // Update visual selection and scroll
    private updateSuggestionSelection(): void {
        if (!this.suggestions) return;

        const suggestionItems = this.suggestions.querySelectorAll('.suggestion-item');
        suggestionItems.forEach((suggestion, index) => {
            if (index === this.selectedSuggestionIndex) {
                suggestion.classList.add('selected');

                // Scroll to keep selected item visible
                const selectedElement = suggestion as HTMLElement;
                const container = this.suggestions!;
                const containerRect = container.getBoundingClientRect();
                const selectedRect = selectedElement.getBoundingClientRect();

                if (selectedRect.bottom > containerRect.bottom) {
                    container.scrollTop += selectedRect.bottom - containerRect.bottom + 5;
                } else if (selectedRect.top < containerRect.top) {
                    container.scrollTop -= containerRect.top - selectedRect.top + 5;
                }
            } else {
                suggestion.classList.remove('selected');
            }
        });
    }

    // Select item and close dropdown
    private selectItem(item: string, symbolPosition: number, cursorPosition: number): void {
        const shouldClose = this.config.onSelect(item, symbolPosition, cursorPosition);
        if (shouldClose !== false) {
            this.hideSuggestions();
        }
    }

    // Hide suggestion dropdown
    hideSuggestions(): void {
        if (this.suggestions) {
            document.body.removeChild(this.suggestions);
            this.suggestions = null;
        }
        this.selectedSuggestionIndex = -1;
        this.currentSymbolPosition = -1;
        this.currentCursorPosition = -1;
    }

    // Clean up resources
    cleanup(): void {
        this.hideSuggestions();
    }

    // Update available items
    updateItems(newItems: string[]): void {
        this.config.items = newItems;
    }

    getConfig(): SuggestionConfig {
        return this.config;
    }
}