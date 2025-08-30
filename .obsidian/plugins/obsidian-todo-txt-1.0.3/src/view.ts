import { TextFileView, WorkspaceLeaf, TFile } from 'obsidian';
import { TodoItem, VIEW_TYPE_TODO_TXT } from './types';
import { TodoParser } from './parser';
import TodoTxtPlugin from './main';
import { ViewRenderer } from './managers/viewRenderer';
import { TaskManager } from './managers/taskManager';
import { ProjectManager } from './managers/projectManager';
import { FilterManager } from './managers/filterManager';
import { StateManager } from './managers/stateManager';
import { FileService } from './services/fileService';
import { TaskService } from './services/taskService';
import { ProjectService } from './services/projectService';

export class TodoTxtView extends TextFileView {
	private todoItems: TodoItem[] = [];

	// View managers
	private renderer: ViewRenderer;
	private taskManager: TaskManager;
	private projectManager: ProjectManager;
	private filterManager: FilterManager;
	private stateManager: StateManager;

	// Data services
	private fileService: FileService;
	private taskService: TaskService;
	private projectService: ProjectService;

	constructor(leaf: WorkspaceLeaf, private plugin: TodoTxtPlugin) {
		super(leaf);

		// Initialize services
		this.fileService = new FileService(this.app.vault);
		this.taskService = new TaskService(this.fileService);

		// Initialize managers
		this.filterManager = new FilterManager();
		this.projectManager = new ProjectManager(plugin);
		this.projectService = new ProjectService(this.fileService, this.projectManager);
		this.taskManager = new TaskManager(this.app);
		this.stateManager = new StateManager();

		// Use contentEl for rendering
		this.renderer = new ViewRenderer(
			this.contentEl,
			this.taskManager,
			this.projectManager,
			this.filterManager,
			this.plugin
		);

		this.setupEventHandlers();

		// Watch file changes
		this.registerEvent(this.app.vault.on('modify', (file) => {
			if (file === this.file) {
				this.loadFileContent();
			}
		}));
	}

	// Setup manager callbacks
	private setupEventHandlers(): void {
		// Task operation handlers
		this.taskManager.onTaskComplete = async (item) => {
			if (this.file) await this.taskService.completeTask(this.file, item);
		};

		this.taskManager.onTaskUncomplete = async (item) => {
			if (this.file) await this.taskService.uncompleteTask(this.file, item);
		};

		this.taskManager.onTaskUpdate = async (item, taskLine) => {
			if (this.file) await this.taskService.updateTask(this.file, item, taskLine);
		};

		this.taskManager.onTaskDelete = async (item) => {
			if (this.file) await this.taskService.deleteTask(this.file, item);
		};

		this.taskManager.onTaskAdd = async (taskLine) => {
			if (this.file) await this.taskService.addNewTask(this.file, taskLine);
		};

		this.taskManager.onMoveFromArchived = async (item) => {
			if (this.file) await this.taskService.moveTaskFromArchivedToInbox(this.file, item);
		};

		// Project operation handlers
		this.projectManager.onProjectCreate = async (projectName, icon) => {
			await this.projectService.createEmptyProject(this.file, projectName);
			this.refresh();
		};

		this.projectManager.onProjectUpdate = async (oldName, newName, icon) => {
			if (this.file) {
				if (oldName !== newName) {
					await this.projectService.updateProjectName(this.file, oldName, newName);

					if (this.filterManager.getSelectedProject() === oldName) {
						this.filterManager.setProjectFilter(newName);
					}
				}

				if (oldName === newName) {
					this.refresh();
				}
			}
		};

		this.projectManager.onProjectDelete = async (projectName) => {
			if (this.file) {
				await this.projectService.deleteProject(this.file, projectName);
				if (this.filterManager.getSelectedProject() === projectName) {
					this.filterManager.setProjectFilter('');
				}
				await this.loadFileContent();
			}
		};

		this.projectManager.onProjectPin = async (projectName, isPinned) => {
			await this.projectService.toggleProjectPin(this.file, projectName, isPinned);
			this.refresh();
		};

		// Filter handlers
		this.filterManager.onFilterChange = () => {
			this.refresh();
		};

		this.renderer.onProjectSelect = (project) => {
			this.filterManager.setProjectFilter(project);
		};

		this.renderer.onTimeFilterSelect = (filter) => {
			this.filterManager.setTimeFilter(filter);
		};

		this.renderer.onSearchChange = (query) => {
			this.filterManager.setSearchQuery(query);
		};

		this.renderer.onSortChange = (sortOption) => {
			this.filterManager.setSortOption(sortOption);
		};

		this.renderer.onContextFilterChange = (context) => {
			this.filterManager.setContextFilter(context);
		};

		this.renderer.onSpecialFilterSelect = (filter) => {
			this.filterManager.setSpecialFilter(filter);
		};

		this.renderer.onProjectReorder = async (projectName, newIndex, isPinned) => {
			this.projectManager.reorderProject(projectName, newIndex, isPinned);

			if (isPinned) {
				await this.projectManager.savePinnedProjects(this.file);
			} else {
				await this.projectManager.saveAllKnownProjects(this.file);
			}

			this.refresh();
		};

		this.renderer.onProjectTogglePin = async (projectName, shouldPin) => {
			await this.projectManager.onProjectPin(projectName, shouldPin);
		};
	}

