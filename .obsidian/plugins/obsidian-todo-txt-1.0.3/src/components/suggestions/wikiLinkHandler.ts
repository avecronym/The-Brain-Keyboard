import { App, TFile } from 'obsidian';
import { SuggestionHandler } from './suggestionHandler';

export class WikiLinkHandler {
    private handler: SuggestionHandler;
    private app: App;
    private textarea: HTMLTextAreaElement | null = null;

    constructor(app: App) {
        this.app = app;

        this.handler = new SuggestionHandler({
            type: 'project', // Reuse project type for styling
            items: [],
            onSelect: (item: string, symbolPosition: number, cursorPosition: number) => {
                return this.insertWikiLink(item, symbolPosition, cursorPosition);
            },
            symbol: '[[',
            customFilter: (item: string, searchTerm: string) => {
                return item.toLowerCase().includes(searchTerm.toLowerCase());
            },
            getDisplayText: (item: string) => {
                return item;
            }
        });
    }

    showSuggestions(searchTerm: string, textarea: HTMLTextAreaElement, cursorPosition: number): boolean {
        this.textarea = textarea;

        const allFiles = this.app.vault.getFiles();
        const fileItems = allFiles.map(file => {
            if (file.extension === 'md') {
                return file.basename;
            }
            return file.name;
        });

        this.handler.updateItems(fileItems);
        return this.handler.showSuggestions(searchTerm, textarea, cursorPosition);
    }

    private insertWikiLink(fileName: string, symbolPosition: number, cursorPosition: number): boolean {
        if (!this.textarea) return false;

        const value = this.textarea.value;
        const beforeSymbol = value.substring(0, symbolPosition);
        const afterCursor = value.substring(cursorPosition);

        const wikiLink = `[[${fileName}]]`;

        this.textarea.value = beforeSymbol + wikiLink + afterCursor;

        const newCursorPosition = symbolPosition + wikiLink.length;
        this.textarea.setSelectionRange(newCursorPosition, newCursorPosition);

        this.textarea.dispatchEvent(new Event('input', { bubbles: true }));

        return true;
    }

    handleKeyNavigation(event: KeyboardEvent): boolean {
        return this.handler.handleKeyNavigation(event);
    }

    hideSuggestions(): void {
        this.handler.hideSuggestions();
    }

    cleanup(): void {
        this.handler.cleanup();
    }
}