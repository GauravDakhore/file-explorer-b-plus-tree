// Render tree view based on file structure
function renderTreeView(fileStructure) {
    const rootTree = document.getElementById('root-tree');
    rootTree.innerHTML = '';
    
    // Add root folder
    const rootItem = document.createElement('li');
    rootItem.innerHTML = `<span class="tree-toggle folder" data-path="" onclick="navigateTo('')">
        <i class="fas fa-folder"></i> Root
    </span>`;
    
    // Add child items recursively
    const rootList = document.createElement('ul');
    rootList.style.display = 'block'; // Root is always expanded
    renderTreeItems(fileStructure.children, rootList);
    rootItem.appendChild(rootList);
    
    rootTree.appendChild(rootItem);
    
    // Add event listeners for toggle elements
    addTreeToggleListeners();
}

// Render tree items recursively
function renderTreeItems(items, parentList) {
    if (!items || items.length === 0) return;
    
    // Sort items: folders first, then files, both alphabetically
    const sortedItems = [...items].sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });
    
    for (const item of sortedItems) {
        const li = document.createElement('li');
        const isFolder = item.type === 'folder';
        const icon = isFolder ? 'fa-folder' : getFileIcon(item.name);
        
        li.innerHTML = `<span class="tree-toggle ${isFolder ? 'folder' : 'file'}" data-path="${item.path}" onclick="${isFolder ? `navigateTo('${item.path}')` : `viewFileContent('${item.path}', '${item.name}')`}">
            <i class="fas ${icon}"></i> ${item.name}
        </span>`;
        
        // If this is a folder with children, add nested list
        if (isFolder && item.children && item.children.length > 0) {
            const childList = document.createElement('ul');
            childList.style.display = 'none'; // Start collapsed
            renderTreeItems(item.children, childList);
            li.appendChild(childList);
            
            // Add expand/collapse icon
            const toggle = li.querySelector('.tree-toggle');
            toggle.innerHTML = `<i class="fas fa-caret-right"></i> ${toggle.innerHTML}`;
            toggle.classList.add('has-children');
        }
        
        parentList.appendChild(li);
    }
}

// Add event listeners for tree toggle elements
function addTreeToggleListeners() {
    const toggles = document.querySelectorAll('.tree-toggle.has-children');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('click', function(event) {
            event.stopPropagation();
            
            const li = this.parentElement;
            const ul = li.querySelector('ul');
            const caret = this.querySelector('.fas.fa-caret-right, .fas.fa-caret-down');
            
            if (ul.style.display === 'none') {
                ul.style.display = 'block';
                if (caret) caret.className = 'fas fa-caret-down';
            } else {
                ul.style.display = 'none';
                if (caret) caret.className = 'fas fa-caret-right';
            }
            
            // Still navigate to the folder
            const path = this.getAttribute('data-path');
            navigateTo(path);
        });
    });
}

// Expand tree to the current path
function expandTreeToPath(path) {
    if (!path) return;
    
    const parts = path.split('/').filter(part => part);
    let currentPath = '';
    
    for (const part of parts) {
        currentPath += part;
        
        // Find the corresponding tree toggle element
        const toggle = document.querySelector(`.tree-toggle[data-path="${currentPath}"]`);
        if (toggle && toggle.classList.contains('has-children')) {
            // Expand this level
            const li = toggle.parentElement;
            const ul = li.querySelector('ul');
            const caret = toggle.querySelector('.fas.fa-caret-right');
            
            if (ul.style.display === 'none') {
                ul.style.display = 'block';
                if (caret) caret.className = 'fas fa-caret-down';
            }
        }
        
        currentPath += '/';
    }
}

// Call this after rendering the tree and setting current path
function updateTreeSelection() {
    // Remove current selection
    document.querySelectorAll('.tree-toggle.selected').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selection to current path
    const currentPathElement = document.querySelector(`.tree-toggle[data-path="${state.currentPath}"]`);
    if (currentPathElement) {
        currentPathElement.classList.add('selected');
    }
    
    // Expand tree to show current path
    expandTreeToPath(state.currentPath);
}

// When navigating to a path, update tree selection
const originalNavigateTo = navigateTo;
navigateTo = function(path) {
    originalNavigateTo(path);
    updateTreeSelection();
};

// Enhance the loadFileStructure function to update tree selection
const originalLoadFileStructure = loadFileStructure;
loadFileStructure = async function() {
    await originalLoadFileStructure();
    updateTreeSelection();
};