	getViewType(): string {
		return VIEW_TYPE_TODO_TXT;
	}

	getIcon(): string {
		return 'circle-check-big';
	}

	getViewData(): string {
		return this.data || '';
	}

	setViewData(data: string, clear: boolean): void {
		this.data = data;

		if (clear) {
			this.todoItems = [];
		}

		this.todoItems = TodoParser.parseTodoTxt(data);
		this.updateManagers().then(() => this.refresh());
	}

	clear(): void {
		this.contentEl.empty();
	}

	// Called when view opens
	async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass('todo-txt-view');
		this.render();
	}

	// Called when file loads
	async onLoadFile(file: TFile): Promise<void> {
		this.projectManager.loadPinnedProjects(file);
		this.projectManager.loadAllKnownProjects(file);
		this.projectManager.loadProjectIcons(file);
		await super.onLoadFile(file);
	}

	// Restore view state
	async setState(state: any, result: any): Promise<void> {
		await this.stateManager.loadState(state, this);
		await super.setState(state, result);
	}

	// Save current state
	getState(): any {
		return this.stateManager.saveState(this);
	}

	// Update managers with current data
	private async updateManagers(): Promise<void> {
		this.taskManager.setTodoItems(this.todoItems);

		// Check for new projects before update
		const oldProjectsCount = this.projectManager.allKnownProjects.length;
		this.projectManager.updateFromTodoItems(this.todoItems);

		// Save projects if new ones found
		if (this.projectManager.allKnownProjects.length > oldProjectsCount) {
			await this.projectManager.saveAllKnownProjects(this.file);
		}

		// Extract available contexts and projects
		const contexts = new Set<string>();
		const projects = new Set<string>();

		this.todoItems.forEach(item => {
			item.contexts.forEach(c => contexts.add(c));
			item.projects.forEach(p => projects.add(p));
		});

		this.filterManager.setAvailableContexts(Array.from(contexts));
		this.filterManager.setAvailableProjects(Array.from(projects));
	}

	// Render filtered view
	private render(): void {
		const availableContexts = this.filterManager.getContextsForCurrentFilters(this.todoItems);
		this.filterManager.setAvailableContexts(availableContexts);

		const filteredItems = this.filterManager.applyFilters(this.todoItems);

		this.renderer.render(
			filteredItems,
			this.todoItems,
			this.filterManager.getState(),
			this.projectManager.pinnedProjects,
			this.projectManager.allKnownProjects,
			this.file
		);
	}

	private refresh(): void {
		this.render();
	}

	// Read and parse file content
	async loadFileContent(): Promise<void> {
		if (this.file) {
			const content = await this.fileService.readFile(this.file);
			this.setViewData(content, true);
		}
	}

	// Open task creation modal
	public openAddTaskModal(): void {
		this.taskManager.openAddTaskModal(
			this.projectManager.getAvailableProjects(),
			this.filterManager.getAvailableContexts(),
			this.filterManager.getDefaultProject(),
			this.filterManager.getDefaultDueDate()
		);
	}

	// Apply quick filter
	public setFilter(filter: string): void {
		this.filterManager.setQuickFilter(filter);
	}

	// Clean up on view close
	async onClose(): Promise<void> {
		this.renderer.destroy();
		await super.onClose();
	}

	public getFile(): TFile | null { return this.file; }
	public getFilterManager(): FilterManager { return this.filterManager; }
	public getProjectManager(): ProjectManager { return this.projectManager; }

	// Load plugin default file
	public async loadDefaultFile(): Promise<void> {
		try {
			const defaultFile = await this.plugin.getDefaultTodoFile();
			await this.leaf.openFile(defaultFile);
		} catch (error) {
			console.error('Failed to load default todo file:', error);
		}
	}
}