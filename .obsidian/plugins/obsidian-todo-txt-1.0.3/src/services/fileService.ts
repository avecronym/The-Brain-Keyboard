import { TFile, Vault } from 'obsidian';
import { TodoItem } from '../types';

export class FileService {
    constructor(private vault: Vault) { }

    // Read file content
    async readFile(file: TFile): Promise<string> {
        return await this.vault.read(file);
    }

    // Write content to file
    async writeFile(file: TFile, content: string): Promise<void> {
        await this.vault.modify(file, content);
    }

    // Replace task line in file
    async updateTaskLine(file: TFile, originalItem: TodoItem, newLine: string): Promise<void> {
        const currentContent = await this.readFile(file);
        const lines = currentContent.split('\n');
        const updatedLines = lines.map(line =>
            line.trim() === originalItem.raw.trim() ? newLine : line
        );
        await this.writeFile(file, updatedLines.join('\n'));
    }

    // Remove task line from file
    async deleteTaskLine(file: TFile, item: TodoItem): Promise<void> {
        const currentContent = await this.readFile(file);
        const lines = currentContent.split('\n');
        const filteredLines = lines.filter(line => line.trim() !== item.raw.trim());
        await this.writeFile(file, filteredLines.join('\n'));
    }

    // Add new task line to file
    async prependTaskLine(file: TFile, taskLine: string): Promise<void> {
        const currentContent = await this.readFile(file);

        if (!currentContent.trim()) {
            await this.writeFile(file, taskLine);
            return;
        }

        const lines = currentContent.split('\n');
        const firstLine = lines[0].trim();

        // Extract dates from both lines
        const firstDate = this.extractCreationDate(firstLine);
        const newDate = this.extractCreationDate(taskLine);

        // Add line break if different dates
        const separator = (firstDate && newDate && firstDate !== newDate) ? '\n\n' : '\n';
        const newContent = `${taskLine}${separator}${currentContent}`;

        await this.writeFile(file, newContent);
    }

    // Extract date from task line
    private extractCreationDate(taskLine: string): string | null {
        let workingLine = taskLine.trim();

        // Skip priority if present
        if (workingLine.length >= 3 &&
            workingLine.charAt(0) === '(' &&
            workingLine.charAt(2) === ')' &&
            /[A-Z]/.test(workingLine.charAt(1))) {

            workingLine = workingLine.substring(3).trim();
        }

        // Extract date
        const dateMatch = workingLine.match(/^(\d{4}-\d{2}-\d{2})/);
        return dateMatch ? dateMatch[1] : null;
    }

    // Rename project in all tasks
    async replaceProjectName(file: TFile, oldName: string, newName: string): Promise<void> {
        const currentContent = await this.readFile(file);
        const lines = currentContent.split('\n');
        const updatedLines = lines.map(line => {
            if (line.includes(`+${oldName}`)) {
                return line.replace(new RegExp(`\\+${oldName}\\b`, 'g'), `+${newName}`);
            }
            return line;
        });
        await this.writeFile(file, updatedLines.join('\n'));
    }

    // Remove project from all tasks
    async removeProjectFromTasks(file: TFile, projectName: string): Promise<void> {
        const currentContent = await this.readFile(file);
        const lines = currentContent.split('\n');

        const updatedLines = lines.map(line => {
            // Skip empty lines
            if (!line.trim()) {
                return line;
            }

            // Check if line has project
            if (!line.includes(`+${projectName}`)) {
                return line;
            }

            // Check if task is completed
            const isCompleted = line.trim().startsWith('x ');

            if (isCompleted) {
                return line.replace(new RegExp(`\\s*\\+${projectName}\\b`, 'g'), '');
            } else {
                return null;
            }
        }).filter(line => line !== null);

        await this.writeFile(file, updatedLines.join('\n'));
    }
}