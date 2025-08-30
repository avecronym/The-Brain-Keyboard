export class DateUtils {
    // Format date for display
    static formatDate(dateString: string): string {
        // Check date format
        if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Set to midnight for comparison
        today.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        // Show relative dates
        if (date.getTime() === today.getTime()) {
            return 'Today';
        } else if (date.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        } else if (date.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        }

        const currentYear = today.getFullYear();
        const dateYear = date.getFullYear();

        // Hide year if current
        if (dateYear === currentYear) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    }

    // Get due date status
    static getDueDateStatus(dateString: string): 'overdue' | 'today' | 'upcoming' | null {
        if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return null;
        }

        const date = new Date(dateString);
        const today = new Date();

        // Compare at midnight
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        if (date.getTime() < today.getTime()) {
            return 'overdue';
        } else if (date.getTime() === today.getTime()) {
            return 'today';
        } else {
            return 'upcoming';
        }
    }
}

// Get current local date
export function getCurrentLocalDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Calculate due date
export function calculateDueDate(option: string): string {
    const today = new Date();
    let targetDate: Date;

    switch (option) {
        case 'Today':
            targetDate = new Date(today);
            break;
        case 'Tomorrow':
            targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() + 1);
            break;
        case 'Next Week':
            targetDate = new Date(today);
            const dayOfWeek = targetDate.getDay();
            // Find next Sunday
            const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
            targetDate.setDate(targetDate.getDate() + daysUntilSunday);
            break;
        case 'Next Month':
            targetDate = new Date(today);
            // Go to next month
            targetDate.setDate(1);
            targetDate.setMonth(targetDate.getMonth() + 1);
            break;
        default:
            targetDate = new Date(today);
    }

    // Format as ISO date
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// Get repeat syntax
export function getRepeatSyntax(option: string): string {
    switch (option) {
        case 'Daily':
            return 'rec:1d';
        case 'Weekly':
            return 'rec:1w,sun';
        case 'Monthly':
            return 'rec:1m,1';
        case 'Yearly':
            return 'rec:Jan,1';
        default:
            return '';
    }
}