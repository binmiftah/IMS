import React, { useEffect, useRef } from 'react';

export default function FileItem({ file }) {
    const iframeRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'c') {
                e.preventDefault();
                console.log('Copying is disabled');
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        const iframe = iframeRef.current;

        const onIframeLoad = () => {
            try {
                const iframeDoc = iframe.contentWindow.document;

                iframeDoc.addEventListener('contextmenu', prevent);
                iframeDoc.addEventListener('mousedown', prevent);
                iframeDoc.addEventListener('copy', prevent);
                iframeDoc.addEventListener('keydown', handleKeyDown);
            } catch (err) {
                console.warn('Could not attach events inside iframe', err);
            }
        };

        const prevent = (e) => e.preventDefault();

        if (iframe) {
            iframe.addEventListener('load', onIframeLoad);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (iframe) iframe.removeEventListener('load', onIframeLoad);
        };
    }, []);

    const getFileType = (file) => {
        if (!file || !file.fileName) return '';
        const ext = file.fileName.split('.').pop().toLowerCase();
        if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
        if (['pdf'].includes(ext)) return 'pdf';
        if (['txt', 'md', 'csv', 'json', 'js', 'py', 'java', 'log'].includes(ext)) return 'text';
        return 'other';
    };

    const getDrivePreviewUrl = (url) => {
        const match = url?.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
        return match ? `https://drive.google.com/file/d/${match[1]}/preview` : null;
    };

    const fileType = getFileType(file);

    return (
        <div>
            <div className="p-4 border rounded-lg hover:bg-gray-100 cursor-pointer">
                <p>Name: {file.fileName}</p>
                <p>Size: {file.fileSize}</p>
                <p>Type: {fileType}</p>
                <p>Created: {new Date(file.uploadedAt).toDateString()}</p>
            </div>

            <div className="mt-4 border rounded-lg" style={{ height: '500px', overflow: 'auto' }}>
                {(fileType === 'image' || fileType === 'pdf') && (
                    <iframe
                        ref={iframeRef}
                        src={getDrivePreviewUrl(file.webViewLink) || file.path}
                        width="100%"
                        height="500"
                        style={{ border: 'none' }}
                        sandbox="allow-scripts allow-same-origin"
                    />
                )}
                {fileType === 'text' && (
                    <pre style={{ whiteSpace: 'pre-wrap', padding: 16 }}>
                        {file.content || 'Text preview not available.'}
                    </pre>
                )}
                {fileType === 'other' && (
                    <div className="p-4 text-gray-500">
                        No preview available for this file type.
                    </div>
                )}
            </div>
        </div>
    );
}
