import { App, Modal, Setting } from 'obsidian';

export class AddProjectModal extends Modal {
    // Form state
    private projectName: string = '';
    private projectIcon: string = '';
    private onSubmit: ((projectName: string, icon?: string) => void) | ((oldName: string, newName: string, icon?: string) => Promise<void>);
    private isEditMode: boolean;
    private originalProjectName: string = '';
    private originalProjectIcon: string = '';
    private inputEl: HTMLInputElement | null = null;
    private iconInputEl: HTMLInputElement | null = null;

    constructor(
        app: App,
        onSubmit: ((projectName: string, icon?: string) => void) | ((oldName: string, newName: string, icon?: string) => Promise<void>),
        editingProjectName?: string,
        currentIcon?: string
    ) {
        super(app);
        this.modalEl.addClass('todo-project-mod');
        this.onSubmit = onSubmit;
        this.isEditMode = !!editingProjectName;

        // Set up edit mode data
        if (editingProjectName) {
            this.originalProjectName = editingProjectName;
            this.projectName = editingProjectName.replace(/_/g, ' ');
        }

        if (currentIcon !== undefined) {
            this.originalProjectIcon = currentIcon;
            this.projectIcon = currentIcon;
        }
    }

    // Extract first icon from input
    private parseFirstIcon(input: string): string {
        const trimmed = input.trim();
        if (!trimmed) return '';

        // Handle SVG icons
        if (trimmed.includes('<svg')) {
            const svgMatch = trimmed.match(/<svg[^>]*>[\s\S]*?<\/svg>/i);
            return svgMatch ? svgMatch[0] : '';
        }

        // Handle emoji icons
        const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(\u200D(\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*/u;
        const emojiMatch = trimmed.match(emojiRegex);

        if (emojiMatch) {
            return emojiMatch[0];
        }

        // Use first character as fallback
        return trimmed.charAt(0);
    }

    // Create modal UI
    onOpen() {
        const { contentEl } = this;
        this.titleEl.setText(this.isEditMode ? 'Edit Project' : 'Add Project');

        // Project name input
        new Setting(contentEl)
            .setName('Name')
            .addText(text => {
                this.inputEl = text.inputEl;
                text.setPlaceholder('My Project')
                    .setValue(this.projectName)
                    .onChange(value => {
                        this.projectName = value;
                    });

                // Submit on Enter
                text.inputEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.submit();
                    }
                });
            });

        // Project icon input
        new Setting(contentEl)
            .setName('Icon')
            .addText(text => {
                this.iconInputEl = text.inputEl;
                text.setPlaceholder('Emoji or SVG code')
                    .setValue(this.projectIcon)
                    .onChange(value => {
                        this.projectIcon = value;
                    });

                // Submit on Enter
                text.inputEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.submit();
                    }
                });
            });

        // Action buttons
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Cancel')
                .onClick(() => this.close()))
            .addButton(btn => btn
                .setButtonText(this.isEditMode ? 'Update' : 'Add')
                .setCta()
                .onClick(() => this.submit()));

        // Focus name input
        setTimeout(() => {
            if (this.inputEl) {
                this.inputEl.focus();
                if (this.isEditMode) {
                    this.inputEl.select();
                }
            }
        }, 0);
    }

    // Submit form data
    private async submit() {
        const trimmedName = this.projectName.trim();
        if (!trimmedName) return;

        // Format name with underscores
        const formattedProjectName = trimmedName.replace(/\s+/g, '_');
        const iconValue = this.parseFirstIcon(this.projectIcon);

        if (this.isEditMode) {
            // Only update if changed
            if (formattedProjectName !== this.originalProjectName || iconValue !== this.originalProjectIcon) {
                await (this.onSubmit as (oldName: string, newName: string, icon?: string) => Promise<void>)(
                    this.originalProjectName,
                    formattedProjectName,
                    iconValue
                );
            }
        } else {
            // Create new project
            (this.onSubmit as (projectName: string, icon?: string) => void)(formattedProjectName, iconValue);
        }

        this.close();
    }

    // Clean up modal
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}