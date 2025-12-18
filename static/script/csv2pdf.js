const fileInput = document.getElementById('excelFileInput');
const dragDropArea = document.getElementById('dragDropArea');
const submitButton = document.getElementById('submitButton');
const layoutOptions = document.getElementById('layoutOptions');
const processedArea = document.getElementById('processedArea');
const fileCountDisplay = document.getElementById('fileCount');
let filesList = [];
let selectedLayout = 'tabular';


function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute("content");
}

// --- Utility: Update Selected Layout ---
layoutOptions.querySelectorAll('.layout-card').forEach(card => {
    card.addEventListener('click', () => {
        layoutOptions.querySelectorAll('.layout-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedLayout = card.getAttribute('data-type');
    });
});

// --- Utility: File Handling ---
const updateFilesDisplay = () => {
    fileCountDisplay.textContent = `${filesList.length} file(s) selected. Layout: ${selectedLayout.toUpperCase()}`;
    submitButton.disabled = filesList.length === 0;
};

const handleFiles = (newFiles) => {
    // Filter for Excel and CSV files
    filesList = Array.from(newFiles).filter(file => 
        file.name.endsWith('.xlsx') || 
        file.name.endsWith('.csv')
    );
    
    // Attach files to the input (important for real form submission)
    const dataTransfer = new DataTransfer();
    filesList.forEach(file => dataTransfer.items.add(file));
    fileInput.files = dataTransfer.files;

    updateFilesDisplay();
};

// --- Event Listeners: Drag & Drop ---
dragDropArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dragDropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

['dragenter', 'dragover'].forEach(eventName => {
    dragDropArea.addEventListener(eventName, () => dragDropArea.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dragDropArea.addEventListener(eventName, () => dragDropArea.classList.remove('dragover'), false);
});

dragDropArea.addEventListener('drop', (e) => {
    handleFiles(e.dataTransfer.files);
}, false);


// --- Processing & Download Logic (Simulated) ---
submitButton.addEventListener("click", () => {
    if (filesList.length === 0) return;

    const formData = new FormData();
    filesList.forEach(f => formData.append("files", f));
    formData.append("layout", selectedLayout);

    processedArea.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Converting files...</p>
    `;

    fetch("/excel-to-pdf/", {
        method: "POST",
        body: formData,
        headers: {
            "X-CSRFToken": getCSRFToken(),   // ✅ REQUIRED
            "X-Requested-With": "XMLHttpRequest"
        }
    })
    .then(res => res.json())
    .then(data => {
        processedArea.innerHTML = "";

        // ZIP button
        processedArea.innerHTML += `
            <a class="download-all-button" href="${data.zip_base64}" download="${data.zip_name}">
                Download All as ZIP
            </a>
            <div class="image-preview-grid" style="margin-top:20px;"></div>
        `;

        const grid = processedArea.querySelector(".image-preview-grid");

        data.pdfs.forEach(pdf => {
            const card = document.createElement("div");
            card.className = "download-card";
            card.innerHTML = `
                <img src="/static/images/pdfred.png">
                <span>${pdf.file_name}</span>
                <a href="${pdf.base64}" download="${pdf.file_name}">Download PDF</a>
            `;
            grid.appendChild(card);
        });
    })
    .catch(() => {
        processedArea.innerHTML = "<p style='color:red'>Conversion failed</p>";
    });
});
