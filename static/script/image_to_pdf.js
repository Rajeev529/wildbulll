// Unique Variables with 'itp1_' prefix
const itp1_fileInput = document.getElementById('itp1_fileInput');
const itp1_dragDropArea = document.getElementById('itp1_dragDropArea');
const itp1_submitButton = document.getElementById('itp1_submitButton');
const itp1_uploadedImagesGrid = document.getElementById('itp1_uploadedImagesGrid');
const itp1_uploadedPreviewWrapper = document.getElementById('itp1_uploadedPreviewWrapper');
const itp1_processedArea = document.getElementById('itp1_processedArea');
let itp1_filesList = []; // Array to store uploaded files

// --- Utility Functions ---

const itp1_formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const itp1_updatePreviews = () => {
    itp1_uploadedImagesGrid.innerHTML = '';
    itp1_filesList.forEach((file) => {
        const itp1_reader = new FileReader();
        itp1_reader.onload = (e) => {
            const itp1_card = document.createElement('div');
            itp1_card.classList.add('image-card');
            itp1_card.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <p>${itp1_formatBytes(file.size)}</p>
            `;
            itp1_uploadedImagesGrid.appendChild(itp1_card);
        };
        itp1_reader.readAsDataURL(file);
    });

    // Show/hide preview section and enable button
    if (itp1_filesList.length > 0) {
        itp1_uploadedPreviewWrapper.style.display = 'block';
        itp1_submitButton.disabled = false;
    } else {
        itp1_uploadedPreviewWrapper.style.display = 'none';
        itp1_submitButton.disabled = true;
    }
};

const itp1_handleFiles = (files) => {
    itp1_filesList = Array.from(files).filter(file => file.type.startsWith('image/'));
    itp1_updatePreviews();
};

// --- Event Listeners for Upload ---

// 1. Click to browse
itp1_dragDropArea.addEventListener('click', () => {
    itp1_fileInput.click();
});

itp1_fileInput.addEventListener('change', (e) => {
    itp1_handleFiles(e.target.files);
});

// 2. Drag and Drop handlers
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    itp1_dragDropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

// Highlight effect
['dragenter', 'dragover'].forEach(eventName => {
    itp1_dragDropArea.addEventListener(eventName, () => {
        itp1_dragDropArea.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    itp1_dragDropArea.addEventListener(eventName, () => {
        itp1_dragDropArea.classList.remove('dragover');
    }, false);
});

// Handle drop
itp1_dragDropArea.addEventListener('drop', (e) => {
    const itp1_dt = e.dataTransfer;
    const itp1_files = itp1_dt.files;
    itp1_handleFiles(itp1_files);
}, false);


// --- Submit and Processing Simulation (Adapt this for your actual Django form submission) ---
function getCSRFToken() {
    const cookieValue = document.cookie
        .split("; ")
        .find(row => row.startsWith("csrftoken="))
        ?.split("=")[1];
    return cookieValue;
}


itp1_submitButton.addEventListener("click", () => {
    if (itp1_filesList.length === 0) return;

    const formData = new FormData();
    itp1_filesList.forEach(file => {
        formData.append("images", file);
    });

    itp1_processedArea.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Generating PDF...</p>
    `;

    fetch("/images-to-pdf/", {
        method: "POST",
        body: formData,
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRFToken": getCSRFToken()
        }
    })
    .then(res => {
        if (!res.ok) throw new Error("Bad Response");
        return res.blob();     // ⬅⬅⬅ IMPORTANT
    })
    .then(blob => {
        const pdfUrl = URL.createObjectURL(blob);

        // Remove default message if it is still present
        const msg = document.getElementById("itp1_processedMessage");
        if (msg) msg.remove();

        itp1_processedArea.innerHTML = "";

        const card = document.createElement("div");
        card.classList.add("download-card", "pdf-card");

        card.innerHTML = `
            <img src="https://png.pngtree.com/png-clipart/20220612/original/pngtree-pdf-file-icon-png-png-image_7965915.png" alt="PDF Icon">
            <span>combined.pdf</span>
            <p>${itp1_filesList.length} Images</p>
            <a href="${pdfUrl}" download="combined.pdf">
                Download PDF
            </a>
        `;

        itp1_processedArea.appendChild(card);
    })

    .catch(err => {
        console.error(err);
        itp1_processedArea.innerHTML = `<p style="color:red">Error generating PDF ${err}</p>`;
    });
});
