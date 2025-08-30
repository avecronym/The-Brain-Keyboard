import { FilterState } from '../../managers/filterManager';
import { ProjectManager } from '../../managers/projectManager';
import { Icons, createSVGElement } from '../../utils/icons';
import { DragHandler } from './dragHandler';
import { TFile } from 'obsidian';

export class ProjectItem {
    private dragHandler: DragHandler;
    private containerEl: HTMLElement | null = null;

    constructor(
        private projectManager: ProjectManager,
        private onProjectSelect: (project: string) => void,
        private onProjectReorder: (projectName: string, newIndex: number, isPinned: boolean) => void,
        private onProjectTogglePin: (projectName: string, shouldPin: boolean) => void,
        private toggleMobileSidebar: () => void
    ) {
        this.dragHandler = new DragHandler(onProjectReorder, onProjectTogglePin);
    }

    render(
        container: HTMLElement,
        project: string,
        count: number,
        filterState: FilterState,
        file: TFile | null
    ): void {
        // Save container reference for width check
        this.containerEl = container.closest('.todo-txt-view') as HTMLElement;

        const projectItem = container.createDiv('project-item');
        projectItem.draggable = true;
        projectItem.dataset.project = project;

        // Highlight if selected
        if (filterState.selectedProject === project && !filterState.archivedFilter && !filterState.completedFilter) {
            projectItem.addClass('selected');
        }

        this.renderProjectContent(projectItem, project, count);
        this.setupEventListeners(projectItem, project, container, file);
    }

    // Render project visual content
    private renderProjectContent(projectItem: HTMLElement, project: string, count: number): void {
        // Project icon
        const projectIcon = projectItem.createSpan('project-icon');
        const icon = this.projectManager.getProjectIcon(project);

        if (icon) {
            if (icon.includes('<svg')) {
                const svgElement = createSVGElement(icon);
                projectIcon.appendChild(svgElement);
            } else {
                projectIcon.setText(icon);
            }
        } else {
            const hashSvg = createSVGElement(Icons.hash);
            projectIcon.appendChild(hashSvg);
        }

        // Project name
        const projectText = projectItem.createSpan('project-text');
        projectText.setText(project.replace(/_/g, ' '));

        // Task count
        const projectCount = projectItem.createSpan('project-count');
        projectCount.setText(count.toString());

        // Context menu button
        const projectMenu = projectItem.createSpan('project-menu');
        const dotsSvg = createSVGElement(Icons.threeDots);
        projectMenu.appendChild(dotsSvg);
        projectMenu.addClass('project-menu-dots');
    }

    private getContainerWidth(): number {
        // Use stored container reference for width detection
        return this.containerEl ? this.containerEl.clientWidth : window.innerWidth;
    }

    // Setup all event listeners
    private setupEventListeners(projectItem: HTMLElement, project: string, container: HTMLElement, file: TFile | null): void {
        // Setup drag handling
        const isTouchHandled = this.dragHandler.setupDragEvents(projectItem, project, container);

        // Click listener
        projectItem.addEventListener('click', (e) => {
            if (isTouchHandled()) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            const projectMenu = projectItem.querySelector('.project-menu');
            if (e.target === projectMenu || projectMenu?.contains(e.target as Node)) {
                e.stopPropagation();
                this.projectManager.showProjectMenu(e, project, file);
            } else {
                this.onProjectSelect(project);
                if (this.getContainerWidth() <= 768) {
                    this.toggleMobileSidebar();
                }
            }
        });
    }
}