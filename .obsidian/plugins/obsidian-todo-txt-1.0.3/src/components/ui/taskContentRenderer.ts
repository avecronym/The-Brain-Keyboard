import { TodoItem } from '../../types';
import { ProjectManager } from '../../managers/projectManager';
import { Icons, createSVGElement } from '../../utils/icons';
import { App } from 'obsidian';

export class TaskContentRenderer {
    constructor(
        private projectManager: ProjectManager,
        private onSearchTag: (tag: string) => void,
        private app: App
    ) { }

    // Render main description
    renderDescription(container: HTMLElement, item: TodoItem): void {
        const descriptionLine = container.createDiv('todo-description-line');
        const descriptionEl = descriptionLine.createDiv('todo-description');
        this.renderFormattedDescription(descriptionEl, item);
    }

    // Render description notes
    renderDescriptionNotes(container: HTMLElement, notes: string): void {
        const notesLine = container.createDiv('todo-description-notes-line');
        const notesEl = notesLine.createDiv('task-description-notes');
        this.renderFormattedNotes(notesEl, notes);
    }

    // Render inline project tags
    renderInlineProjects(container: HTMLElement, projects: string[], item: TodoItem): void {
        const inlineProjectsEl = container.createDiv('todo-projects-inline');
        projects.forEach(project => {
            const projectEl = inlineProjectsEl.createSpan('todo-project-meta');

            const displayProject = this.getDisplayProject(project, item);
            const textSpan = projectEl.createSpan('todo-project-text');
            textSpan.setText(displayProject.replace(/_/g, ' '));

            const iconSpan = projectEl.createSpan('todo-project-icon');
            const icon = this.getProjectIcon(displayProject);

            if (icon.includes('<svg')) {
                const svgElement = createSVGElement(icon);
                iconSpan.appendChild(svgElement);
            } else {
                iconSpan.setText(icon);
            }
        });
    }

    private renderFormattedDescription(container: HTMLElement, item: TodoItem): void {
        let displayDescription = item.description;

        // Hide priority for completed/archived
        if (item.completed || item.projects.includes('Archived')) {
            displayDescription = displayDescription.replace(/\s+pri:[A-Z]\b/g, '').trim();
        }

        // Handle WikiLinks
        const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
        let lastIndex = 0;
        let match;

        while ((match = wikiLinkRegex.exec(displayDescription)) !== null) {
            // Add text before WikiLink
            const beforeText = displayDescription.substring(lastIndex, match.index);
            this.renderTextPart(container, beforeText);

            // Create WikiLink element
            const linkText = match[1];
            const linkEl = container.createSpan('wiki-link');
            linkEl.setText(linkText);
            linkEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openWikiLink(linkText);
            });

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        const remainingText = displayDescription.substring(lastIndex);
        this.renderTextPart(container, remainingText);
    }

    private renderTextPart(container: HTMLElement, text: string): void {
        const parts = text.split(/(\s+)/);

        parts.forEach(part => {
            if (part.trim() === '') {
                container.appendChild(document.createTextNode(part));
            } else if (part.startsWith('+') && part.match(/^\+\w+/)) {
                // Skip project tags (rendered separately)
                return;
            } else if (part.startsWith('@') && part.match(/^@\S+/)) {
                // Context tag
                const contextEl = container.createSpan('context-tag');
                contextEl.setText(part.substring(1));
            } else if (part.startsWith('#')) {
                // Clickable hashtag
                const hashtagEl = container.createSpan('hashtag-tag');
                hashtagEl.setText(part);
                hashtagEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.onSearchTag(part);
                });
            } else if (part.includes(':') && !part.includes(' ') && !part.startsWith('http')) {
                const [key, value] = part.split(':', 2);
                if (key === 'rec') {
                    return;
                }
                // Skip key:value pairs
                if (value && value.trim()) {
                    return;
                } else {
                    container.appendChild(document.createTextNode(part));
                }
            } else if (part.match(/https?:\/\/[^\s]+/)) {
                // External link
                const linkEl = container.createEl('a', {
                    href: part,
                    text: part
                });
                linkEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(part, '_blank');
                });
            } else {
                container.appendChild(document.createTextNode(part));
            }
        });
    }

    private openWikiLink(linkText: string): void {
        const file = this.app.metadataCache.getFirstLinkpathDest(linkText, '');
        if (file) {
            this.app.workspace.getLeaf(false).openFile(file);
        }
    }

    private renderFormattedNotes(container: HTMLElement, notes: string): void {
        // Handle WikiLinks in notes
        const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
        let lastIndex = 0;
        let match;

        while ((match = wikiLinkRegex.exec(notes)) !== null) {
            // Add text before WikiLink
            const beforeText = notes.substring(lastIndex, match.index);
            this.renderNotesTextPart(container, beforeText);

            // Create WikiLink element
            const linkText = match[1];
            const linkEl = container.createSpan('wiki-link');
            linkEl.setText(linkText);
            linkEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openWikiLink(linkText);
            });

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        const remainingText = notes.substring(lastIndex);
        this.renderNotesTextPart(container, remainingText);
    }

    private renderNotesTextPart(container: HTMLElement, text: string): void {
        const parts = text.split(/(\s+)/);

        parts.forEach(part => {
            if (part.match(/https?:\/\/[^\s]+/)) {
                // External link
                const linkEl = container.createEl('a', {
                    href: part,
                    text: part
                });
                linkEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(part, '_blank');
                });
            } else {
                container.appendChild(document.createTextNode(part));
            }
        });
    }

    private getProjectIcon(project: string): string {
        if (project === 'Inbox') return Icons.inbox;
        if (project === 'Archived') return Icons.archived;

        const customIcon = this.projectManager.getProjectIcon(project);
        return customIcon || Icons.hash;
    }

    private getDisplayProject(project: string, item: TodoItem): string {
        if (project === 'Archived' && item.keyValuePairs.origProj) {
            const originalProjects = item.keyValuePairs.origProj.split(',');
            return originalProjects[0];
        }
        return project;
    }
}