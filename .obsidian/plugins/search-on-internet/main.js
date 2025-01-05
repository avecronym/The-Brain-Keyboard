'use strict';

var obsidian = require('obsidian');
var require$$0 = require('util');
var path = require('path');
var childProcess = require('child_process');
var fs = require('fs');
var os = require('os');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var require$$0__default = /*#__PURE__*/_interopDefaultLegacy(require$$0);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var childProcess__default = /*#__PURE__*/_interopDefaultLegacy(childProcess);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var os__default = /*#__PURE__*/_interopDefaultLegacy(os);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var DEFAULT_QUERY = {
    tags: [],
    query: '{{query}}',
    name: '',
    encode: true,
};
var DEFAULT_SETTING = {
    searches: [{
            tags: [],
            query: 'https://www.google.com/search?&q={{query}}',
            name: 'Google',
            encode: true,
        }, {
            tags: [],
            query: 'https://en.wikipedia.org/wiki/Special:Search/{{query}}',
            name: 'Wikipedia',
            encode: true,
        }],
    useIframe: true,
};
var parseTags = function (inputs) {
    return inputs.split(',')
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return /^#([A-Za-z])\w+$/.test(s); });
};
var SOISettingTab = /** @class */ (function (_super) {
    __extends(SOISettingTab, _super);
    function SOISettingTab(app, plugin) {
        var _this = _super.call(this, app, plugin) || this;
        _this.plugin = plugin;
        return _this;
    }
    SOISettingTab.prototype.display = function () {
        var _this = this;
        var containerEl = this.containerEl;
        containerEl.empty();
        var plugin = this.plugin;
        new obsidian.Setting(containerEl)
            .setName('Open in iframe')
            .setDesc('If set to true, this will open your searches in an iframe within Obsidian. ' +
            'Otherwise, it will open in your default browser.')
            .addToggle(function (toggle) {
            toggle.setValue(_this.plugin.settings.useIframe)
                .onChange(function (new_value) {
                _this.plugin.settings.useIframe = new_value;
                _this.plugin.saveData(_this.plugin.settings);
            });
        });
        // Code mostly taken from https://github.com/SilentVoid13/Templater/blob/master/src/settings.ts
        plugin.settings.searches.forEach(function (search) {
            var div = containerEl.createEl('div');
            div.addClass('soi_div');
            new obsidian.Setting(div) //
                .addExtraButton(function (extra) {
                extra.setIcon('cross')
                    .setTooltip('Delete')
                    .onClick(function () {
                    var index = plugin.settings.searches.indexOf(search);
                    if (index > -1) {
                        plugin.settings.searches.splice(index, 1);
                        // Force refresh
                        _this.display();
                    }
                });
            })
                .addText(function (text) {
                return text.setPlaceholder('Search name')
                    .setValue(search.name)
                    .onChange(function (newValue) {
                    var index = plugin.settings.searches.indexOf(search);
                    if (index > -1) {
                        search.name = newValue;
                        plugin.saveSettings();
                        // title.textContent = newValue;
                    }
                });
            }).setName('Name')
                .setDesc('Name of the search. Click the cross to delete the search.');
            new obsidian.Setting(div)
                .setName('Encode')
                .setDesc('If set to true, this will encode raw text to be used in URLs. ' +
                'Otherwise, it will not encode your query.')
                .addToggle(function (toggle) {
                toggle.setValue(search.encode)
                    .onChange(function (newValue) {
                    var index = plugin.settings.searches.indexOf(search);
                    if (index > -1) {
                        search.encode = newValue;
                        plugin.saveSettings();
                    }
                });
            });
            new obsidian.Setting(div)
                .addTextArea(function (text) {
                var t = text.setPlaceholder('Search query')
                    .setValue(search.query)
                    .onChange(function (newQuery) {
                    var index = plugin.settings.searches.indexOf(search);
                    if (index > -1) {
                        search.query = newQuery;
                        plugin.saveSettings();
                    }
                });
                t.inputEl.setAttr('rows', 2);
                return t; //
            }).setName('URL')
                .setDesc('URL to open when executing the search. ' +
                'Use {{query}} to refer to the query, which is either the selected text, or the title of a note.');
            new obsidian.Setting(div).addText(function (text) {
                return text.setPlaceholder('')
                    .setValue(search.tags.join(', '))
                    .onChange(function (newValue) {
                    var index = plugin.settings.searches.indexOf(search);
                    if (index > -1) {
                        search.tags = parseTags(newValue);
                        plugin.saveSettings();
                    }
                });
            }).setName('Tags')
                .setDesc('Only add search to notes with these comma-separated tags. Leave empty to use all tags.');
        });
        var div = containerEl.createEl('div');
        div.addClass('soi_div2');
        var setting = new obsidian.Setting(containerEl)
            .addButton(function (button) {
            return button.setButtonText('Add Search').onClick(function () {
                plugin.settings.searches.push({
                    name: '',
                    query: '',
                    tags: [],
                    encode: true,
                });
                // Force refresh
                _this.display();
            });
        });
        setting.infoEl.remove();
        div.appendChild(containerEl.lastChild);
    };
    return SOISettingTab;
}(obsidian.PluginSettingTab));

