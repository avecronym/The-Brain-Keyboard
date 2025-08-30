import { FilterManager } from '../../managers/filterManager';
import { TaskManager } from '../../managers/taskManager';
import { ProjectManager } from '../../managers/projectManager';
import { Icons, createSVGElement } from '../../utils/icons';

export class TaskControls {
    // UI element references
    private searchInputEl: HTMLInputElement | null = null;
    private contextFilterEl: HTMLSelectElement | null = null;
    private sortOptionsVisible: boolean = false;

    constructor(
        private filterManager: FilterManager,
        private taskManager: TaskManager,
        private projectManager: ProjectManager,
        private onSearchChange: (query: string) => void,
        private onSortChange: (sortOption: string) => void,
        private onContextFilterChange: (context: string) => void,
        private completedFilter: boolean = false
    ) { }

    // Render all task controls
    render(container: HTMLElement, searchQuery: string, sortOption: string, contextFilter: string, completedFilter: boolean): void {
        this.completedFilter = completedFilter;
        const controlsContainer = container.createDiv('todo-controls');

        const searchWrapper = controlsContainer.createDiv('search-sort-wrapper');

        this.renderSearchInput(searchWrapper, searchQuery);
        this.renderSortToggle(searchWrapper);

        // Sort options panel
        const sortOptionsWrapper = controlsContainer.createDiv('sort-options-wrapper');
        if (this.sortOptionsVisible) {
            sortOptionsWrapper.addClass('visible');
        }

        this.renderSortDropdown(sortOptionsWrapper, sortOption, completedFilter);
        this.renderContextFilter(sortOptionsWrapper, contextFilter);

        this.renderAddTaskButton(controlsContainer);
    }

    // Render search input with clear button
    private renderSearchInput(container: HTMLElement, searchQuery: string): void {
        const searchContainer = container.createDiv('search-container');

        const searchIcon = searchContainer.createSpan('search-icon');
        const searchSvg = createSVGElement(Icons.search);
        searchIcon.appendChild(searchSvg);

        const searchInput = searchContainer.createEl('input', {
            type: 'text',
            placeholder: 'Search',
            value: searchQuery,
            cls: 'search-input'
        });

        this.searchInputEl = searchInput;

        const clearBtn = searchContainer.createEl('button', {
            title: 'Clear search',
            cls: 'clear-search-btn'
        });

        const clearSvg = createSVGElement(Icons.clear);
        clearBtn.appendChild(clearSvg);

        // Show clear button only when text exists
        const updateClearButtonVisibility = () => {
            if (searchInput.value.trim() === '') {
                clearBtn.addClass('hidden');
            } else {
                clearBtn.removeClass('hidden');
            }
        };

        updateClearButtonVisibility();

        // Handle search input
        searchInput.addEventListener('input', (e) => {
            e.stopPropagation();
            updateClearButtonVisibility();
            this.onSearchChange((e.target as HTMLInputElement).value);
        });

        searchInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Handle clear button
        clearBtn.addEventListener('click', () => {
            if (this.searchInputEl) {
                this.searchInputEl.value = '';
                this.searchInputEl.focus();
            }
            updateClearButtonVisibility();
            this.onSearchChange('');
        });
    }

    // Render sort options toggle button
    private renderSortToggle(container: HTMLElement): void {
        const sortToggleBtn = container.createDiv('sort-toggle-btn');
        const sortSvg = createSVGElement(Icons.sort);
        sortToggleBtn.appendChild(sortSvg);
        sortToggleBtn.setAttribute('title', 'Sort options');

        // Sort options visibility
        sortToggleBtn.addEventListener('click', () => {
            this.sortOptionsVisible = !this.sortOptionsVisible;
            const sortOptionsWrapper = container.parentElement?.querySelector('.sort-options-wrapper');
            if (sortOptionsWrapper) {
                sortOptionsWrapper.classList.toggle('visible', this.sortOptionsVisible);
            }
        });
    }

