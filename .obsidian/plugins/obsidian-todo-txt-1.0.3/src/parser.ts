import { TodoItem } from './types';

export class TodoParser {
    // Parse entire todo file
    static parseTodoTxt(content: string): TodoItem[] {
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        return lines.map(line => this.parseTodoLine(line));
    }

    // Parse single todo line
    static parseTodoLine(line: string): TodoItem {
        const item: TodoItem = {
            completed: false,
            priority: '',
            creationDate: '',
            completionDate: '',
            description: '',
            projects: [],
            contexts: [],
            keyValuePairs: {},
            raw: line
        };

        let parts = line.trim().split(/\s+/);
        let index = 0;

        // Check completion status
        if (parts[index] === 'x') {
            item.completed = true;
            index++;
        }

        // Parse completion date
        if (parts[index] && /^\d{4}-\d{2}-\d{2}$/.test(parts[index]) && item.completed) {
            item.completionDate = parts[index];
            index++;
        }

        // Parse priority (A-Z)
        if (parts[index] && /^\([A-Z]\)$/.test(parts[index])) {
            item.priority = parts[index].slice(1, -1);
            index++;
        }

        // Parse creation date
        if (parts[index] && /^\d{4}-\d{2}-\d{2}$/.test(parts[index])) {
            item.creationDate = parts[index];
            index++;
        }

        let remainingLine = parts.slice(index).join(' ');

        // Extract description notes
        const descNotesMatch = remainingLine.match(/\|\|(.+)$/);
        if (descNotesMatch) {
            item.descriptionNotes = descNotesMatch[1].trim().replace(/\\n/g, '\n');
            remainingLine = remainingLine.replace(/\s*\|\|.+$/, '').trim();
        }

        item.description = remainingLine;

        const remainingParts = remainingLine.split(/\s+/).filter(part => part.length > 0);

        // Extract tags and metadata
        remainingParts.forEach(part => {
            if (part.startsWith('+') && part.length > 1) {
                // Project tags (+project)
                item.projects.push(part.slice(1));
            } else if (part.startsWith('@') && part.length > 1) {
                // Context tags (@context)
                item.contexts.push(part.slice(1));
            } else if (part.includes(':') && !part.includes(' ') && !part.startsWith('http')) {
                // Key:value pairs
                const [key, value] = part.split(':', 2);
                if (key && value) {
                    item.keyValuePairs[key] = value;
                }
            }
        });

        return item;
    }
}