const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const fileList = document.getElementById('fileList');
const mergeBtn = document.getElementById('mergeBtn');
const loader = document.getElementById('loader');
const resultArea = document.getElementById('resultArea');

let selectedFiles = [];

dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => {
    selectedFiles = Array.from(e.target.files);
    renderFileList();
};

function renderFileList() {
    fileList.innerHTML = '';
    if (selectedFiles.length > 1) {
        mergeBtn.disabled = false;
        selectedFiles.forEach((file, index) => {
            const div = document.createElement('div');
            div.className = 'merge-item';
            div.innerHTML = `
                <div class="order">${index + 1}</div>
                <div class="file-name-txt">${file.name}</div>
                <div style="font-size: 0.8rem; color: #888;">${(file.size/1024).toFixed(1)} KB</div>
            `;
            fileList.appendChild(div);
        });
    } else {
        mergeBtn.disabled = true;
    }
}

// NEW CLIENT-SIDE MERGE LOGIC
mergeBtn.onclick = async () => {
    mergeBtn.style.display = 'none';
    loader.style.display = 'block';

    try {
        // 1. Create a new PDF Document
        const mergedPdf = await PDFLib.PDFDocument.create();

        for (const file of selectedFiles) {
            // 2. Read file as ArrayBuffer
            const fileBytes = await file.arrayBuffer();
            // 3. Load the PDF
            const pdf = await PDFLib.PDFDocument.load(fileBytes);
            // 4. Copy all pages from the PDF
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            // 5. Add pages to the merged document
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        // 6. Save the merged PDF as bytes
        const mergedPdfBytes = await mergedPdf.save();

        // 7. Create a Blob and Download Link
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        // UI Updates
        loader.style.display = 'none';
        resultArea.style.display = 'block';
        document.getElementById('sizeInfo').innerText = `Final Size: ${(blob.size / 1024).toFixed(1)} KB`;
        document.getElementById('downloadLink').href = url;
        fileList.style.display = 'none';
        dropZone.style.display = 'none';

    } catch (err) {
        console.error(err);
        alert("Error merging files. Make sure they are valid PDFs.");
        location.reload();
    }
};