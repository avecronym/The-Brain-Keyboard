You’ve found the main page! Choose from this list of Templates.
```folder-overview
id: d5ce11fb-c6d4-407e-a270-e9b66fd56ad0
folderPath: ""
title: "{{folderName}} overview"
showTitle: false
depth: 3
style: list
includeTypes:
  - folder
  - markdown
  - other
disableFileTag: false
sortBy: name
sortByAsc: true
showEmptyFolders: false
onlyIncludeSubfolders: false
storeFolderCondition: true
showFolderNotes: false
disableCollapseIcon: true
```

## About the Matrix Base System:

#### 📁 For All Views

1. **In All the following are true:**
- `file.ext == "md"`
2. **Filter Group + Any the following are true:**
	- **Dynamic Folder Note**: `file.inFolder(this.file.folder)`
3. **Recursively Adding Any External Folder Note(s)**:
    - Filter Group + Any the following are true + `file.folder.contains("Folder Note's Name")` or `file.name.contains("Folder Note's Name")`
    - _(Repeat "Add filter" for each external folder you wish to include)_
	![[Matrix-1.png|642x533]]
#### 📁 For Specific Views

**Recursively Excluding Any Folder Notes(s):**
**In All the following are true:**
- `!file.folder.contains("Folder Note's Name")`
    - _(Repeat "Add filter" for each folder you wish to exclude)_
**Recursively Excluding Any Notes(s):**
**In All the following are true:**
- `!file.name.contains("Folder Note's Name")`
    - _(Repeat "Add filter" for each note you wish to exclude)_
![[Matrix-2.png|700x249]]

[](obsidian://adv-uri?vault=The%20Brain's%20Keyboard&filepath=Hotkeys%2FTemplates%2FMatrix.base&commandid=file-explorer%3Aduplicate-file)