import { TaskDataHandler } from './taskDataHandler';

export interface ModalElements {
    taskInput: HTMLTextAreaElement;
    descriptionInput: HTMLTextAreaElement;
    projectDropdown: HTMLSelectElement;
    priorityDropdown: HTMLSelectElement;
    datePicker: HTMLInputElement;
}

export class TaskModalElements {
    constructor(
        private isEditMode: boolean,
        private dataHandler: TaskDataHandler,
        private onSubmit: () => void,
        private onDelete?: () => void,
        private onCancel?: () => void
    ) { }

    // Check if device is mobile
    private isMobile(): boolean {
        return window.innerWidth <= 768;
    }

    // Create all modal UI elements
    createModalElements(contentEl: HTMLElement): ModalElements {
        // Main task input
        const inputContainer = contentEl.createDiv('task-input-container');
        const taskInput = this.createTaskInput(inputContainer);
        const descriptionInput = this.createDescriptionInput(inputContainer);

        // Bottom controls section
        const bottomContainer = contentEl.createDiv('modal-bottom-container');
        const leftContainer = bottomContainer.createDiv('left-container');

        const projectDropdown = this.createProjectDropdown(leftContainer);
        const priorityDropdown = this.createPriorityDropdown(leftContainer);
        const datePicker = this.createDatePicker(leftContainer);

        this.createButtons(bottomContainer);

        return {
            taskInput,
            descriptionInput,
            projectDropdown,
            priorityDropdown,
            datePicker
        };
    }

    private createTaskInput(container: HTMLElement): HTMLTextAreaElement {
        const taskInput = container.createEl('textarea');
        taskInput.addClass('task-input-field');
        taskInput.setAttribute('rows', '1');
        taskInput.setAttribute('placeholder', 'Next thing to do');
        taskInput.value = this.dataHandler.taskDescription;

        return taskInput;
    }

    private createDescriptionInput(container: HTMLElement): HTMLTextAreaElement {
        const descriptionContainer = container.createDiv('task-description-container');
        const descriptionInput = descriptionContainer.createEl('textarea');
        descriptionInput.addClass('task-description-field');
        descriptionInput.setAttribute('rows', '2');
        descriptionInput.setAttribute('placeholder', 'Description');
        descriptionInput.value = this.dataHandler.taskDescriptionNotes || '';

        return descriptionInput;
    }

    private createProjectDropdown(container: HTMLElement): HTMLSelectElement {
        const projectContainer = container.createDiv('dropdown-container');
        const projectSelect = projectContainer.createEl('select');
        projectSelect.addClass('modal-dropdown');

        // Inbox first
        projectSelect.createEl('option', { value: 'Inbox', text: 'Inbox' });

        // Other projects
        this.dataHandler.availableProjects
            .filter(p => p !== 'Inbox' && p !== 'Archived')
            .forEach(project => {
                projectSelect.createEl('option', {
                    value: project,
                    text: project.replace(/_/g, ' ')
                });
            });

        // Archived last
        projectSelect.createEl('option', { value: 'Archived', text: 'Archived' });

        projectSelect.value = this.dataHandler.selectedProject;

        return projectSelect;
    }

    private createPriorityDropdown(container: HTMLElement): HTMLSelectElement {
        const priorityContainer = container.createDiv('dropdown-container');
        const prioritySelect = priorityContainer.createEl('select');
        prioritySelect.addClass('modal-dropdown');

        // Add placeholder for new tasks
        if ((this.dataHandler.isFirstTimePriority && !this.isEditMode) ||
            (this.isEditMode && !this.dataHandler.priority)) {
            const defaultOption = prioritySelect.createEl('option', {
                value: '',
                text: 'Priority'
            });
            defaultOption.disabled = true;
            defaultOption.hidden = true;
            defaultOption.addClass('default-option');
        }

        // Add standard priorities
        const priorities = [
            { value: 'A', text: 'High' },
            { value: 'B', text: 'Medium' },
            { value: 'C', text: 'Low' },
            { value: '', text: 'None' }
        ];

        priorities.forEach(p => prioritySelect.createEl('option', p));

        // Add custom priority if needed
        if (this.dataHandler.priority && !['A', 'B', 'C', ''].includes(this.dataHandler.priority)) {
            prioritySelect.createEl('option', {
                value: this.dataHandler.priority,
                text: `Priority ${this.dataHandler.priority}`
            });
        }

        if (this.dataHandler.priority) {
            prioritySelect.value = this.dataHandler.priority;
        }

        return prioritySelect;
    }

    private createDatePicker(container: HTMLElement): HTMLInputElement {
        const dateContainer = container.createDiv('dropdown-container');
        const dateInput = dateContainer.createEl('input', { type: 'date' });
        dateInput.addClass('modal-date-picker');

        if (this.dataHandler.dueDate) {
            dateInput.value = this.dataHandler.dueDate;
        }

        return dateInput;
    }

    private createButtons(container: HTMLElement): void {
        const buttonsContainer = container.createDiv('buttons-container');

        // Delete button for edit mode
        if (this.isEditMode && this.onDelete) {
            const deleteButton = buttonsContainer.createEl('button', { text: 'Delete' });
            deleteButton.addClass('delete-button');
            deleteButton.addEventListener('click', () => this.onDelete!());
        }

        // Cancel button for new tasks
        if (!this.isEditMode) {
            const cancelButton = buttonsContainer.createEl('button', { text: 'Cancel' });
            cancelButton.addClass('cancel-button');
            cancelButton.addEventListener('click', () => {
                if (this.onCancel) {
                    this.onCancel();
                }
            });
        }

        // Submit button
        const submitButton = buttonsContainer.createEl('button', {
            text: this.isEditMode ? 'Update' : 'Add'
        });
        submitButton.addClass('add-button');
        submitButton.addEventListener('click', this.onSubmit);
    }
}