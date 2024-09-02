const jsonEditor = document.getElementById('jsoneditor');
const jsonInfo = document.getElementById('json-info');
const clipboardTray = document.getElementById('clipboard-tray');
const clipboardList = document.getElementById('clipboard-list');
const playlistSidebar = document.getElementById('playlist-sidebar');
const playlistPlayer = document.getElementById('playlistPlayer');
const helpOverlay = document.getElementById('help-overlay');
let currentView = 'code';
let multiSelectMode = false;
let clipboard = [];
let treeStyle = 1;
let highlightedElements = [];
let currentHighlightIndex = -1;
let data = {};

document.getElementById('documentSelector').addEventListener('change', (event) => {
    fetchData(event.target.value);
});

async function fetchData(documentName = 'CheraxDocuments') {
    try {
        const response = await fetch(`${documentName}.json`);
        if (!response.ok) {
            throw new Error('Failed to load JSON data');
        }
        data = await response.json();
        showCodeView();
    } catch (error) {
        console.error('Error loading JSON data:', error);
        jsonEditor.innerText = 'Error loading data.';
    }
}

function updateJSONInfo() {
    const totalKeys = countKeys(data);
    const maxDepth = calculateDepth(data);
    const arrayCount = countArrays(data);
    jsonInfo.innerText = `Total Keys: ${totalKeys} | Max Depth: ${maxDepth} | Arrays: ${arrayCount}`;
}

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

function showCodeView() {
    currentView = 'code';
    jsonEditor.innerText = JSON.stringify(data, null, 2);
    updateJSONInfo();
}

function showTreeView() {
    currentView = 'tree';
    jsonEditor.innerHTML = renderTree(data, '', '');
    attachCollapsibleListeners();
    applyTreeStyle();
    updateJSONInfo();
}

function renderTree(json, path, indent = '') {
    let html = '<ul>';
    for (let key in json) {
        const newPath = path ? `${path}.${key}` : key;
        if (typeof json[key] === 'object' && json[key] !== null) {
            html += `
                <li class="collapsible collapsed">
                    <span class="arrow">▶</span>
                    <span onclick="toggleCollapse(event)">${key}:</span>
                    <div class="nested hidden">${renderTree(json[key], newPath, indent + '  ')}</div>
                </li>`;
        } else {
            html += `<li class="value" data-path="${newPath}" onclick="handleNodeClick('${newPath}', '${json[key]}')">${key}: ${json[key]}</li>`;
        }
    }
    html += '</ul>';
    return html;
}

function toggleTreeStyle() {
    treeStyle = (treeStyle % 3) + 1;
    showTreeView();
}

function applyTreeStyle() {
    const treeContainer = document.querySelector('#jsoneditor ul');
    if (!treeContainer) return;
    switch (treeStyle) {
        case 1:
            treeContainer.style.textAlign = 'left';
            treeContainer.style.paddingLeft = '20px';
            treeContainer.style.display = 'block';
            break;
        case 2:
            treeContainer.style.textAlign = 'left';
            treeContainer.style.paddingLeft = '0px';
            treeContainer.style.display = 'flex';
            treeContainer.style.flexDirection = 'column';
            break;
        case 3:
            treeContainer.style.textAlign = 'center';
            treeContainer.style.display = 'block';
            treeContainer.style.paddingLeft = '40px';
            break;
    }
}

function toggleCollapse(event) {
    event.stopPropagation();
    const parent = event.target.closest('.collapsible');
    parent.classList.toggle('expanded');
    parent.classList.toggle('collapsed');
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
        element.addEventListener('click', toggleCollapse);
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

function downloadJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
}

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

                const alreadyInClipboard = clipboard.some(item => item.path === path && item.value === value);
                if (!alreadyInClipboard) {
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
        const alreadyInClipboard = clipboard.some(existing => existing.path === item.path && existing.value === item.value);
        if (!alreadyInClipboard) {
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
    if (type === 'Coding Focus') {
        playlistPlayer.src = "https://www.youtube.com/embed/videoseries?si=C1A6VU3j_nwV1nki&list=PLPit0qsdr5cdLA3N9O43ao9zy56rp1mY1";
    } else if (type === 'Relaxation') {
        playlistPlayer.src = "https://www.youtube.com/embed/videoseries?si=KYlB4aWUBXbfHi2p&list=PLL7L4yFKS-089dJGU6JdK_vAuiamOVprQ";
    } else if (type === 'Coding Session') {
        playlistPlayer.src = "https://www.youtube.com/embed/videoseries?si=g9oSo0npYrZtiluH&list=PLXzchC_LKdZ0uJgrPt9-Cicl8TeDSyLqF";
    }
    playlistPlayer.classList.remove('hidden');
}

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

function highlightElements() {
    highlightedElements = Array.from(document.querySelectorAll('.highlight'));
    currentHighlightIndex = -1;
}

document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        const btnRect = btn.getBoundingClientRect();
        const screenHalf = window.innerWidth / 2;

        // Position tooltip based on button's horizontal position on the screen
        if (btnRect.left < screenHalf) {
            // Position tooltip to the top right of the button
            btn.style.setProperty('--tooltip-position', 'auto');
            btn.style.setProperty('--arrow-position', '5px');
        } else {
            // Position tooltip to the top left of the button
            btn.style.setProperty('--tooltip-position', 'auto');
            btn.style.setProperty('--arrow-position', 'auto');
            btn.style.setProperty('right', '5px');
        }
    });
});


fetchData();
