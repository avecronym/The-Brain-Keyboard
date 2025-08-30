import { TodoItem } from '../../types';
import { TaskManager } from '../../managers/taskManager';
import { ProjectManager } from '../../managers/projectManager';
import { TaskContentRenderer } from './taskContentRenderer';
import { TaskMetadataRenderer } from './taskMetadataRenderer';
import { App } from 'obsidian';

export class TaskItem {
    private contentRenderer: TaskContentRenderer;
    private metadataRenderer: TaskMetadataRenderer;

    constructor(
        private taskManager: TaskManager,
        private projectManager: ProjectManager,
        private filterManager: any,
        private onSearchTag: (tag: string) => void,
        private app: App
    ) {
        this.contentRenderer = new TaskContentRenderer(projectManager, onSearchTag, app);
        this.metadataRenderer = new TaskMetadataRenderer(projectManager);
    }

    // Render complete task item
    render(container: HTMLElement, item: TodoItem): void {
        const todoEl = container.createDiv('todo-item');
        if (item.completed) {
            todoEl.addClass('completed');
        } else if (item.projects.includes('Archived')) {
            todoEl.addClass('archived');
        }

        this.renderCheckbox(todoEl, item);
        this.renderContent(todoEl, item);

        // Open edit modal on click
        todoEl.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!target.classList.contains('todo-checkbox')) {
                this.taskManager.editTask(
                    item,
                    this.projectManager.getAvailableProjects(),
                    this.filterManager.getAvailableContexts()
                );
            }
        });
    }

    private renderCheckbox(container: HTMLElement, item: TodoItem): void {
        const checkbox = container.createEl('input', { type: 'checkbox' });
        checkbox.checked = item.completed || item.projects.includes('Archived');
        checkbox.addClass('todo-checkbox');

        // Style based on task state
        if (item.completed) {
            checkbox.addClass('todo-checkbox-completed');
        } else if (item.projects.includes('Archived')) {
            checkbox.addClass('todo-checkbox-archived');
        }

        // Apply priority styling
        const priorityForDisplay = this.getPriorityForDisplay(item);
        if (priorityForDisplay) {
            if (['A', 'B', 'C'].includes(priorityForDisplay)) {
                checkbox.addClass(`priority-${priorityForDisplay.toLowerCase()}`);
            } else {
                checkbox.addClass('priority-other');
            }
        }

        // Toggle task state on checkbox change
        checkbox.addEventListener('change', async (event) => {
            const isChecked = (event.target as HTMLInputElement).checked;
            if (item.projects.includes('Archived')) {
                if (!isChecked) {
                    await this.taskManager.moveTaskFromArchived(item);
                }
            } else {
                if (isChecked) {
                    await this.taskManager.completeTask(item);
                } else {
                    await this.taskManager.uncompleteTask(item);
                }
            }
        });
    }

    private renderContent(container: HTMLElement, item: TodoItem): void {
        const contentEl = container.createDiv('todo-content');
        const mainLine = contentEl.createDiv('todo-main');

        // Determine metadata presence
        const dueMatch = item.description.match(/due:(\d{4}-\d{2}-\d{2})/);
        const hasDueDate = dueMatch && !item.completed;
        const hasDescriptionNotes = !!item.descriptionNotes;
        const hasKeyValuePairs = Object.keys(item.keyValuePairs)
            .filter(k => k !== 'pri' && k !== 'due').length > 0;

        const isMobile = this.getContainerWidth() <= 768;
        const isCompleted = item.completed;
        const isArchived = item.projects.includes('Archived');

        // Render description and optional notes
        this.contentRenderer.renderDescription(mainLine, item);

        // Inline projects for desktop without metadata
        const shouldShowInlineProjects = !isCompleted && !isArchived && !hasDueDate &&
            !hasDescriptionNotes && !hasKeyValuePairs && item.projects.length > 0 && !isMobile;

        if (shouldShowInlineProjects) {
            const descriptionLine = mainLine.querySelector('.todo-description-line');
            if (descriptionLine) {
                this.contentRenderer.renderInlineProjects(descriptionLine as HTMLElement, item.projects, item);
            }
        }

        // Notes section
        if (hasDescriptionNotes) {
            this.contentRenderer.renderDescriptionNotes(mainLine, item.descriptionNotes || '');

            if (!isCompleted && !isArchived && !hasDueDate && !hasKeyValuePairs &&
                item.projects.length > 0 && !isMobile) {
                const notesLine = mainLine.querySelector('.todo-description-notes-line');
                if (notesLine) {
                    this.contentRenderer.renderInlineProjects(notesLine as HTMLElement, item.projects, item);
                }
            }
        }

        // Metadata section
        const needsMetadata = hasDueDate || hasKeyValuePairs || item.completionDate ||
            (isCompleted && item.projects.length > 0) || (isArchived && item.projects.length > 0) ||
            (isMobile && item.projects.length > 0);

        if (needsMetadata) {
            const shouldRenderProjectsInMeta = isCompleted || isArchived || hasDueDate ||
                hasKeyValuePairs || isMobile;
            this.metadataRenderer.render(contentEl, item, shouldRenderProjectsInMeta);
        }
    }

    private getContainerWidth(): number {
        const container = document.querySelector('.todo-txt-view');
        return container ? container.clientWidth : window.innerWidth;
    }

    private getPriorityForDisplay(item: TodoItem): string | null {
        if (item.priority) return item.priority;
        if (item.completed && item.keyValuePairs.pri) return item.keyValuePairs.pri;
        return null;
    }
}