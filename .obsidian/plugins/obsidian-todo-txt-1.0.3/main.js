/**
	Todo.txt v1.0.3
	@author Mahmudul
	@url https://github.com/SearchMahmudul
**/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => TodoTxtPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian8 = require("obsidian");

// src/types.ts
var DEFAULT_SETTINGS = {
  todoFilePath: "Todo.txt",
  openOnStartup: false,
  sidebarCollapsed: false,
  startupFilter: "All",
  pinnedProjects: {}
};
var VIEW_TYPE_TODO_TXT = "todo-txt-view";

// src/settings.ts
var import_obsidian = require("obsidian");
var TodoTxtSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Tasks location").setDesc("Enter the .txt file path to open your tasks.").addText(
      (text) => text.setPlaceholder("folder/file.txt").setValue(this.plugin.settings.todoFilePath).onChange(async (value) => {
        this.plugin.settings.todoFilePath = value.trim() || DEFAULT_SETTINGS.todoFilePath;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Startup filter").setDesc("Enter the filter to select on startup.").addText(
      (text) => text.setPlaceholder("All").setValue(this.plugin.settings.startupFilter).onChange(async (value) => {
        this.plugin.settings.startupFilter = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Open on startup").setDesc("Automatically open Todo.txt when Obsidian starts").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.openOnStartup).onChange(async (value) => {
        this.plugin.settings.openOnStartup = value;
        await this.plugin.saveSettings();
      })
    );
  }
};

// src/view.ts
var import_obsidian6 = require("obsidian");

// src/parser.ts
var TodoParser = class {
  // Parse entire todo file
  static parseTodoTxt(content) {
    const lines = content.split("\n").filter((line) => line.trim().length > 0);
    return lines.map((line) => this.parseTodoLine(line));
  }
  // Parse single todo line
  static parseTodoLine(line) {
    const item = {
      completed: false,
      priority: "",
      creationDate: "",
      completionDate: "",
      description: "",
      projects: [],
      contexts: [],
      keyValuePairs: {},
      raw: line
    };
    let parts = line.trim().split(/\s+/);
    let index = 0;
    if (parts[index] === "x") {
      item.completed = true;
      index++;
    }
    if (parts[index] && /^\d{4}-\d{2}-\d{2}$/.test(parts[index]) && item.completed) {
      item.completionDate = parts[index];
      index++;
    }
    if (parts[index] && /^\([A-Z]\)$/.test(parts[index])) {
      item.priority = parts[index].slice(1, -1);
      index++;
    }
    if (parts[index] && /^\d{4}-\d{2}-\d{2}$/.test(parts[index])) {
      item.creationDate = parts[index];
      index++;
    }
    let remainingLine = parts.slice(index).join(" ");
    const descNotesMatch = remainingLine.match(/\|\|(.+)$/);
    if (descNotesMatch) {
      item.descriptionNotes = descNotesMatch[1].trim().replace(/\\n/g, "\n");
      remainingLine = remainingLine.replace(/\s*\|\|.+$/, "").trim();
    }
    item.description = remainingLine;
    const remainingParts = remainingLine.split(/\s+/).filter((part) => part.length > 0);
    remainingParts.forEach((part) => {
      if (part.startsWith("+") && part.length > 1) {
        item.projects.push(part.slice(1));
      } else if (part.startsWith("@") && part.length > 1) {
        item.contexts.push(part.slice(1));
      } else if (part.includes(":") && !part.includes(" ") && !part.startsWith("http")) {
        const [key, value] = part.split(":", 2);
        if (key && value) {
          item.keyValuePairs[key] = value;
        }
      }
    });
    return item;
  }
};

// src/utils/icons.ts
var Icons = {
  all: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>',
  today: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
  upcoming: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>',
  inbox: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22,12 16,12 14,15 10,15 8,12 2,12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
  archived: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>',
  completed: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
  threeDots: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis-icon lucide-ellipsis"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
  add: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-icon lucide-trash"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  repeat: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`,
  hash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hash-icon lucide-hash"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search-icon lucide-search"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>',
  clear: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  menu: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-align-justify-icon lucide-align-justify"><path d="M3 12h18"/><path d="M3 18h18"/><path d="M3 6h18"/></svg>',
  sort: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings2-icon lucide-settings-2"><path d="M14 17H5"/><path d="M19 7h-9"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>'
};
function getIcon(name) {
  return Icons[name] || "";
}
function createSVGElement(svgString) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = svgString;
  const svgElement = tempDiv.firstElementChild;
  return svgElement;
}

// src/components/ui/taskContentRenderer.ts
var TaskContentRenderer = class {
  constructor(projectManager, onSearchTag, app) {
    this.projectManager = projectManager;
    this.onSearchTag = onSearchTag;
    this.app = app;
  }
  // Render main description
  renderDescription(container, item) {
    const descriptionLine = container.createDiv("todo-description-line");
    const descriptionEl = descriptionLine.createDiv("todo-description");
    this.renderFormattedDescription(descriptionEl, item);
  }
  // Render description notes
  renderDescriptionNotes(container, notes) {
    const notesLine = container.createDiv("todo-description-notes-line");
    const notesEl = notesLine.createDiv("task-description-notes");
    this.renderFormattedNotes(notesEl, notes);
  }
  // Render inline project tags
  renderInlineProjects(container, projects, item) {
    const inlineProjectsEl = container.createDiv("todo-projects-inline");
    projects.forEach((project) => {
      const projectEl = inlineProjectsEl.createSpan("todo-project-meta");
      const displayProject = this.getDisplayProject(project, item);
      const textSpan = projectEl.createSpan("todo-project-text");
      textSpan.setText(displayProject.replace(/_/g, " "));
      const iconSpan = projectEl.createSpan("todo-project-icon");
      const icon = this.getProjectIcon(displayProject);
      if (icon.includes("<svg")) {
        const svgElement = createSVGElement(icon);
        iconSpan.appendChild(svgElement);
      } else {
        iconSpan.setText(icon);
      }
    });
  }
  renderFormattedDescription(container, item) {
    let displayDescription = item.description;
    if (item.completed || item.projects.includes("Archived")) {
      displayDescription = displayDescription.replace(/\s+pri:[A-Z]\b/g, "").trim();
    }
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    let lastIndex = 0;
    let match;
    while ((match = wikiLinkRegex.exec(displayDescription)) !== null) {
      const beforeText = displayDescription.substring(lastIndex, match.index);
      this.renderTextPart(container, beforeText);
      const linkText = match[1];
      const linkEl = container.createSpan("wiki-link");
      linkEl.setText(linkText);
      linkEl.addEventListener("click", (e) => {
        e.stopPropagation();
        this.openWikiLink(linkText);
      });
      lastIndex = match.index + match[0].length;
    }
    const remainingText = displayDescription.substring(lastIndex);
    this.renderTextPart(container, remainingText);
  }
  renderTextPart(container, text) {
    const parts = text.split(/(\s+)/);
    parts.forEach((part) => {
      if (part.trim() === "") {
        container.appendChild(document.createTextNode(part));
      } else if (part.startsWith("+") && part.match(/^\+\w+/)) {
        return;
      } else if (part.startsWith("@") && part.match(/^@\S+/)) {
        const contextEl = container.createSpan("context-tag");
        contextEl.setText(part.substring(1));
      } else if (part.startsWith("#")) {
        const hashtagEl = container.createSpan("hashtag-tag");
        hashtagEl.setText(part);
        hashtagEl.addEventListener("click", (e) => {
          e.stopPropagation();
          this.onSearchTag(part);
        });
      } else if (part.includes(":") && !part.includes(" ") && !part.startsWith("http")) {
        const [key, value] = part.split(":", 2);
        if (key === "rec") {
          return;
        }
        if (value && value.trim()) {
          return;
        } else {
          container.appendChild(document.createTextNode(part));
        }
      } else if (part.match(/https?:\/\/[^\s]+/)) {
        const linkEl = container.createEl("a", {
          href: part,
          text: part
        });
        linkEl.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.open(part, "_blank");
        });
      } else {
        container.appendChild(document.createTextNode(part));
      }
    });
  }
  openWikiLink(linkText) {
    const file = this.app.metadataCache.getFirstLinkpathDest(linkText, "");
    if (file) {
      this.app.workspace.getLeaf(false).openFile(file);
    }
  }
  renderFormattedNotes(container, notes) {
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    let lastIndex = 0;
    let match;
    while ((match = wikiLinkRegex.exec(notes)) !== null) {
      const beforeText = notes.substring(lastIndex, match.index);
      this.renderNotesTextPart(container, beforeText);
      const linkText = match[1];
      const linkEl = container.createSpan("wiki-link");
      linkEl.setText(linkText);
      linkEl.addEventListener("click", (e) => {
        e.stopPropagation();
        this.openWikiLink(linkText);
      });
      lastIndex = match.index + match[0].length;
    }
    const remainingText = notes.substring(lastIndex);
    this.renderNotesTextPart(container, remainingText);
  }
  renderNotesTextPart(container, text) {
    const parts = text.split(/(\s+)/);
    parts.forEach((part) => {
      if (part.match(/https?:\/\/[^\s]+/)) {
        const linkEl = container.createEl("a", {
          href: part,
          text: part
        });
        linkEl.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.open(part, "_blank");
        });
      } else {
        container.appendChild(document.createTextNode(part));
      }
    });
  }
  getProjectIcon(project) {
    if (project === "Inbox")
      return Icons.inbox;
    if (project === "Archived")
      return Icons.archived;
    const customIcon = this.projectManager.getProjectIcon(project);
    return customIcon || Icons.hash;
  }
  getDisplayProject(project, item) {
    if (project === "Archived" && item.keyValuePairs.origProj) {
      const originalProjects = item.keyValuePairs.origProj.split(",");
      return originalProjects[0];
    }
    return project;
  }
};

