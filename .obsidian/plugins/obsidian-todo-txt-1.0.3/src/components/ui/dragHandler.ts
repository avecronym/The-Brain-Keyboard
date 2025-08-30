export class DragHandler {
    // Mobile touch state
    private isDragging = false;
    private startY = 0;
    private startX = 0;
    private longPressTimer: NodeJS.Timeout | null = null;
    private longPressActivated = false;
    private touchHandled = false;
    private dragClone: HTMLElement | null = null;

    constructor(
        private onReorder: (itemName: string, newIndex: number, isPinned: boolean) => void,
        private onTogglePin: (itemName: string, shouldPin: boolean) => void
    ) { }

    // Setup all drag events for draggable item
    setupDragEvents(dragItem: HTMLElement, itemName: string, container: HTMLElement): () => boolean {
        this.setupDesktopDragEvents(dragItem, itemName, container);
        this.setupMobileTouchEvents(dragItem, itemName, container);

        // Return function to check if touch was handled
        return () => this.touchHandled;
    }

    // Desktop drag and drop events
    private setupDesktopDragEvents(dragItem: HTMLElement, itemName: string, container: HTMLElement): void {
        dragItem.addEventListener('dragstart', (e) => {
            e.dataTransfer?.setData('text/plain', itemName);
            dragItem.addClass('dragging');
        });

        dragItem.addEventListener('dragend', () => {
            dragItem.removeClass('dragging');
            document.querySelectorAll('.section-highlight').forEach(el => el.removeClass('section-highlight'));
            document.querySelectorAll('.drop-target-highlight').forEach(el => el.removeClass('drop-target-highlight'));
        });

        dragItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingElement = container.querySelector('.dragging');
            if (!draggingElement || draggingElement === dragItem) return;

            const draggedFromPinned = draggingElement.closest('.pinned-projects-list') !== null;
            const isPinnedContainer = container.classList.contains('pinned-projects-list');

            container.querySelectorAll('.drop-target-highlight').forEach(el => el.removeClass('drop-target-highlight'));

            if (draggedFromPinned === isPinnedContainer) {
                const rect = dragItem.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                const isAbove = e.clientY < midY;

                if (isAbove) {
                    dragItem.addClass('drop-target-highlight');
                } else {
                    const nextItem = dragItem.nextElementSibling;
                    if (nextItem && nextItem.classList.contains('project-item')) {
                        nextItem.addClass('drop-target-highlight');
                    }
                }
            }
        });

        dragItem.addEventListener('drop', (e) => {
            e.preventDefault();
            container.querySelectorAll('.drop-target-highlight').forEach(el => el.removeClass('drop-target-highlight'));

            const draggedItem = e.dataTransfer?.getData('text/plain');
            if (!draggedItem || draggedItem === itemName) return;

            const draggedElement = document.querySelector(`[data-project="${draggedItem}"]`) as HTMLElement;
            if (!draggedElement) return;

            const isPinnedContainer = container.classList.contains('pinned-projects-list');
            const draggedFromPinned = draggedElement.closest('.pinned-projects-list') !== null;

            if (draggedFromPinned !== isPinnedContainer) {
                this.onTogglePin(draggedItem, isPinnedContainer);
            } else {
                this.handleDrop(draggedItem, itemName, container);
            }
        });
    }

    // Mobile touch events
    private setupMobileTouchEvents(dragItem: HTMLElement, itemName: string, container: HTMLElement): void {
        dragItem.addEventListener('touchstart', (e) => {
            this.startY = e.touches[0].clientY;
            this.startX = e.touches[0].clientX;
            this.isDragging = false;
            this.longPressActivated = false;
            this.touchHandled = false;

            this.longPressTimer = setTimeout(() => {
                this.longPressActivated = true;
                this.touchHandled = true;
                dragItem.addClass('long-press-ready');
            }, 500);
        });

        dragItem.addEventListener('touchmove', (e) => {
            const currentY = e.touches[0].clientY;
            const currentX = e.touches[0].clientX;
            const moveDistance = Math.sqrt(Math.pow(currentX - this.startX, 2) + Math.pow(currentY - this.startY, 2));

            // Cancel long press if moved too much
            if (!this.longPressActivated && moveDistance > 10) {
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
                return;
            }

            // Start drag after long press
            if (this.longPressActivated && !this.isDragging && moveDistance > 5) {
                this.isDragging = true;
                this.touchHandled = true;
                dragItem.addClass('dragging');

                // Create visual clone
                this.dragClone = dragItem.cloneNode(true) as HTMLElement;
                this.dragClone.addClass('mobile-drag-clone');
                document.body.appendChild(this.dragClone);

                e.preventDefault();
                e.stopPropagation();
            }

            if (this.isDragging && this.dragClone) {
                e.preventDefault();
                e.stopPropagation();

                // Update position
                this.dragClone.style.setProperty('--drag-x', `${currentX - 100}px`);
                this.dragClone.style.setProperty('--drag-y', `${currentY - 25}px`);

                // Handle highlighting
                this.updateDragHighlights(currentX, currentY, dragItem, container);
            }
        });

        dragItem.addEventListener('touchend', (e) => {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }

            dragItem.removeClass('long-press-ready');

            if (this.isDragging) {
                e.preventDefault();
                e.stopPropagation();
                this.touchHandled = true;

                this.handleTouchDrop(e, itemName, dragItem);
                this.cleanupDrag();
            }

            // Delay flag reset
            setTimeout(() => {
                this.isDragging = false;
                this.longPressActivated = false;
                this.touchHandled = false;
            }, 50);
        });

        dragItem.addEventListener('touchcancel', () => {
            this.cancelDrag(dragItem);
        });
    }

    // Update drag highlights during touch move
    private updateDragHighlights(currentX: number, currentY: number, dragItem: HTMLElement, container: HTMLElement): void {
        const elementBelow = document.elementFromPoint(currentX, currentY);
        const targetItem = elementBelow?.closest('.project-item') as HTMLElement;
        const targetSection = elementBelow?.closest('.projects-list, .pinned-projects-list') as HTMLElement;

        // Clear existing highlights
        document.querySelectorAll('.drop-target-highlight, .section-highlight').forEach(el => {
            el.removeClass('drop-target-highlight');
            el.removeClass('section-highlight');
        });

        if (targetSection) {
            const isPinnedTarget = targetSection.classList.contains('pinned-projects-list');
            const isDraggedFromPinned = container.classList.contains('pinned-projects-list');

            // Highlight section for cross-section drag
            if (isDraggedFromPinned !== isPinnedTarget) {
                targetSection.addClass('section-highlight');
            }

            // Highlight project for same-section reorder
            if (targetItem && targetItem !== dragItem && isDraggedFromPinned === isPinnedTarget) {
                targetItem.addClass('drop-target-highlight');
            }
        }
    }

    // Touch drop
    private handleTouchDrop(e: TouchEvent, itemName: string, dragItem: HTMLElement): void {
        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetItem = elementBelow?.closest('.project-item') as HTMLElement;

        if (targetItem && targetItem !== dragItem && targetItem.dataset.project) {
            const targetContainer = targetItem.closest('.projects-list, .pinned-projects-list') as HTMLElement;
            const draggedContainer = dragItem.closest('.projects-list, .pinned-projects-list') as HTMLElement;

            const isPinnedTarget = targetContainer?.classList.contains('pinned-projects-list') || false;
            const isDraggedFromPinned = draggedContainer?.classList.contains('pinned-projects-list') || false;

            if (isDraggedFromPinned !== isPinnedTarget) {
                this.onTogglePin(itemName, isPinnedTarget);
            } else {
                const highlightedElement = targetContainer.querySelector('.drop-target-highlight') as HTMLElement;
                if (highlightedElement && highlightedElement.dataset.project) {
                    const projectElements = Array.from(targetContainer.querySelectorAll('.project-item'));
                    const targetIndex = projectElements.indexOf(highlightedElement);
                    this.onReorder(itemName, targetIndex, isPinnedTarget);
                }
            }
        }
    }

    // Desktop drop
    private handleDrop(draggedItem: string, targetItem: string, container: HTMLElement): void {
        const isPinnedContainer = container.classList.contains('pinned-projects-list');
        const projectElements = Array.from(container.querySelectorAll('.project-item'));
        const targetElement = projectElements.find(el => (el as HTMLElement).dataset.project === targetItem);

        if (!targetElement) return;

        const targetIndex = projectElements.indexOf(targetElement);
        this.onReorder(draggedItem, targetIndex, isPinnedContainer);
    }

    // Clean up drag elements
    private cleanupDrag(): void {
        if (this.dragClone) {
            this.dragClone.remove();
            this.dragClone = null;
        }
        document.querySelectorAll('.drop-target-highlight, .section-highlight').forEach(el => {
            el.removeClass('drop-target-highlight');
            el.removeClass('section-highlight');
        });
    }

    // Cancel drag operation
    private cancelDrag(dragItem: HTMLElement): void {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        dragItem.removeClass('long-press-ready');
        dragItem.removeClass('dragging');

        this.cleanupDrag();

        this.isDragging = false;
        this.longPressActivated = false;
        this.touchHandled = false;
    }
}