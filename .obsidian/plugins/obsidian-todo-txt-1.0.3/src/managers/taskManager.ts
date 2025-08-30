import { App } from 'obsidian';
import { TodoItem } from '../types';
import { AddTaskModal } from '../components/modals/addTaskModal';
import { DeleteTaskModal, DeleteAllCompletedTasksModal } from '../components/modals/confirmModals';

export class TaskManager {
    private todoItems: TodoItem[] = [];

    // Task operation callbacks
    public onTaskComplete: (item: TodoItem) => Promise<void> = async () => { };
    public onTaskUncomplete: (item: TodoItem) => Promise<void> = async () => { };
    public onTaskUpdate: (item: TodoItem, taskLine: string) => Promise<void> = async () => { };
    public onTaskDelete: (item: TodoItem) => Promise<void> = async () => { };
    public onTaskAdd: (taskLine: string) => Promise<void> = async () => { };
    public onMoveFromArchived: (item: TodoItem) => Promise<void> = async () => { };

    constructor(private app: App) { }

    // Store todo items
    setTodoItems(items: TodoItem[]): void {
        this.todoItems = items;
    }

    // Mark task as done
    async completeTask(item: TodoItem): Promise<void> {
        await this.onTaskComplete(item);
    }

    // Unmark task completion
    async uncompleteTask(item: TodoItem): Promise<void> {
        await this.onTaskUncomplete(item);
    }

    // Move task to inbox
    async moveTaskFromArchived(item: TodoItem): Promise<void> {
        await this.onMoveFromArchived(item);
    }

    // Open task edit modal
    editTask(item: TodoItem, availableProjects: string[], availableContexts: string[]): void {
        const modal = new AddTaskModal(
            this.app,
            async (taskLine: string) => {
                await this.onTaskUpdate(item, taskLine);
            },
            availableProjects,
            availableContexts,
            item,
            async () => {
                // Show delete confirmation
                const confirmModal = new DeleteTaskModal(
                    this.app,
                    item.description,
                    async () => {
                        await this.onTaskDelete(item);
                    }
                );
                confirmModal.open();
            }
        );
        modal.open();
    }

    // Open new task modal
    openAddTaskModal(
        availableProjects: string[],
        availableContexts: string[],
        defaultProject?: string,
        defaultDueDate?: string
    ): void {
        const modal = new AddTaskModal(
            this.app,
            (taskLine: string) => {
                this.onTaskAdd(taskLine);
            },
            availableProjects,
            availableContexts,
            undefined,
            undefined,
            defaultProject,
            defaultDueDate
        );
        modal.open();
    }

    // Open bulk delete modal
    public openEmptyCompletedTasksModal(): void {
        const completedTasks = this.todoItems.filter(item => item.completed);
        const count = completedTasks.length;

        if (count === 0) {
            return;
        }

        const modal = new DeleteAllCompletedTasksModal(
            this.app,
            count,
            async () => {
                await this.deleteAllCompletedTasks();
            }
        );
        modal.open();
    }

    // Delete all completed tasks
    private async deleteAllCompletedTasks(): Promise<void> {
        const completedTasks = this.todoItems.filter(item => item.completed);

        for (const task of completedTasks) {
            if (this.onTaskDelete) {
                await this.onTaskDelete(task);
            }
        }
    }
}