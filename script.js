/**
 * Image Background Remover - Main JavaScript Module
 * Uses @imgly/background-removal library for client-side background removal
 */

// Import the background removal library from CDN
import imglyRemoveBackground from 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/+esm';

// DOM Elements
const uploadSection = document.getElementById('upload-section');
const processingSection = document.getElementById('processing-section');
const resultSection = document.getElementById('result-section');
const errorSection = document.getElementById('error-section');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const processingText = document.getElementById('processing-text');
const originalImage = document.getElementById('original-image');
const resultImage = document.getElementById('result-image');
const downloadBtn = document.getElementById('download-btn');
const newImageBtn = document.getElementById('new-image-btn');
const errorMessage = document.getElementById('error-message');
const tryAgainBtn = document.getElementById('try-again-btn');

// State
let currentResultBlob = null;
let currentFileName = '';

/**
 * Show a specific section and hide others
 * @param {string} sectionId - The ID of the section to show
 */
function showSection(sectionId) {
    const sections = [uploadSection, processingSection, resultSection, errorSection];
    sections.forEach(section => {
        if (section.id === sectionId) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
}

/**
 * Update the processing text
 * @param {string} text - The text to display
 */
function updateProcessingText(text) {
    processingText.textContent = text;
}

/**
 * Validate if the file is a supported image type
 * @param {File} file - The file to validate
 * @returns {boolean} - Whether the file is valid
 */
function isValidImageFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
}

/**
 * Generate a download filename from the original filename
 * @param {string} originalName - The original filename
 * @returns {string} - The new filename with _no_bg suffix
 */
function generateDownloadFilename(originalName) {
    const lastDotIndex = originalName.lastIndexOf('.');
    if (lastDotIndex === -1) {
        return originalName + '_no_bg.png';
    }
    const nameWithoutExt = originalName.substring(0, lastDotIndex);
    return nameWithoutExt + '_no_bg.png';
}

/**
 * Process the image to remove background
 * @param {File} file - The image file to process
 */
async function processImage(file) {
    if (!isValidImageFile(file)) {
        showSection('error-section');
        errorMessage.textContent = 'Please upload a valid image file (JPG, PNG, or WebP).';
        return;
    }

    // Store the original filename
    currentFileName = file.name;

    // Show processing section
    showSection('processing-section');
    updateProcessingText('Loading AI model...');

    try {
        // Create object URL for original image preview
        const originalUrl = URL.createObjectURL(file);
        originalImage.src = originalUrl;

        // Configure the background removal
        const config = {
            progress: (key, current, total) => {
                if (key === 'fetch:onnx') {
                    updateProcessingText(`Loading AI model... ${Math.round((current / total) * 100)}%`);
                } else if (key === 'compute:inference') {
                    updateProcessingText('Removing background...');
                }
            }
        };

        updateProcessingText('Processing image...');

        // Remove the background
        const resultBlob = await imglyRemoveBackground(file, config);
        
        // Store the result blob for download
        currentResultBlob = resultBlob;

        // Create object URL for result image
        const resultUrl = URL.createObjectURL(resultBlob);
        resultImage.src = resultUrl;

        // Show result section
        showSection('result-section');

    } catch (error) {
        console.error('Error removing background:', error);
        showSection('error-section');
        errorMessage.textContent = 'An error occurred while processing your image. Please try again.';
    }
}

/**
 * Download the processed image
 */
function downloadResult() {
    if (!currentResultBlob) {
        return;
    }

    const downloadUrl = URL.createObjectURL(currentResultBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = generateDownloadFilename(currentFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
}

/**
 * Reset the application to initial state
 */
function resetApp() {
    // Revoke any existing object URLs
    if (originalImage.src.startsWith('blob:')) {
        URL.revokeObjectURL(originalImage.src);
    }
    if (resultImage.src.startsWith('blob:')) {
        URL.revokeObjectURL(resultImage.src);
    }

    // Clear state
    currentResultBlob = null;
    currentFileName = '';
    originalImage.src = '';
    resultImage.src = '';
    fileInput.value = '';

    // Show upload section
    showSection('upload-section');
}

/**
 * Handle file selection from input
 * @param {Event} event - The change event
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processImage(file);
    }
}

/**
 * Handle file drop
 * @param {DragEvent} event - The drop event
 */
function handleDrop(event) {
    event.preventDefault();
    dropZone.classList.remove('dragover');

    const file = event.dataTransfer.files[0];
    if (file) {
        processImage(file);
    }
}

/**
 * Handle drag over
 * @param {DragEvent} event - The dragover event
 */
function handleDragOver(event) {
    event.preventDefault();
    dropZone.classList.add('dragover');
}

/**
 * Handle drag leave
 * @param {DragEvent} event - The dragleave event
 */
function handleDragLeave(event) {
    event.preventDefault();
    dropZone.classList.remove('dragover');
}

/**
 * Handle click on drop zone
 */
function handleDropZoneClick() {
    fileInput.click();
}

// Event Listeners
fileInput.addEventListener('change', handleFileSelect);
dropZone.addEventListener('drop', handleDrop);
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('click', handleDropZoneClick);
downloadBtn.addEventListener('click', downloadResult);
newImageBtn.addEventListener('click', resetApp);
tryAgainBtn.addEventListener('click', resetApp);

// Prevent default drag behavior on the window
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

// Initialize
showSection('upload-section');
