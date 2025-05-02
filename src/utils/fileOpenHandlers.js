
export function sanitizeUrl(url) {
    try {
        const parsed = new URL(url, window.location.origin);
        // Only allow http(s) protocols
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch {
        // Invalid URL
    }
    return null;
}

// Utility: Open file in new tab with security
export async function handleFileClick(file) {
    const safeUrl = sanitizeUrl(file.url);
    if (!safeUrl) {
        alert('Invalid file URL.');
        return;
    }

    try {
        if (file.type.startsWith('image/')) {
            // Open image directly
            const win = window.open('', '_blank', 'noopener,noreferrer');
            if (win) {
                win.document.write(`<img src="${safeUrl}" alt="${file.name}" style="max-width:100vw;max-height:100vh;display:block;margin:auto;" />`);
            }
        } else if (file.type === 'application/pdf') {
            // Open PDF in browser viewer
            window.open(safeUrl, '_blank', 'noopener,noreferrer');
        } else if (file.type.startsWith('text/')) {
            // Fetch and display text content
            const response = await fetch(safeUrl);
            if (!response.ok) throw new Error('Failed to load file');
            const text = await response.text();
            const blob = new Blob([`
                <html>
                <head><title>${file.name}</title></head>
                <body style="font-family:monospace;white-space:pre-wrap;background:#f9f9f9;padding:2rem;">
                <h2>${file.name}</h2>
                <pre>${escapeHtml(text)}</pre>
                </body>
                </html>
            `], { type: 'text/html' });
            const objectUrl = URL.createObjectURL(blob);
            const win = window.open(objectUrl, '_blank', 'noopener,noreferrer');
            // Cleanup
            if (win) {
                win.onload = () => URL.revokeObjectURL(objectUrl);
            } else {
                URL.revokeObjectURL(objectUrl);
            }
        } else {
            // Trigger download for other types
            const link = document.createElement('a');
            link.href = safeUrl;
            link.download = file.name;
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (err) {
        alert('Failed to open file.');
    }
}

// Utility: Escape HTML for safe rendering
function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

// Example usage in a file list item
/*
import { handleFileClick } from '../utils/fileOpenHandlers';

const mockFile = {
    name: 'Sample.pdf',
    url: 'https://example.com/sample.pdf',
    type: 'application/pdf'
};

// In your file item component:
<div
    className="p-4 border rounded-lg hover:bg-gray-100 cursor-pointer"
    onClick={() => handleFileClick(mockFile)}
>
    {mockFile.name}
</div>
*/