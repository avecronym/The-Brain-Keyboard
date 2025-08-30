import { TodoItem } from '../../types';
import { getCurrentLocalDate } from '../../utils/dateUtils';

export class TaskDataHandler {
    // Task form data
    taskDescription: string = '';
    priority: string = '';
    selectedProject: string = 'Inbox';
    dueDate: string = '';
    isFirstTimePriority: boolean = true;
    availableProjects: string[] = [];
    availableContexts: string[] = [];
    private editingItem: TodoItem | null = null;
    private isEditMode: boolean = false;
    taskDescriptionNotes: string = '';

    constructor(
        availableProjects: string[],
        availableContexts: string[],
        editingItem?: TodoItem,
        preselectedProject?: string,
        defaultDueDate?: string
    ) {
        this.availableProjects = availableProjects;
        this.availableContexts = availableContexts;
        this.isEditMode = !!editingItem;
        this.editingItem = editingItem || null;

        // Set up edit or new task data
        if (this.isEditMode && this.editingItem) {
            this.populateFromItem(this.editingItem);
        } else {
            if (preselectedProject) {
                this.selectedProject = preselectedProject;
            }
            if (defaultDueDate) {
                this.dueDate = defaultDueDate;
            }
        }
    }

    // Fill form from existing task
    private populateFromItem(item: TodoItem): void {
        this.taskDescription = this.extractDescriptionWithoutPriorityAndMetadata(item);
        this.priority = item.priority || '';

        // Set project or default to Inbox
        if (item.projects.length > 0) {
            this.selectedProject = item.projects[0];
        } else {
            this.selectedProject = 'Inbox';
        }

        // Extract due date
        const dueMatch = item.description.match(/due:(\d{4}-\d{2}-\d{2})/);
        if (dueMatch) {
            this.dueDate = dueMatch[1];
        }

        if (this.priority) {
            this.isFirstTimePriority = false;
        }

        if (item.descriptionNotes) {
            this.taskDescriptionNotes = item.descriptionNotes;
        }
    }

    // Clean description for editing
    private extractDescriptionWithoutPriorityAndMetadata(item: TodoItem): string {
        let description = item.description;

        // Remove project tags
        if (item.projects.length > 0) {
            item.projects.forEach(project => {
                const projectRegex = new RegExp(`\\s*\\+${project}\\b`, 'g');
                description = description.replace(projectRegex, '');
            });
        }

        // Remove remaining metadata
        description = description.replace(/\s*\+\w+/g, '');
        description = description.replace(/\s*due:\d{4}-\d{2}-\d{2}/g, '');
        description = description.replace(/\s*origProj:\S+/g, '');

        return description.trim();
    }

    // Extract priority from description text
    parsePriorityFromDescription(): void {
        const trimmed = this.taskDescription.trim();

        if (trimmed.length >= 3 &&
            trimmed.charAt(0) === '(' &&
            trimmed.charAt(2) === ')' &&
            /[A-Z]/.test(trimmed.charAt(1))) {

            this.priority = trimmed.charAt(1);
            this.taskDescription = trimmed.substring(3).trim();
        }
    }

    // Build final task line string
    buildTaskLine(): string {
        const trimmedDescription = this.taskDescription.trim();
        if (!trimmedDescription) {
            return '';
        }

        // Check if description has only metadata
        let contentCheck = trimmedDescription;
        contentCheck = contentCheck.replace(/\s*\+\w+/g, ''); // Remove project tags
        contentCheck = contentCheck.replace(/\s*@\w+/g, ''); // Remove context tags
        contentCheck = contentCheck.replace(/\s*due:\d{4}-\d{2}-\d{2}/g, ''); // Remove due dates
        contentCheck = contentCheck.replace(/\s*rec:\S+/g, ''); // Remove recurrence
        contentCheck = contentCheck.replace(/\s*\w+:\S+/g, ''); // Remove key:value pairs
        contentCheck = contentCheck.replace(/\s*[+@!/*]/g, ''); // Remove standalone symbols
        contentCheck = contentCheck.replace(/\s*\w+:\s*/g, ''); // Remove incomplete key: patterns

        if (!contentCheck.trim()) {
            return '';
        }

        let taskLine = '';

        // Mark edited completed tasks
        if (this.editingItem?.completed) {
            const completionMatch = this.editingItem.raw.match(/^x\s+(\d{4}-\d{2}-\d{2})/);
            if (completionMatch) {
                taskLine += `x ${completionMatch[1]} `;
            } else {
                const today = new Date().toISOString().split('T')[0];
                taskLine += `x ${today} `;
            }
        }

        // Add priority
        if (this.priority) {
            taskLine += `(${this.priority}) `;
        }

        // Set or keep creation date
        if (!this.editingItem?.completed) {
            if (!this.isEditMode) {
                const today = getCurrentLocalDate();
                taskLine += `${today} `;
            } else if (this.editingItem?.creationDate) {
                taskLine += `${this.editingItem.creationDate} `;
            }
        }

        // Add task description
        taskLine += this.taskDescription.trim();

        // Add project if not specified
        const hasManualProject = /\+\w+/.test(this.taskDescription);
        if (!hasManualProject && this.selectedProject) {
            taskLine += ` +${this.selectedProject}`;
        }

        // Handle due dates and recurrence
        const hasRecurrence = /\brec:\S+/.test(this.taskDescription);
        const hasDueInDescription = /\bdue:\d{4}-\d{2}-\d{2}/.test(this.taskDescription);

        if (this.dueDate && !this.taskDescription.includes(`due:${this.dueDate}`)) {
            taskLine += ` due:${this.dueDate}`;
        } else if (hasRecurrence && !this.dueDate && !hasDueInDescription) {
            const today = new Date().toISOString().split('T')[0];
            taskLine += ` due:${today}`;
        }

        // Add notes if present
        if (this.taskDescriptionNotes) {
            const escapedNotes = this.taskDescriptionNotes.replace(/\n/g, '\\n');
            taskLine += ` ||${escapedNotes}`;
        }

        return taskLine;
    }

    updateAvailableContexts(newContexts: string[]): void {
        this.availableContexts = newContexts;
    }
}