// src/utils/dateUtils.ts
var DateUtils = class {
  // Format date for display
  static formatDate(dateString) {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    if (date.getTime() === today.getTime()) {
      return "Today";
    } else if (date.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else if (date.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    }
    const currentYear = today.getFullYear();
    const dateYear = date.getFullYear();
    if (dateYear === currentYear) {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  }
  // Get due date status
  static getDueDateStatus(dateString) {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return null;
    }
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    if (date.getTime() < today.getTime()) {
      return "overdue";
    } else if (date.getTime() === today.getTime()) {
      return "today";
    } else {
      return "upcoming";
    }
  }
};
function getCurrentLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function calculateDueDate(option) {
  const today = new Date();
  let targetDate;
  switch (option) {
    case "Today":
      targetDate = new Date(today);
      break;
    case "Tomorrow":
      targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + 1);
      break;
    case "Next Week":
      targetDate = new Date(today);
      const dayOfWeek = targetDate.getDay();
      const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
      targetDate.setDate(targetDate.getDate() + daysUntilSunday);
      break;
    case "Next Month":
      targetDate = new Date(today);
      targetDate.setDate(1);
      targetDate.setMonth(targetDate.getMonth() + 1);
      break;
    default:
      targetDate = new Date(today);
  }
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function getRepeatSyntax(option) {
  switch (option) {
    case "Daily":
      return "rec:1d";
    case "Weekly":
      return "rec:1w,sun";
    case "Monthly":
      return "rec:1m,1";
    case "Yearly":
      return "rec:Jan,1";
    default:
      return "";
  }
}

// src/components/ui/taskMetadataRenderer.ts
var TaskMetadataRenderer = class {
  constructor(projectManager) {
    this.projectManager = projectManager;
  }
  // Render metadata section
  render(container, item, renderProjects = true) {
    const metaEl = container.createDiv("todo-meta");
    const metaLeft = metaEl.createDiv("todo-meta-left");
    const metaRight = metaEl.createDiv("todo-meta-right");
    this.renderDates(metaLeft, item);
    this.renderKeyValuePairs(metaLeft, item);
    if (renderProjects && item.projects.length > 0) {
      this.renderProjects(metaRight, item);
    }
  }
  renderDates(container, item) {
    if (item.completed && item.completionDate) {
      const formattedDate = DateUtils.formatDate(item.completionDate);
      const completionDateEl = container.createSpan("todo-date completion-date");
      completionDateEl.setText(formattedDate);
    }
    if (item.projects.includes("Archived") && !item.completed && item.creationDate) {
      const formattedDate = DateUtils.formatDate(item.creationDate);
      const creationDateEl = container.createSpan("todo-date creation-date");
      creationDateEl.setText(formattedDate);
    }
    const dueMatch = item.description.match(/due:(\d{4}-\d{2}-\d{2})/);
    if (dueMatch && !item.completed && !item.projects.includes("Archived")) {
      const dueDateValue = dueMatch[1];
      const formattedDate = DateUtils.formatDate(dueDateValue);
      const dueDateStatus = DateUtils.getDueDateStatus(dueDateValue);
      const dueDateEl = container.createSpan("todo-due-date");
      dueDateEl.appendText(formattedDate);
      const hasRecurrence = item.keyValuePairs.rec || item.description.includes("rec:");
      if (hasRecurrence) {
        const repeatIcon = dueDateEl.createSpan("repeat-icon");
        const repeatSvg = createSVGElement(Icons.repeat);
        repeatIcon.appendChild(repeatSvg);
      }
      if (dueDateStatus) {
        dueDateEl.addClass(dueDateStatus);
      }
    }
    if (item.completed && !item.completionDate) {
      const completionDateEl = container.createSpan("todo-date completion-date");
      completionDateEl.setText("Completed");
    }
  }
  renderProjects(container, item) {
    const projectsEl = container.createDiv("todo-projects-meta");
    item.projects.forEach((project) => {
      const projectEl = projectsEl.createSpan("todo-project-meta");
      const displayProject = this.getDisplayProject(project, item);
      const textSpan = projectEl.createSpan("todo-project-text");
      textSpan.setText(displayProject.replace(/_/g, " "));
      const iconSpan = projectEl.createSpan("todo-project-icon");
      const icon = this.getProjectIcon(displayProject);
      if (icon.includes("<svg")) {
        const svgElement = createSVGElement(icon);
        iconSpan.appendChild(svgElement);
      } else {
        iconSpan.setText(icon);
      }
    });
  }
  renderKeyValuePairs(container, item) {
    const kvPairs = Object.entries(item.keyValuePairs).filter(
      ([key]) => key !== "pri" && key !== "due" && key !== "rec" && key !== "origProj" && key !== "||https" && key !== "||http"
    );
    if (kvPairs.length > 0) {
      const kvEl = container.createDiv("todo-kv");
      kvPairs.forEach(([key, value]) => {
        const kvPair = kvEl.createSpan("todo-kv-pair");
        kvPair.setText(`${key}:${value}`);
      });
    }
  }
  getProjectIcon(project) {
    if (project === "Inbox")
      return Icons.inbox;
    if (project === "Archived")
      return Icons.archived;
    const customIcon = this.projectManager.getProjectIcon(project);
    return customIcon || Icons.hash;
  }
  getDisplayProject(project, item) {
    if (project === "Archived" && item.keyValuePairs.origProj) {
      const originalProjects = item.keyValuePairs.origProj.split(",");
      return originalProjects[0];
    }
    return project;
  }
};

// src/components/ui/taskItem.ts
var TaskItem = class {
  constructor(taskManager, projectManager, filterManager, onSearchTag, app) {
    this.taskManager = taskManager;
    this.projectManager = projectManager;
    this.filterManager = filterManager;
    this.onSearchTag = onSearchTag;
    this.app = app;
    this.contentRenderer = new TaskContentRenderer(projectManager, onSearchTag, app);
    this.metadataRenderer = new TaskMetadataRenderer(projectManager);
  }
  // Render complete task item
  render(container, item) {
    const todoEl = container.createDiv("todo-item");
    if (item.completed) {
      todoEl.addClass("completed");
    } else if (item.projects.includes("Archived")) {
      todoEl.addClass("archived");
    }
    this.renderCheckbox(todoEl, item);
    this.renderContent(todoEl, item);
    todoEl.addEventListener("click", (e) => {
      const target = e.target;
      if (!target.classList.contains("todo-checkbox")) {
        this.taskManager.editTask(
          item,
          this.projectManager.getAvailableProjects(),
          this.filterManager.getAvailableContexts()
        );
      }
    });
  }
  renderCheckbox(container, item) {
    const checkbox = container.createEl("input", { type: "checkbox" });
    checkbox.checked = item.completed || item.projects.includes("Archived");
    checkbox.addClass("todo-checkbox");
    if (item.completed) {
      checkbox.addClass("todo-checkbox-completed");
    } else if (item.projects.includes("Archived")) {
      checkbox.addClass("todo-checkbox-archived");
    }
    const priorityForDisplay = this.getPriorityForDisplay(item);
    if (priorityForDisplay) {
      if (["A", "B", "C"].includes(priorityForDisplay)) {
        checkbox.addClass(`priority-${priorityForDisplay.toLowerCase()}`);
      } else {
        checkbox.addClass("priority-other");
      }
    }
    checkbox.addEventListener("change", async (event) => {
      const isChecked = event.target.checked;
      if (item.projects.includes("Archived")) {
        if (!isChecked) {
          await this.taskManager.moveTaskFromArchived(item);
        }
      } else {
        if (isChecked) {
          await this.taskManager.completeTask(item);
        } else {
          await this.taskManager.uncompleteTask(item);
        }
      }
    });
  }
  renderContent(container, item) {
    const contentEl = container.createDiv("todo-content");
    const mainLine = contentEl.createDiv("todo-main");
    const dueMatch = item.description.match(/due:(\d{4}-\d{2}-\d{2})/);
    const hasDueDate = dueMatch && !item.completed;
    const hasDescriptionNotes = !!item.descriptionNotes;
    const hasKeyValuePairs = Object.keys(item.keyValuePairs).filter((k) => k !== "pri" && k !== "due").length > 0;
    const isMobile = this.getContainerWidth() <= 768;
    const isCompleted = item.completed;
    const isArchived = item.projects.includes("Archived");
    this.contentRenderer.renderDescription(mainLine, item);
    const shouldShowInlineProjects = !isCompleted && !isArchived && !hasDueDate && !hasDescriptionNotes && !hasKeyValuePairs && item.projects.length > 0 && !isMobile;
    if (shouldShowInlineProjects) {
      const descriptionLine = mainLine.querySelector(".todo-description-line");
      if (descriptionLine) {
        this.contentRenderer.renderInlineProjects(descriptionLine, item.projects, item);
      }
    }
    if (hasDescriptionNotes) {
      this.contentRenderer.renderDescriptionNotes(mainLine, item.descriptionNotes || "");
      if (!isCompleted && !isArchived && !hasDueDate && !hasKeyValuePairs && item.projects.length > 0 && !isMobile) {
        const notesLine = mainLine.querySelector(".todo-description-notes-line");
        if (notesLine) {
          this.contentRenderer.renderInlineProjects(notesLine, item.projects, item);
        }
      }
    }
    const needsMetadata = hasDueDate || hasKeyValuePairs || item.completionDate || isCompleted && item.projects.length > 0 || isArchived && item.projects.length > 0 || isMobile && item.projects.length > 0;
    if (needsMetadata) {
      const shouldRenderProjectsInMeta = isCompleted || isArchived || hasDueDate || hasKeyValuePairs || isMobile;
      this.metadataRenderer.render(contentEl, item, shouldRenderProjectsInMeta);
    }
  }
  getContainerWidth() {
    const container = document.querySelector(".todo-txt-view");
    return container ? container.clientWidth : window.innerWidth;
  }
  getPriorityForDisplay(item) {
    if (item.priority)
      return item.priority;
    if (item.completed && item.keyValuePairs.pri)
      return item.keyValuePairs.pri;
    return null;
  }
};

// src/components/ui/taskControls.ts
var TaskControls = class {
  constructor(filterManager, taskManager, projectManager, onSearchChange, onSortChange, onContextFilterChange, completedFilter = false) {
    this.filterManager = filterManager;
    this.taskManager = taskManager;
    this.projectManager = projectManager;
    this.onSearchChange = onSearchChange;
    this.onSortChange = onSortChange;
    this.onContextFilterChange = onContextFilterChange;
    this.completedFilter = completedFilter;
    // UI element references
    this.searchInputEl = null;
    this.contextFilterEl = null;
    this.sortOptionsVisible = false;
  }
  // Render all task controls
  render(container, searchQuery, sortOption, contextFilter, completedFilter) {
    this.completedFilter = completedFilter;
    const controlsContainer = container.createDiv("todo-controls");
    const searchWrapper = controlsContainer.createDiv("search-sort-wrapper");
    this.renderSearchInput(searchWrapper, searchQuery);
    this.renderSortToggle(searchWrapper);
    const sortOptionsWrapper = controlsContainer.createDiv("sort-options-wrapper");
    if (this.sortOptionsVisible) {
      sortOptionsWrapper.addClass("visible");
    }
    this.renderSortDropdown(sortOptionsWrapper, sortOption, completedFilter);
    this.renderContextFilter(sortOptionsWrapper, contextFilter);
    this.renderAddTaskButton(controlsContainer);
  }
  // Render search input with clear button
  renderSearchInput(container, searchQuery) {
    const searchContainer = container.createDiv("search-container");
    const searchIcon = searchContainer.createSpan("search-icon");
    const searchSvg = createSVGElement(Icons.search);
    searchIcon.appendChild(searchSvg);
    const searchInput = searchContainer.createEl("input", {
      type: "text",
      placeholder: "Search",
      value: searchQuery,
      cls: "search-input"
    });
    this.searchInputEl = searchInput;
    const clearBtn = searchContainer.createEl("button", {
      title: "Clear search",
      cls: "clear-search-btn"
    });
    const clearSvg = createSVGElement(Icons.clear);
    clearBtn.appendChild(clearSvg);
    const updateClearButtonVisibility = () => {
      if (searchInput.value.trim() === "") {
        clearBtn.addClass("hidden");
      } else {
        clearBtn.removeClass("hidden");
      }
    };
    updateClearButtonVisibility();
    searchInput.addEventListener("input", (e) => {
      e.stopPropagation();
      updateClearButtonVisibility();
      this.onSearchChange(e.target.value);
    });
    searchInput.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    clearBtn.addEventListener("click", () => {
      if (this.searchInputEl) {
        this.searchInputEl.value = "";
        this.searchInputEl.focus();
      }
      updateClearButtonVisibility();
      this.onSearchChange("");
    });
  }
  // Render sort options toggle button
  renderSortToggle(container) {
    const sortToggleBtn = container.createDiv("sort-toggle-btn");
    const sortSvg = createSVGElement(Icons.sort);
    sortToggleBtn.appendChild(sortSvg);
    sortToggleBtn.setAttribute("title", "Sort options");
    sortToggleBtn.addEventListener("click", () => {
      var _a;
      this.sortOptionsVisible = !this.sortOptionsVisible;
      const sortOptionsWrapper = (_a = container.parentElement) == null ? void 0 : _a.querySelector(".sort-options-wrapper");
      if (sortOptionsWrapper) {
        sortOptionsWrapper.classList.toggle("visible", this.sortOptionsVisible);
      }
    });
  }
  // Render sort dropdown menu
  renderSortDropdown(container, sortOption, completedFilter) {
    const sortContainer = container.createDiv("sort-container");
    sortContainer.createSpan("sort-label").setText("Sort by:");
    const sortSelect = sortContainer.createEl("select", { cls: "sort-select" });
    const sortOptions = [
      { value: "priority", text: "Priority" },
      { value: "duedate", text: "Due Date" },
      { value: "projects", text: "Projects" },
      { value: "contexts", text: "Contexts" },
      { value: "alphabetical", text: "Alphabetical" },
      { value: "creation", text: "Creation Date" }
    ];
    if (completedFilter) {
      sortOptions.push({ value: "completion", text: "Completion Date" });
    }
    sortOptions.forEach((option) => {
      const optionEl = sortSelect.createEl("option", {
        value: option.value,
        text: option.text
      });
      if (option.value === sortOption) {
        optionEl.selected = true;
      }
    });
    sortSelect.addEventListener("change", (e) => {
      this.onSortChange(e.target.value);
    });
  }
  // Render context filter dropdown
  renderContextFilter(container, contextFilter) {
    const contextContainer = container.createDiv("context-filter-container");
    contextContainer.createSpan("context-filter-label").setText("Context:");
    const contextSelect = contextContainer.createEl("select", { cls: "context-filter-select" });
    this.contextFilterEl = contextSelect;
    const allOption = contextSelect.createEl("option", { value: "", text: "All" });
    if (contextFilter === "") {
      allOption.selected = true;
    }
    const contexts = this.filterManager.getAvailableContexts();
    contexts.forEach((context) => {
      const optionEl = contextSelect.createEl("option", {
        value: context,
        text: context
      });
      if (context === contextFilter) {
        optionEl.selected = true;
      }
    });
    const noneOption = contextSelect.createEl("option", { value: "NONE", text: "None" });
    if (contextFilter === "NONE") {
      noneOption.selected = true;
    }
    contextSelect.addEventListener("change", (e) => {
      this.onContextFilterChange(e.target.value);
    });
  }
  // Render add task or empty button
  renderAddTaskButton(container) {
    if (this.completedFilter) {
      const emptyButton = container.createEl("button", {
        cls: "empty-tasks-button mobile-fab-button"
      });
      const iconSpan = emptyButton.createSpan("empty-tasks-icon");
      const trashSvg = createSVGElement(Icons.trash);
      iconSpan.appendChild(trashSvg);
      emptyButton.createSpan("empty-tasks-text").setText("Empty");
      emptyButton.addEventListener("click", () => {
        this.taskManager.openEmptyCompletedTasksModal();
      });
    } else {
      const addButton = container.createEl("button", {
        cls: "add-task-button mobile-fab-button"
      });
      const iconSpan = addButton.createSpan("add-task-icon");
      const addSvg = createSVGElement(Icons.add);
      iconSpan.appendChild(addSvg);
      addButton.createSpan("add-task-text").setText("Add task");
      addButton.addEventListener("click", () => {
        this.taskManager.openAddTaskModal(
          this.projectManager.getAvailableProjects(),
          this.filterManager.getAvailableContexts(),
          this.filterManager.getDefaultProject(),
          this.filterManager.getDefaultDueDate()
        );
      });
    }
  }
  // Set search input value
  setSearchValue(value) {
    if (this.searchInputEl) {
      this.searchInputEl.value = value;
    }
  }
};

// src/utils/taskCounter.ts
var TaskCounter = class {
  // Count active tasks
  static getAllTasksCount(items) {
    return items.filter((item) => !item.completed && !item.projects.includes("Archived")).length;
  }
  // Count tasks due today or overdue
  static getTodayTasksCount(items) {
    const today = new Date().toISOString().split("T")[0];
    return items.filter((item) => {
      if (item.completed || item.projects.includes("Archived"))
        return false;
      const dueMatch = item.description.match(/due:(\d{4}-\d{2}-\d{2})/);
      return dueMatch && dueMatch[1] <= today;
    }).length;
  }
  // Count future tasks
  static getUpcomingTasksCount(items) {
    const today = new Date().toISOString().split("T")[0];
    return items.filter((item) => {
      if (item.completed || item.projects.includes("Archived"))
        return false;
      const dueMatch = item.description.match(/due:(\d{4}-\d{2}-\d{2})/);
      return dueMatch && dueMatch[1] > today;
    }).length;
  }
  // Count unorganized tasks
  static getInboxTasksCount(items) {
    return items.filter(
      (item) => !item.completed && (item.projects.length === 0 || item.projects.includes("Inbox"))
    ).length;
  }
  // Count archived tasks
  static getArchivedTasksCount(items) {
    return items.filter((item) => item.projects.includes("Archived")).length;
  }
  // Count finished tasks
  static getCompletedTasksCount(items) {
    return items.filter((item) => item.completed).length;
  }
};

// src/components/ui/filterItem.ts
var FilterItem = class {
  // Render sidebar filter button
  static render(container, filterId, label, count, filterState, onClick) {
    const item = container.createDiv(`project-item ${filterId}-filter`);
    const isSelected = this.isFilterSelected(filterId, filterState);
    if (isSelected) {
      item.addClass("selected");
    }
    const icon = item.createSpan("project-icon");
    const svgElement = createSVGElement(getIcon(filterId));
    icon.appendChild(svgElement);
    const text = item.createSpan("project-text");
    text.setText(label);
    const countEl = item.createSpan("project-count");
    countEl.setText(count.toString());
    item.addEventListener("click", onClick);
  }
  // Check if filter is currently active
  static isFilterSelected(filterId, filterState) {
    switch (filterId) {
      case "all":
        return !filterState.selectedProject && !filterState.selectedTimeFilter && !filterState.archivedFilter && !filterState.completedFilter;
      case "today":
        return filterState.selectedTimeFilter === "today" && !filterState.archivedFilter && !filterState.completedFilter;
      case "upcoming":
        return filterState.selectedTimeFilter === "upcoming" && !filterState.archivedFilter && !filterState.completedFilter;
      case "inbox":
        return filterState.selectedProject === "Inbox" && !filterState.selectedTimeFilter && !filterState.archivedFilter && !filterState.completedFilter;
      case "archived":
        return filterState.archivedFilter;
      case "completed":
        return filterState.completedFilter;
      default:
        return false;
    }
  }
};

// src/components/ui/dragHandler.ts
var DragHandler = class {
  constructor(onReorder, onTogglePin) {
    this.onReorder = onReorder;
    this.onTogglePin = onTogglePin;
    // Mobile touch state
    this.isDragging = false;
    this.startY = 0;
    this.startX = 0;
    this.longPressTimer = null;
    this.longPressActivated = false;
    this.touchHandled = false;
    this.dragClone = null;
  }
  // Setup all drag events for draggable item
  setupDragEvents(dragItem, itemName, container) {
    this.setupDesktopDragEvents(dragItem, itemName, container);
    this.setupMobileTouchEvents(dragItem, itemName, container);
    return () => this.touchHandled;
  }
  // Desktop drag and drop events
  setupDesktopDragEvents(dragItem, itemName, container) {
    dragItem.addEventListener("dragstart", (e) => {
      var _a;
      (_a = e.dataTransfer) == null ? void 0 : _a.setData("text/plain", itemName);
      dragItem.addClass("dragging");
    });
    dragItem.addEventListener("dragend", () => {
      dragItem.removeClass("dragging");
      document.querySelectorAll(".section-highlight").forEach((el) => el.removeClass("section-highlight"));
      document.querySelectorAll(".drop-target-highlight").forEach((el) => el.removeClass("drop-target-highlight"));
    });
    dragItem.addEventListener("dragover", (e) => {
      e.preventDefault();
      const draggingElement = container.querySelector(".dragging");
      if (!draggingElement || draggingElement === dragItem)
        return;
      const draggedFromPinned = draggingElement.closest(".pinned-projects-list") !== null;
      const isPinnedContainer = container.classList.contains("pinned-projects-list");
      container.querySelectorAll(".drop-target-highlight").forEach((el) => el.removeClass("drop-target-highlight"));
      if (draggedFromPinned === isPinnedContainer) {
        const rect = dragItem.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const isAbove = e.clientY < midY;
        if (isAbove) {
          dragItem.addClass("drop-target-highlight");
        } else {
          const nextItem = dragItem.nextElementSibling;
          if (nextItem && nextItem.classList.contains("project-item")) {
            nextItem.addClass("drop-target-highlight");
          }
        }
      }
    });
    dragItem.addEventListener("drop", (e) => {
      var _a;
      e.preventDefault();
      container.querySelectorAll(".drop-target-highlight").forEach((el) => el.removeClass("drop-target-highlight"));
      const draggedItem = (_a = e.dataTransfer) == null ? void 0 : _a.getData("text/plain");
      if (!draggedItem || draggedItem === itemName)
        return;
      const draggedElement = document.querySelector(`[data-project="${draggedItem}"]`);
      if (!draggedElement)
        return;
      const isPinnedContainer = container.classList.contains("pinned-projects-list");
      const draggedFromPinned = draggedElement.closest(".pinned-projects-list") !== null;
      if (draggedFromPinned !== isPinnedContainer) {
        this.onTogglePin(draggedItem, isPinnedContainer);
      } else {
        this.handleDrop(draggedItem, itemName, container);
      }
    });
  }
  // Mobile touch events
  setupMobileTouchEvents(dragItem, itemName, container) {
    dragItem.addEventListener("touchstart", (e) => {
      this.startY = e.touches[0].clientY;
      this.startX = e.touches[0].clientX;
      this.isDragging = false;
      this.longPressActivated = false;
      this.touchHandled = false;
      this.longPressTimer = setTimeout(() => {
        this.longPressActivated = true;
        this.touchHandled = true;
        dragItem.addClass("long-press-ready");
      }, 500);
    });
    dragItem.addEventListener("touchmove", (e) => {
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const moveDistance = Math.sqrt(Math.pow(currentX - this.startX, 2) + Math.pow(currentY - this.startY, 2));
      if (!this.longPressActivated && moveDistance > 10) {
        if (this.longPressTimer) {
          clearTimeout(this.longPressTimer);
          this.longPressTimer = null;
        }
        return;
      }
      if (this.longPressActivated && !this.isDragging && moveDistance > 5) {
        this.isDragging = true;
        this.touchHandled = true;
        dragItem.addClass("dragging");
        this.dragClone = dragItem.cloneNode(true);
        this.dragClone.addClass("mobile-drag-clone");
        document.body.appendChild(this.dragClone);
        e.preventDefault();
        e.stopPropagation();
      }
      if (this.isDragging && this.dragClone) {
        e.preventDefault();
        e.stopPropagation();
        this.dragClone.style.setProperty("--drag-x", `${currentX - 100}px`);
        this.dragClone.style.setProperty("--drag-y", `${currentY - 25}px`);
        this.updateDragHighlights(currentX, currentY, dragItem, container);
      }
    });
    dragItem.addEventListener("touchend", (e) => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      dragItem.removeClass("long-press-ready");
      if (this.isDragging) {
        e.preventDefault();
        e.stopPropagation();
        this.touchHandled = true;
        this.handleTouchDrop(e, itemName, dragItem);
        this.cleanupDrag();
      }
      setTimeout(() => {
        this.isDragging = false;
        this.longPressActivated = false;
        this.touchHandled = false;
      }, 50);
    });
    dragItem.addEventListener("touchcancel", () => {
      this.cancelDrag(dragItem);
    });
  }
  // Update drag highlights during touch move
  updateDragHighlights(currentX, currentY, dragItem, container) {
    const elementBelow = document.elementFromPoint(currentX, currentY);
    const targetItem = elementBelow == null ? void 0 : elementBelow.closest(".project-item");
    const targetSection = elementBelow == null ? void 0 : elementBelow.closest(".projects-list, .pinned-projects-list");
    document.querySelectorAll(".drop-target-highlight, .section-highlight").forEach((el) => {
      el.removeClass("drop-target-highlight");
      el.removeClass("section-highlight");
    });
    if (targetSection) {
      const isPinnedTarget = targetSection.classList.contains("pinned-projects-list");
      const isDraggedFromPinned = container.classList.contains("pinned-projects-list");
      if (isDraggedFromPinned !== isPinnedTarget) {
        targetSection.addClass("section-highlight");
      }
      if (targetItem && targetItem !== dragItem && isDraggedFromPinned === isPinnedTarget) {
        targetItem.addClass("drop-target-highlight");
      }
    }
  }
  // Touch drop
  handleTouchDrop(e, itemName, dragItem) {
    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetItem = elementBelow == null ? void 0 : elementBelow.closest(".project-item");
    if (targetItem && targetItem !== dragItem && targetItem.dataset.project) {
      const targetContainer = targetItem.closest(".projects-list, .pinned-projects-list");
      const draggedContainer = dragItem.closest(".projects-list, .pinned-projects-list");
      const isPinnedTarget = (targetContainer == null ? void 0 : targetContainer.classList.contains("pinned-projects-list")) || false;
      const isDraggedFromPinned = (draggedContainer == null ? void 0 : draggedContainer.classList.contains("pinned-projects-list")) || false;
      if (isDraggedFromPinned !== isPinnedTarget) {
        this.onTogglePin(itemName, isPinnedTarget);
      } else {
        const highlightedElement = targetContainer.querySelector(".drop-target-highlight");
        if (highlightedElement && highlightedElement.dataset.project) {
          const projectElements = Array.from(targetContainer.querySelectorAll(".project-item"));
          const targetIndex = projectElements.indexOf(highlightedElement);
          this.onReorder(itemName, targetIndex, isPinnedTarget);
        }
      }
    }
  }
  // Desktop drop
  handleDrop(draggedItem, targetItem, container) {
    const isPinnedContainer = container.classList.contains("pinned-projects-list");
    const projectElements = Array.from(container.querySelectorAll(".project-item"));
    const targetElement = projectElements.find((el) => el.dataset.project === targetItem);
    if (!targetElement)
      return;
    const targetIndex = projectElements.indexOf(targetElement);
    this.onReorder(draggedItem, targetIndex, isPinnedContainer);
  }
  // Clean up drag elements
  cleanupDrag() {
    if (this.dragClone) {
      this.dragClone.remove();
      this.dragClone = null;
    }
    document.querySelectorAll(".drop-target-highlight, .section-highlight").forEach((el) => {
      el.removeClass("drop-target-highlight");
      el.removeClass("section-highlight");
    });
  }
  // Cancel drag operation
  cancelDrag(dragItem) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    dragItem.removeClass("long-press-ready");
    dragItem.removeClass("dragging");
    this.cleanupDrag();
    this.isDragging = false;
    this.longPressActivated = false;
    this.touchHandled = false;
  }
};

