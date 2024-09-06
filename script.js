// Element References
const jsonEditor = document.getElementById('jsoneditor');
const jsonInfo = document.getElementById('json-info');
const clipboardTray = document.getElementById('clipboard-tray');
const clipboardList = document.getElementById('clipboard-list');
const playlistSidebar = document.getElementById('playlist-sidebar');
const playlistPlayer = document.getElementById('playlistPlayer');
const helpOverlay = document.getElementById('help-overlay');

// State Variables
let currentView = 'tree';
let multiSelectMode = false;
let clipboard = [];
let treeStyle = 1;
let highlightedElements = [];
let currentHighlightIndex = -1;
let data = {};

// Event Listeners
document.getElementById('documentSelector').addEventListener('change', (event) => {
    fetchData(event.target.value);
});

// Fetch JSON Data
async function fetchData(documentName = 'CheraxDocuments') {
    try {
        const response = await fetch(`${documentName}.json`);
        if (!response.ok) {
            throw new Error('Failed to load JSON data');
        }
        data = await response.json();
        showTreeView();
    } catch (error) {
        console.error('Error loading JSON data:', error);
        jsonEditor.innerText = 'Error loading data.';
        alert('Failed to load the JSON data. Please try again or select another document.');
    }
}

// Update JSON Information
function updateJSONInfo() {
    const totalKeys = countKeys(data);
    const maxDepth = calculateDepth(data);
    const arrayCount = countArrays(data);
    jsonInfo.innerText = `Total Keys: ${totalKeys} | Max Depth: ${maxDepth} | Arrays: ${arrayCount}`;
}

// Utility Functions for JSON Analysis
function countKeys(obj) {
    let count = 0;
    for (let key in obj) {
        count++;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            count += countKeys(obj[key]);
        }
    }
    return count;
}

function calculateDepth(obj) {
    let maxDepth = 0;
    for (let key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            maxDepth = Math.max(maxDepth, calculateDepth(obj[key]));
        }
    }
    return maxDepth + 1;
}

function countArrays(obj) {
    let count = 0;
    for (let key in obj) {
        if (Array.isArray(obj[key])) {
            count++;
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            count += countArrays(obj[key]);
        }
    }
    return count;
}

// Display Views
function showCodeView() {
    currentView = 'code';
    jsonEditor.textContent = JSON.stringify(data, null, 2);
    updateJSONInfo();
}

function showTreeView() {
    currentView = 'tree';
    jsonEditor.innerHTML = renderTree(data);
    attachCollapsibleListeners();
    applyTreeStyle();
    updateJSONInfo();
}

function renderTree(json, path = '') {
    let html = '<ul>';
    for (let key in json) {
        const newPath = path ? `${path}.${key}` : key;
        if (typeof json[key] === 'object' && json[key] !== null) {
            html += `
                <li class="collapsible collapsed">
                    <span class="arrow">▶</span>
                    <span onclick="toggleCollapse(event)">${key}:</span>
                    <div class="nested hidden">${renderTree(json[key], newPath)}</div>
                </li>`;
        } else {
            html += `<li class="value" data-path="${newPath}" onclick="handleNodeClick('${newPath}', '${json[key]}')">${key}: ${json[key]}</li>`;
        }
    }
    html += '</ul>';
    return html;
}

// Tree and Clipboard Controls
function toggleTreeStyle() {
    treeStyle = (treeStyle % 3) + 1;
    showTreeView();
}

function applyTreeStyle() {
    const treeContainer = document.querySelector('#jsoneditor ul');
    if (!treeContainer) return;

    switch (treeStyle) {
        case 1:
            // Traditional hierarchical style with clear bullet points and spacing
            treeContainer.style.cssText = `
                text-align: left;
                padding-left: 25px;
                display: block;
                line-height: 1.8;
                list-style-type: disc;
                margin: 0;
                border-left: 3px solid #6a0dad;
            `;
            break;
        case 2:
            // Compact, card-like style with borders and more padding for clarity
            treeContainer.style.cssText = `
                text-align: left;
                padding: 10px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                list-style-type: none;
                border: 1px solid #8a2be2;
                border-radius: 8px;
            `;
            break;
        case 3:
            // Centered, minimal style with enhanced spacing for a clean look
            treeContainer.style.cssText = `
                text-align: center;
                padding-left: 50px;
                display: block;
                list-style-type: circle;
                line-height: 2.0;
                margin: 0 auto;
                max-width: 70%;
                color: #e0e0e0;
                background-color: #1e1e1e;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                border: 2px dashed #6a0dad;
            `;
            break;
    }
}

function toggleCollapse(event) {
    event.stopPropagation(); // Prevent event bubbling to avoid affecting parent nodes
    const parent = event.currentTarget.closest('.collapsible'); // Get the closest collapsible element
    parent.classList.toggle('expanded');
    parent.classList.toggle('collapsed');
    
    // Locate and toggle the nested content within the parent collapsible element
    const nested = parent.querySelector('.nested');
    if (nested) nested.classList.toggle('hidden');
}

function handleNodeClick(path, value) {
    if (multiSelectMode) {
        clipboard.push({ path, value });
        updateClipboardTray();
    } else {
        copyToClipboard(value);
    }
}

function toggleMultiSelect() {
    multiSelectMode = !multiSelectMode;
    clipboardTray.style.display = multiSelectMode ? 'block' : 'none';
}

