const cimg1_fileInput = document.getElementById('cimg1_fileInput');
const cimg1_dragDropArea = document.getElementById('cimg1_dragDropArea');
const cimg1_submitButton = document.getElementById('cimg1_submitButton');
const cimg1_uploadedImagesGrid = document.getElementById('cimg1_uploadedImagesGrid');
const cimg1_uploadedPreviewWrapper = document.getElementById('cimg1_uploadedPreviewWrapper');
const cimg1_processedArea = document.getElementById('cimg1_processedArea');
let cimg1_filesList = []; // Array to store uploaded files

// --- Utility Functions ---

const cimg1_formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const cimg1_updatePreviews = () => {
    cimg1_uploadedImagesGrid.innerHTML = '';
    cimg1_filesList.forEach((file) => {
        const cimg1_reader = new FileReader();
        cimg1_reader.onload = (e) => {
            const cimg1_card = document.createElement('div');
            cimg1_card.classList.add('image-card');
            cimg1_card.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <p>${cimg1_formatBytes(file.size)}</p>
            `;
            cimg1_uploadedImagesGrid.appendChild(cimg1_card);
        };
        cimg1_reader.readAsDataURL(file);
    });

    // Show/hide preview section and enable button
    if (cimg1_filesList.length > 0) {
        cimg1_uploadedPreviewWrapper.style.display = 'block';
        cimg1_submitButton.disabled = false;
        cimg1_dragDropArea.innerHTML = `<p>${cimg1_filesList.length} image(s) selected. Click again or drag to add more.</p>`;
    } else {
        cimg1_uploadedPreviewWrapper.style.display = 'none';
        cimg1_submitButton.disabled = true;
        cimg1_dragDropArea.innerHTML = `<p>Drag and drop image(s) to convert (e.g., PNG, JPG, WEBP)</p>`;
    }
};

const cimg1_handleFiles = (files) => {
    cimg1_filesList = Array.from(files).filter(file => file.type.startsWith('image/'));
    cimg1_updatePreviews();
};

// --- Event Listeners for Upload ---

// 1. Click to browse
cimg1_dragDropArea.addEventListener('click', () => {
    cimg1_fileInput.click();
});

cimg1_fileInput.addEventListener('change', (e) => {
    cimg1_handleFiles(e.target.files);
});

// 2. Drag and Drop handlers (including highlight and drop logic)
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    cimg1_dragDropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

// Highlight effect
['dragenter', 'dragover'].forEach(eventName => {
    cimg1_dragDropArea.addEventListener(eventName, () => {
        cimg1_dragDropArea.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    cimg1_dragDropArea.addEventListener(eventName, () => {
        cimg1_dragDropArea.classList.remove('dragover');
    }, false);
});

// Handle drop
cimg1_dragDropArea.addEventListener('drop', (e) => {
    const cimg1_dt = e.dataTransfer;
    const cimg1_files = cimg1_dt.files;
    cimg1_handleFiles(cimg1_files);
}, false);


// --- Submit and Processing Simulation ---
function getCSRFToken() {
    const cookieValue = document.cookie
        .split("; ")
        .find(row => row.startsWith("csrftoken="))
        ?.split("=")[1];
    return cookieValue;
}

cimg1_submitButton.addEventListener('click', () => {
    if (cimg1_filesList.length === 0) return;

    const targetExtension = document.getElementById('cimg1_targetExtension').value;
    const formData = new FormData();

    // Append files to FormData
    cimg1_filesList.forEach(file => {
        formData.append("images", file);
    });
    formData.append("target_extension", targetExtension);

    // Show loading
    cimg1_processedArea.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Converting ${cimg1_filesList.length} images to ${targetExtension.toUpperCase()}...</p>
    `;
    cimg1_submitButton.disabled = true;

    // AJAX request to Django backend
    fetch("/convert_image_extension/", {
        method: "POST",
        body: formData,
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRFToken": getCSRFToken() // make sure you have this function defined
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            cimg1_processedArea.innerHTML = `<p style="color:red">${data.error}</p>`;
            cimg1_submitButton.disabled = false;
            return;
        }

        // Clear previous results
        cimg1_processedArea.innerHTML = "";

        data.images.forEach((imgData, idx) => {
            const card = document.createElement("div");
            card.classList.add("download-card");

            card.innerHTML = `
                <img src="${imgData.base64}" alt="${imgData.file_name}">
                <span>${imgData.file_name}</span>
                <a href="${imgData.base64}" download="${imgData.file_name}">Download</a>
            `;

            cimg1_processedArea.appendChild(card);
        });

        // Hide placeholder message
        const msgElem = document.getElementById("cimg1_processedMessage");
        if (msgElem) msgElem.style.display = "none";

        cimg1_submitButton.disabled = false;
    })
    .catch(err => {
        console.error(err);
        cimg1_processedArea.innerHTML = `<p style="color:red">Error converting images. ${err}</p>`;
        cimg1_submitButton.disabled = false;
    });
});

