// Handle create folder form submission
async function handleCreateFolder(event) {
    event.preventDefault();
    
    const folderPath = document.getElementById('folder-path').value.trim();
    
    if (!folderPath) {
        showToast('Please enter a folder path', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/create_folder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ folder_name: folderPath })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message);
            folderModal.style.display = 'none';
            loadFileStructure();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Failed to create folder', 'error');
        console.error('Error creating folder:', error);
    }
}

// Handle create file form submission
async function handleCreateFile(event) {
    event.preventDefault();
    
    const folderName = document.getElementById('file-folder').value.trim();
    const fileName = document.getElementById('file-name').value.trim();
    const fileContent = document.getElementById('file-content').value;
    
    if (!fileName) {
        showToast('Please enter a file name', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/create_file`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                folder_name: folderName,
                file_name: fileName,
                content: fileContent
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message);
            fileModal.style.display = 'none';
            loadFileStructure();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Failed to create file', 'error');
        console.error('Error creating file:', error);
    }
}

// Handle file upload form submission
async function handleUploadFile(event) {
    event.preventDefault();
    
    const folderName = document.getElementById('upload-folder').value.trim();
    const fileInput = document.getElementById('upload-file');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        showToast('Please select a file to upload', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('folder_name', folderName);
    formData.append('file', fileInput.files[0]);
    
    try {
        const response = await fetch(`${API_URL}/upload_file`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message);
            uploadModal.style.display = 'none';
            loadFileStructure();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Failed to upload file', 'error');
        console.error('Error uploading file:', error);
    }
}

// Handle file deletion
async function handleDeleteFile(filePath) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/delete_file`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: filePath })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message);
            loadFileStructure();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Failed to delete item', 'error');
        console.error('Error deleting item:', error);
    }
}

// Open rename modal
function openRenameModal(filePath, fileName) {
    document.getElementById('rename-path').value = filePath;
    document.getElementById('rename-name').value = fileName;
    renameModal.style.display = 'block';
}

