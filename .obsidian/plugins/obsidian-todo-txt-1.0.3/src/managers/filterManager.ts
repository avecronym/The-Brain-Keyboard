import { TodoItem } from '../types';

// Filter state configuration
export interface FilterState {
    sortOption: string;
    searchQuery: string;
    contextFilter: string;
    selectedProject: string;
    selectedTimeFilter: string;
    archivedFilter: boolean;
    completedFilter: boolean;
}

export class FilterManager {
    // Current filter settings
    private state: FilterState = {
        sortOption: 'priority',
        searchQuery: '',
        contextFilter: '',
        selectedProject: '',
        selectedTimeFilter: '',
        archivedFilter: false,
        completedFilter: false
    };

    private availableContexts: string[] = [];
    private availableProjects: string[] = [];

    public onFilterChange: () => void = () => { };

    // Get current filter state
    getState(): FilterState {
        return { ...this.state };
    }

    // Update filter state
    setState(state: Partial<FilterState>): void {
        this.state = { ...this.state, ...state };
        this.onFilterChange();
    }

    // Set available contexts list
    setAvailableContexts(contexts: string[]): void {
        this.availableContexts = contexts;
    }

    // Set available projects list
    setAvailableProjects(projects: string[]): void {
        this.availableProjects = projects;
    }

    getAvailableContexts(): string[] {
        return this.availableContexts;
    }

    getAvailableProjects(): string[] {
        return this.availableProjects;
    }

    // Change sort option
    setSortOption(sortOption: string): void {
        this.state.sortOption = sortOption;
        this.onFilterChange();
    }

    // Update search query
    setSearchQuery(query: string): void {
        this.state.searchQuery = query;
        this.onFilterChange();
    }

    // Filter by context
    setContextFilter(context: string): void {
        this.state.contextFilter = context;
        this.onFilterChange();
    }

    // Filter by project and reset others
    setProjectFilter(project: string): void {
        this.state.selectedProject = project;
        this.state.selectedTimeFilter = '';
        this.state.archivedFilter = false;
        this.state.completedFilter = false;
        this.state.contextFilter = '';
        this.state.sortOption = 'priority';
        this.onFilterChange();
    }

    // Filter by time and reset others
    setTimeFilter(filter: string): void {
        this.state.selectedTimeFilter = filter;
        this.state.selectedProject = '';
        this.state.archivedFilter = false;
        this.state.completedFilter = false;
        this.state.contextFilter = '';
        this.state.sortOption = 'priority';
        this.onFilterChange();
    }

    // Apply special filters
    setSpecialFilter(filter: string): void {
        if (filter === 'archived') {
            this.state.archivedFilter = true;
            this.state.completedFilter = false;
            this.state.sortOption = 'priority';
        } else if (filter === 'completed') {
            this.state.completedFilter = true;
            this.state.archivedFilter = false;
            this.state.sortOption = 'completion';
        } else {
            this.state.archivedFilter = false;
            this.state.completedFilter = false;
            this.state.sortOption = 'priority';
        }
        this.state.selectedProject = '';
        this.state.selectedTimeFilter = '';
        this.state.contextFilter = '';
        this.onFilterChange();
    }

    // Apply preset filter by name
    setQuickFilter(filter: string): void {
        switch (filter.toLowerCase()) {
            case 'all':
                this.setState({
                    selectedProject: '',
                    selectedTimeFilter: '',
                    archivedFilter: false,
                    completedFilter: false
                });
                break;
            case 'inbox':
                this.setProjectFilter('Inbox');
                break;
            case 'today':
                this.setTimeFilter('today');
                break;
            case 'upcoming':
                this.setTimeFilter('upcoming');
                break;
            case 'archived':
                this.setSpecialFilter('archived');
                break;
            case 'completed':
                this.setSpecialFilter('completed');
                break;
            default:
                this.setProjectFilter(filter);
                break;
        }
    }

    getSelectedProject(): string {
        return this.state.selectedProject;
    }

    // Get default project for new tasks
    getDefaultProject(): string | undefined {
        if (this.state.archivedFilter) return 'Archived';
        return this.state.selectedProject || undefined;
    }

    // Get default due date for new tasks
    getDefaultDueDate(): string | undefined {
        if (this.state.selectedTimeFilter === 'today') {
            return new Date().toISOString().split('T')[0];
        }
        return undefined;
    }

