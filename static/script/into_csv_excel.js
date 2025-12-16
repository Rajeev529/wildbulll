const dataFileInput = document.getElementById('dataFileInput');
const dragDropArea = document.getElementById('dragDropArea');
const submitButton = document.getElementById('submitButton');
const fileInfo = document.getElementById('fileInfo');
const conversionForm = document.getElementById('conversionForm');
const processedArea = document.getElementById('processedArea');
const outputFormatSelect = document.getElementById('outputFormat');
let uploadedFiles = [];

// --- Utility Functions ---

const getOutputExtension = () => {
    return outputFormatSelect.value;
};

const updateFileInfo = () => {
    const ext = getOutputExtension();
    if (uploadedFiles.length > 0) {
        fileInfo.innerHTML = `${uploadedFiles.length} file(s) selected. Converting to **${ext.toUpperCase()}**.`;
        submitButton.disabled = false;
    } else {
        fileInfo.innerHTML = `No files selected. Drag or click to browse.`;
        submitButton.disabled = true;
    }
};

const handleFiles = (newFiles) => {
    // Filter only valid file types (.csv, .xls, .xlsx)
    uploadedFiles = Array.from(newFiles).filter(file => 
        file.name.endsWith('.csv') || 
        file.name.endsWith('.xls') || 
        file.name.endsWith('.xlsx')
    );
    
    // Re-attach files to the input for potential backend submission
    const dataTransfer = new DataTransfer();
    uploadedFiles.forEach(file => dataTransfer.items.add(file));
    dataFileInput.files = dataTransfer.files;

    updateFileInfo();
};

// --- Event Listeners ---

// 1. Format selector change
outputFormatSelect.addEventListener('change', updateFileInfo);

// 2. Drag & Drop / Click input handlers
dragDropArea.addEventListener('click', () => dataFileInput.click());
dataFileInput.addEventListener('change', (e) => handleFiles(e.target.files));

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dragDropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (eventName === 'dragenter' || eventName === 'dragover') {
            dragDropArea.classList.add('dragover');
        } else {
            dragDropArea.classList.remove('dragover');
        }
    }, false);
});

dragDropArea.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files), false);

function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

// 3. Form Submission (Simulated)
conversionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (uploadedFiles.length === 0) return;

    const formData = new FormData();
    uploadedFiles.forEach(f => formData.append("files", f));
    formData.append("outputFormat", getOutputExtension());

    processedArea.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Converting files...</p>
    `;

    fetch("/convert-data/", {
        method: "POST",
        body: formData,
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "X-Requested-With": "XMLHttpRequest"
        }
    })
    .then(res => res.json())
    .then(data => {
        processedArea.innerHTML = "";

        processedArea.innerHTML += `
            <a class="download-all-button" href="${data.zip_base64}" download="${data.zip_name}">
                Download All as ZIP
            </a>
            <div class="image-preview-grid" style="margin-top:20px;"></div>
        `;

        const grid = processedArea.querySelector(".image-preview-grid");

        data.pdfs.forEach(file => {
            const card = document.createElement("div");
            card.className = "download-card";
            card.innerHTML = `
                <img src="https://via.placeholder.com/60x60/4CAF50/FFFFFF?text=${getOutputExtension().toUpperCase()}">
                <span>${file.file_name}</span>
                <a href="${file.base64}" download="${file.file_name}">Download</a>
            `;
            grid.appendChild(card);
        });
    })
    .catch(() => {
        processedArea.innerHTML = "<p style='color:red'>Conversion failed</p>";
    });
});

