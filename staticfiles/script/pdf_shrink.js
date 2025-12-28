// ================== ELEMENTS ==================
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const resultsList = document.getElementById('resultsList');
const loader = document.getElementById('loader');

// ================== CSRF ==================
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

// ================== FILE REGISTRY ==================
const fileRegistry = {}; // stores latest compressed file per ID

// ================== EVENTS ==================
dropZone.onclick = () => fileInput.click();

fileInput.onchange = (e) => handleFiles(e.target.files);

// ================== HELPERS ==================
function base64ToFile(base64, filename) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return new File([bytes], filename, { type: 'application/pdf' });
}

// ================== MAIN LOGIC ==================
async function handleFiles(files) {
    for (let file of files) {
        if (file.type !== 'application/pdf') continue;

        // Vercel size warning
        if (file.size > 4.5 * 1024 * 1024) {
            alert(`${file.name} is larger than 4.5MB. Compression may fail.`);
        }

        const id = Math.random().toString(36).substr(2, 9);

        fileRegistry[id] = {
            file: file,
            level: 1,
            lastSize: null
        };

        await compressFile(id);
    }
}

async function compressFile(id) {
    const entry = fileRegistry[id];

    const formData = new FormData();
    formData.append('pdf_file', entry.file);
    formData.append('level', entry.level);

    loader.style.display = 'block';

    try {
        const response = await fetch('/compress-pdf/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            },
            body: formData
        });

        const data = await response.json();
        loader.style.display = 'none';

        if (data.status === 'success') {
            updateUI(id, data);
        } else {
            alert('Compression failed');
        }

    } catch (err) {
        loader.style.display = 'none';
        console.error(err);
        alert('Server error during compression');
    }
}

// ================== UI UPDATE ==================
function updateUI(id, data) {
    let row = document.getElementById(`row-${id}`);
    if (!row) {
        row = document.createElement('div');
        row.id = `row-${id}`;
        row.className = 'result-item';
        resultsList.prepend(row);
    }

    // 🔥 Replace stored file with compressed version
    fileRegistry[id].file = base64ToFile(data.base64, data.name);

    const newSize = data.new_size;
    const lastSize = fileRegistry[id].lastSize;

    // Disable Reduce More if no further compression possible
    let disableReduce = lastSize !== null && lastSize === newSize;

    fileRegistry[id].lastSize = newSize;

    const downloadUrl = `data:application/pdf;base64,${data.base64}`;

    row.innerHTML = `
        <div class="file-info">
            <span class="file-name">${data.name}</span>
            <span class="file-stats">Shrunk to ${newSize} KB</span>
        </div>
        <div class="action-group">
            <a href="${downloadUrl}" download="shrunk_${data.name}" class="btn btn-small">
                Download
            </a>
        </div>
    `;
}

// ================== REDUCE MORE ==================
function reduceMore(id) {
    fileRegistry[id].level += 1;
    compressFile(id);
}

// ================== DRAG & DROP ==================
dropZone.ondragover = (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#ff9933';
};

dropZone.ondragleave = () => {
    dropZone.style.borderColor = '#4a5a73';
};

dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#4a5a73';
    handleFiles(e.dataTransfer.files);
};
