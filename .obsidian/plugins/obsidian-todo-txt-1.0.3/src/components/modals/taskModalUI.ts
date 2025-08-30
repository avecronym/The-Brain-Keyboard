import { TodoItem } from '../../types';
import { TaskDataHandler } from './taskDataHandler';
import { TaskModalElements } from './taskModalElements';

export class TaskModalUI {
    private contentEl: HTMLElement;
    private isEditMode: boolean;
    private dataHandler: TaskDataHandler;
    private onSubmit: () => void;
    private onDelete?: () => void;
    private onCancel?: () => void;

    // UI element builder
    private elements: TaskModalElements;

    // UI element references
    private taskDescriptionInput: HTMLTextAreaElement | null = null;
    private priorityDropdown: HTMLSelectElement | null = null;
    private projectDropdown: HTMLSelectElement | null = null;
    private datePicker: HTMLInputElement | null = null;
    private taskDescriptionNotes: HTMLTextAreaElement | null = null;

    constructor(
        contentEl: HTMLElement,
        isEditMode: boolean,
        dataHandler: TaskDataHandler,
        onSubmit: () => void,
        onDelete?: () => void,
        onCancel?: () => void
    ) {
        this.contentEl = contentEl;
        this.isEditMode = isEditMode;
        this.dataHandler = dataHandler;
        this.onSubmit = onSubmit;
        this.onDelete = onDelete;
        this.onCancel = onCancel;

        this.elements = new TaskModalElements(
            isEditMode,
            dataHandler,
            onSubmit,
            onDelete,
            onCancel
        );
    }

    // Create complete modal UI
    render(): void {
        this.contentEl.empty();

        const {
            taskInput,
            descriptionInput,
            projectDropdown,
            priorityDropdown,
            datePicker
        } = this.elements.createModalElements(this.contentEl);

        this.taskDescriptionInput = taskInput;
        this.taskDescriptionNotes = descriptionInput;
        this.projectDropdown = projectDropdown;
        this.priorityDropdown = priorityDropdown;
        this.datePicker = datePicker;
    }

    // Set up task description change handler
    onTaskDescriptionChange(handler: (value: string, cursorPosition: number) => void): void {
        this.taskDescriptionInput?.addEventListener('input', (e) => {
            const target = e.target as HTMLTextAreaElement;
            handler(target.value, target.selectionStart || 0);
        });
    }

    // Set up key down handler
    onKeyDown(handler: (e: KeyboardEvent) => void): void {
        this.taskDescriptionInput?.addEventListener('keydown', handler);
    }

    // Set up key up handler
    onKeyUp(handler: (e: KeyboardEvent) => void): void {
        this.taskDescriptionInput?.addEventListener('keyup', handler);
    }

    // Set up project change handler
    onProjectChange(handler: (value: string) => void): void {
        this.projectDropdown?.addEventListener('change', (e) => {
            handler((e.target as HTMLSelectElement).value);
        });
    }

    // Set up priority change handler
    onPriorityChange(handler: (value: string) => void): void {
        this.priorityDropdown?.addEventListener('change', (e) => {
            handler((e.target as HTMLSelectElement).value);
            // Remove placeholder option
            const defaultOption = this.priorityDropdown?.querySelector('.default-option');
            if (defaultOption) {
                defaultOption.remove();
            }
        });
    }

    // Set up date change handler
    onDateChange(handler: (value: string) => void): void {
        this.datePicker?.addEventListener('change', (e) => {
            handler((e.target as HTMLInputElement).value);
        });
    }

    // Set up notes change handler
    onTaskDescriptionNotesChange(handler: (value: string) => void): void {
        this.taskDescriptionNotes?.addEventListener('input', (e) => {
            handler((e.target as HTMLTextAreaElement).value);
        });
    }

    // Update priority dropdown selection
    updatePriority(priority: string): void {
        if (this.priorityDropdown) {
            // Remove placeholder
            const defaultOption = this.priorityDropdown.querySelector('.default-option');
            if (defaultOption) {
                defaultOption.remove();
            }

            // Add custom priority option if needed
            if (!['A', 'B', 'C', ''].includes(priority)) {
                const existing = this.priorityDropdown.querySelector(`option[value="${priority}"]`);
                if (!existing) {
                    const customOption = this.priorityDropdown.createEl('option', {
                        value: priority,
                        text: `Priority ${priority}`
                    });
                    const noneOption = this.priorityDropdown.querySelector('option[value=""]');
                    if (noneOption) {
                        this.priorityDropdown.insertBefore(customOption, noneOption);
                    }
                }
            }

            this.priorityDropdown.value = priority;
        }

        // Update input text
        if (this.taskDescriptionInput) {
            this.taskDescriptionInput.value = this.dataHandler.taskDescription;
        }
    }

    // Update project dropdown selection
    updateProject(project: string): void {
        if (this.projectDropdown) {
            this.projectDropdown.value = project;
        }
    }

    // Update date picker value
    updateDueDate(date: string): void {
        if (this.datePicker) {
            this.datePicker.value = date;
        }
    }

    // Insert context at cursor position
    insertContextAtPosition(context: string, atPosition: number): void {
        this.insertTextAtPosition(context, atPosition, '@');
    }

    // Insert text at specific position in input
    insertTextAtPosition(text: string, symbolPosition: number, symbol: string): void {
        if (!this.taskDescriptionInput) return;

        const input = this.taskDescriptionInput;
        const value = input.value;
        const cursorPosition = input.selectionStart || 0;

        const beforeSymbol = value.substring(0, symbolPosition);
        const afterCursor = value.substring(cursorPosition);

        // Build new value with inserted text
        const newValue = beforeSymbol + symbol + text + ' ' + afterCursor;
        input.value = newValue;

        // Position cursor after inserted text
        const newCursorPosition = symbolPosition + symbol.length + text.length + 1;
        input.setSelectionRange(newCursorPosition, newCursorPosition);
        input.focus();

        this.dataHandler.taskDescription = input.value;
    }

    // Focus main input field
    focusInput(): void {
        this.taskDescriptionInput?.focus();
    }

    getTaskDescription(): string {
        return this.taskDescriptionInput?.value || '';
    }

    getTaskDescriptionNotes(): string {
        return this.taskDescriptionNotes?.value || '';
    }

    getTaskInputElement(): HTMLTextAreaElement | null {
        return this.taskDescriptionInput;
    }

    // Notes keydown handler  
    onTaskDescriptionNotesKeyDown(handler: (e: KeyboardEvent) => void): void {
        this.taskDescriptionNotes?.addEventListener('keydown', handler);
    }

    // Notes keyup handler  
    onTaskDescriptionNotesKeyUp(handler: (e: KeyboardEvent) => void): void {
        this.taskDescriptionNotes?.addEventListener('keyup', handler);
    }

    // Notes input change with cursor position
    onTaskDescriptionNotesInputChange(handler: (value: string, cursorPosition: number) => void): void {
        this.taskDescriptionNotes?.addEventListener('input', (e) => {
            const target = e.target as HTMLTextAreaElement;
            handler(target.value, target.selectionStart || 0);
        });
    }

    getTaskNotesInputElement(): HTMLTextAreaElement | null {
        return this.taskDescriptionNotes;
    }
}