// src/components/ui/projectItem.ts
var ProjectItem = class {
  constructor(projectManager, onProjectSelect, onProjectReorder, onProjectTogglePin, toggleMobileSidebar) {
    this.projectManager = projectManager;
    this.onProjectSelect = onProjectSelect;
    this.onProjectReorder = onProjectReorder;
    this.onProjectTogglePin = onProjectTogglePin;
    this.toggleMobileSidebar = toggleMobileSidebar;
    this.containerEl = null;
    this.dragHandler = new DragHandler(onProjectReorder, onProjectTogglePin);
  }
  render(container, project, count, filterState, file) {
    this.containerEl = container.closest(".todo-txt-view");
    const projectItem = container.createDiv("project-item");
    projectItem.draggable = true;
    projectItem.dataset.project = project;
    if (filterState.selectedProject === project && !filterState.archivedFilter && !filterState.completedFilter) {
      projectItem.addClass("selected");
    }
    this.renderProjectContent(projectItem, project, count);
    this.setupEventListeners(projectItem, project, container, file);
  }
  // Render project visual content
  renderProjectContent(projectItem, project, count) {
    const projectIcon = projectItem.createSpan("project-icon");
    const icon = this.projectManager.getProjectIcon(project);
    if (icon) {
      if (icon.includes("<svg")) {
        const svgElement = createSVGElement(icon);
        projectIcon.appendChild(svgElement);
      } else {
        projectIcon.setText(icon);
      }
    } else {
      const hashSvg = createSVGElement(Icons.hash);
      projectIcon.appendChild(hashSvg);
    }
    const projectText = projectItem.createSpan("project-text");
    projectText.setText(project.replace(/_/g, " "));
    const projectCount = projectItem.createSpan("project-count");
    projectCount.setText(count.toString());
    const projectMenu = projectItem.createSpan("project-menu");
    const dotsSvg = createSVGElement(Icons.threeDots);
    projectMenu.appendChild(dotsSvg);
    projectMenu.addClass("project-menu-dots");
  }
  getContainerWidth() {
    return this.containerEl ? this.containerEl.clientWidth : window.innerWidth;
  }
  // Setup all event listeners
  setupEventListeners(projectItem, project, container, file) {
    const isTouchHandled = this.dragHandler.setupDragEvents(projectItem, project, container);
    projectItem.addEventListener("click", (e) => {
      if (isTouchHandled()) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const projectMenu = projectItem.querySelector(".project-menu");
      if (e.target === projectMenu || (projectMenu == null ? void 0 : projectMenu.contains(e.target))) {
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
};

// src/components/ui/projectsSidebar.ts
var ProjectsSidebar = class {
  constructor(projectManager, onProjectSelect, onTimeFilterSelect, onSpecialFilterSelect, onProjectReorder, onProjectTogglePin, toggleSidebar) {
    this.projectManager = projectManager;
    this.onProjectSelect = onProjectSelect;
    this.onTimeFilterSelect = onTimeFilterSelect;
    this.onSpecialFilterSelect = onSpecialFilterSelect;
    this.onProjectReorder = onProjectReorder;
    this.onProjectTogglePin = onProjectTogglePin;
    this.toggleSidebar = toggleSidebar;
    this.containerEl = null;
    this.projectItemRenderer = new ProjectItem(
      projectManager,
      onProjectSelect,
      onProjectReorder,
      onProjectTogglePin,
      toggleSidebar
    );
  }
  render(container, allItems, filterState, pinnedProjects, allKnownProjects, file, sidebarOpen) {
    this.containerEl = container.closest(".todo-txt-view");
    const sidebar = container.createDiv("projects-sidebar");
    if (sidebarOpen) {
      sidebar.addClass("open");
    } else {
      sidebar.addClass("closed");
    }
    const topSection = sidebar.createDiv("projects-top-section");
    const filters = [
      { id: "all", label: "All", count: TaskCounter.getAllTasksCount(allItems) },
      { id: "today", label: "Today", count: TaskCounter.getTodayTasksCount(allItems) },
      { id: "upcoming", label: "Upcoming", count: TaskCounter.getUpcomingTasksCount(allItems) },
      { id: "inbox", label: "Inbox", count: TaskCounter.getInboxTasksCount(allItems) },
      { id: "archived", label: "Archived", count: TaskCounter.getArchivedTasksCount(allItems) },
      { id: "completed", label: "Completed", count: TaskCounter.getCompletedTasksCount(allItems) }
    ];
    filters.forEach((filter) => {
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
    const projectCounts = this.projectManager.getProjectCounts(allItems);
    const pinnedProjectCounts = this.projectManager.getOrderedPinnedProjects(projectCounts);
    const unpinnedProjectCounts = projectCounts.filter((p) => !pinnedProjects.includes(p.project));
    if (pinnedProjectCounts.length > 0) {
      const pinnedHeaderContainer = sidebar.createDiv("pinned-header-container");
      pinnedHeaderContainer.createEl("h3", { text: "Pinned" });
      const pinnedList = sidebar.createDiv("projects-list pinned-projects-list");
      this.addSectionDragEvents(pinnedList, true);
      pinnedProjectCounts.forEach(({ project, count }) => {
        this.projectItemRenderer.render(pinnedList, project, count, filterState, file);
      });
    }
    this.renderProjectsSection(sidebar, unpinnedProjectCounts, filterState, file);
  }
  getContainerWidth() {
    return this.containerEl ? this.containerEl.clientWidth : window.innerWidth;
  }
  // Filter button clicks
  handleFilterClick(filterId) {
    switch (filterId) {
      case "all":
        this.onProjectSelect("");
        this.onTimeFilterSelect("");
        this.onSpecialFilterSelect("");
        break;
      case "today":
      case "upcoming":
        this.onTimeFilterSelect(filterId);
        break;
      case "inbox":
        this.onProjectSelect("Inbox");
        break;
      case "archived":
      case "completed":
        this.onSpecialFilterSelect(filterId);
        break;
    }
  }
  // Add drag highlight
  addSectionDragEvents(container, isPinnedSection) {
    container.addEventListener("dragover", (e) => {
      const draggingElement = document.querySelector(".dragging");
      if (!draggingElement)
        return;
      const draggedFromPinned = draggingElement.closest(".pinned-projects-list") !== null;
      if (draggedFromPinned !== isPinnedSection) {
        e.preventDefault();
        container.addClass("section-highlight");
      }
    });
    container.addEventListener("dragleave", (e) => {
      if (!container.contains(e.relatedTarget)) {
        container.removeClass("section-highlight");
      }
    });
    container.addEventListener("drop", () => {
      container.removeClass("section-highlight");
    });
  }
  // Render projects section with header
  renderProjectsSection(container, projectCounts, filterState, file) {
    const headerContainer = container.createDiv("projects-header-container");
    const title = headerContainer.createEl("h3", { text: "Projects" });
    const addIcon = headerContainer.createSpan("add-project-icon");
    const addSvg = createSVGElement(Icons.add);
    addIcon.appendChild(addSvg);
    headerContainer.addEventListener("click", (e) => {
      if (e.target === addIcon || addIcon.contains(e.target)) {
        e.stopPropagation();
        this.projectManager.openAddProjectModal(file);
      }
    });
    const projectsList = container.createDiv("projects-list");
    this.addSectionDragEvents(projectsList, false);
    projectCounts.forEach(({ project, count }) => {
      this.projectItemRenderer.render(projectsList, project, count, filterState, file);
    });
  }
};

// src/utils/responsiveManager.ts
var ResponsiveManager = class {
  constructor(containerEl, onBreakpointChange) {
    this.containerEl = containerEl;
    this.onBreakpointChange = onBreakpointChange;
    this.resizeObserver = null;
    this.currentBreakpoint = "mobile";
    this.isInitialized = false;
    this.initialize();
  }
  // Initialize responsive classes
  initialize() {
    const width = this.containerEl.offsetWidth || window.innerWidth;
    const initialBreakpoint = width > 768 ? "desktop" : "mobile";
    this.containerEl.removeClass("mobile", "desktop");
    this.containerEl.addClass(initialBreakpoint);
    this.currentBreakpoint = initialBreakpoint;
    this.setupResizeObserver();
  }
  // Setup ResizeObserver for container width changes
  setupResizeObserver() {
    if (typeof ResizeObserver !== "undefined" && !this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateResponsiveClasses();
      });
      this.resizeObserver.observe(this.containerEl);
    }
  }
  // Update responsive classes based on container width
  updateResponsiveClasses() {
    const containerWidth = this.containerEl.offsetWidth;
    const effectiveWidth = containerWidth > 0 ? containerWidth : window.innerWidth;
    const newBreakpoint = effectiveWidth > 768 ? "desktop" : "mobile";
    if (newBreakpoint !== this.currentBreakpoint) {
      const oldBreakpoint = this.currentBreakpoint;
      this.containerEl.removeClass("mobile", "desktop");
      this.containerEl.addClass(newBreakpoint);
      this.currentBreakpoint = newBreakpoint;
      if (this.isInitialized) {
        this.onBreakpointChange(newBreakpoint, oldBreakpoint);
      }
    }
  }
  // Force responsive update
  forceUpdate() {
    const containerWidth = this.containerEl.offsetWidth;
    const effectiveWidth = containerWidth > 0 ? containerWidth : window.innerWidth;
    const correctBreakpoint = effectiveWidth > 768 ? "desktop" : "mobile";
    this.containerEl.removeClass("mobile", "desktop");
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
  setInitialized() {
    this.isInitialized = true;
  }
  // Get current breakpoint
  getCurrentBreakpoint() {
    return this.currentBreakpoint;
  }
  // Cleanup ResizeObserver
  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }
};

// src/managers/viewRenderer.ts
var ViewRenderer = class {
  constructor(containerEl, taskManager, projectManager, filterManager, plugin) {
    this.containerEl = containerEl;
    this.taskManager = taskManager;
    this.projectManager = projectManager;
    this.filterManager = filterManager;
    this.plugin = plugin;
    // State
    this.searchInputHasFocus = false;
    this.sidebarOpen = false;
    this.isInitialized = false;
    // Event callbacks
    this.onProjectSelect = () => {
    };
    this.onTimeFilterSelect = () => {
    };
    this.onSearchChange = () => {
    };
    this.onSortChange = () => {
    };
    this.onContextFilterChange = () => {
    };
    this.onSpecialFilterSelect = () => {
    };
    this.onProjectReorder = () => {
    };
    this.onProjectTogglePin = () => {
    };
    this.responsiveManager = new ResponsiveManager(
      containerEl,
      (newBreakpoint, oldBreakpoint) => this.handleBreakpointChange(newBreakpoint)
    );
    const isDesktop = this.responsiveManager.getCurrentBreakpoint() === "desktop";
    this.sidebarOpen = isDesktop ? !this.plugin.settings.sidebarCollapsed : false;
    this.taskItemRenderer = new TaskItem(
      taskManager,
      projectManager,
      filterManager,
      (tag) => this.searchForTag(tag),
      this.plugin.app
    );
    this.taskControls = new TaskControls(
      filterManager,
      taskManager,
      projectManager,
      (query) => this.onSearchChange(query),
      (sortOption) => this.onSortChange(sortOption),
      (context) => this.onContextFilterChange(context)
    );
    this.projectsSidebar = new ProjectsSidebar(
      projectManager,
      (project) => this.onProjectSelect(project),
      (filter) => this.onTimeFilterSelect(filter),
      (filter) => this.onSpecialFilterSelect(filter),
      (projectName, newIndex, isPinned) => this.onProjectReorder(projectName, newIndex, isPinned),
      (projectName, shouldPin) => this.onProjectTogglePin(projectName, shouldPin),
      () => this.toggleSidebar()
    );
  }
  // Handle responsive breakpoint changes
  handleBreakpointChange(newBreakpoint) {
    if (!this.isInitialized)
      return;
    const isDesktop = newBreakpoint === "desktop";
    const shouldBeOpen = isDesktop ? !this.plugin.settings.sidebarCollapsed : false;
    if (shouldBeOpen !== this.sidebarOpen) {
      this.sidebarOpen = shouldBeOpen;
      this.updateSidebarState();
    }
  }
  // Cleanup
  destroy() {
    this.responsiveManager.destroy();
  }
  // Render complete view layout
  render(filteredItems, allItems, filterState, pinnedProjects, allKnownProjects, file) {
    var _a, _b;
    const activeElement = document.activeElement;
    this.searchInputHasFocus = (activeElement == null ? void 0 : activeElement.classList.contains("search-input")) || false;
    const sidebarScrollTop = ((_a = this.containerEl.querySelector(".projects-sidebar")) == null ? void 0 : _a.scrollTop) || 0;
    const tasksScrollTop = ((_b = this.containerEl.querySelector(".todo-tasks-container")) == null ? void 0 : _b.scrollTop) || 0;
    this.containerEl.empty();
    const mainLayout = this.containerEl.createDiv("todo-txt-content");
    this.responsiveManager.forceUpdate();
    if (!this.sidebarOpen) {
      mainLayout.addClass("sidebar-collapsed");
    }
    const mobileOverlay = mainLayout.createDiv("mobile-sidebar-overlay");
    if (this.sidebarOpen) {
      mobileOverlay.addClass("visible");
    }
    mobileOverlay.addEventListener("click", () => {
      this.toggleSidebar();
    });
    this.projectsSidebar.render(mainLayout, allItems, filterState, pinnedProjects, allKnownProjects, file, this.sidebarOpen);
    const tasksMain = mainLayout.createDiv("tasks-main");
    if (!this.sidebarOpen) {
      tasksMain.addClass("sidebar-closed");
    }
    this.renderTasksSection(tasksMain, filteredItems, filterState);
    requestAnimationFrame(() => {
      const sidebar = this.containerEl.querySelector(".projects-sidebar");
      if (sidebar)
        sidebar.scrollTop = sidebarScrollTop;
      const tasksContainer = this.containerEl.querySelector(".todo-tasks-container");
      if (tasksContainer)
        tasksContainer.scrollTop = tasksScrollTop;
    });
    if (this.searchInputHasFocus) {
      const searchInput = this.containerEl.querySelector(".search-input");
      if (searchInput) {
        searchInput.focus();
        searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
      }
    }
    if (!this.isInitialized) {
      this.isInitialized = true;
      this.responsiveManager.setInitialized();
    }
  }
  // Toggle sidebar visibility
  async toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this.updateSidebarState();
    if (this.responsiveManager.getCurrentBreakpoint() === "desktop") {
      this.plugin.settings.sidebarCollapsed = !this.sidebarOpen;
      await this.plugin.saveSettings();
    }
  }
  // Update sidebar DOM state
  updateSidebarState() {
    const sidebar = this.containerEl.querySelector(".projects-sidebar");
    const mainContent = this.containerEl.querySelector(".tasks-main");
    const overlay = this.containerEl.querySelector(".mobile-sidebar-overlay");
    const todoContent = this.containerEl.querySelector(".todo-txt-content");
    if (sidebar && mainContent) {
      if (this.sidebarOpen) {
        sidebar.addClass("open");
        sidebar.removeClass("closed");
        mainContent.removeClass("sidebar-closed");
        todoContent == null ? void 0 : todoContent.removeClass("sidebar-collapsed");
        if (this.responsiveManager.getCurrentBreakpoint() === "mobile") {
          overlay == null ? void 0 : overlay.addClass("visible");
        }
      } else {
        sidebar.addClass("closed");
        sidebar.removeClass("open");
        mainContent.addClass("sidebar-closed");
        todoContent == null ? void 0 : todoContent.addClass("sidebar-collapsed");
        overlay == null ? void 0 : overlay.removeClass("visible");
      }
    }
  }
  // Render main tasks area
  renderTasksSection(container, filteredItems, filterState) {
    const tasksSection = container.createDiv("todo-section");
    const stickyHeader = tasksSection.createDiv("todo-header-sticky");
    const headerContainer = stickyHeader.createDiv("header-title-container");
    const menuBtn = headerContainer.createDiv("menu-btn");
    const menuSvg = createSVGElement(Icons.menu);
    menuBtn.appendChild(menuSvg);
    menuBtn.addEventListener("click", () => {
      this.toggleSidebar();
    });
    const headerText = this.getHeaderText(filterState);
    const headerEl = headerContainer.createEl("h2", {
      text: headerText,
      cls: filterState.selectedProject ? "todo-section-title project-header" : "todo-section-title all-tasks-header"
    });
    this.taskControls.render(
      stickyHeader,
      filterState.searchQuery,
      filterState.sortOption,
      filterState.contextFilter,
      filterState.completedFilter
    );
    const tasksContainer = tasksSection.createDiv("todo-tasks-container");
    const tasksList = tasksContainer.createDiv("todo-tasks-list");
    filteredItems.forEach((item) => this.taskItemRenderer.render(tasksList, item));
    if (filteredItems.length === 0) {
      tasksList.createDiv("todo-empty").setText("No tasks found");
    }
  }
  // Get appropriate header text
  getHeaderText(filterState) {
    if (filterState.completedFilter)
      return "Completed";
    if (filterState.archivedFilter)
      return "Archived";
    if (filterState.selectedTimeFilter === "today")
      return "Today";
    if (filterState.selectedTimeFilter === "upcoming")
      return "Upcoming";
    if (filterState.selectedProject)
      return filterState.selectedProject.replace(/_/g, " ");
    return "Tasks";
  }
  // Search for clicked tag
  searchForTag(tag) {
    this.taskControls.setSearchValue(tag);
    this.onSearchChange(tag);
  }
};

// src/components/modals/addTaskModal.ts
var import_obsidian2 = require("obsidian");

// src/components/modals/taskModalElements.ts
var TaskModalElements = class {
  constructor(isEditMode, dataHandler, onSubmit, onDelete, onCancel) {
    this.isEditMode = isEditMode;
    this.dataHandler = dataHandler;
    this.onSubmit = onSubmit;
    this.onDelete = onDelete;
    this.onCancel = onCancel;
  }
  // Check if device is mobile
  isMobile() {
    return window.innerWidth <= 768;
  }
  // Create all modal UI elements
  createModalElements(contentEl) {
    const inputContainer = contentEl.createDiv("task-input-container");
    const taskInput = this.createTaskInput(inputContainer);
    const descriptionInput = this.createDescriptionInput(inputContainer);
    const bottomContainer = contentEl.createDiv("modal-bottom-container");
    const leftContainer = bottomContainer.createDiv("left-container");
    const projectDropdown = this.createProjectDropdown(leftContainer);
    const priorityDropdown = this.createPriorityDropdown(leftContainer);
    const datePicker = this.createDatePicker(leftContainer);
    this.createButtons(bottomContainer);
    return {
      taskInput,
      descriptionInput,
      projectDropdown,
      priorityDropdown,
      datePicker
    };
  }
  createTaskInput(container) {
    const taskInput = container.createEl("textarea");
    taskInput.addClass("task-input-field");
    taskInput.setAttribute("rows", "1");
    taskInput.setAttribute("placeholder", "Next thing to do");
    taskInput.value = this.dataHandler.taskDescription;
    return taskInput;
  }
  createDescriptionInput(container) {
    const descriptionContainer = container.createDiv("task-description-container");
    const descriptionInput = descriptionContainer.createEl("textarea");
    descriptionInput.addClass("task-description-field");
    descriptionInput.setAttribute("rows", "2");
    descriptionInput.setAttribute("placeholder", "Description");
    descriptionInput.value = this.dataHandler.taskDescriptionNotes || "";
    return descriptionInput;
  }
  createProjectDropdown(container) {
    const projectContainer = container.createDiv("dropdown-container");
    const projectSelect = projectContainer.createEl("select");
    projectSelect.addClass("modal-dropdown");
    projectSelect.createEl("option", { value: "Inbox", text: "Inbox" });
    this.dataHandler.availableProjects.filter((p) => p !== "Inbox" && p !== "Archived").forEach((project) => {
      projectSelect.createEl("option", {
        value: project,
        text: project.replace(/_/g, " ")
      });
    });
    projectSelect.createEl("option", { value: "Archived", text: "Archived" });
    projectSelect.value = this.dataHandler.selectedProject;
    return projectSelect;
  }
  createPriorityDropdown(container) {
    const priorityContainer = container.createDiv("dropdown-container");
    const prioritySelect = priorityContainer.createEl("select");
    prioritySelect.addClass("modal-dropdown");
    if (this.dataHandler.isFirstTimePriority && !this.isEditMode || this.isEditMode && !this.dataHandler.priority) {
      const defaultOption = prioritySelect.createEl("option", {
        value: "",
        text: "Priority"
      });
      defaultOption.disabled = true;
      defaultOption.hidden = true;
      defaultOption.addClass("default-option");
    }
    const priorities = [
      { value: "A", text: "High" },
      { value: "B", text: "Medium" },
      { value: "C", text: "Low" },
      { value: "", text: "None" }
    ];
    priorities.forEach((p) => prioritySelect.createEl("option", p));
    if (this.dataHandler.priority && !["A", "B", "C", ""].includes(this.dataHandler.priority)) {
      prioritySelect.createEl("option", {
        value: this.dataHandler.priority,
        text: `Priority ${this.dataHandler.priority}`
      });
    }
    if (this.dataHandler.priority) {
      prioritySelect.value = this.dataHandler.priority;
    }
    return prioritySelect;
  }
  createDatePicker(container) {
    const dateContainer = container.createDiv("dropdown-container");
    const dateInput = dateContainer.createEl("input", { type: "date" });
    dateInput.addClass("modal-date-picker");
    if (this.dataHandler.dueDate) {
      dateInput.value = this.dataHandler.dueDate;
    }
    return dateInput;
  }
  createButtons(container) {
    const buttonsContainer = container.createDiv("buttons-container");
    if (this.isEditMode && this.onDelete) {
      const deleteButton = buttonsContainer.createEl("button", { text: "Delete" });
      deleteButton.addClass("delete-button");
      deleteButton.addEventListener("click", () => this.onDelete());
    }
    if (!this.isEditMode) {
      const cancelButton = buttonsContainer.createEl("button", { text: "Cancel" });
      cancelButton.addClass("cancel-button");
      cancelButton.addEventListener("click", () => {
        if (this.onCancel) {
          this.onCancel();
        }
      });
    }
    const submitButton = buttonsContainer.createEl("button", {
      text: this.isEditMode ? "Update" : "Add"
    });
    submitButton.addClass("add-button");
    submitButton.addEventListener("click", this.onSubmit);
  }
};

// src/components/modals/taskModalUI.ts
var TaskModalUI = class {
  constructor(contentEl, isEditMode, dataHandler, onSubmit, onDelete, onCancel) {
    // UI element references
    this.taskDescriptionInput = null;
    this.priorityDropdown = null;
    this.projectDropdown = null;
    this.datePicker = null;
    this.taskDescriptionNotes = null;
    this.contentEl = contentEl;
    this.isEditMode = isEditMode;
    this.dataHandler = dataHandler;
    this.onSubmit = onSubmit;
    this.onDelete = onDelete;
    this.onCancel = onCancel;
    this.elements = new TaskModalElements(
      isEditMode,
      dataHandler,
      onSubmit,
      onDelete,
      onCancel
    );
  }
  // Create complete modal UI
  render() {
    this.contentEl.empty();
    const {
      taskInput,
      descriptionInput,
      projectDropdown,
      priorityDropdown,
      datePicker
    } = this.elements.createModalElements(this.contentEl);
    this.taskDescriptionInput = taskInput;
    this.taskDescriptionNotes = descriptionInput;
    this.projectDropdown = projectDropdown;
    this.priorityDropdown = priorityDropdown;
    this.datePicker = datePicker;
  }
  // Set up task description change handler
  onTaskDescriptionChange(handler) {
    var _a;
    (_a = this.taskDescriptionInput) == null ? void 0 : _a.addEventListener("input", (e) => {
      const target = e.target;
      handler(target.value, target.selectionStart || 0);
    });
  }
  // Set up key down handler
  onKeyDown(handler) {
    var _a;
    (_a = this.taskDescriptionInput) == null ? void 0 : _a.addEventListener("keydown", handler);
  }
  // Set up key up handler
  onKeyUp(handler) {
    var _a;
    (_a = this.taskDescriptionInput) == null ? void 0 : _a.addEventListener("keyup", handler);
  }
  // Set up project change handler
  onProjectChange(handler) {
    var _a;
    (_a = this.projectDropdown) == null ? void 0 : _a.addEventListener("change", (e) => {
      handler(e.target.value);
    });
  }
  // Set up priority change handler
  onPriorityChange(handler) {
    var _a;
    (_a = this.priorityDropdown) == null ? void 0 : _a.addEventListener("change", (e) => {
      var _a2;
      handler(e.target.value);
      const defaultOption = (_a2 = this.priorityDropdown) == null ? void 0 : _a2.querySelector(".default-option");
      if (defaultOption) {
        defaultOption.remove();
      }
    });
  }
  // Set up date change handler
  onDateChange(handler) {
    var _a;
    (_a = this.datePicker) == null ? void 0 : _a.addEventListener("change", (e) => {
      handler(e.target.value);
    });
  }
  // Set up notes change handler
  onTaskDescriptionNotesChange(handler) {
    var _a;
    (_a = this.taskDescriptionNotes) == null ? void 0 : _a.addEventListener("input", (e) => {
      handler(e.target.value);
    });
  }
  // Update priority dropdown selection
  updatePriority(priority) {
    if (this.priorityDropdown) {
      const defaultOption = this.priorityDropdown.querySelector(".default-option");
      if (defaultOption) {
        defaultOption.remove();
      }
      if (!["A", "B", "C", ""].includes(priority)) {
        const existing = this.priorityDropdown.querySelector(`option[value="${priority}"]`);
        if (!existing) {
          const customOption = this.priorityDropdown.createEl("option", {
            value: priority,
            text: `Priority ${priority}`
          });
          const noneOption = this.priorityDropdown.querySelector('option[value=""]');
          if (noneOption) {
            this.priorityDropdown.insertBefore(customOption, noneOption);
          }
        }
      }
      this.priorityDropdown.value = priority;
    }
    if (this.taskDescriptionInput) {
      this.taskDescriptionInput.value = this.dataHandler.taskDescription;
    }
  }
  // Update project dropdown selection
  updateProject(project) {
    if (this.projectDropdown) {
      this.projectDropdown.value = project;
    }
  }
  // Update date picker value
  updateDueDate(date) {
    if (this.datePicker) {
      this.datePicker.value = date;
    }
  }
  // Insert context at cursor position
  insertContextAtPosition(context, atPosition) {
    this.insertTextAtPosition(context, atPosition, "@");
  }
  // Insert text at specific position in input
  insertTextAtPosition(text, symbolPosition, symbol) {
    if (!this.taskDescriptionInput)
      return;
    const input = this.taskDescriptionInput;
    const value = input.value;
    const cursorPosition = input.selectionStart || 0;
    const beforeSymbol = value.substring(0, symbolPosition);
    const afterCursor = value.substring(cursorPosition);
    const newValue = beforeSymbol + symbol + text + " " + afterCursor;
    input.value = newValue;
    const newCursorPosition = symbolPosition + symbol.length + text.length + 1;
    input.setSelectionRange(newCursorPosition, newCursorPosition);
    input.focus();
    this.dataHandler.taskDescription = input.value;
  }
  // Focus main input field
  focusInput() {
    var _a;
    (_a = this.taskDescriptionInput) == null ? void 0 : _a.focus();
  }
  getTaskDescription() {
    var _a;
    return ((_a = this.taskDescriptionInput) == null ? void 0 : _a.value) || "";
  }
  getTaskDescriptionNotes() {
    var _a;
    return ((_a = this.taskDescriptionNotes) == null ? void 0 : _a.value) || "";
  }
  getTaskInputElement() {
    return this.taskDescriptionInput;
  }
  // Notes keydown handler  
  onTaskDescriptionNotesKeyDown(handler) {
    var _a;
    (_a = this.taskDescriptionNotes) == null ? void 0 : _a.addEventListener("keydown", handler);
  }
  // Notes keyup handler  
  onTaskDescriptionNotesKeyUp(handler) {
    var _a;
    (_a = this.taskDescriptionNotes) == null ? void 0 : _a.addEventListener("keyup", handler);
  }
  // Notes input change with cursor position
  onTaskDescriptionNotesInputChange(handler) {
    var _a;
    (_a = this.taskDescriptionNotes) == null ? void 0 : _a.addEventListener("input", (e) => {
      const target = e.target;
      handler(target.value, target.selectionStart || 0);
    });
  }
  getTaskNotesInputElement() {
    return this.taskDescriptionNotes;
  }
};

// src/components/modals/taskDataHandler.ts
var TaskDataHandler = class {
  constructor(availableProjects, availableContexts, editingItem, preselectedProject, defaultDueDate) {
    // Task form data
    this.taskDescription = "";
    this.priority = "";
    this.selectedProject = "Inbox";
    this.dueDate = "";
    this.isFirstTimePriority = true;
    this.availableProjects = [];
    this.availableContexts = [];
    this.editingItem = null;
    this.isEditMode = false;
    this.taskDescriptionNotes = "";
    this.availableProjects = availableProjects;
    this.availableContexts = availableContexts;
    this.isEditMode = !!editingItem;
    this.editingItem = editingItem || null;
    if (this.isEditMode && this.editingItem) {
      this.populateFromItem(this.editingItem);
    } else {
      if (preselectedProject) {
        this.selectedProject = preselectedProject;
      }
      if (defaultDueDate) {
        this.dueDate = defaultDueDate;
      }
    }
  }
  // Fill form from existing task
  populateFromItem(item) {
    this.taskDescription = this.extractDescriptionWithoutPriorityAndMetadata(item);
    this.priority = item.priority || "";
    if (item.projects.length > 0) {
      this.selectedProject = item.projects[0];
    } else {
      this.selectedProject = "Inbox";
    }
    const dueMatch = item.description.match(/due:(\d{4}-\d{2}-\d{2})/);
    if (dueMatch) {
      this.dueDate = dueMatch[1];
    }
    if (this.priority) {
      this.isFirstTimePriority = false;
    }
    if (item.descriptionNotes) {
      this.taskDescriptionNotes = item.descriptionNotes;
    }
  }
  // Clean description for editing
  extractDescriptionWithoutPriorityAndMetadata(item) {
    let description = item.description;
    if (item.projects.length > 0) {
      item.projects.forEach((project) => {
        const projectRegex = new RegExp(`\\s*\\+${project}\\b`, "g");
        description = description.replace(projectRegex, "");
      });
    }
    description = description.replace(/\s*\+\w+/g, "");
    description = description.replace(/\s*due:\d{4}-\d{2}-\d{2}/g, "");
    description = description.replace(/\s*origProj:\S+/g, "");
    return description.trim();
  }
  // Extract priority from description text
  parsePriorityFromDescription() {
    const trimmed = this.taskDescription.trim();
    if (trimmed.length >= 3 && trimmed.charAt(0) === "(" && trimmed.charAt(2) === ")" && /[A-Z]/.test(trimmed.charAt(1))) {
      this.priority = trimmed.charAt(1);
      this.taskDescription = trimmed.substring(3).trim();
    }
  }
  // Build final task line string
  buildTaskLine() {
    var _a, _b, _c;
    const trimmedDescription = this.taskDescription.trim();
    if (!trimmedDescription) {
      return "";
    }
    let contentCheck = trimmedDescription;
    contentCheck = contentCheck.replace(/\s*\+\w+/g, "");
    contentCheck = contentCheck.replace(/\s*@\w+/g, "");
    contentCheck = contentCheck.replace(/\s*due:\d{4}-\d{2}-\d{2}/g, "");
    contentCheck = contentCheck.replace(/\s*rec:\S+/g, "");
    contentCheck = contentCheck.replace(/\s*\w+:\S+/g, "");
    contentCheck = contentCheck.replace(/\s*[+@!/*]/g, "");
    contentCheck = contentCheck.replace(/\s*\w+:\s*/g, "");
    if (!contentCheck.trim()) {
      return "";
    }
    let taskLine = "";
    if ((_a = this.editingItem) == null ? void 0 : _a.completed) {
      const completionMatch = this.editingItem.raw.match(/^x\s+(\d{4}-\d{2}-\d{2})/);
      if (completionMatch) {
        taskLine += `x ${completionMatch[1]} `;
      } else {
        const today = new Date().toISOString().split("T")[0];
        taskLine += `x ${today} `;
      }
    }
    if (this.priority) {
      taskLine += `(${this.priority}) `;
    }
    if (!((_b = this.editingItem) == null ? void 0 : _b.completed)) {
      if (!this.isEditMode) {
        const today = getCurrentLocalDate();
        taskLine += `${today} `;
      } else if ((_c = this.editingItem) == null ? void 0 : _c.creationDate) {
        taskLine += `${this.editingItem.creationDate} `;
      }
    }
    taskLine += this.taskDescription.trim();
    const hasManualProject = /\+\w+/.test(this.taskDescription);
    if (!hasManualProject && this.selectedProject) {
      taskLine += ` +${this.selectedProject}`;
    }
    const hasRecurrence = /\brec:\S+/.test(this.taskDescription);
    const hasDueInDescription = /\bdue:\d{4}-\d{2}-\d{2}/.test(this.taskDescription);
    if (this.dueDate && !this.taskDescription.includes(`due:${this.dueDate}`)) {
      taskLine += ` due:${this.dueDate}`;
    } else if (hasRecurrence && !this.dueDate && !hasDueInDescription) {
      const today = new Date().toISOString().split("T")[0];
      taskLine += ` due:${today}`;
    }
    if (this.taskDescriptionNotes) {
      const escapedNotes = this.taskDescriptionNotes.replace(/\n/g, "\\n");
      taskLine += ` ||${escapedNotes}`;
    }
    return taskLine;
  }
  updateAvailableContexts(newContexts) {
    this.availableContexts = newContexts;
  }
};

// src/components/suggestions/suggestionHandler.ts
var SuggestionHandler = class {
  constructor(config) {
    this.suggestions = null;
    this.selectedSuggestionIndex = -1;
    this.currentSymbolPosition = -1;
    this.currentCursorPosition = -1;
    this.config = config;
  }
  // Show suggestions if matches found
  showSuggestions(searchTerm, textarea, cursorPosition) {
    const filteredItems = this.config.customFilter ? this.config.items.filter((item) => this.config.customFilter(item, searchTerm)) : this.config.items.filter(
      (item) => item.toLowerCase().includes(searchTerm)
    );
    if (filteredItems.length > 0) {
      const symbolPosition = textarea.value.lastIndexOf(this.config.symbol, cursorPosition - 1);
      this.currentSymbolPosition = symbolPosition;
      this.currentCursorPosition = cursorPosition;
      this.displaySuggestions(filteredItems, textarea, cursorPosition, symbolPosition);
      return true;
    } else {
      this.hideSuggestions();
      return false;
    }
  }
  // Create and position suggestion dropdown
  displaySuggestions(items, textarea, cursorPosition, symbolPosition) {
    this.hideSuggestions();
    this.currentSymbolPosition = symbolPosition;
    this.currentCursorPosition = cursorPosition;
    const rect = textarea.getBoundingClientRect();
    const cursorCoords = this.getTextareaCaretPosition(textarea, cursorPosition);
    this.suggestions = document.createElement("div");
    this.suggestions.className = `${this.config.type}-suggestions suggestion-container`;
    this.suggestions.style.setProperty("--suggestion-top", `${rect.top + cursorCoords.top + cursorCoords.height + 5}px`);
    this.suggestions.style.setProperty("--suggestion-left", `${rect.left + cursorCoords.left}px`);
    items.forEach((item, index) => {
      const suggestionEl = document.createElement("div");
      suggestionEl.className = "suggestion-item";
      if (this.config.getDisplayText) {
        suggestionEl.textContent = this.config.getDisplayText(item);
      } else if (this.config.type === "priority") {
        const priorityMap = {
          "A": "High",
          "B": "Medium",
          "C": "Low",
          "": "None"
        };
        suggestionEl.textContent = priorityMap[item] || item;
      } else if (this.config.type === "project") {
        suggestionEl.textContent = item.replace(/_/g, " ");
      } else {
        suggestionEl.textContent = item;
      }
      suggestionEl.dataset.index = index.toString();
      suggestionEl.dataset.value = item;
      suggestionEl.addEventListener("click", () => {
        this.selectItem(item, this.currentSymbolPosition, this.currentCursorPosition);
      });
      suggestionEl.addEventListener("mouseenter", () => {
        this.selectedSuggestionIndex = index;
        this.updateSuggestionSelection();
      });
      this.suggestions.appendChild(suggestionEl);
    });
    document.body.appendChild(this.suggestions);
    const suggestionRect = this.suggestions.getBoundingClientRect();
    let finalTop = rect.top + cursorCoords.top + cursorCoords.height + 5;
    let finalLeft = rect.left + cursorCoords.left;
    const isMobile = window.innerWidth <= 768;
    const padding = isMobile ? 10 : 5;
    const maxWidth = isMobile ? window.innerWidth - padding * 2 : 400;
    this.suggestions.style.setProperty("--suggestion-max-width", `${maxWidth}px`);
    const updatedRect = this.suggestions.getBoundingClientRect();
    if (finalLeft + updatedRect.width > window.innerWidth - padding) {
      if (isMobile) {
        finalLeft = window.innerWidth - updatedRect.width - padding;
        finalLeft = Math.max(padding, finalLeft);
      } else {
        finalLeft = rect.left + cursorCoords.left - updatedRect.width;
        finalLeft = Math.max(padding, finalLeft);
      }
    }
    finalLeft = Math.max(padding, finalLeft);
    if (finalTop + updatedRect.height > window.innerHeight - padding) {
      finalTop = rect.top + cursorCoords.top - updatedRect.height - 5;
      finalTop = Math.max(padding, finalTop);
    }
    this.suggestions.style.setProperty("--suggestion-top", `${finalTop}px`);
    this.suggestions.style.setProperty("--suggestion-left", `${finalLeft}px`);
    this.selectedSuggestionIndex = 0;
    this.updateSuggestionSelection();
  }
  // Calculate cursor position in textarea
  getTextareaCaretPosition(textarea, caretPosition) {
    const mirrorDiv = document.createElement("div");
    const computedStyle = window.getComputedStyle(textarea);
    mirrorDiv.className = "textarea-mirror";
    mirrorDiv.style.setProperty("--mirror-width", computedStyle.width);
    mirrorDiv.style.setProperty("--mirror-font", computedStyle.font);
    mirrorDiv.style.setProperty("--mirror-line-height", computedStyle.lineHeight);
    mirrorDiv.style.setProperty("--mirror-padding", computedStyle.padding);
    mirrorDiv.style.setProperty("--mirror-border", computedStyle.border);
    const textBeforeCursor = textarea.value.substring(0, caretPosition);
    mirrorDiv.textContent = textBeforeCursor;
    const cursorSpan = document.createElement("span");
    cursorSpan.className = "textarea-cursor-span";
    cursorSpan.textContent = "|";
    mirrorDiv.appendChild(cursorSpan);
    document.body.appendChild(mirrorDiv);
    const cursorRect = cursorSpan.getBoundingClientRect();
    const mirrorRect = mirrorDiv.getBoundingClientRect();
    const left = cursorRect.left - mirrorRect.left;
    const top = cursorRect.top - mirrorRect.top;
    const lineHeight = parseInt(computedStyle.lineHeight) || parseInt(computedStyle.fontSize) || 16;
    document.body.removeChild(mirrorDiv);
    return { top, left, height: lineHeight };
  }
  // Handle keyboard navigation
  handleKeyNavigation(event) {
    if (!this.suggestions)
      return false;
    const suggestionItems = this.suggestions.querySelectorAll(".suggestion-item");
    if (suggestionItems.length === 0)
      return false;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (this.selectedSuggestionIndex >= suggestionItems.length - 1) {
          this.selectedSuggestionIndex = 0;
        } else {
          this.selectedSuggestionIndex++;
        }
        this.updateSuggestionSelection();
        return true;
      case "ArrowUp":
        event.preventDefault();
        if (this.selectedSuggestionIndex <= 0) {
          this.selectedSuggestionIndex = suggestionItems.length - 1;
        } else {
          this.selectedSuggestionIndex--;
        }
        this.updateSuggestionSelection();
        return true;
      case "Enter":
        if (this.selectedSuggestionIndex >= 0) {
          event.preventDefault();
          const selectedSuggestion = suggestionItems[this.selectedSuggestionIndex];
          if (selectedSuggestion) {
            const value = selectedSuggestion.dataset.value || "";
            this.selectItem(value, this.currentSymbolPosition, this.currentCursorPosition);
          }
          return true;
        }
        break;
      case "Escape":
        event.preventDefault();
        this.hideSuggestions();
        return true;
    }
    return false;
  }
  // Update visual selection and scroll
  updateSuggestionSelection() {
    if (!this.suggestions)
      return;
    const suggestionItems = this.suggestions.querySelectorAll(".suggestion-item");
    suggestionItems.forEach((suggestion, index) => {
      if (index === this.selectedSuggestionIndex) {
        suggestion.classList.add("selected");
        const selectedElement = suggestion;
        const container = this.suggestions;
        const containerRect = container.getBoundingClientRect();
        const selectedRect = selectedElement.getBoundingClientRect();
        if (selectedRect.bottom > containerRect.bottom) {
          container.scrollTop += selectedRect.bottom - containerRect.bottom + 5;
        } else if (selectedRect.top < containerRect.top) {
          container.scrollTop -= containerRect.top - selectedRect.top + 5;
        }
      } else {
        suggestion.classList.remove("selected");
      }
    });
  }
  // Select item and close dropdown
  selectItem(item, symbolPosition, cursorPosition) {
    const shouldClose = this.config.onSelect(item, symbolPosition, cursorPosition);
    if (shouldClose !== false) {
      this.hideSuggestions();
    }
  }
  // Hide suggestion dropdown
  hideSuggestions() {
    if (this.suggestions) {
      document.body.removeChild(this.suggestions);
      this.suggestions = null;
    }
    this.selectedSuggestionIndex = -1;
    this.currentSymbolPosition = -1;
    this.currentCursorPosition = -1;
  }
  // Clean up resources
  cleanup() {
    this.hideSuggestions();
  }
  // Update available items
  updateItems(newItems) {
    this.config.items = newItems;
  }
  getConfig() {
    return this.config;
  }
};

// src/components/suggestions/menuSuggestions.ts
var MenuSuggestions = class extends SuggestionHandler {
  constructor(dataHandler, ui, getOrderedProjects, onProjectChange) {
    super({
      type: "priority",
      items: ["Date", "Priority", "Project", "Context"],
      symbol: "/",
      getDisplayText: (item) => {
        if (this.mainMenuMode === "Project") {
          return item.replace(/_/g, " ");
        }
        return item;
      },
      onSelect: (option, symbolPosition, cursorPosition) => {
        const input = this.ui.getTaskInputElement();
        if (!input)
          return true;
        const value = input.value;
        const beforeSymbol = value.substring(0, symbolPosition);
        const afterCursor = value.substring(cursorPosition);
        if (this.mainMenuMode) {
          return this.handleSubmenuSelection(
            option,
            symbolPosition,
            cursorPosition,
            beforeSymbol,
            afterCursor,
            input
          );
        } else {
          return this.handleMainSelection(
            option,
            value,
            symbolPosition,
            cursorPosition,
            input
          );
        }
      }
    });
    this.dataHandler = dataHandler;
    this.ui = ui;
    this.getOrderedProjects = getOrderedProjects;
    this.onProjectChange = onProjectChange;
    this.mainMenuMode = "";
  }
  // Handle main menu selection
  handleMainSelection(option, value, symbolPosition, cursorPosition, input) {
    this.mainMenuMode = option;
    switch (option) {
      case "Date":
        this.updateItems(["Today", "Tomorrow", "Next Week", "Next Month", "Repeat"]);
        break;
      case "Priority":
        this.updateItems(["High", "Medium", "Low", "None"]);
        break;
      case "Project":
        this.updateItems(this.getOrderedProjects());
        break;
      case "Context":
        this.updateItems(this.dataHandler.availableContexts);
        break;
    }
    const searchTerm = value.substring(symbolPosition + 1, cursorPosition).toLowerCase();
    this.showSuggestions(searchTerm, input, cursorPosition);
    return false;
  }
  // Handle submenu selection
  handleSubmenuSelection(option, symbolPosition, cursorPosition, beforeSymbol, afterCursor, input) {
    if (this.mainMenuMode === "Date" && option === "Repeat") {
      this.updateItems(["Daily", "Weekly", "Monthly", "Yearly"]);
      this.mainMenuMode = "Date-Repeat";
      const searchTerm = input.value.substring(symbolPosition + 1, cursorPosition).toLowerCase();
      this.showSuggestions(searchTerm, input, cursorPosition);
      return false;
    }
    switch (this.mainMenuMode) {
      case "Date":
        this.handleDateSelection(option, beforeSymbol, afterCursor, symbolPosition, input);
        break;
      case "Date-Repeat":
        this.handleRepeatSelection(option, beforeSymbol, afterCursor, input);
        break;
      case "Priority":
        this.handlePrioritySelection(option, beforeSymbol, afterCursor, symbolPosition, input);
        break;
      case "Project":
        this.handleProjectSelection(option, beforeSymbol, afterCursor, symbolPosition, input);
        break;
      case "Context":
        this.handleContextSelection(option, beforeSymbol, afterCursor, symbolPosition, input);
        break;
    }
    this.resetMode();
    return true;
  }
  handleDateSelection(option, beforeSymbol, afterCursor, symbolPosition, input) {
    const dueDate = calculateDueDate(option);
    input.value = beforeSymbol + afterCursor;
    this.dataHandler.taskDescription = input.value;
    this.dataHandler.dueDate = dueDate;
    this.ui.updateDueDate(dueDate);
    input.setSelectionRange(symbolPosition, symbolPosition);
    input.focus();
  }
  handleRepeatSelection(option, beforeSymbol, afterCursor, input) {
    const repeatSyntax = getRepeatSyntax(option);
    const newValue = beforeSymbol + repeatSyntax + " " + afterCursor;
    input.value = newValue;
    this.dataHandler.taskDescription = input.value;
    const newPosition = beforeSymbol.length + repeatSyntax.length + 1;
    input.setSelectionRange(newPosition, newPosition);
    input.focus();
  }
  handlePrioritySelection(option, beforeSymbol, afterCursor, symbolPosition, input) {
    const priorityMap = {
      "High": "A",
      "Medium": "B",
      "Low": "C",
      "None": ""
    };
    const priority = priorityMap[option] || "";
    input.value = beforeSymbol + afterCursor;
    this.dataHandler.taskDescription = input.value;
    this.dataHandler.priority = priority;
    this.ui.updatePriority(priority);
    input.setSelectionRange(symbolPosition, symbolPosition);
    input.focus();
  }
  handleProjectSelection(option, beforeSymbol, afterCursor, symbolPosition, input) {
    input.value = beforeSymbol + afterCursor;
    this.dataHandler.taskDescription = input.value;
    this.dataHandler.selectedProject = option;
    this.ui.updateProject(option);
    if (this.onProjectChange) {
      this.onProjectChange(option).catch((error) => {
        console.error("Error updating contexts for project:", error);
      });
    }
    input.setSelectionRange(symbolPosition, symbolPosition);
    input.focus();
  }
  handleContextSelection(option, beforeSymbol, afterCursor, symbolPosition, input) {
    const ctxValue = beforeSymbol + `@${option} ` + afterCursor;
    input.value = ctxValue;
    this.dataHandler.taskDescription = input.value;
    const ctxPosition = symbolPosition + option.length + 2;
    input.setSelectionRange(ctxPosition, ctxPosition);
    input.focus();
  }
  resetMode() {
    if (this.mainMenuMode) {
      this.mainMenuMode = "";
      this.updateItems(["Date", "Priority", "Project", "Context"]);
    }
  }
  updateContextItems(newContexts) {
    if (this.mainMenuMode === "Context") {
      this.updateItems(newContexts);
    }
  }
};

// src/components/suggestions/wikiLinkHandler.ts
var WikiLinkHandler = class {
  constructor(app) {
    this.textarea = null;
    this.app = app;
    this.handler = new SuggestionHandler({
      type: "project",
      // Reuse project type for styling
      items: [],
      onSelect: (item, symbolPosition, cursorPosition) => {
        return this.insertWikiLink(item, symbolPosition, cursorPosition);
      },
      symbol: "[[",
      customFilter: (item, searchTerm) => {
        return item.toLowerCase().includes(searchTerm.toLowerCase());
      },
      getDisplayText: (item) => {
        return item;
      }
    });
  }
  showSuggestions(searchTerm, textarea, cursorPosition) {
    this.textarea = textarea;
    const allFiles = this.app.vault.getFiles();
    const fileItems = allFiles.map((file) => {
      if (file.extension === "md") {
        return file.basename;
      }
      return file.name;
    });
    this.handler.updateItems(fileItems);
    return this.handler.showSuggestions(searchTerm, textarea, cursorPosition);
  }
  insertWikiLink(fileName, symbolPosition, cursorPosition) {
    if (!this.textarea)
      return false;
    const value = this.textarea.value;
    const beforeSymbol = value.substring(0, symbolPosition);
    const afterCursor = value.substring(cursorPosition);
    const wikiLink = `[[${fileName}]]`;
    this.textarea.value = beforeSymbol + wikiLink + afterCursor;
    const newCursorPosition = symbolPosition + wikiLink.length;
    this.textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    this.textarea.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }
  handleKeyNavigation(event) {
    return this.handler.handleKeyNavigation(event);
  }
  hideSuggestions() {
    this.handler.hideSuggestions();
  }
  cleanup() {
    this.handler.cleanup();
  }
};

// src/components/suggestions/suggestionManager.ts
var SuggestionManager = class {
  constructor(dataHandler, ui, app, onProjectChange) {
    this.dataHandler = dataHandler;
    this.ui = ui;
    this.app = app;
    this.onProjectChange = onProjectChange;
    this.activeHandler = null;
    this.isInRepeatMode = false;
    this.contextHandler = this.createContextHandler();
    this.priorityHandler = this.createPriorityHandler();
    this.projectHandler = this.createProjectHandler();
    this.dueDateHandler = this.createDueDateHandler();
    this.wikiLinkHandler = new WikiLinkHandler(app);
    this.mainMenuHandler = new MenuSuggestions(
      dataHandler,
      ui,
      () => this.getOrderedProjectsForSuggestions(),
      onProjectChange
    );
  }
  // Context suggestions (@)
  createContextHandler() {
    return new SuggestionHandler({
      type: "context",
      items: this.dataHandler.availableContexts,
      symbol: "@",
      onSelect: (context, symbolPosition, cursorPosition) => {
        const input = this.ui.getTaskInputElement();
        if (!input)
          return true;
        const value = input.value;
        const beforeAt = value.substring(0, symbolPosition);
        const afterCursor = value.substring(cursorPosition);
        const newValue = beforeAt + `@${context} ` + afterCursor;
        input.value = newValue;
        this.dataHandler.taskDescription = newValue;
        const newCursorPosition = symbolPosition + context.length + 2;
        input.setSelectionRange(newCursorPosition, newCursorPosition);
        input.focus();
        this.activeHandler = null;
        return true;
      }
    });
  }
  // Priority suggestions (!)
  createPriorityHandler() {
    return new SuggestionHandler({
      type: "priority",
      items: ["A", "B", "C", ""],
      symbol: "!",
      customFilter: (item, searchTerm) => {
        const priorityMap = {
          "A": "high",
          "B": "medium",
          "C": "low",
          "": "none"
        };
        const displayText = priorityMap[item] || item.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        return item.toLowerCase().includes(searchLower) || displayText.includes(searchLower);
      },
      onSelect: (priority, symbolPosition, cursorPosition) => {
        const input = this.ui.getTaskInputElement();
        if (!input)
          return true;
        const value = input.value;
        const beforeExclamation = value.substring(0, symbolPosition);
        const afterCursor = value.substring(cursorPosition);
        const newValue = beforeExclamation + afterCursor;
        input.value = newValue;
        this.dataHandler.taskDescription = newValue;
        this.dataHandler.priority = priority;
        this.ui.updatePriority(priority);
        input.setSelectionRange(symbolPosition, symbolPosition);
        input.focus();
        this.activeHandler = null;
        return true;
      }
    });
  }
  // Project suggestions (+)
  createProjectHandler() {
    const projectsForSuggestion = this.getOrderedProjectsForSuggestions();
    return new SuggestionHandler({
      type: "project",
      items: projectsForSuggestion,
      symbol: "+",
      onSelect: (project, symbolPosition, cursorPosition) => {
        const input = this.ui.getTaskInputElement();
        if (!input)
          return true;
        const value = input.value;
        const beforePlus = value.substring(0, symbolPosition);
        const afterCursor = value.substring(cursorPosition);
        const newValue = beforePlus + afterCursor;
        input.value = newValue;
        this.dataHandler.taskDescription = newValue;
        this.dataHandler.selectedProject = project;
        this.ui.updateProject(project);
        if (this.onProjectChange) {
          this.onProjectChange(project).catch((error) => {
            console.error("Error updating contexts for project:", error);
          });
        }
        input.setSelectionRange(symbolPosition, symbolPosition);
        input.focus();
        this.activeHandler = null;
        return true;
      }
    });
  }
  // Due date suggestions (*)
  createDueDateHandler() {
    return new SuggestionHandler({
      type: "priority",
      items: ["Today", "Tomorrow", "Next Week", "Next Month", "Repeat"],
      symbol: "*",
      onSelect: (option, symbolPosition, cursorPosition) => {
        const input = this.ui.getTaskInputElement();
        if (!input)
          return true;
        const value = input.value;
        const beforeSymbol = value.substring(0, symbolPosition);
        const afterCursor = value.substring(cursorPosition);
        if (option === "Repeat" && !this.isInRepeatMode) {
          this.isInRepeatMode = true;
          this.dueDateHandler.updateItems(["Daily", "Weekly", "Monthly", "Yearly"]);
          const searchTerm = value.substring(symbolPosition + 1, cursorPosition).toLowerCase();
          this.dueDateHandler.showSuggestions(searchTerm, input, cursorPosition);
          return false;
        }
        if (this.isInRepeatMode) {
          const repeatSyntax = getRepeatSyntax(option);
          const newValue = beforeSymbol + repeatSyntax + " " + afterCursor;
          input.value = newValue;
          this.dataHandler.taskDescription = input.value;
          this.isInRepeatMode = false;
          this.dueDateHandler.updateItems(["Today", "Tomorrow", "Next Week", "Next Month", "Repeat"]);
          const newPosition = beforeSymbol.length + repeatSyntax.length + 1;
          input.setSelectionRange(newPosition, newPosition);
          input.focus();
        } else {
          const dueDate = calculateDueDate(option);
          input.value = beforeSymbol + afterCursor;
          this.dataHandler.taskDescription = input.value;
          this.dataHandler.dueDate = dueDate;
          this.ui.updateDueDate(dueDate);
          input.setSelectionRange(symbolPosition, symbolPosition);
          input.focus();
        }
        this.activeHandler = null;
        return true;
      }
    });
  }
  // Get projects ordered for display
  getOrderedProjectsForSuggestions() {
    const availableProjects = [...this.dataHandler.availableProjects];
    const orderedProjects = [];
    orderedProjects.push("Inbox");
    const otherProjects = availableProjects.filter(
      (project) => project !== "Inbox" && project !== "Archived"
    );
    orderedProjects.push(...otherProjects);
    orderedProjects.push("Archived");
    return orderedProjects;
  }
  getActiveHandler() {
    return this.activeHandler;
  }
  setActiveHandler(handler) {
    this.activeHandler = handler;
  }
  // Reset all states
  resetModes() {
    if (this.isInRepeatMode) {
      this.isInRepeatMode = false;
      this.dueDateHandler.updateItems(["Today", "Tomorrow", "Next Week", "Next Month", "Repeat"]);
    }
    this.mainMenuHandler.resetMode();
  }
  // Update contexts
  updateContextItems(newContexts) {
    this.contextHandler.updateItems(newContexts);
    this.mainMenuHandler.updateContextItems(newContexts);
  }
  cleanup() {
    this.contextHandler.cleanup();
    this.priorityHandler.cleanup();
    this.projectHandler.cleanup();
    this.dueDateHandler.cleanup();
    this.mainMenuHandler.cleanup();
    this.wikiLinkHandler.cleanup();
    this.resetModes();
  }
};

// src/components/suggestions/taskInputHandler.ts
var TaskInputHandler = class {
  constructor(dataHandler, ui, suggestionManager) {
    this.dataHandler = dataHandler;
    this.ui = ui;
    this.suggestionManager = suggestionManager;
  }
  // Handle text changes and show suggestions
  handleTaskDescriptionChange(value, cursorPosition) {
    this.dataHandler.taskDescription = value;
    this.dataHandler.parsePriorityFromDescription();
    if (this.dataHandler.priority) {
      this.ui.updatePriority(this.dataHandler.priority);
    }
    const wikiLinkPosition = value.lastIndexOf("[[", cursorPosition - 1);
    const atPosition = value.lastIndexOf("@", cursorPosition - 1);
    const exclamationPosition = value.lastIndexOf("!", cursorPosition - 1);
    const plusPosition = value.lastIndexOf("+", cursorPosition - 1);
    const asteriskPosition = value.lastIndexOf("*", cursorPosition - 1);
    const slashPosition = value.lastIndexOf("/", cursorPosition - 1);
    const positions = [
      { pos: wikiLinkPosition, handler: this.suggestionManager.wikiLinkHandler, symbol: "[[", length: 2 },
      { pos: atPosition, handler: this.suggestionManager.contextHandler, symbol: "@", length: 1 },
      { pos: exclamationPosition, handler: this.suggestionManager.priorityHandler, symbol: "!", length: 1 },
      { pos: plusPosition, handler: this.suggestionManager.projectHandler, symbol: "+", length: 1 },
      { pos: asteriskPosition, handler: this.suggestionManager.dueDateHandler, symbol: "*", length: 1 },
      { pos: slashPosition, handler: this.suggestionManager.mainMenuHandler, symbol: "/", length: 1 }
    ].filter((p) => p.pos !== -1).sort((a, b) => b.pos - a.pos);
    const activeHandler = this.suggestionManager.getActiveHandler();
    if (activeHandler === this.suggestionManager.dueDateHandler && (positions.length === 0 || positions[0].handler !== this.suggestionManager.dueDateHandler)) {
      this.suggestionManager.resetModes();
    }
    if (activeHandler === this.suggestionManager.mainMenuHandler && (positions.length === 0 || positions[0].handler !== this.suggestionManager.mainMenuHandler)) {
      this.suggestionManager.resetModes();
    }
    if (positions.length > 0 && positions[0].pos < cursorPosition) {
      const { pos, handler, symbol, length } = positions[0];
      const searchTerm = value.substring(pos + length, cursorPosition);
      if (symbol === "[[" && value.substring(pos, cursorPosition).includes("]]")) {
        this.hideAllSuggestions();
        this.suggestionManager.setActiveHandler(null);
        return;
      }
      const hasSpaceAfter = searchTerm.includes(" ") && symbol !== "[[";
      if (!hasSpaceAfter) {
        this.hideAllSuggestionsExcept(handler);
        const hasSuggestions = handler.showSuggestions(
          searchTerm.toLowerCase(),
          this.ui.getTaskInputElement(),
          cursorPosition
        );
        this.suggestionManager.setActiveHandler(hasSuggestions ? handler : null);
      } else {
        this.hideAllSuggestions();
        this.suggestionManager.setActiveHandler(null);
        this.suggestionManager.resetModes();
      }
    } else {
      this.hideAllSuggestions();
      this.suggestionManager.setActiveHandler(null);
      this.suggestionManager.resetModes();
    }
  }
  // Handle keyboard navigation and submission
  handleKeyDown(e, onSubmit) {
    const activeHandler = this.suggestionManager.getActiveHandler();
    if (activeHandler && e.key !== "Enter") {
      activeHandler.handleKeyNavigation(e);
    }
  }
  // Show suggestions on trigger symbol typed
  handleKeyUp(e) {
    if (e.key === "@" || e.key === "!" || e.key === "+" || e.key === "*" || e.key === "/") {
      setTimeout(() => {
        const input = this.ui.getTaskInputElement();
        if (input) {
          const cursorPosition = input.selectionStart || 0;
          const value = input.value;
          const handlerMap = {
            "@": this.suggestionManager.contextHandler,
            "!": this.suggestionManager.priorityHandler,
            "+": this.suggestionManager.projectHandler,
            "*": this.suggestionManager.dueDateHandler,
            "/": this.suggestionManager.mainMenuHandler
          };
          const handler = handlerMap[e.key];
          const symbolPosition = value.lastIndexOf(e.key, cursorPosition - 1);
          if (symbolPosition !== -1) {
            const searchTerm = value.substring(symbolPosition + 1, cursorPosition).toLowerCase();
            this.suggestionManager.setActiveHandler(handler);
            handler.showSuggestions(searchTerm, input, cursorPosition);
          }
        }
      }, 0);
    }
  }
  // Hide all suggestions except the active one
  hideAllSuggestionsExcept(exceptHandler) {
    const { contextHandler, priorityHandler, projectHandler, dueDateHandler, mainMenuHandler, wikiLinkHandler } = this.suggestionManager;
    if (exceptHandler !== contextHandler)
      contextHandler.hideSuggestions();
    if (exceptHandler !== priorityHandler)
      priorityHandler.hideSuggestions();
    if (exceptHandler !== projectHandler)
      projectHandler.hideSuggestions();
    if (exceptHandler !== dueDateHandler)
      dueDateHandler.hideSuggestions();
    if (exceptHandler !== mainMenuHandler)
      mainMenuHandler.hideSuggestions();
    if (exceptHandler !== wikiLinkHandler)
      wikiLinkHandler.hideSuggestions();
  }
  // Hide all suggestion dropdowns
  hideAllSuggestions() {
    this.suggestionManager.contextHandler.hideSuggestions();
    this.suggestionManager.priorityHandler.hideSuggestions();
    this.suggestionManager.projectHandler.hideSuggestions();
    this.suggestionManager.dueDateHandler.hideSuggestions();
    this.suggestionManager.mainMenuHandler.hideSuggestions();
    this.suggestionManager.wikiLinkHandler.hideSuggestions();
  }
};

// src/components/modals/addTaskModal.ts
var AddTaskModal = class extends import_obsidian2.Modal {
  constructor(app, onSubmit, availableProjects = [], availableContexts = [], editingItem, onDelete, preselectedProject, defaultDueDate) {
    super(app);
    this.isEditMode = false;
    this.modalEl.addClass("todo-task-mod");
    this.onSubmit = onSubmit;
    this.onDelete = onDelete;
    this.isEditMode = !!editingItem;
    this.dataHandler = new TaskDataHandler(
      availableProjects,
      availableContexts,
      editingItem,
      preselectedProject,
      defaultDueDate
    );
    this.ui = new TaskModalUI(
      this.contentEl,
      this.isEditMode,
      this.dataHandler,
      () => this.submitTask(),
      this.onDelete ? () => {
        this.onDelete();
        this.close();
      } : void 0,
      () => this.close()
    );
    this.suggestionManager = new SuggestionManager(
      this.dataHandler,
      this.ui,
      this.app,
      async (projectName) => {
        const projectContexts = await this.getContextsForProject(projectName);
        this.dataHandler.updateAvailableContexts(projectContexts);
        this.suggestionManager.updateContextItems(projectContexts);
      }
    );
    this.notesSuggestionManager = new SuggestionManager(
      this.dataHandler,
      this.ui,
      this.app,
      async (projectName) => {
        const projectContexts = await this.getContextsForProject(projectName);
        this.dataHandler.updateAvailableContexts(projectContexts);
        this.notesSuggestionManager.updateContextItems(projectContexts);
      }
    );
    this.inputHandler = new TaskInputHandler(this.dataHandler, this.ui, this.suggestionManager);
  }
  // Get contexts for a specific project
  async getContextsForProject(projectName) {
    try {
      const files = this.app.vault.getFiles().filter((f) => f.extension === "txt");
      if (files.length === 0)
        return this.dataHandler.availableContexts;
      const file = files[0];
      const content = await this.app.vault.read(file);
      const lines = content.split("\n").filter((line) => line.trim().length > 0);
      const contextsSet = /* @__PURE__ */ new Set();
      lines.forEach((line) => {
        if (line.trim().startsWith("x ")) {
          return;
        }
        if (line.includes(`+${projectName}`) || projectName === "Inbox") {
          let cleanLine = line;
          const notesIndex = cleanLine.indexOf("||");
          if (notesIndex !== -1) {
            cleanLine = cleanLine.substring(0, notesIndex).trim();
          }
          cleanLine = cleanLine.replace(/^KATEX_INLINE_OPEN[A-Z]KATEX_INLINE_CLOSE\s+/, "");
          cleanLine = cleanLine.replace(/^\d{4}-\d{2}-\d{2}\s+/, "");
          const contextMatches = cleanLine.match(/(?:^|\s)@(\S+)/g);
          if (contextMatches) {
            contextMatches.forEach((match) => {
              const context = match.trim().substring(1);
              contextsSet.add(context);
            });
          }
        }
      });
      return Array.from(contextsSet).sort();
    } catch (error) {
      console.error("Error fetching contexts for project:", error);
      return this.dataHandler.availableContexts;
    }
  }
  // Set up modal UI and event handlers
  onOpen() {
    this.ui.render();
    this.ui.onTaskDescriptionChange((value, cursorPosition) => {
      this.inputHandler.handleTaskDescriptionChange(value, cursorPosition);
    });
    this.ui.onKeyDown((e) => {
      const activeHandler = this.suggestionManager.getActiveHandler();
      if (activeHandler && activeHandler.handleKeyNavigation(e)) {
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.submitTask();
        return;
      }
      this.inputHandler.handleKeyDown(e, () => this.submitTask());
    });
    this.ui.onKeyUp((e) => {
      this.inputHandler.handleKeyUp(e);
    });
    this.ui.onProjectChange(async (project) => {
      this.dataHandler.selectedProject = project;
      const projectContexts = await this.getContextsForProject(project);
      this.dataHandler.updateAvailableContexts(projectContexts);
      this.suggestionManager.updateContextItems(projectContexts);
    });
    this.ui.onPriorityChange((priority) => {
      this.dataHandler.priority = priority;
      this.dataHandler.isFirstTimePriority = false;
    });
    this.ui.onDateChange((date) => {
      this.dataHandler.dueDate = date;
    });
    this.ui.onTaskDescriptionNotesChange((value) => {
      this.dataHandler.taskDescriptionNotes = value;
    });
    this.ui.onTaskDescriptionNotesInputChange((value, cursorPosition) => {
      this.dataHandler.taskDescriptionNotes = value;
      this.handleNotesInputChange(value, cursorPosition);
    });
    this.ui.onTaskDescriptionNotesKeyDown((e) => {
      if (this.handleNotesKeyDown(e)) {
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) {
          e.preventDefault();
          this.submitTask();
        }
      }
    });
    this.ui.onTaskDescriptionNotesKeyUp((e) => {
      this.handleNotesKeyUp(e);
    });
    setTimeout(() => this.ui.focusInput(), 100);
  }
  // Build and submit task line
  submitTask() {
    const taskLine = this.dataHandler.buildTaskLine();
    if (taskLine) {
      this.onSubmit(taskLine);
      this.close();
    }
  }
  // Handle notes input for WikiLink suggestions
  handleNotesInputChange(value, cursorPosition) {
    const wikiLinkPosition = value.lastIndexOf("[[", cursorPosition - 1);
    if (wikiLinkPosition !== -1 && wikiLinkPosition < cursorPosition) {
      const searchTerm = value.substring(wikiLinkPosition + 2, cursorPosition);
      if (value.substring(wikiLinkPosition, cursorPosition).includes("]]")) {
        this.notesSuggestionManager.wikiLinkHandler.hideSuggestions();
        return;
      }
      const notesInput = this.ui.getTaskNotesInputElement();
      if (notesInput) {
        this.notesSuggestionManager.wikiLinkHandler.showSuggestions(
          searchTerm.toLowerCase(),
          notesInput,
          cursorPosition
        );
      }
    } else {
      this.notesSuggestionManager.wikiLinkHandler.hideSuggestions();
    }
  }
  // Handle notes keyboard navigation
  handleNotesKeyDown(e) {
    if (this.notesSuggestionManager.wikiLinkHandler.handleKeyNavigation(e)) {
      return true;
    }
    return false;
  }
  // Handle notes keyup for WikiLink trigger
  handleNotesKeyUp(e) {
    if (e.key === "[") {
      setTimeout(() => {
        const notesInput = this.ui.getTaskNotesInputElement();
        if (notesInput) {
          const cursorPosition = notesInput.selectionStart || 0;
          const value = notesInput.value;
          const wikiLinkPosition = value.lastIndexOf("[[", cursorPosition - 1);
          if (wikiLinkPosition !== -1 && wikiLinkPosition === cursorPosition - 2) {
            this.notesSuggestionManager.wikiLinkHandler.showSuggestions(
              "",
              notesInput,
              cursorPosition
            );
          }
        }
      }, 0);
    }
  }
  // Clean up modal resources
  onClose() {
    this.contentEl.empty();
    this.suggestionManager.cleanup();
    this.notesSuggestionManager.cleanup();
  }
};

// src/components/modals/confirmModals.ts
var import_obsidian3 = require("obsidian");
var DeleteTaskModal = class extends import_obsidian3.Modal {
  constructor(app, taskDescription, onConfirm) {
    super(app);
    this.modalEl.addClass("todo-del-mod");
    this.taskDescription = taskDescription;
    this.onConfirm = onConfirm;
  }
  // Create deletion confirmation UI
  onOpen() {
    const { contentEl } = this;
    this.titleEl.setText("Delete Task?");
    const messageEl = contentEl.createEl("p");
    const cleanTaskDescription = this.taskDescription.split(" ").filter((word) => {
      if (word.startsWith("+"))
        return false;
      if (word.includes(":"))
        return false;
      return word !== "";
    }).join(" ").trim();
    messageEl.appendText('The "');
    const boldEl = messageEl.createEl("span", {
      text: cleanTaskDescription,
      cls: "todo-delete-highlight"
    });
    messageEl.appendText('" task will be permanently deleted.');
    new import_obsidian3.Setting(contentEl).addButton(
      (btn) => btn.setButtonText("Cancel").onClick(() => this.close())
    ).addButton(
      (btn) => btn.setButtonText("Delete").setWarning().onClick(async () => {
        await this.onConfirm();
        this.close();
      })
    );
  }
  // Clean up modal
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};
var DeleteProjectModal = class extends import_obsidian3.Modal {
  constructor(app, projectName, onConfirm) {
    super(app);
    this.modalEl.addClass("todo-del-mod");
    this.projectName = projectName;
    this.onConfirm = onConfirm;
  }
  // Create project deletion confirmation UI
  onOpen() {
    const { contentEl } = this;
    this.titleEl.setText("Delete Project?");
    const messageEl = contentEl.createEl("p");
    messageEl.appendText('The "');
    const boldEl = messageEl.createEl("span", {
      text: this.projectName.replace(/_/g, " "),
      cls: "todo-delete-highlight"
    });
    messageEl.appendText('" project and all of its tasks will be permanently deleted.');
    new import_obsidian3.Setting(contentEl).addButton(
      (btn) => btn.setButtonText("Cancel").onClick(() => this.close())
    ).addButton(
      (btn) => btn.setButtonText("Delete").setWarning().onClick(async () => {
        await this.onConfirm();
        this.close();
      })
    );
  }
  // Clean up modal
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};
var DeleteAllCompletedTasksModal = class extends import_obsidian3.Modal {
  constructor(app, taskCount, onConfirm) {
    super(app);
    this.modalEl.addClass("todo-del-mod");
    this.taskCount = taskCount;
    this.onConfirm = onConfirm;
  }
  // Create bulk deletion confirmation UI
  onOpen() {
    const { contentEl } = this;
    this.titleEl.setText("Delete All Completed Tasks?");
    const messageEl = contentEl.createEl("p");
    messageEl.setText(`Are you sure you want to permanently delete all ${this.taskCount} completed tasks?`);
    new import_obsidian3.Setting(contentEl).addButton(
      (btn) => btn.setButtonText("Cancel").onClick(() => this.close())
    ).addButton(
      (btn) => btn.setButtonText("Delete All").setWarning().onClick(async () => {
        await this.onConfirm();
        this.close();
      })
    );
  }
  // Clean up modal
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};

// src/managers/taskManager.ts
var TaskManager = class {
  constructor(app) {
    this.app = app;
    this.todoItems = [];
    // Task operation callbacks
    this.onTaskComplete = async () => {
    };
    this.onTaskUncomplete = async () => {
    };
    this.onTaskUpdate = async () => {
    };
    this.onTaskDelete = async () => {
    };
    this.onTaskAdd = async () => {
    };
    this.onMoveFromArchived = async () => {
    };
  }
  // Store todo items
  setTodoItems(items) {
    this.todoItems = items;
  }
  // Mark task as done
  async completeTask(item) {
    await this.onTaskComplete(item);
  }
  // Unmark task completion
  async uncompleteTask(item) {
    await this.onTaskUncomplete(item);
  }
  // Move task to inbox
  async moveTaskFromArchived(item) {
    await this.onMoveFromArchived(item);
  }
  // Open task edit modal
  editTask(item, availableProjects, availableContexts) {
    const modal = new AddTaskModal(
      this.app,
      async (taskLine) => {
        await this.onTaskUpdate(item, taskLine);
      },
      availableProjects,
      availableContexts,
      item,
      async () => {
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
  openAddTaskModal(availableProjects, availableContexts, defaultProject, defaultDueDate) {
    const modal = new AddTaskModal(
      this.app,
      (taskLine) => {
        this.onTaskAdd(taskLine);
      },
      availableProjects,
      availableContexts,
      void 0,
      void 0,
      defaultProject,
      defaultDueDate
    );
    modal.open();
  }
  // Open bulk delete modal
  openEmptyCompletedTasksModal() {
    const completedTasks = this.todoItems.filter((item) => item.completed);
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
  async deleteAllCompletedTasks() {
    const completedTasks = this.todoItems.filter((item) => item.completed);
    for (const task of completedTasks) {
      if (this.onTaskDelete) {
        await this.onTaskDelete(task);
      }
    }
  }
};

// src/components/modals/addProjectModal.ts
var import_obsidian4 = require("obsidian");
var AddProjectModal = class extends import_obsidian4.Modal {
  constructor(app, onSubmit, editingProjectName, currentIcon) {
    super(app);
    // Form state
    this.projectName = "";
    this.projectIcon = "";
    this.originalProjectName = "";
    this.originalProjectIcon = "";
    this.inputEl = null;
    this.iconInputEl = null;
    this.modalEl.addClass("todo-project-mod");
    this.onSubmit = onSubmit;
    this.isEditMode = !!editingProjectName;
    if (editingProjectName) {
      this.originalProjectName = editingProjectName;
      this.projectName = editingProjectName.replace(/_/g, " ");
    }
    if (currentIcon !== void 0) {
      this.originalProjectIcon = currentIcon;
      this.projectIcon = currentIcon;
    }
  }
  // Extract first icon from input
  parseFirstIcon(input) {
    const trimmed = input.trim();
    if (!trimmed)
      return "";
    if (trimmed.includes("<svg")) {
      const svgMatch = trimmed.match(/<svg[^>]*>[\s\S]*?<\/svg>/i);
      return svgMatch ? svgMatch[0] : "";
    }
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(\u200D(\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*/u;
    const emojiMatch = trimmed.match(emojiRegex);
    if (emojiMatch) {
      return emojiMatch[0];
    }
    return trimmed.charAt(0);
  }
  // Create modal UI
  onOpen() {
    const { contentEl } = this;
    this.titleEl.setText(this.isEditMode ? "Edit Project" : "Add Project");
    new import_obsidian4.Setting(contentEl).setName("Name").addText((text) => {
      this.inputEl = text.inputEl;
      text.setPlaceholder("My Project").setValue(this.projectName).onChange((value) => {
        this.projectName = value;
      });
      text.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.submit();
        }
      });
    });
    new import_obsidian4.Setting(contentEl).setName("Icon").addText((text) => {
      this.iconInputEl = text.inputEl;
      text.setPlaceholder("Emoji or SVG code").setValue(this.projectIcon).onChange((value) => {
        this.projectIcon = value;
      });
      text.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.submit();
        }
      });
    });
    new import_obsidian4.Setting(contentEl).addButton((btn) => btn.setButtonText("Cancel").onClick(() => this.close())).addButton((btn) => btn.setButtonText(this.isEditMode ? "Update" : "Add").setCta().onClick(() => this.submit()));
    setTimeout(() => {
      if (this.inputEl) {
        this.inputEl.focus();
        if (this.isEditMode) {
          this.inputEl.select();
        }
      }
    }, 0);
  }
  // Submit form data
  async submit() {
    const trimmedName = this.projectName.trim();
    if (!trimmedName)
      return;
    const formattedProjectName = trimmedName.replace(/\s+/g, "_");
    const iconValue = this.parseFirstIcon(this.projectIcon);
    if (this.isEditMode) {
      if (formattedProjectName !== this.originalProjectName || iconValue !== this.originalProjectIcon) {
        await this.onSubmit(
          this.originalProjectName,
          formattedProjectName,
          iconValue
        );
      }
    } else {
      this.onSubmit(formattedProjectName, iconValue);
    }
    this.close();
  }
  // Clean up modal
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};

// src/utils/projectPersistence.ts
var ProjectPersistence = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  // Save pinned projects to settings
  async savePinnedProjects(file, pinnedProjects) {
    if (!file)
      return;
    if (!this.plugin.settings.pinnedProjects) {
      this.plugin.settings.pinnedProjects = {};
    }
    this.plugin.settings.pinnedProjects[file.path] = [...pinnedProjects];
    await this.plugin.saveSettings();
  }
  // Load pinned projects from settings
  loadPinnedProjects(file) {
    if (!file)
      return [];
    if (this.plugin.settings.pinnedProjects && this.plugin.settings.pinnedProjects[file.path]) {
      return [...this.plugin.settings.pinnedProjects[file.path]];
    }
    return [];
  }
  // Save all known projects to settings
  async saveAllKnownProjects(file, allKnownProjects) {
    if (!file)
      return;
    if (!this.plugin.settings.allKnownProjects) {
      this.plugin.settings.allKnownProjects = {};
    }
    this.plugin.settings.allKnownProjects[file.path] = [...allKnownProjects];
    await this.plugin.saveSettings();
  }
  // Load all known projects from settings
  loadAllKnownProjects(file) {
    if (!file)
      return [];
    if (this.plugin.settings.allKnownProjects && this.plugin.settings.allKnownProjects[file.path]) {
      return [...this.plugin.settings.allKnownProjects[file.path]];
    }
    return [];
  }
  // Save project icons to settings
  async saveProjectIcons(file, projectIcons) {
    if (!file)
      return;
    if (!this.plugin.settings.projectIcons) {
      this.plugin.settings.projectIcons = {};
    }
    this.plugin.settings.projectIcons[file.path] = Object.fromEntries(projectIcons);
    await this.plugin.saveSettings();
  }
  // Load project icons from settings
  loadProjectIcons(file) {
    if (!file)
      return /* @__PURE__ */ new Map();
    if (this.plugin.settings.projectIcons && this.plugin.settings.projectIcons[file.path]) {
      return new Map(Object.entries(this.plugin.settings.projectIcons[file.path]));
    }
    return /* @__PURE__ */ new Map();
  }
};

// src/managers/projectManager.ts
var ProjectManager = class {
  constructor(plugin) {
    this.plugin = plugin;
    // Project data stores
    this.pinnedProjects = [];
    this.allKnownProjects = [];
    this.projectIcons = /* @__PURE__ */ new Map();
    // Callback handlers
    this.onProjectCreate = async () => {
    };
    this.onProjectUpdate = async () => {
    };
    this.onProjectDelete = async () => {
    };
    this.onProjectPin = async () => {
    };
    this.persistence = new ProjectPersistence(plugin);
  }
  // Extract projects from todo items
  updateFromTodoItems(items) {
    const newProjects = [];
    items.forEach((item) => {
      item.projects.forEach((project) => {
        if (project !== "Inbox" && project !== "Archived") {
          if (!this.allKnownProjects.includes(project) && !newProjects.includes(project)) {
            newProjects.push(project);
          }
        }
      });
    });
    this.allKnownProjects.push(...newProjects);
  }
  // Update projects from todo items and save if needed
  async updateAndSaveFromTodoItems(items, file) {
    const oldProjectsCount = this.allKnownProjects.length;
    this.updateFromTodoItems(items);
    if (this.allKnownProjects.length > oldProjectsCount) {
      await this.saveAllKnownProjects(file);
    }
  }
  // Count active tasks per project
  getProjectCounts(items) {
    const projectCounts = /* @__PURE__ */ new Map();
    this.allKnownProjects.forEach((project) => {
      projectCounts.set(project, 0);
    });
    items.filter((item) => !item.completed && !item.projects.includes("Archived")).forEach((item) => {
      item.projects.forEach((project) => {
        if (project !== "Archived") {
          const currentCount = projectCounts.get(project) || 0;
          projectCounts.set(project, currentCount + 1);
        }
      });
    });
    if (!projectCounts.has("Inbox")) {
      projectCounts.set("Inbox", 0);
    }
    const allProjectCounts = Array.from(projectCounts.entries()).map(([project, count]) => ({ project, count })).filter(({ project }) => project !== "Inbox" && project !== "Archived");
    return allProjectCounts.sort((a, b) => {
      const aIndex = this.allKnownProjects.indexOf(a.project);
      const bIndex = this.allKnownProjects.indexOf(b.project);
      if (aIndex === -1 && bIndex === -1) {
        return a.project.localeCompare(b.project);
      }
      if (aIndex === -1)
        return 1;
      if (bIndex === -1)
        return -1;
      return aIndex - bIndex;
    });
  }
  // Get ordered pinned projects
  getOrderedPinnedProjects(projectCounts) {
    const pinnedCounts = projectCounts.filter((p) => this.pinnedProjects.includes(p.project));
    return pinnedCounts.sort((a, b) => {
      const aIndex = this.pinnedProjects.indexOf(a.project);
      const bIndex = this.pinnedProjects.indexOf(b.project);
      if (aIndex === -1 && bIndex === -1) {
        return a.project.localeCompare(b.project);
      }
      if (aIndex === -1)
        return 1;
      if (bIndex === -1)
        return -1;
      return aIndex - bIndex;
    });
  }
  // Reorder project in array
  reorderProject(projectName, targetIndex, isPinned) {
    const array = isPinned ? this.pinnedProjects : this.allKnownProjects;
    const sourceIndex = array.indexOf(projectName);
    if (sourceIndex === -1 || sourceIndex === targetIndex)
      return;
    const [item] = array.splice(sourceIndex, 1);
    let insertIndex = targetIndex;
    if (sourceIndex < targetIndex) {
      insertIndex = targetIndex - 1;
    }
    array.splice(insertIndex, 0, item);
  }
  // Remove duplicates from allKnownProjects
  removeDuplicates() {
    this.allKnownProjects = [...new Set(this.allKnownProjects)];
  }
  // Get all projects for dropdowns
  getAvailableProjects() {
    const projects = [...this.allKnownProjects];
    projects.push("Archived");
    return projects.sort();
  }
  // Get project icon
  getProjectIcon(projectName) {
    return this.projectIcons.get(projectName) || "";
  }
  // Open modal to create project
  openAddProjectModal(file) {
    const modal = new AddProjectModal(
      this.plugin.app,
      async (projectName, icon) => {
        if (icon !== void 0) {
          this.projectIcons.set(projectName, icon);
          await this.saveProjectIcons(file);
        }
        await this.onProjectCreate(projectName, icon);
      }
    );
    modal.open();
  }
  // Open modal to edit project
  editProject(projectName, file) {
    const currentIcon = this.projectIcons.get(projectName) || "";
    const modal = new AddProjectModal(
      this.plugin.app,
      async (oldName, newName, icon) => {
        if (oldName !== newName && this.projectIcons.has(oldName)) {
          this.projectIcons.delete(oldName);
        }
        if (icon !== void 0) {
          this.projectIcons.set(newName, icon);
          await this.saveProjectIcons(file);
        }
        await this.onProjectUpdate(oldName, newName, icon);
      },
      projectName,
      currentIcon
    );
    modal.open();
  }
  // Show context menu for project
  showProjectMenu(event, projectName, file) {
    const existingMenu = document.querySelector(".project-context-menu");
    if (existingMenu) {
      existingMenu.remove();
    }
    const menu = document.createElement("div");
    menu.className = "project-context-menu";
    const editOption = menu.createEl("div", {
      text: "Edit",
      cls: "project-context-menu-item"
    });
    editOption.addEventListener("click", () => {
      this.editProject(projectName, file);
      menu.remove();
    });
    const isPinned = this.pinnedProjects.includes(projectName);
    const pinOption = menu.createEl("div", {
      text: isPinned ? "Unpin" : "Pin",
      cls: "project-context-menu-item"
    });
    pinOption.addEventListener("click", async () => {
      await this.onProjectPin(projectName, !isPinned);
      menu.remove();
    });
    const deleteOption = menu.createEl("div", {
      text: "Delete",
      cls: "project-context-menu-item"
    });
    deleteOption.addEventListener("click", () => {
      this.confirmDeleteProject(projectName);
      menu.remove();
    });
    document.body.appendChild(menu);
    menu.style.setProperty("--menu-left", `${event.clientX}px`);
    menu.style.setProperty("--menu-top", `${event.clientY}px`);
    const menuRect = menu.getBoundingClientRect();
    let menuTop = event.clientY;
    let menuLeft = event.clientX;
    if (menuTop + menuRect.height > window.innerHeight) {
      menuTop = event.clientY - menuRect.height;
    }
    if (menuLeft + menuRect.width > window.innerWidth) {
      menuLeft = event.clientX - menuRect.width;
    }
    menu.style.setProperty("--menu-left", `${menuLeft}px`);
    menu.style.setProperty("--menu-top", `${menuTop}px`);
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener("click", closeMenu);
      }
    };
    setTimeout(() => {
      document.addEventListener("click", closeMenu);
    }, 0);
  }
  // Show delete confirmation
  confirmDeleteProject(projectName) {
    const modal = new DeleteProjectModal(
      this.plugin.app,
      projectName,
      async () => {
        await this.onProjectDelete(projectName);
      }
    );
    modal.open();
  }
  // Update project name in arrays
  async renameProject(oldName, newName, file) {
    const pinnedIndex = this.pinnedProjects.indexOf(oldName);
    if (pinnedIndex !== -1) {
      this.pinnedProjects[pinnedIndex] = newName;
      await this.savePinnedProjects(file);
    }
    const projectIndex = this.allKnownProjects.indexOf(oldName);
    if (projectIndex !== -1) {
      this.allKnownProjects[projectIndex] = newName;
      this.removeDuplicates();
      await this.saveAllKnownProjects(file);
    }
  }
  // Remove project from all data
  async deleteProject(projectName, file) {
    const allIndex = this.allKnownProjects.indexOf(projectName);
    if (allIndex !== -1) {
      this.allKnownProjects.splice(allIndex, 1);
    }
    const pinnedIndex = this.pinnedProjects.indexOf(projectName);
    if (pinnedIndex !== -1) {
      this.pinnedProjects.splice(pinnedIndex, 1);
    }
    this.projectIcons.delete(projectName);
    this.removeDuplicates();
    await this.saveAllKnownProjects(file);
    await this.savePinnedProjects(file);
    await this.saveProjectIcons(file);
  }
  // Persistence delegation methods
  async savePinnedProjects(file) {
    await this.persistence.savePinnedProjects(file, this.pinnedProjects);
  }
  loadPinnedProjects(file) {
    this.pinnedProjects = this.persistence.loadPinnedProjects(file);
  }
  async saveAllKnownProjects(file) {
    await this.persistence.saveAllKnownProjects(file, this.allKnownProjects);
  }
  loadAllKnownProjects(file) {
    this.allKnownProjects = this.persistence.loadAllKnownProjects(file);
  }
  async saveProjectIcons(file) {
    await this.persistence.saveProjectIcons(file, this.projectIcons);
  }
  loadProjectIcons(file) {
    this.projectIcons = this.persistence.loadProjectIcons(file);
  }
};

