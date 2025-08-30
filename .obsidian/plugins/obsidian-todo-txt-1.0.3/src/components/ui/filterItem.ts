import { Icons, getIcon, createSVGElement } from '../../utils/icons';
import { FilterState } from '../../managers/filterManager';

export class FilterItem {
    // Render sidebar filter button
    static render(
        container: HTMLElement,
        filterId: string,
        label: string,
        count: number,
        filterState: FilterState,
        onClick: () => void
    ): void {
        const item = container.createDiv(`project-item ${filterId}-filter`);

        // Highlight if selected
        const isSelected = this.isFilterSelected(filterId, filterState);
        if (isSelected) {
            item.addClass('selected');
        }

        // Filter icon
        const icon = item.createSpan('project-icon');
        const svgElement = createSVGElement(getIcon(filterId as keyof typeof Icons));
        icon.appendChild(svgElement);

        // Filter label
        const text = item.createSpan('project-text');
        text.setText(label);

        // Task count
        const countEl = item.createSpan('project-count');
        countEl.setText(count.toString());

        item.addEventListener('click', onClick);
    }

    // Check if filter is currently active
    private static isFilterSelected(filterId: string, filterState: FilterState): boolean {
        switch (filterId) {
            case 'all':
                return !filterState.selectedProject && !filterState.selectedTimeFilter &&
                    !filterState.archivedFilter && !filterState.completedFilter;
            case 'today':
                return filterState.selectedTimeFilter === 'today' && !filterState.archivedFilter &&
                    !filterState.completedFilter;
            case 'upcoming':
                return filterState.selectedTimeFilter === 'upcoming' && !filterState.archivedFilter &&
                    !filterState.completedFilter;
            case 'inbox':
                return filterState.selectedProject === 'Inbox' && !filterState.selectedTimeFilter &&
                    !filterState.archivedFilter && !filterState.completedFilter;
            case 'archived':
                return filterState.archivedFilter;
            case 'completed':
                return filterState.completedFilter;
            default:
                return false;
        }
    }
}