    // Filter and sort tasks
    applyFilters(items: TodoItem[]): TodoItem[] {
        let filteredItems = [...items];

        // Filter by completion status
        if (this.state.completedFilter) {
            filteredItems = filteredItems.filter(item => item.completed);
        } else if (this.state.archivedFilter) {
            filteredItems = filteredItems.filter(item => item.projects.includes('Archived'));
        } else {
            filteredItems = filteredItems.filter(item => !item.completed && !item.projects.includes('Archived'));
        }

        // Filter by time range
        if (this.state.selectedTimeFilter && !this.state.archivedFilter && !this.state.completedFilter) {
            filteredItems = filteredItems.filter(item => this.isTaskInTimeFilter(item));
        }

        // Filter by search text
        if (this.state.searchQuery.trim()) {
            const query = this.state.searchQuery.toLowerCase();
            filteredItems = filteredItems.filter(item =>
                item.description.toLowerCase().includes(query) ||
                item.projects.some(p => p.toLowerCase().includes(query)) ||
                item.contexts.some(c => c.toLowerCase().includes(query))
            );
        }

        // Filter by context
        if (this.state.contextFilter.trim()) {
            if (this.state.contextFilter === 'NONE') {
                filteredItems = filteredItems.filter(item => item.contexts.length === 0);
            } else {
                filteredItems = filteredItems.filter(item =>
                    item.contexts.includes(this.state.contextFilter)
                );
            }
        }

        // Filter by project
        if (this.state.selectedProject.trim() && !this.state.archivedFilter) {
            if (this.state.selectedProject === 'Inbox') {
                filteredItems = filteredItems.filter(item =>
                    item.projects.length === 0 || item.projects.includes('Inbox')
                );
            } else {
                filteredItems = filteredItems.filter(item =>
                    item.projects.includes(this.state.selectedProject)
                );
            }
        }

        this.sortTasks(filteredItems);

        return filteredItems;
    }

    // Check if task matches time filter
    private isTaskInTimeFilter(item: TodoItem): boolean {
        const dueMatch = item.description.match(/due:(\d{4}-\d{2}-\d{2})/);
        if (!dueMatch) return false;

        const today = new Date().toISOString().split('T')[0];
        const dueDate = dueMatch[1];

        if (this.state.selectedTimeFilter === 'today') {
            return dueDate <= today;
        } else if (this.state.selectedTimeFilter === 'upcoming') {
            return dueDate > today;
        }

        return true;
    }

    // Sort tasks by selected criteria
    private sortTasks(tasks: TodoItem[]): void {
        tasks.sort((a, b) => {
            // Completed tasks go last
            const aCompleted = a.completed ? 1 : 0;
            const bCompleted = b.completed ? 1 : 0;
            if (aCompleted !== bCompleted) {
                return aCompleted - bCompleted;
            }

            switch (this.state.sortOption) {
                case 'priority': {
                    const aPri = a.priority || 'Z';
                    const bPri = b.priority || 'Z';
                    return aPri.localeCompare(bPri);
                }
                case 'creation': {
                    const dateA = a.creationDate || '0000-00-00';
                    const dateB = b.creationDate || '0000-00-00';
                    return dateB.localeCompare(dateA);
                }
                case 'completion': {
                    const dateA = a.completionDate || '0000-00-00';
                    const dateB = b.completionDate || '0000-00-00';
                    return dateB.localeCompare(dateA);
                }
                case 'alphabetical': {
                    return a.description.localeCompare(b.description);
                }
                case 'projects': {
                    const projectA = a.projects.length > 0 ? a.projects[0] : 'zzz';
                    const projectB = b.projects.length > 0 ? b.projects[0] : 'zzz';
                    return projectA.localeCompare(projectB);
                }
                case 'contexts': {
                    const contextA = a.contexts.length > 0 ? a.contexts[0] : 'zzz';
                    const contextB = b.contexts.length > 0 ? b.contexts[0] : 'zzz';
                    return contextA.localeCompare(contextB);
                }
                case 'duedate': {
                    // Extract due date or use far future
                    const getDueDate = (item: TodoItem): string => {
                        const dueMatch = item.description.match(/due:(\d{4}-\d{2}-\d{2})/);
                        return dueMatch ? dueMatch[1] : '9999-99-99';
                    };
                    return getDueDate(a).localeCompare(getDueDate(b));
                }
                default:
                    return 0;
            }
        });
    }

    // Get contexts for current filter state
    getContextsForCurrentFilters(items: TodoItem[]): string[] {
        let filteredItems = [...items];

        // Apply same filters as main filter
        if (this.state.completedFilter) {
            filteredItems = filteredItems.filter(item => item.completed);
        } else if (this.state.archivedFilter) {
            filteredItems = filteredItems.filter(item => item.projects.includes('Archived'));
        } else {
            filteredItems = filteredItems.filter(item => !item.completed && !item.projects.includes('Archived'));
        }

        if (this.state.selectedTimeFilter && !this.state.archivedFilter && !this.state.completedFilter) {
            filteredItems = filteredItems.filter(item => this.isTaskInTimeFilter(item));
        }

        if (this.state.searchQuery.trim()) {
            const query = this.state.searchQuery.toLowerCase();
            filteredItems = filteredItems.filter(item =>
                item.description.toLowerCase().includes(query) ||
                item.projects.some(p => p.toLowerCase().includes(query)) ||
                item.contexts.some(c => c.toLowerCase().includes(query))
            );
        }

        if (this.state.selectedProject.trim() && !this.state.archivedFilter) {
            if (this.state.selectedProject === 'Inbox') {
                filteredItems = filteredItems.filter(item =>
                    item.projects.length === 0 || item.projects.includes('Inbox')
                );
            } else {
                filteredItems = filteredItems.filter(item =>
                    item.projects.includes(this.state.selectedProject)
                );
            }
        }

        // Collect unique contexts
        const contexts = new Set<string>();
        filteredItems.forEach(item => {
            item.contexts.forEach(c => contexts.add(c));
        });

        return Array.from(contexts).sort();
    }
}