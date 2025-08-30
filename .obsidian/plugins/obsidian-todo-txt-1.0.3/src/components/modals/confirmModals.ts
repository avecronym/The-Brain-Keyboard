import { App, Modal, Setting } from 'obsidian';

export class DeleteTaskModal extends Modal {
    private taskDescription: string;
    private onConfirm: () => Promise<void>;

    constructor(app: App, taskDescription: string, onConfirm: () => Promise<void>) {
        super(app);
        this.modalEl.addClass('todo-del-mod');
        this.taskDescription = taskDescription;
        this.onConfirm = onConfirm;
    }

    // Create deletion confirmation UI
    onOpen() {
        const { contentEl } = this;
        this.titleEl.setText('Delete Task?');

        const messageEl = contentEl.createEl('p');
        // Clean task description for display
        const cleanTaskDescription = this.taskDescription
            .split(' ')
            .filter(word => {
                if (word.startsWith('+')) return false;
                if (word.includes(':')) return false;
                return word !== '';
            })
            .join(' ')
            .trim();

        // Build confirmation message
        messageEl.appendText('The "');
        const boldEl = messageEl.createEl('span', {
            text: cleanTaskDescription,
            cls: 'todo-delete-highlight'
        });
        messageEl.appendText('" task will be permanently deleted.');

        // Add action buttons
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Cancel')
                .onClick(() => this.close())
            )
            .addButton(btn => btn
                .setButtonText('Delete')
                .setWarning()
                .onClick(async () => {
                    await this.onConfirm();
                    this.close();
                })
            );
    }

    // Clean up modal
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export class DeleteProjectModal extends Modal {
    private projectName: string;
    private onConfirm: () => Promise<void>;

    constructor(app: App, projectName: string, onConfirm: () => Promise<void>) {
        super(app);
        this.modalEl.addClass('todo-del-mod');
        this.projectName = projectName;
        this.onConfirm = onConfirm;
    }

    // Create project deletion confirmation UI
    onOpen() {
        const { contentEl } = this;
        this.titleEl.setText('Delete Project?');

        const messageEl = contentEl.createEl('p');
        // Build warning message
        messageEl.appendText('The "');
        const boldEl = messageEl.createEl('span', {
            text: this.projectName.replace(/_/g, ' '),
            cls: 'todo-delete-highlight'
        });
        messageEl.appendText('" project and all of its tasks will be permanently deleted.');

        // Add action buttons
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Cancel')
                .onClick(() => this.close())
            )
            .addButton(btn => btn
                .setButtonText('Delete')
                .setWarning()
                .onClick(async () => {
                    await this.onConfirm();
                    this.close();
                })
            );
    }

    // Clean up modal
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export class DeleteAllCompletedTasksModal extends Modal {
    private taskCount: number;
    private onConfirm: () => Promise<void>;

    constructor(app: App, taskCount: number, onConfirm: () => Promise<void>) {
        super(app);
        this.modalEl.addClass('todo-del-mod');
        this.taskCount = taskCount;
        this.onConfirm = onConfirm;
    }

    // Create bulk deletion confirmation UI
    onOpen() {
        const { contentEl } = this;
        this.titleEl.setText('Delete All Completed Tasks?');

        const messageEl = contentEl.createEl('p');
        messageEl.setText(`Are you sure you want to permanently delete all ${this.taskCount} completed tasks?`);

        // Add action buttons
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Cancel')
                .onClick(() => this.close())
            )
            .addButton(btn => btn
                .setButtonText('Delete All')
                .setWarning()
                .onClick(async () => {
                    await this.onConfirm();
                    this.close();
                })
            );
    }

    // Clean up modal
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}