    // Render sort dropdown menu
    private renderSortDropdown(container: HTMLElement, sortOption: string, completedFilter: boolean): void {
        const sortContainer = container.createDiv('sort-container');
        sortContainer.createSpan('sort-label').setText('Sort by:');

        const sortSelect = sortContainer.createEl('select', { cls: 'sort-select' });

        // Base sort options
        const sortOptions = [
            { value: 'priority', text: 'Priority' },
            { value: 'duedate', text: 'Due Date' },
            { value: 'projects', text: 'Projects' },
            { value: 'contexts', text: 'Contexts' },
            { value: 'alphabetical', text: 'Alphabetical' },
            { value: 'creation', text: 'Creation Date' }
        ];

        // Add completion date for completed tasks
        if (completedFilter) {
            sortOptions.push({ value: 'completion', text: 'Completion Date' });
        }

        // Populate dropdown
        sortOptions.forEach(option => {
            const optionEl = sortSelect.createEl('option', {
                value: option.value,
                text: option.text
            });
            if (option.value === sortOption) {
                optionEl.selected = true;
            }
        });

        sortSelect.addEventListener('change', (e) => {
            this.onSortChange((e.target as HTMLSelectElement).value);
        });
    }

    // Render context filter dropdown
    private renderContextFilter(container: HTMLElement, contextFilter: string): void {
        const contextContainer = container.createDiv('context-filter-container');
        contextContainer.createSpan('context-filter-label').setText('Context:');

        const contextSelect = contextContainer.createEl('select', { cls: 'context-filter-select' });
        this.contextFilterEl = contextSelect;

        // All contexts option
        const allOption = contextSelect.createEl('option', { value: '', text: 'All' });
        if (contextFilter === '') {
            allOption.selected = true;
        }

        // Add available contexts
        const contexts = this.filterManager.getAvailableContexts();
        contexts.forEach(context => {
            const optionEl = contextSelect.createEl('option', {
                value: context,
                text: context
            });
            if (context === contextFilter) {
                optionEl.selected = true;
            }
        });

        // No context option
        const noneOption = contextSelect.createEl('option', { value: 'NONE', text: 'None' });
        if (contextFilter === 'NONE') {
            noneOption.selected = true;
        }

        contextSelect.addEventListener('change', (e) => {
            this.onContextFilterChange((e.target as HTMLSelectElement).value);
        });
    }

    // Render add task or empty button
    private renderAddTaskButton(container: HTMLElement): void {
        if (this.completedFilter) {
            // Empty completed tasks button
            const emptyButton = container.createEl('button', {
                cls: 'empty-tasks-button mobile-fab-button'
            });

            const iconSpan = emptyButton.createSpan('empty-tasks-icon');
            const trashSvg = createSVGElement(Icons.trash);
            iconSpan.appendChild(trashSvg);

            emptyButton.createSpan('empty-tasks-text').setText('Empty');

            emptyButton.addEventListener('click', () => {
                this.taskManager.openEmptyCompletedTasksModal();
            });
        } else {
            // Add new task button
            const addButton = container.createEl('button', {
                cls: 'add-task-button mobile-fab-button'
            });

            const iconSpan = addButton.createSpan('add-task-icon');
            const addSvg = createSVGElement(Icons.add);
            iconSpan.appendChild(addSvg);

            addButton.createSpan('add-task-text').setText('Add task');

            addButton.addEventListener('click', () => {
                this.taskManager.openAddTaskModal(
                    this.projectManager.getAvailableProjects(),
                    this.filterManager.getAvailableContexts(),
                    this.filterManager.getDefaultProject(),
                    this.filterManager.getDefaultDueDate()
                );
            });
        }
    }

    // Set search input value
    public setSearchValue(value: string): void {
        if (this.searchInputEl) {
            this.searchInputEl.value = value;
        }
    }
}