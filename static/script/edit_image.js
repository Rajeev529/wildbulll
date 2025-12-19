let cropper;
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const image = document.getElementById('imageToCrop');
const editorWindow = document.getElementById('editorWindow');
const controlBar = document.getElementById('controlBar');

dropZone.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            image.src = event.target.result;
            editorWindow.style.display = 'block';
            controlBar.style.display = 'flex';
            dropZone.style.display = 'none';

            if (cropper) cropper.destroy();
            cropper = new Cropper(image, {
                viewMode: 1,
                autoCropArea: 0.8,
                responsive: true,
                restore: false,
                checkOrientation: false,
            });
        };
        reader.readAsDataURL(file);
    }
};

document.getElementById('finalizeBtn').onclick = () => {
    // Get high quality canvas
    const canvas = cropper.getCroppedCanvas({
        maxWidth: 4096,
        maxHeight: 4096,
        imageSmoothingQuality: 'high',
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    document.getElementById('resultSection').style.display = 'block';
    document.getElementById('croppedImage').src = dataUrl;
    
    const link = document.getElementById('downloadLink');
    link.href = dataUrl;
    link.download = "gorilla_cropped.jpg";
    
    // Auto scroll to result
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
};