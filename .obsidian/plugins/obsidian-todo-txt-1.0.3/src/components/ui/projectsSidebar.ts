import { TodoItem } from '../../types';
import { FilterState } from '../../managers/filterManager';
import { ProjectManager } from '../../managers/projectManager';
import { Icons, createSVGElement } from '../../utils/icons';
import { TaskCounter } from '../../utils/taskCounter';
import { FilterItem } from './filterItem';
import { ProjectItem } from './projectItem';
import { TFile } from 'obsidian';

export class ProjectsSidebar {
    private projectItemRenderer: ProjectItem;
    private containerEl: HTMLElement | null = null;

    constructor(
        private projectManager: ProjectManager,
        private onProjectSelect: (project: string) => void,
        private onTimeFilterSelect: (filter: string) => void,
        private onSpecialFilterSelect: (filter: string) => void,
        private onProjectReorder: (projectName: string, newIndex: number, isPinned: boolean) => void,
        private onProjectTogglePin: (projectName: string, shouldPin: boolean) => void,
        private toggleSidebar: () => void
    ) {
        this.projectItemRenderer = new ProjectItem(
            projectManager,
            onProjectSelect,
            onProjectReorder,
            onProjectTogglePin,
            toggleSidebar
        );
    }

    render(
        container: HTMLElement,
        allItems: TodoItem[],
        filterState: FilterState,
        pinnedProjects: string[],
        allKnownProjects: string[],
        file: TFile | null,
        sidebarOpen: boolean
    ): void {
        // Store container reference for width check
        this.containerEl = container.closest('.todo-txt-view') as HTMLElement;

        const sidebar = container.createDiv('projects-sidebar');
        if (sidebarOpen) {
            sidebar.addClass('open');
        } else {
            sidebar.addClass('closed');
        }

        const topSection = sidebar.createDiv('projects-top-section');

        // Render default filters
        const filters = [
            { id: 'all', label: 'All', count: TaskCounter.getAllTasksCount(allItems) },
            { id: 'today', label: 'Today', count: TaskCounter.getTodayTasksCount(allItems) },
            { id: 'upcoming', label: 'Upcoming', count: TaskCounter.getUpcomingTasksCount(allItems) },
            { id: 'inbox', label: 'Inbox', count: TaskCounter.getInboxTasksCount(allItems) },
            { id: 'archived', label: 'Archived', count: TaskCounter.getArchivedTasksCount(allItems) },
            { id: 'completed', label: 'Completed', count: TaskCounter.getCompletedTasksCount(allItems) }
        ];

        filters.forEach(filter => {
            FilterItem.render(
                topSection,
                filter.id,
                filter.label,
                filter.count,
                filterState,
                () => {
                    this.handleFilterClick(filter.id);
                    if (this.getContainerWidth() <= 768) {
                        this.toggleSidebar();
                    }
                }
            );
        });

        // Get project counts and separate pinned/unpinned
        const projectCounts = this.projectManager.getProjectCounts(allItems);
        const pinnedProjectCounts = this.projectManager.getOrderedPinnedProjects(projectCounts);
        const unpinnedProjectCounts = projectCounts.filter(p => !pinnedProjects.includes(p.project));

        // Render pinned projects section
        if (pinnedProjectCounts.length > 0) {
            const pinnedHeaderContainer = sidebar.createDiv('pinned-header-container');
            pinnedHeaderContainer.createEl('h3', { text: 'Pinned' });

            const pinnedList = sidebar.createDiv('projects-list pinned-projects-list');
            this.addSectionDragEvents(pinnedList, true);
            pinnedProjectCounts.forEach(({ project, count }) => {
                this.projectItemRenderer.render(pinnedList, project, count, filterState, file);
            });
        }

        this.renderProjectsSection(sidebar, unpinnedProjectCounts, filterState, file);
    }

    private getContainerWidth(): number {
        // Use stored container reference for width detection
        return this.containerEl ? this.containerEl.clientWidth : window.innerWidth;
    }

    // Filter button clicks
    private handleFilterClick(filterId: string): void {
        switch (filterId) {
            case 'all':
                this.onProjectSelect('');
                this.onTimeFilterSelect('');
                this.onSpecialFilterSelect('');
                break;
            case 'today':
            case 'upcoming':
                this.onTimeFilterSelect(filterId);
                break;
            case 'inbox':
                this.onProjectSelect('Inbox');
                break;
            case 'archived':
            case 'completed':
                this.onSpecialFilterSelect(filterId);
                break;
        }
    }

    // Add drag highlight
    private addSectionDragEvents(container: HTMLElement, isPinnedSection: boolean): void {
        container.addEventListener('dragover', (e) => {
            const draggingElement = document.querySelector('.dragging');
            if (!draggingElement) return;

            const draggedFromPinned = draggingElement.closest('.pinned-projects-list') !== null;

            if (draggedFromPinned !== isPinnedSection) {
                e.preventDefault();
                container.addClass('section-highlight');
            }
        });

        container.addEventListener('dragleave', (e) => {
            if (!container.contains(e.relatedTarget as Node)) {
                container.removeClass('section-highlight');
            }
        });

        container.addEventListener('drop', () => {
            container.removeClass('section-highlight');
        });
    }

    // Render projects section with header
    private renderProjectsSection(
        container: HTMLElement,
        projectCounts: { project: string; count: number }[],
        filterState: FilterState,
        file: TFile | null
    ): void {
        const headerContainer = container.createDiv('projects-header-container');
        const title = headerContainer.createEl('h3', { text: 'Projects' });
        const addIcon = headerContainer.createSpan('add-project-icon');
        const addSvg = createSVGElement(Icons.add);
        addIcon.appendChild(addSvg);

        // Add project click
        headerContainer.addEventListener('click', (e) => {
            if (e.target === addIcon || addIcon.contains(e.target as Node)) {
                e.stopPropagation();
                this.projectManager.openAddProjectModal(file);
            }
        });

        const projectsList = container.createDiv('projects-list');
        this.addSectionDragEvents(projectsList, false);

        // Render all projects
        projectCounts.forEach(({ project, count }) => {
            this.projectItemRenderer.render(projectsList, project, count, filterState, file);
        });
    }
}