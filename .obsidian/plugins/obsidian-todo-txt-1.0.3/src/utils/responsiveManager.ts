export type Breakpoint = 'mobile' | 'desktop';

export class ResponsiveManager {
    private resizeObserver: ResizeObserver | null = null;
    private currentBreakpoint: Breakpoint = 'mobile';
    private isInitialized: boolean = false;

    constructor(
        private containerEl: HTMLElement,
        private onBreakpointChange: (newBreakpoint: Breakpoint, oldBreakpoint: Breakpoint) => void
    ) {
        this.initialize();
    }

    // Initialize responsive classes
    private initialize(): void {
        const width = this.containerEl.offsetWidth || window.innerWidth;
        const initialBreakpoint = width > 768 ? 'desktop' : 'mobile';

        this.containerEl.removeClass('mobile', 'desktop');
        this.containerEl.addClass(initialBreakpoint);
        this.currentBreakpoint = initialBreakpoint;

        this.setupResizeObserver();
    }

    // Setup ResizeObserver for container width changes
    private setupResizeObserver(): void {
        if (typeof ResizeObserver !== 'undefined' && !this.resizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.updateResponsiveClasses();
            });
            this.resizeObserver.observe(this.containerEl);
        }
    }

    // Update responsive classes based on container width
    private updateResponsiveClasses(): void {
        const containerWidth = this.containerEl.offsetWidth;
        const effectiveWidth = containerWidth > 0 ? containerWidth : window.innerWidth;
        const newBreakpoint: Breakpoint = effectiveWidth > 768 ? 'desktop' : 'mobile';

        if (newBreakpoint !== this.currentBreakpoint) {
            const oldBreakpoint = this.currentBreakpoint;
            this.containerEl.removeClass('mobile', 'desktop');
            this.containerEl.addClass(newBreakpoint);
            this.currentBreakpoint = newBreakpoint;

            if (this.isInitialized) {
                this.onBreakpointChange(newBreakpoint, oldBreakpoint);
            }
        }
    }

    // Force responsive update
    public forceUpdate(): void {
        const containerWidth = this.containerEl.offsetWidth;
        const effectiveWidth = containerWidth > 0 ? containerWidth : window.innerWidth;
        const correctBreakpoint: Breakpoint = effectiveWidth > 768 ? 'desktop' : 'mobile';

        this.containerEl.removeClass('mobile', 'desktop');
        this.containerEl.addClass(correctBreakpoint);

        if (correctBreakpoint !== this.currentBreakpoint) {
            const oldBreakpoint = this.currentBreakpoint;
            this.currentBreakpoint = correctBreakpoint;

            if (this.isInitialized) {
                this.onBreakpointChange(correctBreakpoint, oldBreakpoint);
            }
        }
    }

    // Mark as initialized
    public setInitialized(): void {
        this.isInitialized = true;
    }

    // Get current breakpoint
    public getCurrentBreakpoint(): Breakpoint {
        return this.currentBreakpoint;
    }

    // Cleanup ResizeObserver
    public destroy(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }
}