// src/managers/filterManager.ts
var FilterManager = class {
  constructor() {
    // Current filter settings
    this.state = {
      sortOption: "priority",
      searchQuery: "",
      contextFilter: "",
      selectedProject: "",
      selectedTimeFilter: "",
      archivedFilter: false,
      completedFilter: false
    };
    this.availableContexts = [];
    this.availableProjects = [];
    this.onFilterChange = () => {
    };
  }
  // Get current filter state
  getState() {
    return { ...this.state };
  }
  // Update filter state
  setState(state) {
    this.state = { ...this.state, ...state };
    this.onFilterChange();
  }
  // Set available contexts list
  setAvailableContexts(contexts) {
    this.availableContexts = contexts;
  }
  // Set available projects list
  setAvailableProjects(projects) {
    this.availableProjects = projects;
  }
  getAvailableContexts() {
    return this.availableContexts;
  }
  getAvailableProjects() {
    return this.availableProjects;
  }
  // Change sort option
  setSortOption(sortOption) {
    this.state.sortOption = sortOption;
    this.onFilterChange();
  }
  // Update search query
  setSearchQuery(query) {
    this.state.searchQuery = query;
    this.onFilterChange();
  }
  // Filter by context
  setContextFilter(context) {
    this.state.contextFilter = context;
    this.onFilterChange();
  }
  // Filter by project and reset others
  setProjectFilter(project) {
    this.state.selectedProject = project;
    this.state.selectedTimeFilter = "";
    this.state.archivedFilter = false;
    this.state.completedFilter = false;
    this.state.contextFilter = "";
    this.state.sortOption = "priority";
    this.onFilterChange();
  }
  // Filter by time and reset others
  setTimeFilter(filter) {
    this.state.selectedTimeFilter = filter;
    this.state.selectedProject = "";
    this.state.archivedFilter = false;
    this.state.completedFilter = false;
    this.state.contextFilter = "";
    this.state.sortOption = "priority";
    this.onFilterChange();
  }
  // Apply special filters
  setSpecialFilter(filter) {
    if (filter === "archived") {
      this.state.archivedFilter = true;
      this.state.completedFilter = false;
      this.state.sortOption = "priority";
    } else if (filter === "completed") {
      this.state.completedFilter = true;
      this.state.archivedFilter = false;
      this.state.sortOption = "completion";
    } else {
      this.state.archivedFilter = false;
      this.state.completedFilter = false;
      this.state.sortOption = "priority";
    }
    this.state.selectedProject = "";
    this.state.selectedTimeFilter = "";
    this.state.contextFilter = "";
    this.onFilterChange();
  }
  // Apply preset filter by name
  setQuickFilter(filter) {
    switch (filter.toLowerCase()) {
      case "all":
        this.setState({
          selectedProject: "",
          selectedTimeFilter: "",
          archivedFilter: false,
          completedFilter: false
        });
        break;
      case "inbox":
        this.setProjectFilter("Inbox");
        break;
      case "today":
        this.setTimeFilter("today");
        break;
      case "upcoming":
        this.setTimeFilter("upcoming");
        break;
      case "archived":
        this.setSpecialFilter("archived");
        break;
      case "completed":
        this.setSpecialFilter("completed");
        break;
      default:
        this.setProjectFilter(filter);
        break;
    }
  }
  getSelectedProject() {
    return this.state.selectedProject;
  }
  // Get default project for new tasks
  getDefaultProject() {
    if (this.state.archivedFilter)
      return "Archived";
    return this.state.selectedProject || void 0;
  }
  // Get default due date for new tasks
  getDefaultDueDate() {
    if (this.state.selectedTimeFilter === "today") {
      return new Date().toISOString().split("T")[0];
    }
    return void 0;
  }
  // Filter and sort tasks
  applyFilters(items) {
    let filteredItems = [...items];
    if (this.state.completedFilter) {
      filteredItems = filteredItems.filter((item) => item.completed);
    } else if (this.state.archivedFilter) {
      filteredItems = filteredItems.filter((item) => item.projects.includes("Archived"));
    } else {
      filteredItems = filteredItems.filter((item) => !item.completed && !item.projects.includes("Archived"));
    }
    if (this.state.selectedTimeFilter && !this.state.archivedFilter && !this.state.completedFilter) {
      filteredItems = filteredItems.filter((item) => this.isTaskInTimeFilter(item));
    }
    if (this.state.searchQuery.trim()) {
      const query = this.state.searchQuery.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) => item.description.toLowerCase().includes(query) || item.projects.some((p) => p.toLowerCase().includes(query)) || item.contexts.some((c) => c.toLowerCase().includes(query))
      );
    }
    if (this.state.contextFilter.trim()) {
      if (this.state.contextFilter === "NONE") {
        filteredItems = filteredItems.filter((item) => item.contexts.length === 0);
      } else {
        filteredItems = filteredItems.filter(
          (item) => item.contexts.includes(this.state.contextFilter)
        );
      }
    }
    if (this.state.selectedProject.trim() && !this.state.archivedFilter) {
      if (this.state.selectedProject === "Inbox") {
        filteredItems = filteredItems.filter(
          (item) => item.projects.length === 0 || item.projects.includes("Inbox")
        );
      } else {
        filteredItems = filteredItems.filter(
          (item) => item.projects.includes(this.state.selectedProject)
        );
      }
    }
    this.sortTasks(filteredItems);
    return filteredItems;
  }
  // Check if task matches time filter
  isTaskInTimeFilter(item) {
    const dueMatch = item.description.match(/due:(\d{4}-\d{2}-\d{2})/);
    if (!dueMatch)
      return false;
    const today = new Date().toISOString().split("T")[0];
    const dueDate = dueMatch[1];
    if (this.state.selectedTimeFilter === "today") {
      return dueDate <= today;
    } else if (this.state.selectedTimeFilter === "upcoming") {
      return dueDate > today;
    }
    return true;
  }
  // Sort tasks by selected criteria
  sortTasks(tasks) {
    tasks.sort((a, b) => {
      const aCompleted = a.completed ? 1 : 0;
      const bCompleted = b.completed ? 1 : 0;
      if (aCompleted !== bCompleted) {
        return aCompleted - bCompleted;
      }
      switch (this.state.sortOption) {
        case "priority": {
          const aPri = a.priority || "Z";
          const bPri = b.priority || "Z";
          return aPri.localeCompare(bPri);
        }
        case "creation": {
          const dateA = a.creationDate || "0000-00-00";
          const dateB = b.creationDate || "0000-00-00";
          return dateB.localeCompare(dateA);
        }
        case "completion": {
          const dateA = a.completionDate || "0000-00-00";
          const dateB = b.completionDate || "0000-00-00";
          return dateB.localeCompare(dateA);
        }
        case "alphabetical": {
          return a.description.localeCompare(b.description);
        }
        case "projects": {
          const projectA = a.projects.length > 0 ? a.projects[0] : "zzz";
          const projectB = b.projects.length > 0 ? b.projects[0] : "zzz";
          return projectA.localeCompare(projectB);
        }
        case "contexts": {
          const contextA = a.contexts.length > 0 ? a.contexts[0] : "zzz";
          const contextB = b.contexts.length > 0 ? b.contexts[0] : "zzz";
          return contextA.localeCompare(contextB);
        }
        case "duedate": {
          const getDueDate = (item) => {
            const dueMatch = item.description.match(/due:(\d{4}-\d{2}-\d{2})/);
            return dueMatch ? dueMatch[1] : "9999-99-99";
          };
          return getDueDate(a).localeCompare(getDueDate(b));
        }
        default:
          return 0;
      }
    });
  }
  // Get contexts for current filter state
  getContextsForCurrentFilters(items) {
    let filteredItems = [...items];
    if (this.state.completedFilter) {
      filteredItems = filteredItems.filter((item) => item.completed);
    } else if (this.state.archivedFilter) {
      filteredItems = filteredItems.filter((item) => item.projects.includes("Archived"));
    } else {
      filteredItems = filteredItems.filter((item) => !item.completed && !item.projects.includes("Archived"));
    }
    if (this.state.selectedTimeFilter && !this.state.archivedFilter && !this.state.completedFilter) {
      filteredItems = filteredItems.filter((item) => this.isTaskInTimeFilter(item));
    }
    if (this.state.searchQuery.trim()) {
      const query = this.state.searchQuery.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) => item.description.toLowerCase().includes(query) || item.projects.some((p) => p.toLowerCase().includes(query)) || item.contexts.some((c) => c.toLowerCase().includes(query))
      );
    }
    if (this.state.selectedProject.trim() && !this.state.archivedFilter) {
      if (this.state.selectedProject === "Inbox") {
        filteredItems = filteredItems.filter(
          (item) => item.projects.length === 0 || item.projects.includes("Inbox")
        );
      } else {
        filteredItems = filteredItems.filter(
          (item) => item.projects.includes(this.state.selectedProject)
        );
      }
    }
    const contexts = /* @__PURE__ */ new Set();
    filteredItems.forEach((item) => {
      item.contexts.forEach((c) => contexts.add(c));
    });
    return Array.from(contexts).sort();
  }
};

