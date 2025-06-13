// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const qrText = document.getElementById('qrText');
const qrSize = document.getElementById('qrSize');
const qrErrorCorrection = document.getElementById('qrErrorCorrection');
const foregroundColor = document.getElementById('foregroundColor');
const backgroundColor = document.getElementById('backgroundColor');
const logoUpload = document.getElementById('logoUpload');
const generateBtn = document.getElementById('generateBtn');
const qrCode = document.getElementById('qrCode');
const downloadPNG = document.getElementById('downloadPNG');
const downloadSVG = document.getElementById('downloadSVG');

// State
let currentQRCode = null;
let logoImage = null;

// Theme Toggle
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    themeToggle.innerHTML = `<i class="fas fa-${theme === 'light' ? 'moon' : 'sun'}"></i>`;
}

// QR Code Generation
function generateQRCode() {
    const text = qrText.value.trim();
    if (!text) {
        showError('Please enter some text or URL');
        return;
    }

    try {
        // Create QR code
        const qr = qrcode(0, qrErrorCorrection.value);
        qr.addData(text);
        qr.make();

        // Get QR code HTML
        const size = parseInt(qrSize.value);
        const cellSize = size / qr.getModuleCount();
        const margin = Math.floor(size * 0.1); // 10% margin
        const totalSize = size + (margin * 2);

        // Create SVG
        const svg = createQRCodeSVG(qr, cellSize, margin, totalSize);
        currentQRCode = { svg, text, size: totalSize };

        // Display QR code
        qrCode.innerHTML = svg;
        qrCode.style.display = 'block';
        document.querySelector('.qr-placeholder').style.display = 'none';

        // Enable download buttons
        downloadPNG.disabled = false;
        downloadSVG.disabled = false;

        // Add logo if exists
        if (logoImage) {
            addLogoToQRCode();
        }
    } catch (error) {
        showError('Error generating QR code. Please try again.');
        console.error('QR Code generation error:', error);
    }
}

function createQRCodeSVG(qr, cellSize, margin, totalSize) {
    const moduleCount = qr.getModuleCount();
    const fgColor = foregroundColor.value;
    const bgColor = backgroundColor.value;

    let svg = `<svg width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg">`;

    // Background
    svg += `<rect width="${totalSize}" height="${totalSize}" fill="${bgColor}"/>`;

    // QR Code modules
    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            if (qr.isDark(row, col)) {
                const x = margin + (col * cellSize);
                const y = margin + (row * cellSize);
                svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fgColor}"/>`;
            }
        }
    }

    svg += '</svg>';
    return svg;
}

// Logo Handling
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showError('Please upload an image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        logoImage = new Image();
        logoImage.onload = function () {
            if (currentQRCode) {
                addLogoToQRCode();
            }
        };
        logoImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function addLogoToQRCode() {
    if (!currentQRCode || !logoImage) return;

    const svg = currentQRCode.svg;
    const logoSize = currentQRCode.size * 0.2; // 20% of QR code size
    const logoX = (currentQRCode.size - logoSize) / 2;
    const logoY = (currentQRCode.size - logoSize) / 2;

    // Create a white background for the logo
    const logoBg = `<rect x="${logoX - 2}" y="${logoY - 2}" width="${logoSize + 4}" height="${logoSize + 4}" fill="${backgroundColor.value}"/>`;

    // Add logo image
    const logoImageElement = `<image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" href="${logoImage.src}"/>`;

    // Insert logo before the closing SVG tag
    currentQRCode.svg = svg.replace('</svg>', `${logoBg}${logoImageElement}</svg>`);
    qrCode.innerHTML = currentQRCode.svg;
}

// Download Handlers
function downloadQRCode(format) {
    if (!currentQRCode) return;

    const { svg, text, size } = currentQRCode;
    const fileName = `qrcode-${text.substring(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;

    if (format === 'svg') {
        downloadSVGFile(svg, fileName);
    } else {
        downloadPNGFile(svg, fileName, size);
    }
}

function downloadSVGFile(svg, fileName) {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function downloadPNGFile(svg, fileName, size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = function () {
        ctx.drawImage(img, 0, 0, size, size);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${fileName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svg);
}

// Error Handling
function showError(message) {
    // You could implement a more sophisticated error display system
    alert(message);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // QR Code generation
    generateBtn.addEventListener('click', generateQRCode);

    // Logo upload
    logoUpload.addEventListener('change', handleLogoUpload);

    // Download handlers
    downloadPNG.addEventListener('click', () => downloadQRCode('png'));
    downloadSVG.addEventListener('click', () => downloadQRCode('svg'));

    // Real-time updates for color changes
    foregroundColor.addEventListener('change', () => {
        if (currentQRCode) generateQRCode();
    });

    backgroundColor.addEventListener('change', () => {
        if (currentQRCode) generateQRCode();
    });

    // Size and error correction changes
    qrSize.addEventListener('change', () => {
        if (currentQRCode) generateQRCode();
    });

    qrErrorCorrection.addEventListener('change', () => {
        if (currentQRCode) generateQRCode();
    });

    // Enter key to generate
    qrText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            generateQRCode();
        }
    });
}); 