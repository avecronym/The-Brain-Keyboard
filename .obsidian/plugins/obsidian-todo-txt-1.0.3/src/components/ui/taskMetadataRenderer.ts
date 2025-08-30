import { TodoItem } from '../../types';
import { DateUtils } from '../../utils/dateUtils';
import { Icons, createSVGElement } from '../../utils/icons';
import { ProjectManager } from '../../managers/projectManager';

export class TaskMetadataRenderer {
    constructor(private projectManager: ProjectManager) { }

    // Render metadata section
    render(container: HTMLElement, item: TodoItem, renderProjects: boolean = true): void {
        const metaEl = container.createDiv('todo-meta');
        const metaLeft = metaEl.createDiv('todo-meta-left');
        const metaRight = metaEl.createDiv('todo-meta-right');

        this.renderDates(metaLeft, item);
        this.renderKeyValuePairs(metaLeft, item);

        if (renderProjects && item.projects.length > 0) {
            this.renderProjects(metaRight, item);
        }
    }

    private renderDates(container: HTMLElement, item: TodoItem): void {
        // Completion date
        if (item.completed && item.completionDate) {
            const formattedDate = DateUtils.formatDate(item.completionDate);
            const completionDateEl = container.createSpan('todo-date completion-date');
            completionDateEl.setText(formattedDate);
        }

        // Creation date for archived
        if (item.projects.includes('Archived') && !item.completed && item.creationDate) {
            const formattedDate = DateUtils.formatDate(item.creationDate);
            const creationDateEl = container.createSpan('todo-date creation-date');
            creationDateEl.setText(formattedDate);
        }

        // Due date with status
        const dueMatch = item.description.match(/due:(\d{4}-\d{2}-\d{2})/);
        if (dueMatch && !item.completed && !item.projects.includes('Archived')) {
            const dueDateValue = dueMatch[1];
            const formattedDate = DateUtils.formatDate(dueDateValue);
            const dueDateStatus = DateUtils.getDueDateStatus(dueDateValue);

            const dueDateEl = container.createSpan('todo-due-date');
            dueDateEl.appendText(formattedDate);

            // Recurrence indicator
            const hasRecurrence = item.keyValuePairs.rec || item.description.includes('rec:');
            if (hasRecurrence) {
                const repeatIcon = dueDateEl.createSpan('repeat-icon');
                const repeatSvg = createSVGElement(Icons.repeat);
                repeatIcon.appendChild(repeatSvg);
            }

            if (dueDateStatus) {
                dueDateEl.addClass(dueDateStatus);
            }
        }

        // Generic completion indicator
        if (item.completed && !item.completionDate) {
            const completionDateEl = container.createSpan('todo-date completion-date');
            completionDateEl.setText('Completed');
        }
    }

    private renderProjects(container: HTMLElement, item: TodoItem): void {
        const projectsEl = container.createDiv('todo-projects-meta');

        item.projects.forEach(project => {
            const projectEl = projectsEl.createSpan('todo-project-meta');

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

    private renderKeyValuePairs(container: HTMLElement, item: TodoItem): void {
        // Filter system keys
        const kvPairs = Object.entries(item.keyValuePairs).filter(([key]) =>
            key !== 'pri' &&
            key !== 'due' &&
            key !== 'rec' &&
            key !== 'origProj' &&
            key !== '||https' &&
            key !== '||http'
        );

        if (kvPairs.length > 0) {
            const kvEl = container.createDiv('todo-kv');
            kvPairs.forEach(([key, value]) => {
                const kvPair = kvEl.createSpan('todo-kv-pair');
                kvPair.setText(`${key}:${value}`);
            });
        }
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