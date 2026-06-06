// Global state
const state = {
    currentPath: '',
    fileStructure: null,
    selectedFile: null
};

// API endpoint (change this if your backend is on a different URL)
const API_URL = 'http://localhost:5000';

// DOM elements
const fileGrid = document.getElementById('file-grid');
const treeView = document.getElementById('tree-view');
const breadcrumbsContainer = document.getElementById('breadcrumbs');
const toast = document.getElementById('toast');

// Modals
const folderModal = document.getElementById('folder-modal');
const fileModal = document.getElementById('file-modal');
const uploadModal = document.getElementById('upload-modal');
const viewModal = document.getElementById('view-modal');
const renameModal = document.getElementById('rename-modal');

// Buttons
const createFolderBtn = document.getElementById('btn-create-folder');
const createFileBtn = document.getElementById('btn-create-file');
const uploadFileBtn = document.getElementById('btn-upload-file');
const closeViewBtn = document.getElementById('btn-close-view');
const downloadBtn = document.getElementById('btn-download');

// Form elements
const folderForm = document.getElementById('folder-form');
const fileForm = document.getElementById('file-form');
const uploadForm = document.getElementById('upload-form');
const renameForm = document.getElementById('rename-form');
const fileFolderSelect = document.getElementById('file-folder');
const uploadFolderSelect = document.getElementById('upload-folder');

// Close buttons for modals
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        folderModal.style.display = 'none';
        fileModal.style.display = 'none';
        uploadModal.style.display = 'none';
        viewModal.style.display = 'none';
        renameModal.style.display = 'none';
    });
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadFileStructure();
    
    // Event listeners for buttons
    createFolderBtn.addEventListener('click', openFolderModal);
    createFileBtn.addEventListener('click', openFileModal);
    uploadFileBtn.addEventListener('click', openUploadModal);
    closeViewBtn.addEventListener('click', () => viewModal.style.display = 'none');
    
    // Form submissions
    folderForm.addEventListener('submit', handleCreateFolder);
    fileForm.addEventListener('submit', handleCreateFile);
    uploadForm.addEventListener('submit', handleUploadFile);
    renameForm.addEventListener('submit', handleRenameFile);
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === folderModal) folderModal.style.display = 'none';
        if (event.target === fileModal) fileModal.style.display = 'none';
        if (event.target === uploadModal) uploadModal.style.display = 'none';
        if (event.target === viewModal) viewModal.style.display = 'none';
        if (event.target === renameModal) renameModal.style.display = 'none';
    });
});

// Load file structure from the server
async function loadFileStructure() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/files`);
        
        if (!response.ok) {
            throw new Error('Failed to load file structure');
        }
        
        const data = await response.json();
        state.fileStructure = data;
        
        // Populate UI
        renderFileGrid(data);
        renderTreeView(data);
        populateFolderSelects(data);
        updateBreadcrumbs();
        
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Error loading file structure:', error);
        renderEmptyState('Could not load files. Please try again.');
    }
}

// Open create folder modal
function openFolderModal() {
    document.getElementById('folder-path').value = state.currentPath;
    folderModal.style.display = 'block';
}

// Open create file modal
function openFileModal() {
    fileFolderSelect.value = state.currentPath;
    document.getElementById('file-name').value = '';
    document.getElementById('file-content').value = '';
    fileModal.style.display = 'block';
}

// Open upload file modal
function openUploadModal() {
    uploadFolderSelect.value = state.currentPath;
    document.getElementById('upload-file').value = '';
    uploadModal.style.display = 'block';
}

// Show loading indicator
function showLoading() {
    fileGrid.innerHTML = '<div class="loading">Loading files...</div>';
}

// Render empty state
function renderEmptyState(message) {
    fileGrid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-folder-open"></i>
            <p>${message}</p>
        </div>
    `;
}

// Show toast notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000);
}

// Handle window resize to adjust layout
window.addEventListener('resize', () => {
    // Adjust sidebar height if needed
    const sidebar = document.getElementById('sidebar');
    sidebar.style.height = `${window.innerHeight}px`;
});

// Initialize by triggering resize event
window.dispatchEvent(new Event('resize'));