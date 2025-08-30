import { TFile } from 'obsidian';
import { TodoTxtView } from '../view';

export class StateManager {
    // Restore view state from saved data
    async loadState(state: any, view: TodoTxtView): Promise<void> {
        const filterManager = view.getFilterManager();
        const projectManager = view.getProjectManager();

        // Restore filter settings
        filterManager.setState({
            sortOption: state.sortOption || 'priority',
            searchQuery: state.searchQuery || '',
            contextFilter: state.contextFilter || '',
            selectedProject: state.selectedProject || '',
            selectedTimeFilter: state.selectedTimeFilter || '',
            archivedFilter: state.archivedFilter || false,
            completedFilter: state.completedFilter || false
        });

        // Restore pinned projects
        if (state.pinnedProjects) {
            projectManager.pinnedProjects = [...(state.pinnedProjects || [])];
        }

        // Load file or default
        if (state.file) {
            const file = view.app.vault.getAbstractFileByPath(state.file);
            if (file instanceof TFile) {
                await view.leaf.openFile(file);
            } else {
                await view.loadDefaultFile();
            }
        } else {
            await view.loadDefaultFile();
        }
    }

    // Save current view state
    saveState(view: TodoTxtView): any {
        const file = view.getFile();
        const filterState = view.getFilterManager().getState();
        const pinnedProjects = [...view.getProjectManager().pinnedProjects];

        return {
            file: file?.path || null,
            ...filterState,
            pinnedProjects
        };
    }
}