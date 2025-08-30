export class RecurrenceCalculator {
    // Calculate next occurrence date
    static calculateNextDueDate(currentDate: Date, recPattern: string): string {
        const date = new Date(currentDate);

        // Handle simple patterns (1d, 2w, 3m, 1y)
        const simpleMatch = recPattern.match(/^(\d+)([dwmy])$/);
        if (simpleMatch) {
            const amount = parseInt(simpleMatch[1]);
            const unit = simpleMatch[2];

            switch (unit) {
                case 'd':
                    date.setDate(date.getDate() + amount);
                    break;
                case 'w':
                    date.setDate(date.getDate() + (amount * 7));
                    break;
                case 'm':
                    date.setMonth(date.getMonth() + amount);
                    break;
                case 'y':
                    date.setFullYear(date.getFullYear() + amount);
                    break;
            }

            return date.toISOString().split('T')[0];
        }

        // Handle complex patterns with specific days/dates
        const parts = recPattern.split(',');
        if (parts.length < 2) return currentDate.toISOString().split('T')[0];

        const interval = parts[0];

        if (interval.endsWith('w')) {
            return this.calculateWeeklyRecurrence(date, interval, parts.slice(1));
        }
        else if (interval.endsWith('m')) {
            return this.calculateMonthlyRecurrence(date, currentDate, interval, parts.slice(1));
        }
        else {
            return this.calculateYearlyRecurrence(date, currentDate, parts);
        }
    }

    // Calculate weekly recurrence with specific days
    private static calculateWeeklyRecurrence(date: Date, interval: string, dayParts: string[]): string {
        const weeks = parseInt(interval);
        const targetDays = dayParts.map(d => this.getDayNumber(d));
        targetDays.sort((a, b) => a - b);

        const currentDayOfWeek = date.getDay();
        const currentDayIndex = targetDays.indexOf(currentDayOfWeek);
        const nextDate = new Date(date);

        // Find next target day in same week
        if (currentDayIndex !== -1 && currentDayIndex < targetDays.length - 1) {
            const nextTargetDay = targetDays[currentDayIndex + 1];
            const daysToAdd = nextTargetDay - currentDayOfWeek;
            nextDate.setDate(nextDate.getDate() + daysToAdd);
        } else {
            let daysToAdd: number;

            // Move to next cycle
            if (currentDayIndex === targetDays.length - 1) {
                daysToAdd = (weeks * 7) - currentDayOfWeek + targetDays[0];
            } else {
                const nextTargetDay = targetDays.find(d => d > currentDayOfWeek);

                if (nextTargetDay !== undefined) {
                    daysToAdd = nextTargetDay - currentDayOfWeek;
                } else {
                    daysToAdd = (weeks * 7) - currentDayOfWeek + targetDays[0];
                }
            }

            nextDate.setDate(nextDate.getDate() + daysToAdd);
        }

        return nextDate.toISOString().split('T')[0];
    }

    // Calculate monthly recurrence with specific dates
    private static calculateMonthlyRecurrence(date: Date, currentDate: Date, interval: string, dateParts: string[]): string {
        const months = parseInt(interval);

        if (dateParts.length === 1) {
            // Single target date
            let targetDate = parseInt(dateParts[0]);
            targetDate = Math.min(targetDate, 31);

            date.setDate(targetDate);

            if (date <= currentDate) {
                date.setMonth(date.getMonth() + months);
            }

            // Handle invalid dates (e.g., Feb 31)
            while (date.getDate() !== targetDate) {
                date.setDate(0);
            }

            return date.toISOString().split('T')[0];
        } else {
            // Multiple target dates
            const targetDates = dateParts
                .map(d => parseInt(d))
                .filter(d => !isNaN(d))
                .map(d => Math.min(d, 31));

            targetDates.sort((a, b) => a - b);

            // Find next valid date
            let nextTargetDate = targetDates.find(d => {
                const testDate = new Date(date);
                testDate.setDate(d);
                return testDate > currentDate;
            });

            let addMonths = 0;

            if (!nextTargetDate) {
                nextTargetDate = targetDates[0];
                addMonths = months;
            }

            date.setMonth(date.getMonth() + addMonths);
            date.setDate(nextTargetDate);

            // Handle invalid dates
            while (date.getDate() !== nextTargetDate) {
                date.setDate(0);
            }

            return date.toISOString().split('T')[0];
        }
    }

    // Calculate yearly recurrence
    private static calculateYearlyRecurrence(date: Date, currentDate: Date, parts: string[]): string {
        const monthName = parts[0];
        const targetDate = parseInt(parts[1]);
        const targetMonth = this.getMonthNumber(monthName);

        if (targetMonth === -1) return currentDate.toISOString().split('T')[0];

        date.setMonth(targetMonth);
        date.setDate(targetDate);

        // Move to next year if date passed
        if (date <= currentDate) {
            date.setFullYear(date.getFullYear() + 1);
        }

        return date.toISOString().split('T')[0];
    }

    // Convert day name to number
    private static getDayNumber(day: string): number {
        const days: { [key: string]: number } = {
            'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3,
            'thu': 4, 'fri': 5, 'sat': 6
        };
        return days[day.toLowerCase()] ?? -1;
    }

    // Convert month name to number
    private static getMonthNumber(month: string): number {
        const months: { [key: string]: number } = {
            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3,
            'may': 4, 'jun': 5, 'jul': 6, 'aug': 7,
            'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        return months[month.toLowerCase()] ?? -1;
    }
}