function updateClipboardTray() {
    clipboardList.innerHTML = clipboard.map(item => `<li>${item.path}: ${item.value}</li>`).join('');
}

function copyTrayToClipboard() {
    const text = clipboard.map(item => `${item.path}: ${item.value}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied all items from the tray.');
    });
}

function clearTray() {
    clipboard = [];
    updateClipboardTray();
}

function attachCollapsibleListeners() {
    document.querySelectorAll('.collapsible > .arrow, .collapsible > span').forEach(element => {
        element.addEventListener('click', toggleCollapse); // Attach to both the arrow and the span elements
    });
}

function expandAll() {
    document.querySelectorAll('.collapsible').forEach(element => {
        element.classList.add('expanded');
        element.classList.remove('collapsed');
        element.querySelector('.nested').classList.remove('hidden');
    });
}

function collapseAll() {
    document.querySelectorAll('.collapsible').forEach(element => {
        element.classList.add('collapsed');
        element.classList.remove('expanded');
        element.querySelector('.nested').classList.add('hidden');
    });
}

function copyToClipboard(value) {
    navigator.clipboard.writeText(value).then(() => {
        alert(`Copied: ${value}`);
    });
}

// File Download
function downloadJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Search Functionality
function searchJSON() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!searchTerm) return;

    const elements = document.querySelectorAll('.value, .collapsible > span');
    const matchingItems = [];
    highlightedElements = [];
    currentHighlightIndex = -1;

    elements.forEach(element => {
        const text = element.textContent.toLowerCase();
        element.classList.remove('highlight');

        if (text.includes(searchTerm)) {
            element.classList.add('highlight');
            highlightedElements.push(element);

            if (element.classList.contains('value')) {
                const path = element.getAttribute('data-path');
                const value = element.textContent.split(': ')[1];

                if (!clipboard.some(item => item.path === path && item.value === value)) {
                    matchingItems.push({ path, value });
                }

                expandParentBranches(element);
            }
        }
    });

    updateClipboardWithSearchResults(matchingItems);
    console.log('Search complete:', highlightedElements.length, 'matches found.');
}

function updateClipboardWithSearchResults(results) {
    results.forEach(item => {
        if (!clipboard.some(existing => existing.path === item.path && existing.value === item.value)) {
            clipboard.push(item);
        }
    });

    if (clipboardTray.style.display === 'none') {
        clipboardTray.style.display = 'block';
    }

    updateClipboardTray();
}

function expandParentBranches(element) {
    let parent = element.closest('.nested');
    while (parent) {
        const collapsibleParent = parent.closest('.collapsible');
        if (collapsibleParent) {
            collapsibleParent.classList.add('expanded');
            collapsibleParent.classList.remove('collapsed');
            parent.classList.remove('hidden');
        }
        parent = collapsibleParent.closest('.nested');
    }
}

// Music and Help Overlays
function searchYouTube() {
    const query = document.getElementById('playlistSearch').value;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank');
}

function togglePlaylistSidebar() {
    playlistSidebar.style.display = playlistSidebar.style.display === 'block' ? 'none' : 'block';
}

function showHelpOverlay() {
    helpOverlay.style.display = 'block';
}

function hideHelpOverlay() {
    helpOverlay.style.display = 'none';
}

function playPlaylist(type) {
    const playlists = {
        'Coding Focus': 'https://www.youtube.com/embed/videoseries?si=C1A6VU3j_nwV1nki&list=PLPit0qsdr5cdLA3N9O43ao9zy56rp1mY1',
        'Relaxation': 'https://www.youtube.com/embed/videoseries?si=KYlB4aWUBXbfHi2p&list=PLL7L4yFKS-089dJGU6JdK_vAuiamOVprQ',
        'Coding Session': 'https://www.youtube.com/embed/videoseries?si=g9oSo0npYrZtiluH&list=PLXzchC_LKdZ0uJgrPt9-Cicl8TeDSyLqF'
    };
    playlistPlayer.src = playlists[type] || '';
    playlistPlayer.classList.remove('hidden');
}

// Keyboard Navigation for Search Results
function handleSearchKey(event) {
    if (event.key === 'Enter') {
        searchJSON();
    }
}

document.addEventListener('keydown', (event) => {
    if (highlightedElements.length === 0 || !['Enter', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;

    event.preventDefault();

    if (event.key === 'Enter' || event.key === 'ArrowDown') {
        currentHighlightIndex = (currentHighlightIndex + 1) % highlightedElements.length;
    } else if (event.key === 'ArrowUp') {
        currentHighlightIndex = (currentHighlightIndex - 1 + highlightedElements.length) % highlightedElements.length;
    }

    scrollToHighlight();
});

function scrollToHighlight() {
    if (highlightedElements.length === 0 || currentHighlightIndex === -1) return;

    highlightedElements.forEach((el, index) => {
        el.style.backgroundColor = index === currentHighlightIndex ? '#8a2be2' : '#6a0dad';
    });

    const currentElement = highlightedElements[currentHighlightIndex];
    currentElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
    });

    const parentContainer = jsonEditor;
    if (parentContainer.scrollHeight > parentContainer.clientHeight) {
        parentContainer.scrollTop = currentElement.offsetTop - parentContainer.offsetTop - (parentContainer.clientHeight / 2) + (currentElement.clientHeight / 2);
    }
}

// Initialize Data Fetch
fetchData();
