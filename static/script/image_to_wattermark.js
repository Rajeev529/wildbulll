// Unique Variables with 'wmark1_' prefix
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute("content");
}

const wmark1_targetFileInput = document.getElementById('wmark1_targetFileInput');
const wmark1_dragDropArea = document.getElementById('wmark1_dragDropArea');
const wmark1_submitButton = document.getElementById('wmark1_submitButton');
const wmark1_uploadedImagesGrid = document.getElementById('wmark1_uploadedImagesGrid');
const wmark1_uploadedPreviewWrapper = document.getElementById('wmark1_uploadedPreviewWrapper');
const wmark1_textTab = document.getElementById('wmark1_textTab');
const wmark1_imageTab = document.getElementById('wmark1_imageTab');
const wmark1_watermarkFileInput = document.getElementById('wmark1_watermarkFileInput');
const wmark1_watermarkImageArea = document.getElementById('wmark1_watermarkImageArea');
const wmark1_watermarkImageLabel = document.getElementById('wmark1_watermarkImageLabel');
const wmark1_mode = document.getElementById('wmark1_mode');
const wmark1_processedArea = document.getElementById('wmark1_processedArea');
const wmark1_form = document.getElementById('wmark1_form'); // The form element
let wmark1_filesList = []; // Array to store uploaded files for local preview

// --- Utility Functions ---
const wmark1_formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const wmark1_updatePreviews = () => {
    wmark1_uploadedImagesGrid.innerHTML = '';

    wmark1_filesList.forEach((file) => {
        const wmark1_reader = new FileReader();
        wmark1_reader.onload = (e) => {
            const wmark1_card = document.createElement('div');
            wmark1_card.classList.add('image-card');
            wmark1_card.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <p>${wmark1_formatBytes(file.size)}</p>
            `;
            wmark1_uploadedImagesGrid.appendChild(wmark1_card);
        };
        wmark1_reader.readAsDataURL(file);
    });

    // Show/hide preview section and enable button
    if (wmark1_filesList.length > 0) {
        wmark1_uploadedPreviewWrapper.style.display = 'block';
        wmark1_submitButton.disabled = false;
        wmark1_dragDropArea.innerHTML = `<p>${wmark1_filesList.length} image(s) selected. Click again or drag to add more.</p>`;
    } else {
        wmark1_uploadedPreviewWrapper.style.display = 'none';
        wmark1_submitButton.disabled = true;
        wmark1_dragDropArea.innerHTML = `<p>Drag and drop images to watermark here, or click to browse</p>`;
    }
};

const wmark1_handleFiles = (newFiles) => {
    wmark1_filesList = Array.from(newFiles).filter(file => file.type.startsWith('image/'));
    wmark1_targetFileInput.files = newFiles; // Attach files to the hidden input for form submission
    wmark1_updatePreviews();
};

// --- Watermark Tab Logic ---
document.querySelectorAll('.watermark-tab-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.watermark-tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const tab = button.getAttribute('data-tab');
        wmark1_mode.value = tab; // Update hidden mode input

        wmark1_textTab.style.display = (tab === 'text' ? 'block' : 'none');
        wmark1_imageTab.style.display = (tab === 'image' ? 'block' : 'none');
    });
});

// Handle Watermark Image Input Click
wmark1_watermarkImageArea.addEventListener('click', () => {
    wmark1_watermarkFileInput.click();
});

wmark1_watermarkFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        wmark1_watermarkImageLabel.textContent = `Watermark selected: ${e.target.files[0].name}`;
    } else {
        wmark1_watermarkImageLabel.textContent = `Click to upload Watermark Image (PNG recommended)`;
    }
});


// --- Event Listeners for Upload ---

// 1. Link click action to the hidden target images input
wmark1_dragDropArea.addEventListener('click', () => {
    wmark1_targetFileInput.click();
});

wmark1_targetFileInput.addEventListener('change', (e) => {
    wmark1_handleFiles(e.target.files);
});

// 2. Drag and Drop handlers (File acceptance logic)
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    wmark1_dragDropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

// Highlight effect
['dragenter', 'dragover'].forEach(eventName => {
    wmark1_dragDropArea.addEventListener(eventName, () => {
        wmark1_dragDropArea.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    wmark1_dragDropArea.addEventListener(eventName, () => {
        wmark1_dragDropArea.classList.remove('dragover');
    }, false);
});

// Handle drop
wmark1_dragDropArea.addEventListener('drop', (e) => {
    const wmark1_dt = e.dataTransfer;
    wmark1_handleFiles(wmark1_dt.files);
}, false);


// --- Submit Handling (Simulation) ---
// NOTE: This simulation must be replaced with an actual API call in your Django app.

wmark1_form.addEventListener("submit", function (e) {
    e.preventDefault();

    let formData = new FormData();

    // Attach images
    wmark1_filesList.forEach((file) => {
        formData.append("images", file);
    });

    // Attach watermark mode
    formData.append("watermark_mode", wmark1_mode.value);

    // Attach watermark text (if selected)
    if (wmark1_mode.value === "text") {
        formData.append("watermark_text", document.getElementById("wmark1_textInput").value);
    }

    // Attach watermark image (if selected)
    if (wmark1_mode.value === "image") {
        let wmFile = wmark1_watermarkFileInput.files[0];
        if (wmFile) {
            formData.append("watermark_image", wmFile);
        }
    }

    // CSRF Token
    formData.append("csrfmiddlewaretoken", getCSRFToken());

    // Loading UI
    wmark1_processedArea.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Applying watermark...</p>
    `;

    fetch("/add-watermark-process/", {
        method: "POST",
        body: formData,
        credentials: "include",  // ensures CSRF + cookies are sent
    })
        .then((res) => res.json())
        .then((data) => {
            console.log("Response:", data);

            if (data.error) {
                wmark1_processedArea.innerHTML = `<p class="error">${data.error}</p>`;
                return;
            }

            let gridHTML = `
                <button class="download-all-button" id="downloadZipBtn">Download All as ZIP</button>
                <div class="image-preview-grid" id="processedGrid"></div>
            `;
            wmark1_processedArea.innerHTML = gridHTML;

            const processedGrid = document.getElementById("processedGrid");

            // SHOW PROCESSED IMAGES
            data.images.forEach((img) => {
                processedGrid.innerHTML += `
                    <div class="download-card">
                        <img src="${img.base64}" alt="${img.file_name}">
                        <span>${img.file_name}</span>
                        <a href="${img.base64}" download="${img.file_name}">Download</a>
                    </div>
                `;
            });

            // ZIP DOWNLOAD BUTTON
            document.getElementById("downloadZipBtn").addEventListener("click", () => {
                const link = document.createElement("a");
                link.href = data.zip_base64;
                link.download = data.zip_name;
                link.click();
            });
        })
        .catch((err) => {
            console.error(err);
            wmark1_processedArea.innerHTML = `<p class="error">Something went wrong.</p>`;
        });
});