// src/managers/stateManager.ts
var import_obsidian5 = require("obsidian");
var StateManager = class {
  // Restore view state from saved data
  async loadState(state, view) {
    const filterManager = view.getFilterManager();
    const projectManager = view.getProjectManager();
    filterManager.setState({
      sortOption: state.sortOption || "priority",
      searchQuery: state.searchQuery || "",
      contextFilter: state.contextFilter || "",
      selectedProject: state.selectedProject || "",
      selectedTimeFilter: state.selectedTimeFilter || "",
      archivedFilter: state.archivedFilter || false,
      completedFilter: state.completedFilter || false
    });
    if (state.pinnedProjects) {
      projectManager.pinnedProjects = [...state.pinnedProjects || []];
    }
    if (state.file) {
      const file = view.app.vault.getAbstractFileByPath(state.file);
      if (file instanceof import_obsidian5.TFile) {
        await view.leaf.openFile(file);
      } else {
        await view.loadDefaultFile();
      }
    } else {
      await view.loadDefaultFile();
    }
  }
  // Save current view state
  saveState(view) {
    const file = view.getFile();
    const filterState = view.getFilterManager().getState();
    const pinnedProjects = [...view.getProjectManager().pinnedProjects];
    return {
      file: (file == null ? void 0 : file.path) || null,
      ...filterState,
      pinnedProjects
    };
  }
};

