export function sanitizeUrl(url) {
    try {
        const parsed = new URL(url, window.location.origin);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch {
        // Invalid URL
    }
    return null;
}

export async function handleFileClickInIframe(file, previewContainer, options = {}) {
    const safeUrl = sanitizeUrl(file.url);
    if (!safeUrl || !previewContainer) {
        alert('Invalid file URL or preview container.');
        return;
    }

    try {
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            previewContainer.innerHTML = `
                <iframe src="${safeUrl}" title="${file.name}" 
                    style="width:100%;height:100%;border:none;"></iframe>`;
        } else if (file.type.startsWith('text/')) {
            const response = await fetch(safeUrl);
            if (!response.ok) throw new Error('Failed to load file');
            const text = await response.text();
            previewContainer.innerHTML = `
                <div style="font-family:monospace;white-space:pre-wrap;background:#f9f9f9;padding:2rem;height:100%;overflow:auto;">
                    <h2>${file.name}</h2>
                    <pre>${escapeHtml(text)}</pre>
                </div>`;
        } else {
            if (options.restrictDownload) {
                alert('This file type cannot be previewed.');
                return;
            }
            const link = document.createElement('a');
            link.href = safeUrl;
            link.download = file.name;
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (err) {
        console.error(err);
        alert('Failed to load preview.');
    }
}

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}
