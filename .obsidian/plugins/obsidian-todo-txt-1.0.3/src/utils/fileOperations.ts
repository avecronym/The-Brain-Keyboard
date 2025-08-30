import { App, TFile } from 'obsidian';
import { DEFAULT_SETTINGS } from '../types';

export class FileOperations {
    constructor(private app: App) { }

    // Get or create default file
    async getDefaultTodoFile(todoFilePath: string): Promise<TFile> {
        let path = todoFilePath.trim();
        if (!path) {
            path = DEFAULT_SETTINGS.todoFilePath;
        }

        let file = this.app.vault.getAbstractFileByPath(path);

        // Create if missing
        if (!file) {
            // Extract folder path
            const folderPath = path.substring(0, path.lastIndexOf('/'));

            // Create folder if path contains folders
            if (folderPath && folderPath !== path) {
                try {
                    await this.createFolderRecursive(folderPath);
                } catch (error) {
                    // Folder might already exist, continue
                }
            }

            // Create file
            await this.app.vault.create(path, '');
            file = this.app.vault.getAbstractFileByPath(path);
        }

        if (file instanceof TFile) {
            return file;
        } else {
            throw new Error('Failed to get or create default Todo.txt file');
        }
    }

    // Create folders recursively
    private async createFolderRecursive(folderPath: string): Promise<void> {
        const parts = folderPath.split('/');
        let currentPath = '';

        for (const part of parts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            if (!this.app.vault.getAbstractFileByPath(currentPath)) {
                await this.app.vault.createFolder(currentPath);
            }
        }
    }
}