function createCommonjsModule(fn, basedir, module) {
	return module = {
		path: basedir,
		exports: {},
		require: function (path, base) {
			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
		}
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

let isDocker;

function hasDockerEnv() {
	try {
		fs__default['default'].statSync('/.dockerenv');
		return true;
	} catch (_) {
		return false;
	}
}

function hasDockerCGroup() {
	try {
		return fs__default['default'].readFileSync('/proc/self/cgroup', 'utf8').includes('docker');
	} catch (_) {
		return false;
	}
}

var isDocker_1 = () => {
	if (isDocker === undefined) {
		isDocker = hasDockerEnv() || hasDockerCGroup();
	}

	return isDocker;
};

var isWsl_1 = createCommonjsModule(function (module) {




const isWsl = () => {
	if (process.platform !== 'linux') {
		return false;
	}

	if (os__default['default'].release().toLowerCase().includes('microsoft')) {
		if (isDocker_1()) {
			return false;
		}

		return true;
	}

	try {
		return fs__default['default'].readFileSync('/proc/version', 'utf8').toLowerCase().includes('microsoft') ?
			!isDocker_1() : false;
	} catch (_) {
		return false;
	}
};

if (process.env.__IS_WSL_TEST__) {
	module.exports = isWsl;
} else {
	module.exports = isWsl();
}
});

const {promisify} = require$$0__default['default'];






const pAccess = promisify(fs__default['default'].access);
const pReadFile = promisify(fs__default['default'].readFile);

// Path to included `xdg-open`.
const localXdgOpenPath = path__default['default'].join(__dirname, 'xdg-open');

/**
Get the mount point for fixed drives in WSL.

@inner
@returns {string} The mount point.
*/
const getWslDrivesMountPoint = (() => {
	// Default value for "root" param
	// according to https://docs.microsoft.com/en-us/windows/wsl/wsl-config
	const defaultMountPoint = '/mnt/';

	let mountPoint;

	return async function () {
		if (mountPoint) {
			// Return memoized mount point value
			return mountPoint;
		}

		const configFilePath = '/etc/wsl.conf';

		let isConfigFileExists = false;
		try {
			await pAccess(configFilePath, fs__default['default'].constants.F_OK);
			isConfigFileExists = true;
		} catch (_) {}

		if (!isConfigFileExists) {
			return defaultMountPoint;
		}

		const configContent = await pReadFile(configFilePath, {encoding: 'utf8'});
		const configMountPoint = /root\s*=\s*(.*)/g.exec(configContent);

		if (!configMountPoint) {
			return defaultMountPoint;
		}

		mountPoint = configMountPoint[1].trim();
		mountPoint = mountPoint.endsWith('/') ? mountPoint : mountPoint + '/';

		return mountPoint;
	};
})();

var open = async (target, options) => {
	if (typeof target !== 'string') {
		throw new TypeError('Expected a `target`');
	}

	options = {
		wait: false,
		background: false,
		allowNonzeroExitCode: false,
		...options
	};

	let command;
	let {app} = options;
	let appArguments = [];
	const cliArguments = [];
	const childProcessOptions = {};

	if (Array.isArray(app)) {
		appArguments = app.slice(1);
		app = app[0];
	}

	if (process.platform === 'darwin') {
		command = 'open';

		if (options.wait) {
			cliArguments.push('--wait-apps');
		}

		if (options.background) {
			cliArguments.push('--background');
		}

		if (app) {
			cliArguments.push('-a', app);
		}
	} else if (process.platform === 'win32' || (isWsl_1 && !isDocker_1())) {
		const mountPoint = await getWslDrivesMountPoint();

		command = isWsl_1 ?
			`${mountPoint}c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe` :
			`${process.env.SYSTEMROOT}\\System32\\WindowsPowerShell\\v1.0\\powershell`;

		cliArguments.push(
			'-NoProfile',
			'-NonInteractive',
			'–ExecutionPolicy',
			'Bypass',
			'-EncodedCommand'
		);

		if (!isWsl_1) {
			childProcessOptions.windowsVerbatimArguments = true;
		}

		const encodedArguments = ['Start'];

		if (options.wait) {
			encodedArguments.push('-Wait');
		}

		if (app) {
			// Double quote with double quotes to ensure the inner quotes are passed through.
			// Inner quotes are delimited for PowerShell interpretation with backticks.
			encodedArguments.push(`"\`"${app}\`""`, '-ArgumentList');
			appArguments.unshift(target);
		} else {
			encodedArguments.push(`"${target}"`);
		}

		if (appArguments.length > 0) {
			appArguments = appArguments.map(arg => `"\`"${arg}\`""`);
			encodedArguments.push(appArguments.join(','));
		}

		// Using Base64-encoded command, accepted by PowerShell, to allow special characters.
		target = Buffer.from(encodedArguments.join(' '), 'utf16le').toString('base64');
	} else {
		if (app) {
			command = app;
		} else {
			// When bundled by Webpack, there's no actual package file path and no local `xdg-open`.
			const isBundled = !__dirname || __dirname === '/';

			// Check if local `xdg-open` exists and is executable.
			let exeLocalXdgOpen = false;
			try {
				await pAccess(localXdgOpenPath, fs__default['default'].constants.X_OK);
				exeLocalXdgOpen = true;
			} catch (_) {}

			const useSystemXdgOpen = process.versions.electron ||
				process.platform === 'android' || isBundled || !exeLocalXdgOpen;
			command = useSystemXdgOpen ? 'xdg-open' : localXdgOpenPath;
		}

		if (appArguments.length > 0) {
			cliArguments.push(...appArguments);
		}

		if (!options.wait) {
			// `xdg-open` will block the process unless stdio is ignored
			// and it's detached from the parent even if it's unref'd.
			childProcessOptions.stdio = 'ignore';
			childProcessOptions.detached = true;
		}
	}

	cliArguments.push(target);

	if (process.platform === 'darwin' && appArguments.length > 0) {
		cliArguments.push('--args', ...appArguments);
	}

	const subprocess = childProcess__default['default'].spawn(command, cliArguments, childProcessOptions);

	if (options.wait) {
		return new Promise((resolve, reject) => {
			subprocess.once('error', reject);

			subprocess.once('close', exitCode => {
				if (options.allowNonzeroExitCode && exitCode > 0) {
					reject(new Error(`Exited with code ${exitCode}`));
					return;
				}

				resolve(subprocess);
			});
		});
	}

	subprocess.unref();

	return subprocess;
};

var SearchModal = /** @class */ (function (_super) {
    __extends(SearchModal, _super);
    function SearchModal(app, plugin, query) {
        var _this = _super.call(this, app) || this;
        _this.plugin = plugin;
        _this.setPlaceholder('');
        _this.query = query;
        _this.setInstructions([{ command: '↑↓', purpose: 'to navigate' },
            { command: '↵', purpose: "to search " + _this.query },
            { command: 'esc', purpose: 'to dismiss' }]);
        return _this;
    }
    SearchModal.prototype.onOpen = function () {
        _super.prototype.onOpen.call(this);
        // const {contentEl} = this;
        this.inputEl.focus();
    };
    SearchModal.prototype.onClose = function () {
        _super.prototype.onClose.call(this);
        var contentEl = this.contentEl;
        contentEl.empty();
    };
    SearchModal.prototype.getItemText = function (item) {
        return item.name;
    };
    SearchModal.prototype.renderSuggestion = function (item, el) {
        _super.prototype.renderSuggestion.call(this, item, el);
        el.innerHTML = "Search on: " + el.innerHTML;
    };
    SearchModal.prototype.getItems = function () {
        return this.plugin.settings.searches;
    };
    SearchModal.prototype.onChooseItem = function (item, evt) {
        this.plugin.openSearch(item, this.query);
    };
    return SearchModal;
}(obsidian.FuzzySuggestModal));

var SearchView = /** @class */ (function (_super) {
    __extends(SearchView, _super);
    function SearchView(plugin, leaf, query, site, url) {
        var _this = _super.call(this, leaf) || this;
        _this.query = query;
        _this.site = site;
        _this.url = url;
        _this.plugin = plugin;
        return _this;
    }
    SearchView.prototype.onOpen = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.frame = document.createElement('iframe');
                this.frame.addClass("soi-site");
                this.frame.setAttr('style', 'height: 100%; width:100%');
                this.frame.setAttr('src', this.url);
                this.frame.setAttr('tabindex', '0');
                this.containerEl.children[1].appendChild(this.frame);
                return [2 /*return*/];
            });
        });
    };
    SearchView.prototype.getDisplayText = function () {
        return this.site + ": " + this.query;
    };
    SearchView.prototype.getViewType = function () {
        return 'Search on Internet';
    };
    return SearchView;
}(obsidian.ItemView));

