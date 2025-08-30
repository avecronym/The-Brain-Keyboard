// === Attachment Organizer Plugin ===

const { Plugin, Notice, Modal, Setting, PluginSettingTab, TFile, TFolder } = require('obsidian');

const DEFAULT_SETTINGS = {
    attachmentFolder: 'attachments',
    attachmentExtensions: 'png,jpg,jpeg,gif,bmp,svg,mp3,wav,mp4,mov,pdf',
    confirmPurge: true,
    ignoreFolders: '',
    autoOrganizeMode: 'date', // 'none', 'date', 'type', 'tag', 'custom'
    customPattern: '{{type}}/{{year}}-{{month}}',
    // OCR Settings
    ocrEnabled: false,
    ocrApiKey: '',
    ocrModel: 'gemini-1.5-flash',
    ocrWatchFolder: 'assets/attachments',
    ocrOutputFolder: 'assets/attachments/ocr',
    ocrAutoProcess: true,
    ocrAutoProcessNewFiles: true,
    ocrAutoProcessModifiedFiles: true,
    ocrProcessedField: 'ocr-processed',
    ocrPrompt: 'Extract all text from this image/document. Provide the text content clearly and accurately.',
    ocrTemplate: '# OCR Result for {{filename}}\n\n**Source:** ![[{{filename}}]]\n**Processed:** {{date}}\n**Status:** {{status}}\n\n## Extracted Text\n\n{{content}}',
    ocrBatchSize: 1,
    ocrMaxFileSize: 10485760, // 10MB in bytes
    ocrForceReprocess: false,
};

class AttachmentOrganizerSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        // Settings container
        // Main Settings Section
        containerEl.createEl('h2', { text: 'Attachment Organizer Settings' });

         // Support & Links Section
         this.createAccordionSection(containerEl, 'Support & Links', () => {
            const supportContainer = containerEl.createDiv();
            supportContainer.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0;';
            
            const buyMeACoffeeBtn = supportContainer.createEl('a', { 
                text: '☕ Buy Me a Coffee',
                href: 'https://buymeacoffee.com/erinskidds'
            });
            buyMeACoffeeBtn.style.cssText = 'background: #FFDD00; color: #000; padding: 8px 12px; border-radius: 4px; text-decoration: none; font-size: 12px;';
            
            const githubBtn = supportContainer.createEl('a', { 
                text: '⭐ Star on GitHub',
                href: 'https://github.com/DudeThatsErin/FileCreator'
            });
            githubBtn.style.cssText = 'background: #24292e; color: #fff; padding: 8px 12px; border-radius: 4px; text-decoration: none; font-size: 12px;';
            
            const issuesBtn = supportContainer.createEl('a', { 
                text: '🐛 Report Issues',
                href: 'https://github.com/DudeThatsErin/FileCreator/issues'
            });
            issuesBtn.style.cssText = 'background: #d73a49; color: #fff; padding: 8px 12px; border-radius: 4px; text-decoration: none; font-size: 12px;';
            
            const discordBtn = supportContainer.createEl('a', { 
                text: '💬 Discord Support',
                href: 'https://discord.gg/your-discord-server'
            });
            discordBtn.style.cssText = 'background: #5865F2; color: #fff; padding: 8px 12px; border-radius: 4px; text-decoration: none; font-size: 12px;';
        });

        // Basic Attachment Settings
        this.createAccordionSection(containerEl, 'Basic Settings', () => {
            new Setting(containerEl)
                .setName('Attachment folder')
                .setDesc('The base folder where attachments will be organized')
                .addText(text => text
                    .setPlaceholder('attachments')
                    .setValue(this.plugin.settings.attachmentFolder)
                    .onChange(async (value) => {
                        this.plugin.settings.attachmentFolder = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Attachment extensions')
                .setDesc('Comma-separated list of file extensions considered as attachments')
                .addText(text => text
                    .setPlaceholder('png,jpg,jpeg,...')
                    .setValue(this.plugin.settings.attachmentExtensions)
                    .onChange(async (value) => {
                        this.plugin.settings.attachmentExtensions = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Ignore folders')
                .setDesc('Comma-separated list of folder paths to ignore when organizing or purging')
                .addTextArea(text => text
                    .setPlaceholder('folder1,folder2/subfolder')
                    .setValue(this.plugin.settings.ignoreFolders)
                    .onChange(async (value) => {
                        this.plugin.settings.ignoreFolders = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Confirm before purging')
                .setDesc('Show confirmation prompt before deleting unlinked attachments')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.confirmPurge)
                    .onChange(async (value) => {
                        this.plugin.settings.confirmPurge = value;
                        await this.plugin.saveSettings();
                    }));
        });

        // Organization Settings
        this.createAccordionSection(containerEl, 'Organization Settings', () => {
            new Setting(containerEl)
                .setName('Auto-organize mode')
                .setDesc('How attachments should be organized')
                .addDropdown(drop => drop
                    .addOption('none', 'None')
                    .addOption('date', 'By Date')
                    .addOption('type', 'By File Type')
                    .addOption('custom', 'Custom Pattern')
                    .setValue(this.plugin.settings.autoOrganizeMode)
                    .onChange(async (value) => {
                        this.plugin.settings.autoOrganizeMode = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            if (this.plugin.settings.autoOrganizeMode === 'custom') {
                new Setting(containerEl)
                    .setName('Custom folder pattern')
                    .setDesc('Use {{year}}, {{month}}, {{type}}, {{basename}} in folder structure')
                    .addText(text => text
                        .setPlaceholder('{{type}}/{{year}}-{{month}}')
                        .setValue(this.plugin.settings.customPattern)
                        .onChange(async (value) => {
                            this.plugin.settings.customPattern = value;
                            await this.plugin.saveSettings();
                        }));
            }
        });

        // OCR Settings
        this.createAccordionSection(containerEl, 'OCR Settings', () => {
            const ocrDesc = containerEl.createEl('p', { 
                text: 'Automatically extract text from images and PDFs using Google Gemini AI',
                cls: 'setting-item-description'
            });
            ocrDesc.style.marginBottom = '16px';
            ocrDesc.style.color = 'var(--text-muted)';
            ocrDesc.style.fontSize = '0.875em';

            new Setting(containerEl)
                .setName('Enable OCR')
                .setDesc('Enable automatic OCR processing of images and PDFs')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.ocrEnabled)
                    .onChange(async (value) => {
                        this.plugin.settings.ocrEnabled = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            if (this.plugin.settings.ocrEnabled) {
                new Setting(containerEl)
                    .setName('Gemini API Key')
                    .setDesc('Get your API key from Google AI Studio (https://makersuite.google.com/app/apikey)')
                    .addText(text => text
                        .setPlaceholder('AIza...')
                        .setValue(this.plugin.settings.ocrApiKey)
                        .onChange(async (value) => {
                            this.plugin.settings.ocrApiKey = value.trim();
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('Gemini Model')
                    .setDesc('The Gemini model to use for OCR')
                    .addDropdown(drop => drop
                        .addOption('gemini-1.5-flash', 'Gemini 1.5 Flash (Recommended)')
                        .addOption('gemini-1.5-pro', 'Gemini 1.5 Pro')
                        .setValue(this.plugin.settings.ocrModel)
                        .onChange(async (value) => {
                            this.plugin.settings.ocrModel = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('OCR Watch Folder')
                    .setDesc('Folder to monitor for images and PDFs to OCR')
                    .addText(text => text
                        .setPlaceholder('assets/attachments')
                        .setValue(this.plugin.settings.ocrWatchFolder)
                        .onChange(async (value) => {
                            this.plugin.settings.ocrWatchFolder = value.trim();
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('OCR Output Folder')
                    .setDesc('Where to save OCR notes (leave empty to use same folder as source)')
                    .addText(text => text
                        .setPlaceholder('assets/attachments/ocr')
                        .setValue(this.plugin.settings.ocrOutputFolder)
                        .onChange(async (value) => {
                            this.plugin.settings.ocrOutputFolder = value.trim();
                            await this.plugin.saveSettings();
                        }));
            }
        });

        // OCR Processing Settings
        if (this.plugin.settings.ocrEnabled) {
            this.createAccordionSection(containerEl, 'OCR Processing Settings', () => {
                new Setting(containerEl)
                    .setName('Batch Size')
                    .setDesc('Number of files to process in each batch (1 recommended for free tier)')
                    .addSlider(slider => slider
                        .setLimits(1, 5, 1)
                        .setValue(this.plugin.settings.ocrBatchSize)
                        .setDynamicTooltip()
                        .onChange(async (value) => {
                            this.plugin.settings.ocrBatchSize = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('Max File Size (MB)')
                    .setDesc('Maximum file size to process (larger files will be skipped)')
                    .addSlider(slider => slider
                        .setLimits(1, 50, 1)
                        .setValue(this.plugin.settings.ocrMaxFileSize / 1024 / 1024)
                        .setDynamicTooltip()
                        .onChange(async (value) => {
                            this.plugin.settings.ocrMaxFileSize = value * 1024 * 1024;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('Force Reprocess')
                    .setDesc('Always reprocess files even if OCR already exists (useful for testing)')
                    .addToggle(toggle => toggle
                        .setValue(this.plugin.settings.ocrForceReprocess)
                        .onChange(async (value) => {
                            this.plugin.settings.ocrForceReprocess = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('Auto-process new files')
                    .setDesc('Automatically OCR new images and PDFs added to the watch folder')
                    .addToggle(toggle => toggle
                        .setValue(this.plugin.settings.ocrAutoProcessNewFiles)
                        .onChange(async (value) => {
                            this.plugin.settings.ocrAutoProcessNewFiles = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('Auto-process modified files')
                    .setDesc('Automatically OCR files when they are modified or updated')
                    .addToggle(toggle => toggle
                        .setValue(this.plugin.settings.ocrAutoProcessModifiedFiles)
                        .onChange(async (value) => {
                            this.plugin.settings.ocrAutoProcessModifiedFiles = value;
                            await this.plugin.saveSettings();
                        }));

                new Setting(containerEl)
                    .setName('OCR Processed Field')
                    .setDesc('YAML frontmatter field name to mark files as processed')
                    .addText(text => text
                        .setPlaceholder('ocr-processed')
                        .setValue(this.plugin.settings.ocrProcessedField)
                        .onChange(async (value) => {
                            this.plugin.settings.ocrProcessedField = value;
                            await this.plugin.saveSettings();
                        }));
            });

            // OCR Templates Section
            this.createAccordionSection(containerEl, 'OCR Templates', () => {
                const ocrPromptSetting = new Setting(containerEl)
                    .setName('OCR Prompt')
                    .setDesc('Custom prompt to send to Gemini for OCR processing')
                    .setClass('setting-item-heading');
                
                ocrPromptSetting.settingEl.style.display = 'block';
                const promptTextArea = ocrPromptSetting.settingEl.createEl('textarea');
                promptTextArea.placeholder = 'Extract all text from this image/document...';
                promptTextArea.value = this.plugin.settings.ocrPrompt;
                promptTextArea.rows = 4;
                promptTextArea.style.width = '100%';
                promptTextArea.style.minHeight = '80px';
                promptTextArea.style.marginTop = '8px';
                promptTextArea.addEventListener('input', async (e) => {
                    this.plugin.settings.ocrPrompt = e.target.value;
                    await this.plugin.saveSettings();
                });

                const ocrTemplateSetting = new Setting(containerEl)
                    .setName('OCR Output Template')
                    .setDesc('Template for OCR output notes. Available variables: {{filename}}, {{date}}, {{status}}, {{content}}')
                    .setClass('setting-item-heading');
                
                ocrTemplateSetting.settingEl.style.display = 'block';
                const templateTextArea = ocrTemplateSetting.settingEl.createEl('textarea');
                templateTextArea.placeholder = '# OCR Result for {{filename}}...';
                templateTextArea.value = this.plugin.settings.ocrTemplate;
                templateTextArea.rows = 6;
                templateTextArea.style.width = '100%';
                templateTextArea.style.minHeight = '120px';
                templateTextArea.style.marginTop = '8px';
                templateTextArea.addEventListener('input', async (e) => {
                    this.plugin.settings.ocrTemplate = e.target.value;
                    await this.plugin.saveSettings();
                });
            });
        }
    }

    createAccordionSection(containerEl, title, contentCallback) {
        const accordionContainer = containerEl.createDiv('accordion-section');
        
        const header = accordionContainer.createDiv('accordion-header');
        header.style.cssText = `
            cursor: pointer;
            padding: 12px 16px;
            background: var(--background-modifier-border);
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            margin: 16px 0 8px 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-weight: 600;
            transition: background-color 0.2s ease;
        `;
        
        const headerText = header.createSpan();
        headerText.textContent = title;
        
        const arrow = header.createSpan('accordion-arrow');
        arrow.textContent = '▼';
        arrow.style.cssText = `
            transition: transform 0.2s ease;
            font-size: 12px;
        `;
        
        const content = accordionContainer.createDiv('accordion-content');
        content.style.cssText = `
            border-left: 1px solid var(--background-modifier-border);
            border-right: 1px solid var(--background-modifier-border);
            border-bottom: 1px solid var(--background-modifier-border);
            border-radius: 0 0 6px 6px;
            margin-bottom: 16px;
            padding: 16px;
            max-height: 1000px;
            overflow: hidden;
            transition: max-height 0.3s ease, padding 0.3s ease;
        `;
        
        let isExpanded = true; // Start expanded
        
        const toggleAccordion = () => {
            isExpanded = !isExpanded;
            
            if (isExpanded) {
                content.style.maxHeight = '1000px';
                content.style.padding = '16px';
                arrow.style.transform = 'rotate(0deg)';
                header.style.borderRadius = '6px 6px 0 0';
            } else {
                content.style.maxHeight = '0';
                content.style.padding = '0 16px';
                arrow.style.transform = 'rotate(-90deg)';
                header.style.borderRadius = '6px';
            }
        };
        
        header.addEventListener('click', toggleAccordion);
        
        // Add hover effect
        header.addEventListener('mouseenter', () => {
            header.style.backgroundColor = 'var(--background-modifier-hover)';
        });
        
        header.addEventListener('mouseleave', () => {
            header.style.backgroundColor = 'var(--background-modifier-border)';
        });
        
        // Call the content callback to populate the accordion
        const tempContainer = containerEl.createDiv();
        const originalContainerEl = containerEl;
        
        // Temporarily redirect new Settings to our temp container
        const originalCreateEl = containerEl.createEl;
        containerEl.createEl = tempContainer.createEl.bind(tempContainer);
        
        contentCallback();
        
        // Restore original createEl
        containerEl.createEl = originalCreateEl;
        
        // Move the settings that were just added to the accordion content
        while (tempContainer.firstChild) {
            content.appendChild(tempContainer.firstChild);
        }
        
        // Remove the temp container
        tempContainer.remove();
    }
}

class MoveAttachmentsModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.sourceFolder = '';
        this.targetFolder = '';
        this.selectedExtensions = [];
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Move Attachments Between Folders' });

        // Source folder selection
        const sourceSetting = contentEl.createDiv('setting-item');
        sourceSetting.createEl('div', { text: 'Source Folder', cls: 'setting-item-name' });
        const sourceInput = sourceSetting.createEl('input', { 
            type: 'text', 
            placeholder: 'Enter source folder path (e.g., assets/old)',
            cls: 'setting-item-control'
        });
        sourceInput.style.width = '100%';
        sourceInput.addEventListener('input', (e) => {
            this.sourceFolder = e.target.value;
        });

        // Target folder selection
        const targetSetting = contentEl.createDiv('setting-item');
        targetSetting.createEl('div', { text: 'Target Folder', cls: 'setting-item-name' });
        const targetInput = targetSetting.createEl('input', { 
            type: 'text', 
            placeholder: 'Enter target folder path (e.g., assets/new)',
            cls: 'setting-item-control'
        });
        targetInput.style.width = '100%';
        targetInput.addEventListener('input', (e) => {
            this.targetFolder = e.target.value;
        });

        // File type filter
        const filterSetting = contentEl.createDiv('setting-item');
        filterSetting.createEl('div', { text: 'File Types to Move', cls: 'setting-item-name' });
        const filterInput = filterSetting.createEl('input', { 
            type: 'text', 
            placeholder: 'png,jpg,pdf (leave empty for all attachment types)',
            cls: 'setting-item-control'
        });
        filterInput.style.width = '100%';
        filterInput.addEventListener('input', (e) => {
            this.selectedExtensions = e.target.value.split(',').map(ext => ext.trim().toLowerCase()).filter(ext => ext);
        });

        // Preview section
        const previewSection = contentEl.createDiv();
        previewSection.style.marginTop = '20px';
        const previewButton = previewSection.createEl('button', { text: 'Preview Files to Move' });
        previewButton.style.marginRight = '10px';
        
        const previewResults = previewSection.createDiv();
        previewResults.style.marginTop = '10px';
        previewResults.style.maxHeight = '200px';
        previewResults.style.overflowY = 'auto';
        previewResults.style.border = '1px solid var(--background-modifier-border)';
        previewResults.style.padding = '10px';
        previewResults.style.display = 'none';

        previewButton.addEventListener('click', () => {
            this.previewMove(previewResults);
        });

        // Action buttons
        const buttonContainer = contentEl.createDiv();
        buttonContainer.style.marginTop = '20px';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';

        const moveButton = buttonContainer.createEl('button', { text: 'Move Files' });
        moveButton.style.backgroundColor = 'var(--interactive-accent)';
        moveButton.style.color = 'var(--text-on-accent)';

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });

        moveButton.addEventListener('click', () => {
            this.performMove();
        });

        cancelButton.addEventListener('click', () => {
            this.close();
        });
    }

    async previewMove(previewResults) {
        if (!this.sourceFolder) {
            previewResults.textContent = 'Please specify a source folder';
            previewResults.style.display = 'block';
            return;
        }

        const files = this.app.vault.getFiles();
        const attachmentExtensions = this.plugin.settings.attachmentExtensions.split(',').map(ext => ext.trim().toLowerCase());
        
        // Filter files by source folder and extension
        const filesToMove = files.filter(file => {
            // Check if file is in source folder
            if (!file.path.startsWith(this.sourceFolder + '/')) {
                return false;
            }
            
            // Check if file is an attachment
            if (!attachmentExtensions.includes(file.extension?.toLowerCase())) {
                return false;
            }
            
            // Check if file matches selected extensions (if any)
            if (this.selectedExtensions.length > 0 && !this.selectedExtensions.includes(file.extension?.toLowerCase())) {
                return false;
            }
            
            return true;
        });

        if (filesToMove.length === 0) {
            previewResults.textContent = 'No files found to move';
        } else {
            const fileList = filesToMove.map(file => `• ${file.path}`).join('\n');
            previewResults.textContent = `Found ${filesToMove.length} files to move:\n\n${fileList}`;
        }
        
        previewResults.style.display = 'block';
    }

    async performMove() {
        if (!this.sourceFolder || !this.targetFolder) {
            new Notice('Please specify both source and target folders');
            return;
        }

        if (this.sourceFolder === this.targetFolder) {
            new Notice('Source and target folders cannot be the same');
            return;
        }

        const files = this.app.vault.getFiles();
        const attachmentExtensions = this.plugin.settings.attachmentExtensions.split(',').map(ext => ext.trim().toLowerCase());
        
        // Filter files to move
        const filesToMove = files.filter(file => {
            if (!file.path.startsWith(this.sourceFolder + '/')) {
                return false;
            }
            
            if (!attachmentExtensions.includes(file.extension?.toLowerCase())) {
                return false;
            }
            
            if (this.selectedExtensions.length > 0 && !this.selectedExtensions.includes(file.extension?.toLowerCase())) {
                return false;
            }
            
            return true;
        });

        if (filesToMove.length === 0) {
            new Notice('No files found to move');
            return;
        }

        // Confirm the move
        const confirmed = confirm(`Are you sure you want to move ${filesToMove.length} files from "${this.sourceFolder}" to "${this.targetFolder}"?`);
        if (!confirmed) {
            return;
        }

        // Ensure target folder exists
        try {
            await this.plugin.ensureFolderExists(this.targetFolder);
        } catch (error) {
            new Notice(`Error creating target folder: ${error.message}`);
            return;
        }

        let moved = 0;
        let failed = 0;

        for (const file of filesToMove) {
            try {
                const relativePath = file.path.substring(this.sourceFolder.length + 1);
                const newPath = `${this.targetFolder}/${relativePath}`;
                
                // Ensure subdirectories exist in target
                const newDir = newPath.substring(0, newPath.lastIndexOf('/'));
                if (newDir !== this.targetFolder) {
                    await this.plugin.ensureFolderExists(newDir);
                }
                
                await this.app.vault.rename(file, newPath);
                moved++;
            } catch (error) {
                console.error(`Failed to move ${file.path}:`, error);
                failed++;
            }
        }

        new Notice(`Moved ${moved} files successfully${failed > 0 ? `, ${failed} failed` : ''}`);
        this.close();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class PurgeConfirmationModal extends Modal {
    constructor(app, plugin, resolve) {
        super(app);
        this.plugin = plugin;
        this.resolve = resolve;
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('purge-confirmation-modal');
        
        // Add custom styles
        const style = contentEl.createEl('style');
        style.textContent = `
            .purge-confirmation-modal {
                padding: 24px;
                max-width: 500px;
            }
            .purge-modal-header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
                color: var(--text-error);
            }
            .purge-modal-icon {
                font-size: 24px;
                margin-right: 12px;
            }
            .purge-modal-title {
                font-size: 18px;
                font-weight: 600;
                margin: 0;
            }
            .purge-modal-content {
                margin-bottom: 24px;
                line-height: 1.5;
            }
            .purge-modal-warning {
                background: rgba(220, 38, 127, 0.1);
                border: 1px solid var(--text-error);
                border-radius: 6px;
                padding: 12px;
                margin: 16px 0;
                color: var(--text-normal);
                font-weight: 500;
            }
            .purge-modal-stats {
                background: var(--background-secondary);
                border-radius: 6px;
                padding: 16px;
                margin: 16px 0;
                border: 1px solid var(--background-modifier-border);
            }
            .purge-modal-buttons {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }
            .purge-modal-button {
                padding: 8px 16px;
                border-radius: 4px;
                border: none;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            .purge-modal-button-cancel {
                background: var(--interactive-normal);
                color: var(--text-normal);
            }
            .purge-modal-button-cancel:hover {
                background: var(--interactive-hover);
            }
            .purge-modal-button-confirm {
                background: var(--text-error);
                color: var(--text-on-accent);
            }
            .purge-modal-button-confirm:hover {
                background: var(--text-error);
                opacity: 0.8;
            }
        `;

        // Get unlinked attachments count
        const unlinkedCount = await this.getUnlinkedAttachmentsCount();

        // Header
        const header = contentEl.createDiv('purge-modal-header');
        header.createSpan('purge-modal-icon').textContent = '⚠️';
        header.createEl('h2', { text: 'Confirm Purge Unlinked Attachments', cls: 'purge-modal-title' });

        // Content
        const content = contentEl.createDiv('purge-modal-content');
        content.style.cssText = `
            margin-bottom: 24px;
            line-height: 1.5;
            color: var(--text-normal);
            font-size: 14px;
        `;
        content.createEl('p', { text: 'You are about to permanently delete all unlinked attachments from your vault.' });

        // Warning box
        const warning = contentEl.createDiv('purge-modal-warning');
        warning.style.cssText = `
            background: rgba(220, 38, 127, 0.15);
            border: 2px solid #dc267f;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            color: var(--text-normal);
            font-weight: 600;
            font-size: 14px;
        `;
        warning.innerHTML = '🚨 <strong style="color: #dc267f;">This action cannot be undone!</strong> All deleted files will be permanently removed from your system.';

        // Stats
        const stats = contentEl.createDiv('purge-modal-stats');
        stats.style.cssText = `
            background: var(--background-secondary);
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            border: 1px solid var(--background-modifier-border);
            color: var(--text-normal);
            font-size: 14px;
            font-weight: 500;
        `;
        stats.createEl('div', { text: `📊 Attachments to be deleted: ${unlinkedCount}` });
        if (unlinkedCount === 0) {
            stats.createEl('div', { text: '✅ No unlinked attachments found.' });
        }

        // Additional info
        const infoP = content.createEl('p', { text: 'This will scan all markdown files in your vault and delete any attachment files that are not referenced.' });
        infoP.style.color = 'var(--text-normal)';

        // Buttons
        const buttons = contentEl.createDiv('purge-modal-buttons');
        
        const cancelButton = buttons.createEl('button', { 
            text: 'Cancel', 
            cls: 'purge-modal-button purge-modal-button-cancel' 
        });
        
        const confirmButton = buttons.createEl('button', { 
            text: `Delete ${unlinkedCount} Files`, 
            cls: 'purge-modal-button purge-modal-button-confirm' 
        });

        if (unlinkedCount === 0) {
            confirmButton.textContent = 'Nothing to Delete';
            confirmButton.disabled = true;
            confirmButton.style.opacity = '0.5';
        }

        cancelButton.addEventListener('click', () => {
            this.resolve(false);
            this.close();
        });

        confirmButton.addEventListener('click', () => {
            this.resolve(true);
            this.close();
        });
    }

    async getUnlinkedAttachmentsCount() {
        const files = this.app.vault.getFiles();
        const attachmentExtensions = this.plugin.settings.attachmentExtensions.split(',').map(ext => ext.trim().toLowerCase());
        const attachments = files.filter(file => attachmentExtensions.includes(file.extension?.toLowerCase()));
        
        const ignoreFolders = this.plugin.settings.ignoreFolders.split(',').map(f => f.trim()).filter(f => f);
        const filteredAttachments = attachments.filter(file => {
            return !ignoreFolders.some(folder => file.path.startsWith(folder + '/'));
        });
        
        const linkedAttachments = new Set();
        const markdownFiles = files.filter(file => file.extension === 'md');

        for (const mdFile of markdownFiles) {
            try {
                const content = await this.app.vault.read(mdFile);
                const linkRegex = /\[\[([^\]\|]+)(\|[^\]]*)?\]\]|!\[\[([^\]\|]+)(\|[^\]]*)?\]\]|!\[([^\]]*)\]\(([^\)]+)\)/g;
                let match;
                
                while ((match = linkRegex.exec(content)) !== null) {
                    const linkedFile = match[1] || match[3] || match[6];
                    if (linkedFile) {
                        const resolvedFile = this.app.metadataCache.getFirstLinkpathDest(linkedFile, mdFile.path);
                        if (resolvedFile) {
                            linkedAttachments.add(resolvedFile.path);
                        }
                    }
                }
            } catch (error) {
                console.error(`Error reading file ${mdFile.path}:`, error);
            }
        }

        const unlinkedAttachments = filteredAttachments.filter(file => !linkedAttachments.has(file.path));
        return unlinkedAttachments.length;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

module.exports = class AttachmentOrganizer extends Plugin {
    async onload() {
        console.log('Loading Attachment Organizer plugin');
        
        // Initialize processing tracking
        this.processingFiles = new Set();
        this.processedFiles = new Set();
        this.fileWatchers = []; // Track active watchers for cleanup
        this.ocrStopRequested = false; // Flag to stop OCR processing
        
        await this.loadSettings();

        this.addSettingTab(new AttachmentOrganizerSettingTab(this.app, this));

        // Set up file watchers for automatic OCR processing with recursion prevention
        this.setupFileWatchers();

        this.addCommand({
            id: 'organize-attachments',
            name: 'Organize attachments',
            callback: () => this.organizeAttachments()
        });

        this.addCommand({
            id: 'find-unlinked-attachments',
            name: 'Find unlinked attachments',
            callback: () => this.findUnlinkedAttachments()
        });

        this.addCommand({
            id: 'purge-unlinked-attachments',
            name: 'Purge unlinked attachments',
            callback: () => this.purgeUnlinkedAttachments()
        });

        this.addCommand({
            id: 'move-attachments-between-folders',
            name: 'Move attachments between folders',
            callback: () => this.moveAttachmentsBetweenFolders()
        });

        // OCR Commands
        this.addCommand({
            id: 'ocr-watch-folder',
            name: 'OCR: Process watch folder',
            callback: () => this.ocrWatchFolder()
        });

        this.addCommand({
            id: 'ocr-reprocess-all',
            name: 'OCR: Reprocess all files (force update)',
            callback: () => this.ocrReprocessAll()
        });

        this.addCommand({
            id: 'ocr-current-file',
            name: 'OCR: Process current file',
            checkCallback: (checking) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile && this.isOcrTarget(activeFile)) {
                    if (!checking) {
                        this.processFileForOcr(activeFile);
                    }
                    return true;
                }
                return false;
            }
        });

        this.addCommand({
            id: 'ocr-stop-processing',
            name: 'OCR: Stop processing',
            callback: () => this.stopOcrProcessing()
        });

    }

    onunload() {
        console.log('Unloading Attachment Organizer plugin');
    }

    async organizeAttachments() {
        const files = this.app.vault.getFiles();
        const attachmentExtensions = this.settings.attachmentExtensions.split(',').map(ext => ext.trim().toLowerCase());
        
        let organized = 0;
        let skipped = 0;

        for (const file of files) {
            if (!attachmentExtensions.includes(file.extension?.toLowerCase())) {
                continue;
            }

            // Skip if file is already in attachment folder or ignored folders
            if (file.path.startsWith(this.settings.attachmentFolder + '/')) {
                continue;
            }

            const ignoreFolders = this.settings.ignoreFolders.split(',').map(f => f.trim()).filter(f => f);
            if (ignoreFolders.some(folder => file.path.startsWith(folder + '/'))) {
                skipped++;
                continue;
            }

            try {
                const newPath = this.getNewAttachmentPath(file);
                if (newPath !== file.path) {
                    await this.ensureFolderExists(newPath.substring(0, newPath.lastIndexOf('/')));
                    await this.app.vault.rename(file, newPath);
                    organized++;
                }
            } catch (error) {
                console.error(`Failed to organize ${file.path}:`, error);
                skipped++;
            }
        }

        new Notice(`Organized ${organized} attachments, skipped ${skipped}`);
    }

    getNewAttachmentPath(file) {
        let targetFolder = this.settings.attachmentFolder;

        if (this.settings.autoOrganizeMode === 'date') {
            const date = new Date(file.stat?.mtime || Date.now());
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            targetFolder = `${this.settings.attachmentFolder}/${year}/${month}`;
        } else if (this.settings.autoOrganizeMode === 'type') {
            const ext = file.extension?.toLowerCase() || 'unknown';
            targetFolder = `${this.settings.attachmentFolder}/${ext}`;
        } else if (this.settings.autoOrganizeMode === 'custom' && this.settings.customPattern) {
            const date = new Date(file.stat?.mtime || Date.now());
            const replacements = {
                '{{type}}': file.extension?.toLowerCase() || 'unknown',
                '{{year}}': date.getFullYear().toString(),
                '{{month}}': String(date.getMonth() + 1).padStart(2, '0'),
                '{{day}}': String(date.getDate()).padStart(2, '0'),
                '{{filename}}': file.basename
            };
            
            targetFolder = this.settings.customPattern;
            for (const [placeholder, value] of Object.entries(replacements)) {
                targetFolder = targetFolder.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
            }
        }

        return `${targetFolder}/${file.name}`;
    }

    async findUnlinkedAttachments() {
        const files = this.app.vault.getFiles();
        const attachmentExtensions = this.settings.attachmentExtensions.split(',').map(ext => ext.trim().toLowerCase());
        const attachments = files.filter(file => attachmentExtensions.includes(file.extension?.toLowerCase()));
        
        // Skip files in ignored folders
        const ignoreFolders = this.settings.ignoreFolders.split(',').map(f => f.trim()).filter(f => f);
        const filteredAttachments = attachments.filter(file => {
            return !ignoreFolders.some(folder => file.path.startsWith(folder + '/'));
        });
        
        const linkedAttachments = new Set();
        const markdownFiles = files.filter(file => file.extension === 'md');

        for (const mdFile of markdownFiles) {
            try {
                const content = await this.app.vault.read(mdFile);
                // Enhanced regex to catch more link formats
                const linkRegex = /\[\[([^\]\|]+)(\|[^\]]*)?\]\]|!\[\[([^\]\|]+)(\|[^\]]*)?\]\]|!\[([^\]]*)\]\(([^\)]+)\)/g;
                let match;
                
                while ((match = linkRegex.exec(content)) !== null) {
                    const linkedFile = match[1] || match[3] || match[6];
                    if (linkedFile) {
                        const resolvedFile = this.app.metadataCache.getFirstLinkpathDest(linkedFile, mdFile.path);
                        if (resolvedFile) {
                            linkedAttachments.add(resolvedFile.path);
                        }
                    }
                }
            } catch (error) {
                console.error(`Error reading file ${mdFile.path}:`, error);
            }
        }

        const unlinkedAttachments = filteredAttachments.filter(file => !linkedAttachments.has(file.path));
        
        if (unlinkedAttachments.length === 0) {
            new Notice('No unlinked attachments found');
            return;
        }

        // Create the report content
        const list = unlinkedAttachments.map(file => `- [[${file.path}]]`).join('\n');
        const reportContent = `# Unlinked Attachments Report\n\nFound ${unlinkedAttachments.length} unlinked attachments:\n\n${list}\n\n---\n\n**Total attachments scanned:** ${filteredAttachments.length}\n**Linked attachments:** ${linkedAttachments.size}\n**Unlinked attachments:** ${unlinkedAttachments.length}\n\n*Generated on: ${new Date().toLocaleString()}*`;
        
        // Create or update the report file
        const reportPath = 'Unlinked Attachments Report.md';
        try {
            const existingFile = this.app.vault.getAbstractFileByPath(reportPath);
            if (existingFile instanceof TFile) {
                await this.app.vault.modify(existingFile, reportContent);
            } else {
                await this.app.vault.create(reportPath, reportContent);
            }
            
            // Open the report
            const reportFile = this.app.vault.getAbstractFileByPath(reportPath);
            if (reportFile instanceof TFile) {
                await this.app.workspace.getLeaf().openFile(reportFile);
            }
            
            new Notice(`Found ${unlinkedAttachments.length} unlinked attachments. Report created.`);
        } catch (error) {
            console.error('Error creating unlinked attachments report:', error);
            new Notice('Error creating report. Check console for details.');
        }
    }

    async purgeUnlinkedAttachments() {
        if (!this.settings.confirmPurge) {
            new Notice('Purge confirmation is disabled in settings');
            return;
        }

        // Use styled confirmation modal
        const confirmed = await this.showPurgeConfirmationModal();
        if (!confirmed) {
            return;
        }

        const files = this.app.vault.getFiles();
        const attachmentExtensions = this.settings.attachmentExtensions.split(',').map(ext => ext.trim().toLowerCase());
        const attachments = files.filter(file => attachmentExtensions.includes(file.extension?.toLowerCase()));
        
        const linkedAttachments = new Set();
        const markdownFiles = files.filter(file => file.extension === 'md');

        for (const mdFile of markdownFiles) {
            const content = await this.app.vault.read(mdFile);
            const linkRegex = /\[\[([^\]]+)\]\]|!\[\[([^\]]+)\]\]/g;
            let match;
            
            while ((match = linkRegex.exec(content)) !== null) {
                const linkedFile = match[1] || match[2];
                const resolvedFile = this.app.metadataCache.getFirstLinkpathDest(linkedFile, mdFile.path);
                if (resolvedFile) {
                    linkedAttachments.add(resolvedFile.path);
                }
            }
        }

        const unlinkedAttachments = attachments.filter(file => !linkedAttachments.has(file.path));
        
        let deleted = 0;
        for (const file of unlinkedAttachments) {
            try {
                await this.app.vault.delete(file);
                deleted++;
            } catch (error) {
                console.error(`Failed to delete ${file.path}:`, error);
            }
        }

        new Notice(`Deleted ${deleted} unlinked attachments`);
    }

    async moveAttachmentsBetweenFolders() {
        new MoveAttachmentsModal(this.app, this).open();
    }

    async showPurgeConfirmationModal() {
        return new Promise((resolve) => {
            new PurgeConfirmationModal(this.app, this, resolve).open();
        });
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async ensureFolderExists(folder) {
        const existingFile = this.app.vault.getAbstractFileByPath(folder);
        if (!existingFile) {
            await this.app.vault.createFolder(folder);
        } else if (!(existingFile instanceof TFolder)) {
            throw new Error(`Path exists but is not a folder: ${folder}`);
        }
    }

    // OCR Helper Functions
    isOcrTarget(file) {
        if (!file || !file.extension) return false;
        const ext = file.extension.toLowerCase();
        return ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'tiff', 'gif', 'bmp', 'heic', 'heif'].includes(ext);
    }

    getMimeType(extension) {
        const ext = extension.toLowerCase();
        if (ext === 'pdf') return 'application/pdf';
        if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext)) {
            return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        }
        if (['tif', 'tiff'].includes(ext)) return 'image/tiff';
        if (['heic', 'heif'].includes(ext)) return 'image/heic';
        return null;
    }

    getOcrNotePath(sourceFile, outputFolder) {
        const baseName = sourceFile.basename;
        const folder = outputFolder || sourceFile.parent?.path || '';
        return `${folder}/${baseName} (OCR).md`;
    }

    buildOcrNote(sourceFile, extractedText, status = 'completed') {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];
        
        const template = this.settings.ocrTemplate || '# OCR Result for {{filename}}\n\n**Source:** ![[{{filename}}]]\n**Processed:** {{date}}\n**Status:** {{status}}\n\n## Extracted Text\n\n{{content}}';
        
        // Replace template variables
        const result = template
            .replace(/\{\{filename\}\}/g, sourceFile.name)
            .replace(/\{\{date\}\}/g, now.toISOString())
            .replace(/\{\{status\}\}/g, status)
            .replace(/\{\{content\}\}/g, extractedText);
        
        return result;
    }

    async callGeminiOCR(fileBuffer, mimeType, retryCount = 0) {
        const apiKey = this.settings.ocrApiKey;
        const model = this.settings.ocrModel;
        const prompt = this.settings.ocrPrompt || 'Extract all text from this image/document. Provide the text content clearly and accurately.';
        
        if (!apiKey) {
            throw new Error('Gemini API key not configured');
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        // Convert ArrayBuffer to base64 string properly (avoid stack overflow for large files)
        const uint8Array = new Uint8Array(fileBuffer);
        let binaryString = '';
        for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
        }
        const base64String = btoa(binaryString);
        
        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: prompt
                    },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64String
                        }
                    }
                ]
            }]
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini API Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    responseText: errorText,
                    url: url,
                    apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'missing',
                    model: model,
                    retryCount: retryCount
                });
                
                if (response.status === 429) {
                    // Parse retry delay from error response
                    let retryDelay = 30; // Default 30 seconds
                    try {
                        const errorData = JSON.parse(errorText);
                        if (errorData.error?.details) {
                            const retryInfo = errorData.error.details.find(d => d['@type']?.includes('RetryInfo'));
                            if (retryInfo?.retryDelay) {
                                retryDelay = parseInt(retryInfo.retryDelay.replace('s', '')) || 30;
                            }
                        }
                    } catch (e) {
                        // Ignore parsing errors, use default delay
                    }

                    // Implement exponential backoff with max 3 retries
                    if (retryCount < 3) {
                        const backoffDelay = Math.min(retryDelay * Math.pow(2, retryCount), 300); // Max 5 minutes
                        new Notice(`Rate limit hit. Retrying in ${backoffDelay} seconds... (attempt ${retryCount + 1}/3)`);
                        
                        await new Promise(resolve => setTimeout(resolve, backoffDelay * 1000));
                        return await this.callGeminiOCR(fileBuffer, mimeType, retryCount + 1);
                    } else {
                        new Notice('Gemini API quota exceeded. Try again later or switch to gemini-1.5-flash model.');
                        throw new Error(`API_ERROR_429: Rate limit exceeded after ${retryCount} retries. ${errorText}`);
                    }
                }
                throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            
            if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
                throw new Error('Invalid response from Gemini API');
            }

            return result.candidates[0].content.parts[0].text.trim();
        } catch (error) {
            if (error.message.includes('API_ERROR_429')) {
                throw error; // Re-throw 429 errors as-is
            }
            throw new Error(`Network or API error: ${error.message}`);
        }
    }

    async processFileForOcr(file) {
        if (!this.settings.ocrEnabled || !this.settings.ocrApiKey) {
            return;
        }

        try {
            // Check if file is in watch folder
            if (!file.path.startsWith(this.settings.ocrWatchFolder + '/') && file.path !== this.settings.ocrWatchFolder) {
                return;
            }

            // Check if it's a target file type
            if (!this.isOcrTarget(file)) {
                return;
            }

            // Check if OCR note already exists
            const ocrPath = this.getOcrNotePath(file, this.settings.ocrOutputFolder);
            if (await this.app.vault.adapter.exists(ocrPath)) {
                return;
            }

            new Notice(`Starting OCR for ${file.name}...`);

            // Ensure output folder exists
            if (this.settings.ocrOutputFolder) {
                await this.ensureFolderExists(this.settings.ocrOutputFolder);
            }

            // Process with Gemini
            const fileBuffer = await this.app.vault.readBinary(file);
            const mimeType = this.getMimeType(file.extension);
            const extractedText = await this.callGeminiOCR(fileBuffer, mimeType);
            
            // Create OCR note
            const noteContent = this.buildOcrNote(file, extractedText, this.settings.ocrProcessedField);
            await this.app.vault.create(ocrPath, noteContent);

            new Notice(`OCR completed for ${file.name}`);
        } catch (error) {
            console.error('OCR processing error:', error);
            new Notice(`OCR failed for ${file.name}: ${error.message}`);
        }
    }

    async ocrWatchFolder() {
        if (!this.settings.ocrEnabled || !this.settings.ocrApiKey) {
            new Notice('OCR is not enabled or API key is missing');
            return;
        }

        // Reset stop flag
        this.ocrStopRequested = false;

        const watchFolder = this.settings.ocrWatchFolder;
        let files = this.app.vault.getFiles().filter(f => 
            (f.path.startsWith(watchFolder + '/') || f.path === watchFolder) && 
            this.isOcrTarget(f)
        );

        if (files.length === 0) {
            new Notice('No images or PDFs found in watch folder');
            return;
        }

        // Filter files by size and existing OCR status
        const validFiles = [];
        for (const file of files) {
            const stat = await this.app.vault.adapter.stat(file.path);
            if (stat.size > this.settings.ocrMaxFileSize) {
                console.warn(`Skipping ${file.name}: file too large (${(stat.size / 1024 / 1024).toFixed(2)}MB)`);
                continue;
            }

            const ocrPath = this.getOcrNotePath(file, this.settings.ocrOutputFolder);
            const ocrExists = await this.app.vault.adapter.exists(ocrPath);
            
            if (!ocrExists || this.settings.ocrForceReprocess) {
                // Check if file was modified after OCR
                if (ocrExists && !this.settings.ocrForceReprocess) {
                    const ocrStat = await this.app.vault.adapter.stat(ocrPath);
                    if (stat.mtime <= ocrStat.mtime) {
                        continue; // OCR is newer than source file
                    }
                }
                validFiles.push({ file, size: stat.size });
            }
        }

        if (validFiles.length === 0) {
            new Notice('No files need OCR processing');
            return;
        }

        // Sort by file size (smallest first for better batching)
        validFiles.sort((a, b) => a.size - b.size);

        new Notice(`Processing ${validFiles.length} files for OCR in batches...`);
        let processed = 0;
        let failed = 0;

        // Process in batches
        const batchSize = this.settings.ocrBatchSize;
        for (let i = 0; i < validFiles.length; i += batchSize) {
            // Check if stop was requested
            if (this.ocrStopRequested) {
                new Notice(`OCR processing stopped by user. Processed: ${processed}, Failed: ${failed}`);
                return;
            }

            const batch = validFiles.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(validFiles.length / batchSize);
            
            new Notice(`Processing batch ${batchNum}/${totalBatches} (${batch.length} files)...`);

            for (const { file } of batch) {
                // Check if stop was requested before processing each file
                if (this.ocrStopRequested) {
                    new Notice(`OCR processing stopped by user. Processed: ${processed}, Failed: ${failed}`);
                    return;
                }

                try {
                    await this.processFileForOcr(file);
                    processed++;
                } catch (error) {
                    console.error(`Failed to process ${file.name}:`, error);
                    failed++;
                    
                    // Stop entire batch processing on quota exceeded
                    if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('API_ERROR_429')) {
                        new Notice(`OCR batch stopped due to quota limit. Processed: ${processed}, Failed: ${failed}`);
                        return;
                    }
                }
            }

            // Longer delay between batches to avoid API rate limits
            if (i + batchSize < validFiles.length) {
                await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
            }
        }

        new Notice(`OCR batch complete: ${processed} processed, ${failed} failed`);
    }

    async ocrReprocessAll() {
        if (!this.settings.ocrEnabled || !this.settings.ocrApiKey) {
            new Notice('OCR is not enabled or API key is missing');
            return;
        }

        // Temporarily enable force reprocess
        const originalForceReprocess = this.settings.ocrForceReprocess;
        this.settings.ocrForceReprocess = true;

        try {
            await this.ocrWatchFolder();
        } finally {
            // Restore original setting
            this.settings.ocrForceReprocess = originalForceReprocess;
        }
    }

    setupFileWatchers() {
        if (!this.settings.ocrEnabled) {
            return;
        }

        // Watch for file creation with recursion prevention
        this.registerEvent(
            this.app.vault.on('create', (file) => {
                if (this.settings.ocrAutoProcessNewFiles && this.isOcrTarget(file) && !this.isOcrOutputFile(file)) {
                    this.handleFileCreated(file);
                }
            })
        );

        // Watch for file modification with recursion prevention
        this.registerEvent(
            this.app.vault.on('modify', (file) => {
                if (this.settings.ocrAutoProcessModifiedFiles && this.isOcrTarget(file) && !this.isOcrOutputFile(file)) {
                    this.handleFileModified(file);
                }
            })
        );
    }

    // Prevent processing OCR output files to avoid infinite recursion
    isOcrOutputFile(file) {
        if (!file || !file.name) return false;
        
        // Check if file is in OCR output folder
        if (this.settings.ocrOutputFolder && file.path.startsWith(this.settings.ocrOutputFolder + '/')) {
            return true;
        }
        
        // Check if file name indicates it's an OCR output
        return file.name.includes('(OCR)') || file.name.includes('OCR Result');
    }

    async handleFileCreated(file) {
        const watchFolder = this.settings.ocrWatchFolder;
        
        // Prevent re-entry for files already being processed
        if (this.processingFiles.has(file.path)) {
            console.log(`Skipping ${file.name}: already being processed`);
            return;
        }
        
        // Check if file is in watch folder
        if (!file.path.startsWith(watchFolder + '/') && file.path !== watchFolder) {
            return;
        }

        // Check file size
        try {
            const stat = await this.app.vault.adapter.stat(file.path);
            if (stat.size > this.settings.ocrMaxFileSize) {
                console.warn(`Skipping new file ${file.name}: too large (${(stat.size / 1024 / 1024).toFixed(2)}MB)`);
                return;
            }
        } catch (error) {
            console.error(`Failed to get file stats for ${file.name}:`, error);
            return;
        }

        // Add to processing set to prevent re-entry
        this.processingFiles.add(file.path);

        // Small delay to ensure file is fully written
        setTimeout(async () => {
            try {
                await this.processFileForOcr(file);
            } catch (error) {
                console.error(`Auto-OCR failed for new file ${file.name}:`, error);
            } finally {
                // Always remove from processing set
                this.processingFiles.delete(file.path);
            }
        }, 1000);
    }

    async handleFileModified(file) {
        const watchFolder = this.settings.ocrWatchFolder;
        
        // Prevent re-entry for files already being processed
        if (this.processingFiles.has(file.path)) {
            console.log(`Skipping ${file.name}: already being processed`);
            return;
        }
        
        // Check if file is in watch folder
        if (!file.path.startsWith(watchFolder + '/') && file.path !== watchFolder) {
            return;
        }

        // Check if OCR note exists
        const ocrPath = this.getOcrNotePath(file, this.settings.ocrOutputFolder);
        const ocrExists = await this.app.vault.adapter.exists(ocrPath);
        
        if (!ocrExists) {
            return; // No existing OCR to update
        }

        try {
            // Check if source file is newer than OCR note
            const fileStat = await this.app.vault.adapter.stat(file.path);
            const ocrStat = await this.app.vault.adapter.stat(ocrPath);
            
            if (fileStat.mtime <= ocrStat.mtime) {
                return; // OCR is already up to date
            }

            // Check file size
            if (fileStat.size > this.settings.ocrMaxFileSize) {
                console.warn(`Skipping modified file ${file.name}: too large (${(fileStat.size / 1024 / 1024).toFixed(2)}MB)`);
                return;
            }
        } catch (error) {
            console.error(`Failed to check file stats for ${file.name}:`, error);
            return;
        }

        // Add to processing set to prevent re-entry
        this.processingFiles.add(file.path);

        // Small delay to ensure file modifications are complete
        setTimeout(async () => {
            try {
                new Notice(`Updating OCR for modified file: ${file.name}`);
                await this.processFileForOcr(file);
            } catch (error) {
                console.error(`Auto-OCR update failed for ${file.name}:`, error);
            } finally {
                // Always remove from processing set
                this.processingFiles.delete(file.path);
            }
        }, 2000);
    }

    stopOcrProcessing() {
        this.ocrStopRequested = true;
        new Notice('OCR processing will stop after current file completes...');
    }

    onunload() {
        console.log('Unloading Attachment Organizer plugin');
        
        // Stop any ongoing OCR processing
        this.ocrStopRequested = true;
        
        // Clear all processing sets to stop any pending operations
        this.processingFiles.clear();
        this.processedFiles.clear();
        
        // Remove any active file watchers
        if (this.fileWatchers) {
            this.fileWatchers.forEach(watcher => {
                if (watcher && typeof watcher.unregister === 'function') {
                    watcher.unregister();
                }
            });
            this.fileWatchers = [];
        }
    }
};
