// Unique Variables with 'simg1_' prefix
console.log("fghjklghjkl")
const simg1_fileInput = document.getElementById('simg1_fileInput');
const simg1_dragDropArea = document.getElementById('simg1_dragDropArea');
const simg1_submitButton = document.getElementById('simg1_submitButton');
const simg1_uploadedImagesGrid = document.getElementById('simg1_uploadedImagesGrid');
const simg1_uploadedPreviewWrapper = document.getElementById('simg1_uploadedPreviewWrapper');
const simg1_processedArea = document.getElementById('simg1_processedArea');
let simg1_filesList = []; // Array to store uploaded files

// --- Utility Functions ---

const simg1_formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const simg1_updatePreviews = () => {
    simg1_uploadedImagesGrid.innerHTML = '';
    simg1_filesList.forEach((file) => {
        const simg1_reader = new FileReader();
        simg1_reader.onload = (e) => {
            const simg1_card = document.createElement('div');
            simg1_card.classList.add('image-card');
            simg1_card.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <p>${simg1_formatBytes(file.size)}</p>
            `;
            simg1_uploadedImagesGrid.appendChild(simg1_card);
        };
        simg1_reader.readAsDataURL(file);
    });

    // Show/hide preview section and enable button
    if (simg1_filesList.length > 0) {
        simg1_uploadedPreviewWrapper.style.display = 'block';
        simg1_submitButton.disabled = false;
        simg1_dragDropArea.innerHTML = `<p>${simg1_filesList.length} image(s) selected. Click again or drag to add more.</p>`;
    } else {
        simg1_uploadedPreviewWrapper.style.display = 'none';
        simg1_submitButton.disabled = true;
        simg1_dragDropArea.innerHTML = `<p>Drag and drop image(s) to convert to a scanned look, or click to browse</p>`;
    }
};

const simg1_handleFiles = (files) => {
    simg1_filesList = Array.from(files).filter(file => file.type.startsWith('image/'));
    simg1_updatePreviews();
};

// --- Event Listeners for Upload ---

// 1. Click to browse
simg1_dragDropArea.addEventListener('click', () => {
    simg1_fileInput.click();
});

simg1_fileInput.addEventListener('change', (e) => {
    simg1_handleFiles(e.target.files);
});

// 2. Drag and Drop handlers (including highlight and drop logic)
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    simg1_dragDropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

// Highlight effect
['dragenter', 'dragover'].forEach(eventName => {
    simg1_dragDropArea.addEventListener(eventName, () => {
        simg1_dragDropArea.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    simg1_dragDropArea.addEventListener(eventName, () => {
        simg1_dragDropArea.classList.remove('dragover');
    }, false);
});

// Handle drop
function getCSRFToken() {
    const cookieValue = document.cookie
        .split("; ")
        .find(row => row.startsWith("csrftoken="))
        ?.split("=")[1];
    return cookieValue;
}
simg1_dragDropArea.addEventListener('drop', (e) => {
    const simg1_dt = e.dataTransfer;
    const simg1_files = simg1_dt.files;
    simg1_handleFiles(simg1_files);
}, false);


// --- Submit and Processing Simulation ---
// NOTE: You must replace this simulation with a proper HTML form submission to your Django backend.

simg1_submitButton.addEventListener("click", () => {
    console.log('len=0')
    if (simg1_filesList.length === 0) return;
    console.log('ghjkghjk')

    const formData = new FormData();
    simg1_filesList.forEach(file => {
        formData.append("images", file);
    });

    // Show loading
    simg1_processedArea.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Applying scan effect to ${simg1_filesList.length} images...</p>
    `;
    simg1_submitButton.disabled = true;

    fetch("/convert-to-scanned/", {
        method: "POST",
        body: formData,
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRFToken": getCSRFToken()
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            simg1_processedArea.innerHTML = `<p style="color:red">${data.error}</p>`;
            simg1_submitButton.disabled = false;
            return;
        }

        simg1_processedArea.innerHTML = "";

        data.images.forEach((img, idx) => {
            const card = document.createElement("div");
            card.classList.add("download-card");
            card.innerHTML = `
                <img src="${img.base64}" alt="${img.file_name}">
                <span>${img.file_name}</span>
                <a href="${img.base64}" download="${img.file_name}">Download</a>
            `;
            simg1_processedArea.appendChild(card);
        });

        // Hide default message
        const msg = document.getElementById("simg1_processedMessage");
        if (msg) msg.remove();

        simg1_submitButton.disabled = false;
    })
    .catch(err => {
        console.error(err);
        simg1_processedArea.innerHTML = `<p style="color:red">Error applying scan effect</p>`;
        simg1_submitButton.disabled = false;
    });
});
