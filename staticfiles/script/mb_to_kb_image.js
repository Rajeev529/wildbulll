// Use a functional script for image handling

function getCSRFToken() {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + '=')) {
            return cookie.split('=')[1];
        }
    }
    return null;
}


console.log("fghjkfghjk")

const fileInput = document.getElementById('fileInput');
const dragDropArea = document.getElementById('dragDropArea');
const submitButton = document.getElementById('submitButton');
const uploadedImagesGrid = document.getElementById('uploadedImagesGrid');
const uploadedPreviewWrapper = document.getElementById('uploadedPreviewWrapper');
const processedArea = document.getElementById('processedArea');
let filesList = []; // Array to store uploaded files

// --- Utility Functions ---

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const updatePreviews = () => {
    uploadedImagesGrid.innerHTML = '';
    filesList.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const card = document.createElement('div');
            card.classList.add('image-card');
            card.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <p>${formatBytes(file.size)}</p>
            `;
            uploadedImagesGrid.appendChild(card);
        };
        reader.readAsDataURL(file);
    });

    // Show/hide preview section and enable button
    if (filesList.length > 0) {
        uploadedPreviewWrapper.style.display = 'block';
        submitButton.disabled = false;
    } else {
        uploadedPreviewWrapper.style.display = 'none';
        submitButton.disabled = true;
    }
};

const handleFiles = (files) => {
    filesList = Array.from(files).filter(file => file.type.startsWith('image/'));
    updatePreviews();
};

// --- Event Listeners for Upload ---

// 1. Click to browse
dragDropArea.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// 2. Drag and Drop handlers
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dragDropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

// Highlight effect
['dragenter', 'dragover'].forEach(eventName => {
    dragDropArea.addEventListener(eventName, () => {
        dragDropArea.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dragDropArea.addEventListener(eventName, () => {
        dragDropArea.classList.remove('dragover');
    }, false);
});

// Handle drop
dragDropArea.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}, false);


// --- Submit and Processing Simulation ---

submitButton.addEventListener("click", () => {
    if (filesList.length === 0) return;

    const targetKb = document.getElementById("targetKb").value || 50;

    const formData = new FormData();
    formData.append("targetKb", targetKb);

    filesList.forEach(file => {
        formData.append("images", file);
    });

    processedArea.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Compressing images...</p>
    `;

    fetch("/compress-images/", {
        method: "POST",
        body: formData,
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "X-Requested-With": "XMLHttpRequest"
        }
    })
    .then(response => response.json())
    .then(data => {
        processedArea.innerHTML = "";

        data.processed.forEach((obj, index) => {
            const card = document.createElement("div");
            card.classList.add("download-card");

            card.innerHTML = `
                <img src="${obj.base64}" alt="Compressed Image ${index + 1}">
                <span>File ${index + 1}</span>
                <p>${obj.size_kb} KB</p>
                <a href="${obj.base64}" download="reduced-${index + 1}.jpg">Download</a>
            `;

            processedArea.appendChild(card);
        });
    })
    .catch(err => {
        processedArea.innerHTML = "<p style='color:red'>Error processing images.</p>";
    });
});