// src/services/fileService.ts
var FileService = class {
  constructor(vault) {
    this.vault = vault;
  }
  // Read file content
  async readFile(file) {
    return await this.vault.read(file);
  }
  // Write content to file
  async writeFile(file, content) {
    await this.vault.modify(file, content);
  }
  // Replace task line in file
  async updateTaskLine(file, originalItem, newLine) {
    const currentContent = await this.readFile(file);
    const lines = currentContent.split("\n");
    const updatedLines = lines.map(
      (line) => line.trim() === originalItem.raw.trim() ? newLine : line
    );
    await this.writeFile(file, updatedLines.join("\n"));
  }
  // Remove task line from file
  async deleteTaskLine(file, item) {
    const currentContent = await this.readFile(file);
    const lines = currentContent.split("\n");
    const filteredLines = lines.filter((line) => line.trim() !== item.raw.trim());
    await this.writeFile(file, filteredLines.join("\n"));
  }
  // Add new task line to file
  async prependTaskLine(file, taskLine) {
    const currentContent = await this.readFile(file);
    if (!currentContent.trim()) {
      await this.writeFile(file, taskLine);
      return;
    }
    const lines = currentContent.split("\n");
    const firstLine = lines[0].trim();
    const firstDate = this.extractCreationDate(firstLine);
    const newDate = this.extractCreationDate(taskLine);
    const separator = firstDate && newDate && firstDate !== newDate ? "\n\n" : "\n";
    const newContent = `${taskLine}${separator}${currentContent}`;
    await this.writeFile(file, newContent);
  }
  // Extract date from task line
  extractCreationDate(taskLine) {
    let workingLine = taskLine.trim();
    if (workingLine.length >= 3 && workingLine.charAt(0) === "(" && workingLine.charAt(2) === ")" && /[A-Z]/.test(workingLine.charAt(1))) {
      workingLine = workingLine.substring(3).trim();
    }
    const dateMatch = workingLine.match(/^(\d{4}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[1] : null;
  }
  // Rename project in all tasks
  async replaceProjectName(file, oldName, newName) {
    const currentContent = await this.readFile(file);
    const lines = currentContent.split("\n");
    const updatedLines = lines.map((line) => {
      if (line.includes(`+${oldName}`)) {
        return line.replace(new RegExp(`\\+${oldName}\\b`, "g"), `+${newName}`);
      }
      return line;
    });
    await this.writeFile(file, updatedLines.join("\n"));
  }
  // Remove project from all tasks
  async removeProjectFromTasks(file, projectName) {
    const currentContent = await this.readFile(file);
    const lines = currentContent.split("\n");
    const updatedLines = lines.map((line) => {
      if (!line.trim()) {
        return line;
      }
      if (!line.includes(`+${projectName}`)) {
        return line;
      }
      const isCompleted = line.trim().startsWith("x ");
      if (isCompleted) {
        return line.replace(new RegExp(`\\s*\\+${projectName}\\b`, "g"), "");
      } else {
        return null;
      }
    }).filter((line) => line !== null);
    await this.writeFile(file, updatedLines.join("\n"));
  }
};

// src/utils/recurrenceCalculator.ts
var RecurrenceCalculator = class {
  // Calculate next occurrence date
  static calculateNextDueDate(currentDate, recPattern) {
    const date = new Date(currentDate);
    const simpleMatch = recPattern.match(/^(\d+)([dwmy])$/);
    if (simpleMatch) {
      const amount = parseInt(simpleMatch[1]);
      const unit = simpleMatch[2];
      switch (unit) {
        case "d":
          date.setDate(date.getDate() + amount);
          break;
        case "w":
          date.setDate(date.getDate() + amount * 7);
          break;
        case "m":
          date.setMonth(date.getMonth() + amount);
          break;
        case "y":
          date.setFullYear(date.getFullYear() + amount);
          break;
      }
      return date.toISOString().split("T")[0];
    }
    const parts = recPattern.split(",");
    if (parts.length < 2)
      return currentDate.toISOString().split("T")[0];
    const interval = parts[0];
    if (interval.endsWith("w")) {
      return this.calculateWeeklyRecurrence(date, interval, parts.slice(1));
    } else if (interval.endsWith("m")) {
      return this.calculateMonthlyRecurrence(date, currentDate, interval, parts.slice(1));
    } else {
      return this.calculateYearlyRecurrence(date, currentDate, parts);
    }
  }
  // Calculate weekly recurrence with specific days
  static calculateWeeklyRecurrence(date, interval, dayParts) {
    const weeks = parseInt(interval);
    const targetDays = dayParts.map((d) => this.getDayNumber(d));
    targetDays.sort((a, b) => a - b);
    const currentDayOfWeek = date.getDay();
    const currentDayIndex = targetDays.indexOf(currentDayOfWeek);
    const nextDate = new Date(date);
    if (currentDayIndex !== -1 && currentDayIndex < targetDays.length - 1) {
      const nextTargetDay = targetDays[currentDayIndex + 1];
      const daysToAdd = nextTargetDay - currentDayOfWeek;
      nextDate.setDate(nextDate.getDate() + daysToAdd);
    } else {
      let daysToAdd;
      if (currentDayIndex === targetDays.length - 1) {
        daysToAdd = weeks * 7 - currentDayOfWeek + targetDays[0];
      } else {
        const nextTargetDay = targetDays.find((d) => d > currentDayOfWeek);
        if (nextTargetDay !== void 0) {
          daysToAdd = nextTargetDay - currentDayOfWeek;
        } else {
          daysToAdd = weeks * 7 - currentDayOfWeek + targetDays[0];
        }
      }
      nextDate.setDate(nextDate.getDate() + daysToAdd);
    }
    return nextDate.toISOString().split("T")[0];
  }
  // Calculate monthly recurrence with specific dates
  static calculateMonthlyRecurrence(date, currentDate, interval, dateParts) {
    const months = parseInt(interval);
    if (dateParts.length === 1) {
      let targetDate = parseInt(dateParts[0]);
      targetDate = Math.min(targetDate, 31);
      date.setDate(targetDate);
      if (date <= currentDate) {
        date.setMonth(date.getMonth() + months);
      }
      while (date.getDate() !== targetDate) {
        date.setDate(0);
      }
      return date.toISOString().split("T")[0];
    } else {
      const targetDates = dateParts.map((d) => parseInt(d)).filter((d) => !isNaN(d)).map((d) => Math.min(d, 31));
      targetDates.sort((a, b) => a - b);
      let nextTargetDate = targetDates.find((d) => {
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
      while (date.getDate() !== nextTargetDate) {
        date.setDate(0);
      }
      return date.toISOString().split("T")[0];
    }
  }
  // Calculate yearly recurrence
  static calculateYearlyRecurrence(date, currentDate, parts) {
    const monthName = parts[0];
    const targetDate = parseInt(parts[1]);
    const targetMonth = this.getMonthNumber(monthName);
    if (targetMonth === -1)
      return currentDate.toISOString().split("T")[0];
    date.setMonth(targetMonth);
    date.setDate(targetDate);
    if (date <= currentDate) {
      date.setFullYear(date.getFullYear() + 1);
    }
    return date.toISOString().split("T")[0];
  }
  // Convert day name to number
  static getDayNumber(day) {
    var _a;
    const days = {
      "sun": 0,
      "mon": 1,
      "tue": 2,
      "wed": 3,
      "thu": 4,
      "fri": 5,
      "sat": 6
    };
    return (_a = days[day.toLowerCase()]) != null ? _a : -1;
  }
  // Convert month name to number
  static getMonthNumber(month) {
    var _a;
    const months = {
      "jan": 0,
      "feb": 1,
      "mar": 2,
      "apr": 3,
      "may": 4,
      "jun": 5,
      "jul": 6,
      "aug": 7,
      "sep": 8,
      "oct": 9,
      "nov": 10,
      "dec": 11
    };
    return (_a = months[month.toLowerCase()]) != null ? _a : -1;
  }
};

// src/services/taskService.ts
var TaskService = class {
  constructor(fileService) {
    this.fileService = fileService;
  }
  // Mark task as completed
  async completeTask(file, item) {
    const today = getCurrentLocalDate();
    const { cleanedLine, priority } = this.extractPriorityFromTaskLine(item.raw);
    const recMatch = item.raw.match(/\brec:(\S+)/);
    if (recMatch) {
      const recPattern = recMatch[1];
      const dueMatch = item.raw.match(/due:(\d{4}-\d{2}-\d{2})/);
      if (dueMatch) {
        const currentDue = new Date(dueMatch[1]);
        const nextDue = RecurrenceCalculator.calculateNextDueDate(currentDue, recPattern);
        let newTaskLine = item.raw.replace(/due:\d{4}-\d{2}-\d{2}/, `due:${nextDue}`);
        newTaskLine = newTaskLine.replace(/^x\s+\d{4}-\d{2}-\d{2}\s+/, "");
        await this.fileService.prependTaskLine(file, newTaskLine);
      }
    }
    let completedLine = `x ${today} ${cleanedLine}`;
    if (priority) {
      const notesMatch = completedLine.match(/(\s+\|\|.*)$/);
      if (notesMatch) {
        const beforeNotes = completedLine.substring(0, completedLine.lastIndexOf(notesMatch[1]));
        const notePart = notesMatch[1];
        completedLine = `${beforeNotes} pri:${priority}${notePart}`;
      } else {
        completedLine += ` pri:${priority}`;
      }
    }
    await this.fileService.updateTaskLine(file, item, completedLine);
  }
  // Unmark task completion
  async uncompleteTask(file, item) {
    const parts = item.raw.trim().split(/\s+/);
    if (parts[0] === "x" && /^\d{4}-\d{2}-\d{2}$/.test(parts[1])) {
      parts.splice(0, 2);
    }
    let taskLine = parts.join(" ");
    const priMatch = taskLine.match(/\s*pri:([A-Z])\b/);
    if (priMatch) {
      const priority = priMatch[1];
      taskLine = taskLine.replace(/\s*pri:[A-Z]\b/, "");
      taskLine = `(${priority}) ${taskLine}`;
    }
    if (item.projects.length === 0) {
      const notesMatch = taskLine.match(/(\s+\|\|.*)$/);
      if (notesMatch) {
        const beforeNotes = taskLine.substring(0, taskLine.lastIndexOf(notesMatch[1]));
        const notePart = notesMatch[1];
        taskLine = `${beforeNotes} +Inbox${notePart}`;
      } else {
        taskLine += " +Inbox";
      }
    }
    await this.fileService.updateTaskLine(file, item, taskLine);
  }
  // Update task content and handle archiving
  async updateTask(file, originalItem, newTaskLine) {
    const isBeingArchived = newTaskLine.includes("+Archived");
    const wasArchived = originalItem.projects.includes("Archived");
    if (isBeingArchived && !wasArchived) {
      const originalProjects = originalItem.projects.filter((p) => p !== "Archived");
      if (originalProjects.length > 0) {
        const origProjString = originalProjects.join(",");
        if (!newTaskLine.includes("origProj:")) {
          const notesMatch = newTaskLine.match(/(\s+\|\|.*)$/);
          if (notesMatch) {
            const beforeNotes = newTaskLine.substring(0, newTaskLine.lastIndexOf(notesMatch[1]));
            const notePart = notesMatch[1];
            newTaskLine = `${beforeNotes} origProj:${origProjString}${notePart}`;
          } else {
            newTaskLine += ` origProj:${origProjString}`;
          }
        }
      }
    } else if (isBeingArchived && wasArchived) {
      const origProjValue = originalItem.keyValuePairs.origProj;
      if (origProjValue && !newTaskLine.includes("origProj:")) {
        const notesMatch = newTaskLine.match(/(\s+\|\|.*)$/);
        if (notesMatch) {
          const beforeNotes = newTaskLine.substring(0, newTaskLine.lastIndexOf(notesMatch[1]));
          const notePart = notesMatch[1];
          newTaskLine = `${beforeNotes} origProj:${origProjValue}${notePart}`;
        } else {
          newTaskLine += ` origProj:${origProjValue}`;
        }
      }
    }
    await this.fileService.updateTaskLine(file, originalItem, newTaskLine);
  }
  // Remove task
  async deleteTask(file, item) {
    await this.fileService.deleteTaskLine(file, item);
  }
  // Add new task
  async addNewTask(file, taskLine) {
    await this.fileService.prependTaskLine(file, taskLine);
  }
  // Move task from archived back to original project
  async moveTaskFromArchivedToInbox(file, item) {
    const origProjValue = item.keyValuePairs.origProj;
    let targetProjects = [];
    if (origProjValue) {
      targetProjects = origProjValue.split(",");
    } else {
      targetProjects = ["Inbox"];
    }
    let cleanDescription = item.description.replace(/\s*\+\w+/g, "").replace(/\s*origProj:\S+/g, "").replace(/\s*due:\d{4}-\d{2}-\d{2}/g, "").replace(/\s*\|\|.*$/g, "").trim();
    let newTaskLine = "";
    if (item.priority) {
      newTaskLine += `(${item.priority}) `;
    }
    if (item.creationDate) {
      newTaskLine += `${item.creationDate} `;
    }
    newTaskLine += cleanDescription;
    targetProjects.forEach((project) => {
      newTaskLine += ` +${project}`;
    });
    item.contexts.forEach((context) => {
      if (!newTaskLine.includes(`@${context}`)) {
        newTaskLine += ` @${context}`;
      }
    });
    Object.entries(item.keyValuePairs).forEach(([key, value]) => {
      if (key !== "pri" || !item.completed) {
        if (key !== "origProj") {
          newTaskLine += ` ${key}:${value}`;
        }
      }
    });
    if (item.descriptionNotes) {
      const escapedNotes = item.descriptionNotes.replace(/\n/g, "\\n");
      newTaskLine += ` ||${escapedNotes}`;
    }
    await this.fileService.updateTaskLine(file, item, newTaskLine);
  }
  // Extract priority from task line format
  extractPriorityFromTaskLine(taskLine) {
    const priorityMatch = taskLine.match(/^\(([A-Z])\)\s+(.+)$/);
    if (priorityMatch) {
      return {
        cleanedLine: priorityMatch[2],
        priority: priorityMatch[1]
      };
    }
    return {
      cleanedLine: taskLine,
      priority: null
    };
  }
};

// src/services/projectService.ts
var ProjectService = class {
  constructor(fileService, projectManager) {
    this.fileService = fileService;
    this.projectManager = projectManager;
  }
  // Create new empty project
  async createEmptyProject(file, projectName) {
    if (!this.projectManager.allKnownProjects.includes(projectName)) {
      this.projectManager.allKnownProjects.push(projectName);
    }
    await this.projectManager.saveAllKnownProjects(file);
  }
  // Rename project everywhere
  async updateProjectName(file, oldName, newName) {
    if (oldName === newName)
      return;
    await this.fileService.replaceProjectName(file, oldName, newName);
    await this.projectManager.renameProject(oldName, newName, file);
  }
  // Delete project and its tasks
  async deleteProject(file, projectName) {
    await this.fileService.removeProjectFromTasks(file, projectName);
    await this.projectManager.deleteProject(projectName, file);
  }
  // Pin or unpin project
  async toggleProjectPin(file, projectName, isPinned) {
    if (isPinned) {
      if (!this.projectManager.pinnedProjects.includes(projectName)) {
        this.projectManager.pinnedProjects.push(projectName);
      }
    } else {
      const index = this.projectManager.pinnedProjects.indexOf(projectName);
      if (index !== -1) {
        this.projectManager.pinnedProjects.splice(index, 1);
      }
    }
    await this.projectManager.savePinnedProjects(file);
  }
};

// src/view.ts
var TodoTxtView = class extends import_obsidian6.TextFileView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.todoItems = [];
    this.fileService = new FileService(this.app.vault);
    this.taskService = new TaskService(this.fileService);
    this.filterManager = new FilterManager();
    this.projectManager = new ProjectManager(plugin);
    this.projectService = new ProjectService(this.fileService, this.projectManager);
    this.taskManager = new TaskManager(this.app);
    this.stateManager = new StateManager();
    this.renderer = new ViewRenderer(
      this.contentEl,
      this.taskManager,
      this.projectManager,
      this.filterManager,
      this.plugin
    );
    this.setupEventHandlers();
    this.registerEvent(this.app.vault.on("modify", (file) => {
      if (file === this.file) {
        this.loadFileContent();
      }
    }));
  }
  // Setup manager callbacks
  setupEventHandlers() {
    this.taskManager.onTaskComplete = async (item) => {
      if (this.file)
        await this.taskService.completeTask(this.file, item);
    };
    this.taskManager.onTaskUncomplete = async (item) => {
      if (this.file)
        await this.taskService.uncompleteTask(this.file, item);
    };
    this.taskManager.onTaskUpdate = async (item, taskLine) => {
      if (this.file)
        await this.taskService.updateTask(this.file, item, taskLine);
    };
    this.taskManager.onTaskDelete = async (item) => {
      if (this.file)
        await this.taskService.deleteTask(this.file, item);
    };
    this.taskManager.onTaskAdd = async (taskLine) => {
      if (this.file)
        await this.taskService.addNewTask(this.file, taskLine);
    };
    this.taskManager.onMoveFromArchived = async (item) => {
      if (this.file)
        await this.taskService.moveTaskFromArchivedToInbox(this.file, item);
    };
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
          this.filterManager.setProjectFilter("");
        }
        await this.loadFileContent();
      }
    };
    this.projectManager.onProjectPin = async (projectName, isPinned) => {
      await this.projectService.toggleProjectPin(this.file, projectName, isPinned);
      this.refresh();
    };
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
  getViewType() {
    return VIEW_TYPE_TODO_TXT;
  }
  getIcon() {
    return "circle-check-big";
  }
  getViewData() {
    return this.data || "";
  }
  setViewData(data, clear) {
    this.data = data;
    if (clear) {
      this.todoItems = [];
    }
    this.todoItems = TodoParser.parseTodoTxt(data);
    this.updateManagers().then(() => this.refresh());
  }
  clear() {
    this.contentEl.empty();
  }
  // Called when view opens
  async onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass("todo-txt-view");
    this.render();
  }
  // Called when file loads
  async onLoadFile(file) {
    this.projectManager.loadPinnedProjects(file);
    this.projectManager.loadAllKnownProjects(file);
    this.projectManager.loadProjectIcons(file);
    await super.onLoadFile(file);
  }
  // Restore view state
  async setState(state, result) {
    await this.stateManager.loadState(state, this);
    await super.setState(state, result);
  }
  // Save current state
  getState() {
    return this.stateManager.saveState(this);
  }
  // Update managers with current data
  async updateManagers() {
    this.taskManager.setTodoItems(this.todoItems);
    const oldProjectsCount = this.projectManager.allKnownProjects.length;
    this.projectManager.updateFromTodoItems(this.todoItems);
    if (this.projectManager.allKnownProjects.length > oldProjectsCount) {
      await this.projectManager.saveAllKnownProjects(this.file);
    }
    const contexts = /* @__PURE__ */ new Set();
    const projects = /* @__PURE__ */ new Set();
    this.todoItems.forEach((item) => {
      item.contexts.forEach((c) => contexts.add(c));
      item.projects.forEach((p) => projects.add(p));
    });
    this.filterManager.setAvailableContexts(Array.from(contexts));
    this.filterManager.setAvailableProjects(Array.from(projects));
  }
  // Render filtered view
  render() {
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
  refresh() {
    this.render();
  }
  // Read and parse file content
  async loadFileContent() {
    if (this.file) {
      const content = await this.fileService.readFile(this.file);
      this.setViewData(content, true);
    }
  }
  // Open task creation modal
  openAddTaskModal() {
    this.taskManager.openAddTaskModal(
      this.projectManager.getAvailableProjects(),
      this.filterManager.getAvailableContexts(),
      this.filterManager.getDefaultProject(),
      this.filterManager.getDefaultDueDate()
    );
  }
  // Apply quick filter
  setFilter(filter) {
    this.filterManager.setQuickFilter(filter);
  }
  // Clean up on view close
  async onClose() {
    this.renderer.destroy();
    await super.onClose();
  }
  getFile() {
    return this.file;
  }
  getFilterManager() {
    return this.filterManager;
  }
  getProjectManager() {
    return this.projectManager;
  }
  // Load plugin default file
  async loadDefaultFile() {
    try {
      const defaultFile = await this.plugin.getDefaultTodoFile();
      await this.leaf.openFile(defaultFile);
    } catch (error) {
      console.error("Failed to load default todo file:", error);
    }
  }
};

