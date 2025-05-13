// useFilePreview.tsx

import { useCallback } from 'react';

function sanitizeUrl(url) {
    try {
        const parsed = new URL(url, window.location.origin);
        // Allow only http/https and optionally known trusted domains
        if (['http:', 'https:'].includes(parsed.protocol)) {
            return parsed.href;
        }
    } catch {
        // Invalid URL
    }
    return null;
}

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) =>
        ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        }[m] || m)
    );
}

export function useFilePreview() {
    const handleFileClick = useCallback(
        async (file, options) => {
            const safeUrl = sanitizeUrl(file.webViewLink);
            if (!safeUrl) {
                alert('Invalid file URL.');
                return;
            }

            try {
                // Google Drive file? Open preview
                if (safeUrl.includes('drive.google.com')) {
                    const previewUrl = safeUrl.replace(/\/view(\?.*)?$/, '/preview');
                    window.open(previewUrl, '_blank', 'noopener,noreferrer');
                    return;
                }

                const type = file.type || getTypeFromExtension(file.name);

                if (type.startsWith('image/')) {
                    const win = window.open('', '_blank', 'noopener,noreferrer');
                    if (win) {
                        win.document.write(`
                                    <html>
                                        <body style="margin:0">
                                            <img src="${safeUrl}" alt="${file.name}" style="max-width:100vw;max-height:100vh;display:block;margin:auto;" />
                                        </body>
                                     </html>
                        `);
                    }
                } else if (type === 'application/pdf') {
                    window.open(safeUrl, '_blank', 'noopener,noreferrer');
                } else if (type.startsWith('text/')) {
                    const res = await fetch(safeUrl);
                    if (!res.ok) throw new Error('Failed to load text file.');
                    const text = await res.text();
                    const html = `
                                        <html>
                                          <head><title>${file.name}</title></head>
                                          <body style="font-family:monospace;white-space:pre-wrap;background:#f9f9f9;padding:2rem;">
                                            <h2>${file.name}</h2>
                                            <pre>${escapeHtml(text)}</pre>
                                          </body>
                                        </html>
          `;
                    const blob = new Blob([html], { type: 'text/html' });
                    const blobUrl = URL.createObjectURL(blob);
                    const win = window.open(blobUrl, '_blank', 'noopener,noreferrer');
                    if (win) {
                        win.onload = () => URL.revokeObjectURL(blobUrl);
                    } else {
                        URL.revokeObjectURL(blobUrl);
                    }
                } else {
                    // Default: download if allowed
                    if (options.restrictDownload) {
                        alert('This file type cannot be previewed.');
                        return;
                    }
                    const a = document.createElement('a');
                    a.href = safeUrl;
                    a.download = file.name;
                    a.rel = 'noopener noreferrer';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            } catch (err) {
                console.error(err);
                alert('Failed to open file.');
            }
        },
        []
    );

    return { handleFileClick };
}

// Utility: Fallback file type by extension
function getTypeFromExtension(name) {
    const ext = name.split('.').pop()?.toLowerCase();
    const map = {
        pdf: 'application/pdf',
        txt: 'text/plain',
        md: 'text/markdown',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        svg: 'image/svg+xml',
    };
    return map[ext || ''] || 'application/octet-stream';
}