var SearchOnInternetPlugin = /** @class */ (function (_super) {
    __extends(SearchOnInternetPlugin, _super);
    function SearchOnInternetPlugin() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SearchOnInternetPlugin.prototype.onload = function () {
        return __awaiter(this, void 0, void 0, function () {
            var plugin;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('loading search-on-internet');
                        return [4 /*yield*/, this.loadSettings()];
                    case 1:
                        _a.sent();
                        this.addSettingTab(new SOISettingTab(this.app, this));
                        plugin = this;
                        this.registerEvent(this.app.workspace.on('file-menu', function (menu, file, source) {
                            var _a, _b;
                            if (file === null) {
                                return;
                            }
                            var fileTags = (_b = (_a = _this.app.metadataCache.getFileCache(file)) === null || _a === void 0 ? void 0 : _a.tags) === null || _b === void 0 ? void 0 : _b.map(function (t) { return t.tag; });
                            _this.settings.searches.forEach(function (search) {
                                if (search.tags.length === 0 ||
                                    (fileTags === null || fileTags === void 0 ? void 0 : fileTags.some(function (t) { return search.tags.contains(t); }))) {
                                    menu.addItem(function (item) {
                                        item.setTitle("Search " + search.name).setIcon('search')
                                            .onClick(function (evt) {
                                            plugin.openSearch(search, file.basename);
                                        });
                                    });
                                }
                            });
                        }));
                        this.addCommand({
                            id: 'search-on-internet',
                            name: 'Perform search',
                            callback: function () {
                                var query = _this.getSelectedText();
                                if (query === null || query === '') {
                                    var activeView = _this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
                                    if (activeView == null) {
                                        return;
                                    }
                                    query = activeView.getDisplayText();
                                }
                                var modal = new SearchModal(plugin.app, plugin, query);
                                modal.open();
                            },
                        });
                        // Preview mode
                        this.onDom = function (event) {
                            var fileMenu = new obsidian.Menu(plugin.app);
                            // @ts-ignore
                            fileMenu.dom.classList.add('soi-file-menu');
                            // Functionality: Open external link in Iframe.
                            var emptyMenu = true;
                            if (event.target) {
                                // @ts-ignore
                                var classes = event.target.classList;
                                // @ts-ignore
                                if (classes.contains('cm-url') || classes.contains('external-link')) {
                                    // @ts-ignore
                                    var url_1 = classes.contains('cm-url') ? event.target.textContent : event.target.href;
                                    fileMenu.addItem(function (item) {
                                        item.setIcon('search').setTitle('Open in IFrame').onClick(function () {
                                            plugin.openSearch({
                                                tags: [],
                                                query: '{{query}}',
                                                name: '',
                                                encode: false,
                                            }, url_1, null);
                                        });
                                    });
                                    emptyMenu = false;
                                }
                            }
                            emptyMenu = emptyMenu && !plugin.handleContext(fileMenu);
                            if (!emptyMenu) {
                                fileMenu.showAtPosition({ x: event.x, y: event.y });
                                event.preventDefault();
                            }
                        };
                        this.onDomSettings = {};
                        document.on('contextmenu', '.markdown-preview-view', this.onDom, this.onDomSettings);
                        // Remove this ignore when the obsidian package is updated on npm
                        // Editor mode
                        // @ts-ignore
                        this.registerEvent(this.app.workspace.on('editor-menu', function (menu, editor, view) {
                            _this.handleContext(menu);
                        }));
                        return [2 /*return*/];
                }
            });
        });
    };
    SearchOnInternetPlugin.prototype.getSelectedText = function () {
        var wSelection = window.getSelection();
        var docSelection = document === null || document === void 0 ? void 0 : document.getSelection();
        if (wSelection) {
            return wSelection.toString();
        }
        else if (document && docSelection.type != 'Control') {
            return docSelection.toString();
        }
        return null;
    };
    SearchOnInternetPlugin.prototype.handleContext = function (menu) {
        var _this = this;
        var query = this.getSelectedText();
        var hasSelection = !(query === null || query.trim() === '');
        if (!hasSelection) {
            return false;
        }
        var _loop_1 = function (searchsetting) {
            menu.addItem(function (item) {
                item.setTitle('Search on ' + searchsetting.name)
                    .setIcon('search')
                    .onClick(function (evt) { return _this.openSearch(searchsetting, query, null); });
            });
        };
        for (var _i = 0, _a = this.settings.searches; _i < _a.length; _i++) {
            var searchsetting = _a[_i];
            _loop_1(searchsetting);
        }
        return true;
    };
    SearchOnInternetPlugin.prototype.openSearch = function (search, query, activeView) {
        if (activeView === void 0) { activeView = null; }
        return __awaiter(this, void 0, void 0, function () {
            var encodedQuery, url, leaf, view;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        encodedQuery = query;
                        if (search.encode) {
                            encodedQuery = encodeURIComponent(query);
                        }
                        url = search.query.replace('{{title}}', encodedQuery)
                            .replace('{{query}}', encodedQuery);
                        console.log("SOI: Opening URL " + url);
                        if (!this.settings.useIframe) return [3 /*break*/, 4];
                        if (!activeView) return [3 /*break*/, 1];
                        activeView.frame.setAttr('src', url);
                        activeView.url = url;
                        return [3 /*break*/, 3];
                    case 1:
                        leaf = this.app.workspace.getLeaf(!(this.app.workspace.activeLeaf.view.getViewType() === 'empty'));
                        view = new SearchView(this, leaf, query, search.name, url);
                        return [4 /*yield*/, leaf.open(view)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, open(url)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    SearchOnInternetPlugin.prototype.onunload = function () {
        console.log('unloading search-on-internet');
        document.off('contextmenu', '.markdown-preview-view', this.onDom, this.onDomSettings);
    };
    SearchOnInternetPlugin.prototype.loadSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            var loadedSettings;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadData()];
                    case 1:
                        loadedSettings = _a.sent();
                        if (loadedSettings && loadedSettings.hasOwnProperty('searches')) {
                            loadedSettings.searches = Array.from(loadedSettings.searches.map(function (s) { return Object.assign({}, DEFAULT_QUERY, s); }));
                            this.settings = loadedSettings;
                        }
                        else {
                            this.settings = DEFAULT_SETTING;
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    SearchOnInternetPlugin.prototype.saveSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.saveData(this.settings)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return SearchOnInternetPlugin;
}(obsidian.Plugin));

module.exports = SearchOnInternetPlugin;


/* nosourcemap */