// Handle rename file form submission
async function handleRenameFile(event) {
    event.preventDefault();
    
    const filePath = document.getElementById('rename-path').value;
    const newName = document.getElementById('rename-name').value.trim();
    
    if (!newName) {
        showToast('Please enter a new name', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/rename_file`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                path: filePath,
                new_name: newName
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message);
            renameModal.style.display = 'none';
            loadFileStructure();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Failed to rename item', 'error');
        console.error('Error renaming item:', error);
    }
}

// View file content
async function viewFileContent(filePath, fileName) {
    try {
        const response = await fetch(`${API_URL}/file_content/${filePath}`);
        
        if (!response.ok) {
            throw new Error('Failed to load file content');
        }
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('view-title').textContent = fileName;
            document.getElementById('view-content').textContent = data.content;
            downloadBtn.onclick = () => window.open(`${API_URL}/download/${filePath}`);
            viewModal.style.display = 'block';
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Failed to load file content', 'error');
        console.error('Error loading file content:', error);
    }
}

// Handle file or folder click
function handleItemClick(item) {
    if (item.type === 'folder') {
        // Navigate to folder
        state.currentPath = item.path;
        updateBreadcrumbs();
        renderCurrentFolder();
    } else {
        // View file content
        viewFileContent(item.path, item.name);
    }
}

// Navigate to specific path via breadcrumb
function navigateTo(path) {
    state.currentPath = path;
    updateBreadcrumbs();
    renderCurrentFolder();
}

// Populate folder select dropdowns
function populateFolderSelects(fileStructure) {
    // Clear existing options except the root option
    fileFolderSelect.innerHTML = '<option value="">Root</option>';
    uploadFolderSelect.innerHTML = '<option value="">Root</option>';
    
    // Function to recursively add folder options
    function addFolderOptions(node, prefix = '') {
        if (node.type === 'folder') {
            const path = node.path;
            const name = prefix + node.name;
            
            if (path) {
                const option = document.createElement('option');
                option.value = path;
                option.textContent = name;
                
                fileFolderSelect.appendChild(option.cloneNode(true));
                uploadFolderSelect.appendChild(option);
            }
            
            // Add child folders
            node.children.forEach(child => {
                if (child.type === 'folder') {
                    addFolderOptions(child, name + '/');
                }
            });
        }
    }
    
    // Start with the root folder
    fileStructure.children.forEach(child => {
        if (child.type === 'folder') {
            addFolderOptions(child);
        }
    });
}

// Update breadcrumbs based on current path
function updateBreadcrumbs() {
    const parts = state.currentPath.split('/').filter(part => part);
    let html = '<span class="breadcrumb" onclick="navigateTo(\'\')">Home</span>';
    
    let currentPath = '';
    for (let i = 0; i < parts.length; i++) {
        currentPath += parts[i];
        const isLast = i === parts.length - 1;
        
        html += `<span class="breadcrumb ${isLast ? 'active' : ''}" ${!isLast ? `onclick="navigateTo('${currentPath}')"` : ''}>${parts[i]}</span>`;
        
        currentPath += '/';
    }
    
    breadcrumbsContainer.innerHTML = html;
}

// Render current folder based on path
function renderCurrentFolder() {
    let currentFolder = state.fileStructure;
    
    if (state.currentPath) {
        const pathParts = state.currentPath.split('/').filter(part => part);
        
        // Navigate to the current folder
        for (const part of pathParts) {
            const found = currentFolder.children.find(child => 
                child.type === 'folder' && child.name === part
            );
            
            if (!found) {
                renderEmptyState('Folder not found');
                return;
            }
            
            currentFolder = found;
        }
    }
    
    renderFileGrid(currentFolder);
}

// Render file grid for the current folder
function renderFileGrid(folder) {
    if (!folder || !folder.children || folder.children.length === 0) {
        renderEmptyState('This folder is empty');
        return;
    }
    
    let html = '';
    
    folder.children.forEach(item => {
        const isFolder = item.type === 'folder';
        const icon = isFolder ? 'fa-folder' : getFileIcon(item.name);
        
        html += `
            <div class="file-card" data-path="${item.path}" data-type="${item.type}" onclick="handleItemClick(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                <div class="file-icon ${isFolder ? 'folder' : 'file'}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="file-name">${item.name}</div>
                <div class="file-actions">
                    ${isFolder ? '' : `<button class="btn secondary" onclick="event.stopPropagation(); viewFileContent('${item.path}', '${item.name}')">
                        <i class="fas fa-eye"></i>
                    </button>`}
                    <button class="btn secondary" onclick="event.stopPropagation(); openRenameModal('${item.path}', '${item.name}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn danger" onclick="event.stopPropagation(); handleDeleteFile('${item.path}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    fileGrid.innerHTML = html;
}

// Get appropriate icon based on file extension
function getFileIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    
    const iconMap = {
        'txt': 'fa-file-alt',
        'pdf': 'fa-file-pdf',
        'doc': 'fa-file-word',
        'docx': 'fa-file-word',
        'xls': 'fa-file-excel',
        'xlsx': 'fa-file-excel',
        'ppt': 'fa-file-powerpoint',
        'pptx': 'fa-file-powerpoint',
        'jpg': 'fa-file-image',
        'jpeg': 'fa-file-image',
        'png': 'fa-file-image',
        'gif': 'fa-file-image',
        'mp3': 'fa-file-audio',
        'wav': 'fa-file-audio',
        'mp4': 'fa-file-video',
        'mov': 'fa-file-video',
        'zip': 'fa-file-archive',
        'rar': 'fa-file-archive',
        'html': 'fa-file-code',
        'css': 'fa-file-code',
        'js': 'fa-file-code',
        'json': 'fa-file-code',
        'py': 'fa-file-code',
        'java': 'fa-file-code',
        'c': 'fa-file-code',
        'cpp': 'fa-file-code'
    };
    
    return iconMap[extension] || 'fa-file';
}