// src/utils/taskOperations.ts
var TaskOperations = class {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
  }
  // Extract projects from todo line
  extractProjectsFromLine(line) {
    const projects = [];
    let cleanLine = line;
    const notesIndex = cleanLine.indexOf("||");
    if (notesIndex !== -1) {
      cleanLine = cleanLine.substring(0, notesIndex).trim();
    }
    cleanLine = cleanLine.replace(/^x\s+/, "");
    cleanLine = cleanLine.replace(/^KATEX_INLINE_OPEN[A-Z]KATEX_INLINE_CLOSE\s+/, "");
    cleanLine = cleanLine.replace(/^\d{4}-\d{2}-\d{2}\s+/, "");
    cleanLine = cleanLine.replace(/^\d{4}-\d{2}-\d{2}\s+\d{4}-\d{2}-\d{2}\s+/, "");
    const tokens = cleanLine.split(/\s+/);
    for (const token of tokens) {
      if (/^\+\w+$/.test(token)) {
        const project = token.substring(1);
        projects.push(project);
      }
    }
    return projects;
  }
  // Extract contexts from todo line
  extractContextsFromLine(line) {
    const contexts = [];
    let cleanLine = line;
    const notesIndex = cleanLine.indexOf("||");
    if (notesIndex !== -1) {
      cleanLine = cleanLine.substring(0, notesIndex).trim();
    }
    cleanLine = cleanLine.replace(/^x\s+/, "");
    cleanLine = cleanLine.replace(/^KATEX_INLINE_OPEN[A-Z]KATEX_INLINE_CLOSE\s+/, "");
    cleanLine = cleanLine.replace(/^\d{4}-\d{2}-\d{2}\s+/, "");
    cleanLine = cleanLine.replace(/^\d{4}-\d{2}-\d{2}\s+\d{4}-\d{2}-\d{2}\s+/, "");
    const contextMatches = cleanLine.match(/(?:^|\s)@(\S+)/g);
    if (contextMatches) {
      contextMatches.forEach((match) => {
        const context = match.trim().substring(1);
        contexts.push(context);
      });
    }
    return contexts;
  }
  // Get projects from file and settings
  async getAvailableProjectsFromFile(file) {
    try {
      const projects = /* @__PURE__ */ new Set();
      if (this.settings.allKnownProjects && this.settings.allKnownProjects[file.path]) {
        this.settings.allKnownProjects[file.path].forEach((project) => {
          if (project !== "Inbox") {
            projects.add(project);
          }
        });
      }
      const content = await this.app.vault.read(file);
      const lines = content.split("\n").filter((line) => line.trim().length > 0);
      lines.forEach((line) => {
        const projectsFromLine = this.extractProjectsFromLine(line);
        projectsFromLine.forEach((project) => {
          if (project !== "Inbox") {
            projects.add(project);
          }
        });
      });
      return Array.from(projects).sort();
    } catch (error) {
      console.error("Error reading file for projects:", error);
      if (this.settings.allKnownProjects && this.settings.allKnownProjects[file.path]) {
        return this.settings.allKnownProjects[file.path].filter((project) => project !== "Inbox").sort();
      }
      return [];
    }
  }
  // Extract contexts from file
  async getAvailableContextsFromFile(file) {
    try {
      const content = await this.app.vault.read(file);
      const contexts = /* @__PURE__ */ new Set();
      const lines = content.split("\n").filter((line) => line.trim().length > 0);
      lines.forEach((line) => {
        if (line.trim().startsWith("x ")) {
          return;
        }
        const contextsFromLine = this.extractContextsFromLine(line);
        contextsFromLine.forEach((context) => {
          contexts.add(context);
        });
      });
      return Array.from(contexts).sort();
    } catch (error) {
      console.error("Error reading file for contexts:", error);
      return [];
    }
  }
  // Convert filter to state
  getStartupState(filter) {
    switch (filter.toLowerCase()) {
      case "all":
        return { selectedProject: "", selectedTimeFilter: "", archivedFilter: false, completedFilter: false };
      case "inbox":
        return { selectedProject: "Inbox", selectedTimeFilter: "", archivedFilter: false, completedFilter: false };
      case "today":
        return { selectedProject: "", selectedTimeFilter: "today", archivedFilter: false, completedFilter: false };
      case "upcoming":
        return { selectedProject: "", selectedTimeFilter: "upcoming", archivedFilter: false, completedFilter: false };
      case "archived":
        return { selectedProject: "", selectedTimeFilter: "", archivedFilter: true, completedFilter: false };
      case "completed":
        return { selectedProject: "", selectedTimeFilter: "", archivedFilter: false, completedFilter: true };
      default:
        return { selectedProject: filter, selectedTimeFilter: "", archivedFilter: false, completedFilter: false };
    }
  }
};

