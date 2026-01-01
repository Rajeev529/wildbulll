let fileQueue = [];
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const resultsList = document.getElementById('resultsList');
const actionBar = document.getElementById('action-bar');
const loader = document.getElementById('loader');

dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => handleFiles(e.target.files);

function handleFiles(files) {
    resultsList.innerHTML = "";
    fileQueue = [];

    Array.from(files).forEach(file => {
        fileQueue.push(file);
    });

    resultsList.innerHTML = `
        <div class="processing-msg">
            Your File Uploaded
        </div>
    `;

    actionBar.style.display = 'block';
}

async function startScanning() {
    loader.style.display = 'block';
    resultsList.innerHTML = `
        <div class="processing-msg">
            ⏳ Processing your files, please wait...
        </div>
    `;

    const formData = new FormData();

    for (let file of fileQueue) {
        if (file.type === "application/pdf") {
            const images = await pdfToImages(file);
            images.forEach(img => formData.append("images", img));
        } else {
            formData.append("images", file);
        }
    }

    try {
        const response = await fetch('/scan-pdf-ajax/', {
            method: 'POST',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            body: formData
        });

        if (!response.ok) throw new Error("Scan failed");

        // 🔥 RECEIVE PDF AS BLOB
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        resultsList.innerHTML = `
            <div class="success-msg">✅ Scan complete</div>
            <a class="download-btn" href="${url}" download="scanned.pdf">
                ⬇ Download PDF
            </a>
        `;
    } catch (err) {
        resultsList.innerHTML = `<div class="error-msg">❌ Scan failed</div>`;
    }

    loader.style.display = 'none';
}


async function pdfToImages(pdfFile) {
    const pdfData = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    const images = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;

        const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.95));
        images.push(new File([blob], `page-${pageNum}.jpg`, { type: "image/jpeg" }));
    }

    return images;
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie) {
        document.cookie.split(';').forEach(c => {
            c = c.trim();
            if (c.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(c.slice(name.length + 1));
            }
        });
    }
    return cookieValue;
}
