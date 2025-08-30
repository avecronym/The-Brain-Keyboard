// Plugin settings interface
export interface TodoTxtSettings {
    todoFilePath: string;
    openOnStartup: boolean;
    sidebarCollapsed?: boolean;
    startupFilter: string;
    pinnedProjects?: { [filePath: string]: string[] };
    allKnownProjects?: { [filePath: string]: string[] };
    projectIcons?: { [filePath: string]: { [projectName: string]: string } };
}

// Default plugin settings
export const DEFAULT_SETTINGS: TodoTxtSettings = {
    todoFilePath: 'Todo.txt',
    openOnStartup: false,
    sidebarCollapsed: false,
    startupFilter: 'All',
    pinnedProjects: {}
}

// Custom view type identifier
export const VIEW_TYPE_TODO_TXT = 'todo-txt-view';

// Parsed todo item structure
export interface TodoItem {
    completed: boolean;
    priority: string;
    creationDate: string;
    completionDate: string;
    description: string;
    descriptionNotes?: string;
    projects: string[];
    contexts: string[];
    keyValuePairs: { [key: string]: string };
    raw: string;
}