// src/utils/fileOperations.ts
var import_obsidian7 = require("obsidian");
var FileOperations = class {
  constructor(app) {
    this.app = app;
  }
  // Get or create default file
  async getDefaultTodoFile(todoFilePath) {
    let path = todoFilePath.trim();
    if (!path) {
      path = DEFAULT_SETTINGS.todoFilePath;
    }
    let file = this.app.vault.getAbstractFileByPath(path);
    if (!file) {
      const folderPath = path.substring(0, path.lastIndexOf("/"));
      if (folderPath && folderPath !== path) {
        try {
          await this.createFolderRecursive(folderPath);
        } catch (error) {
        }
      }
      await this.app.vault.create(path, "");
      file = this.app.vault.getAbstractFileByPath(path);
    }
    if (file instanceof import_obsidian7.TFile) {
      return file;
    } else {
      throw new Error("Failed to get or create default Todo.txt file");
    }
  }
  // Create folders recursively
  async createFolderRecursive(folderPath) {
    const parts = folderPath.split("/");
    let currentPath = "";
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(currentPath)) {
        await this.app.vault.createFolder(currentPath);
      }
    }
  }
};

// src/main.ts
var TodoTxtPlugin = class extends import_obsidian8.Plugin {
  async onload() {
    console.log("Loading Todo.txt plugin...");
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.taskOps = new TaskOperations(this.app, this.settings);
    this.fileOps = new FileOperations(this.app);
    this.registerView(VIEW_TYPE_TODO_TXT, (leaf) => new TodoTxtView(leaf, this));
    this.registerExtensions(["txt"], VIEW_TYPE_TODO_TXT);
    this.registerEvent(
      this.app.vault.on("rename", async (file, oldPath) => {
        if (file instanceof import_obsidian8.TFile && file.extension === "txt") {
          await this.handleFileRename(file, oldPath);
        }
      })
    );
    this.addRibbonIcon("circle-check-big", "Open task", () => {
      this.activateView();
    });
    this.addCommand({
      id: "open-task",
      name: "Open task",
      callback: () => this.activateView()
    });
    this.addCommand({
      id: "add-task",
      name: "Add task",
      callback: () => {
        const activeLeaf = this.app.workspace.getActiveViewOfType(TodoTxtView);
        if (activeLeaf) {
          activeLeaf.openAddTaskModal();
        } else {
          this.openAddTaskModal();
        }
      }
    });
    this.addCommand({
      id: "create-new-file",
      name: "Create new file",
      callback: async () => {
        const todoPath = this.settings.todoFilePath;
        const folder = todoPath.substring(0, todoPath.lastIndexOf("/"));
        const fileName = todoPath.substring(todoPath.lastIndexOf("/") + 1);
        const baseName = fileName.replace(".txt", "");
        if (!this.app.vault.getAbstractFileByPath(todoPath)) {
          const newFile2 = await this.app.vault.create(todoPath, "");
          await this.openTodoTxtView(newFile2);
          return;
        }
        let counter = 1;
        let newPath = `${folder}/${baseName} ${counter}.txt`;
        while (this.app.vault.getAbstractFileByPath(newPath)) {
          counter++;
          newPath = `${folder}/${baseName} ${counter}.txt`;
        }
        const newFile = await this.app.vault.create(newPath, "");
        await this.openTodoTxtView(newFile);
      }
    });
    if (this.settings.openOnStartup) {
      setTimeout(() => {
        this.activateView();
      }, 1e3);
    }
    this.addSettingTab(new TodoTxtSettingTab(this.app, this));
    console.log("Todo.txt plugin loaded successfully");
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  // Update settings on file rename
  async handleFileRename(file, oldPath) {
    var _a;
    let dataUpdated = false;
    if (this.settings.pinnedProjects && this.settings.pinnedProjects[oldPath]) {
      this.settings.pinnedProjects[file.path] = this.settings.pinnedProjects[oldPath];
      delete this.settings.pinnedProjects[oldPath];
      dataUpdated = true;
    }
    if (this.settings.projectIcons && this.settings.projectIcons[oldPath]) {
      this.settings.projectIcons[file.path] = this.settings.projectIcons[oldPath];
      delete this.settings.projectIcons[oldPath];
      dataUpdated = true;
    }
    if (this.settings.allKnownProjects && this.settings.allKnownProjects[oldPath]) {
      this.settings.allKnownProjects[file.path] = this.settings.allKnownProjects[oldPath];
      delete this.settings.allKnownProjects[oldPath];
      dataUpdated = true;
    }
    if (dataUpdated) {
      await this.saveSettings();
      const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_TODO_TXT);
      for (const leaf of leaves) {
        const view = leaf.view;
        if (((_a = view.getFile()) == null ? void 0 : _a.path) === file.path) {
          view.getProjectManager().loadPinnedProjects(file);
          view.getProjectManager().loadAllKnownProjects(file);
          view.getProjectManager().loadProjectIcons(file);
          await view.loadFileContent();
        }
      }
    }
  }
  // Open task modal for default file
  async openAddTaskModal() {
    const defaultFile = await this.getDefaultTodoFile();
    const availableProjects = await this.taskOps.getAvailableProjectsFromFile(defaultFile);
    const availableContexts = await this.taskOps.getAvailableContextsFromFile(defaultFile);
    const modal = new AddTaskModal(this.app, async (taskLine) => {
      await this.addTaskToDefaultFile(taskLine);
    }, availableProjects, availableContexts);
    modal.open();
  }
  // Add task to default file
  async addTaskToDefaultFile(taskLine) {
    var _a;
    const defaultFile = await this.getDefaultTodoFile();
    const currentContent = await this.app.vault.read(defaultFile);
    const newContent = currentContent ? `${taskLine}
${currentContent}` : taskLine;
    await this.app.vault.modify(defaultFile, newContent);
    const projects = this.taskOps.extractProjectsFromLine(taskLine);
    if (projects.length > 0) {
      if (!this.settings.allKnownProjects) {
        this.settings.allKnownProjects = {};
      }
      if (!this.settings.allKnownProjects[defaultFile.path]) {
        this.settings.allKnownProjects[defaultFile.path] = [];
      }
      let projectsAdded = false;
      projects.forEach((project) => {
        if (!this.settings.allKnownProjects[defaultFile.path].includes(project) && project !== "Inbox" && project !== "Archived") {
          this.settings.allKnownProjects[defaultFile.path].push(project);
          projectsAdded = true;
        }
      });
      if (projectsAdded) {
        await this.saveSettings();
      }
      const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_TODO_TXT);
      for (const leaf of leaves) {
        const view = leaf.view;
        if (((_a = view.getFile()) == null ? void 0 : _a.path) === defaultFile.path) {
          const projectManager = view.getProjectManager();
          projects.forEach((project) => {
            if (!projectManager.allKnownProjects.includes(project) && project !== "Inbox" && project !== "Archived") {
              projectManager.allKnownProjects.push(project);
            }
          });
          break;
        }
      }
    }
  }
  // Open todo view for file
  async openTodoTxtView(file) {
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.setViewState({
      type: VIEW_TYPE_TODO_TXT,
      state: { file: file.path },
      active: true
    });
  }
  // Get or create default file
  async getDefaultTodoFile() {
    return this.fileOps.getDefaultTodoFile(this.settings.todoFilePath);
  }
  // Open or focus default view
  async activateView() {
    var _a;
    const defaultFile = await this.getDefaultTodoFile();
    const defaultFilePath = defaultFile.path;
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_TODO_TXT);
    for (const leaf2 of leaves) {
      const state = leaf2.getViewState();
      if (state.type === VIEW_TYPE_TODO_TXT && ((_a = state.state) == null ? void 0 : _a.file) === defaultFilePath) {
        const view = leaf2.view;
        this.app.workspace.setActiveLeaf(leaf2);
        this.app.workspace.revealLeaf(leaf2);
        setTimeout(() => {
          view.setFilter(this.settings.startupFilter);
        }, 100);
        return;
      }
    }
    const leaf = this.app.workspace.getLeaf(true);
    const startupState = this.taskOps.getStartupState(this.settings.startupFilter);
    await leaf.setViewState({
      type: VIEW_TYPE_TODO_TXT,
      state: { file: defaultFilePath, ...startupState },
      active: true
    });
  }
};
