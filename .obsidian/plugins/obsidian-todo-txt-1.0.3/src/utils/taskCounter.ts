import { TodoItem } from '../types';

export class TaskCounter {
    // Count active tasks
    static getAllTasksCount(items: TodoItem[]): number {
        return items.filter(item => !item.completed && !item.projects.includes('Archived')).length;
    }

    // Count tasks due today or overdue
    static getTodayTasksCount(items: TodoItem[]): number {
        const today = new Date().toISOString().split('T')[0];
        return items.filter(item => {
            if (item.completed || item.projects.includes('Archived')) return false;
            const dueMatch = item.description.match(/due:(\d{4}-\d{2}-\d{2})/);
            return dueMatch && dueMatch[1] <= today;
        }).length;
    }

    // Count future tasks
    static getUpcomingTasksCount(items: TodoItem[]): number {
        const today = new Date().toISOString().split('T')[0];
        return items.filter(item => {
            if (item.completed || item.projects.includes('Archived')) return false;
            const dueMatch = item.description.match(/due:(\d{4}-\d{2}-\d{2})/);
            return dueMatch && dueMatch[1] > today;
        }).length;
    }

    // Count unorganized tasks
    static getInboxTasksCount(items: TodoItem[]): number {
        return items.filter(item =>
            !item.completed &&
            (item.projects.length === 0 || item.projects.includes('Inbox'))
        ).length;
    }

    // Count archived tasks
    static getArchivedTasksCount(items: TodoItem[]): number {
        return items.filter(item => item.projects.includes('Archived')).length;
    }

    // Count finished tasks
    static getCompletedTasksCount(items: TodoItem[]): number {
        return items.filter(item => item.completed).length;
    }
}