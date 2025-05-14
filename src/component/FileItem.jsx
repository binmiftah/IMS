import React, { useEffect } from 'react';

export default function FileItem({ file }) {
    // Helper to determine file type
    useEffect(() => {
        const iframe = document.querySelector('iframe');

        // Helper function to prevent right-click and text selection
        const preventRightClick = (e) => e.preventDefault();
        const preventTextSelection = (e) => e.preventDefault();

        // Disable right-click inside the iframe
        if (iframe) {
            iframe.contentWindow.document.addEventListener('contextmenu', preventRightClick);
            iframe.contentWindow.document.addEventListener('mousedown', preventTextSelection);
        }

        const handleKeyDown = (e) => {


            if (e.ctrlKey && e.key === 'c') {

                console.log("i was called")
                e.preventDefault();  // Block the copy action
                console.log('Copying is disabled');
            }
        };

        // Add keydown listener to block Ctrl + C
        document.addEventListener('keydown', handleKeyDown);

        // Cleanup event listeners on unmount
        // Cleanup event listeners on unmount
        return () => {
            if (iframe && iframe.contentWindow) { // Add a check for iframe.contentWindow
                iframe.contentWindow.document.removeEventListener('contextmenu', preventRightClick);
                iframe.contentWindow.document.removeEventListener('mousedown', preventTextSelection);
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
    }, []);


    const getFileType = (file) => {
        if (!file || !file.fileName) return 'unknown';
        const ext = file.fileName.split('.').pop().toLowerCase();
        if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
        if (['pdf'].includes(ext)) return 'pdf';
        if (['txt', 'md', 'csv', 'json', 'js', 'py', 'java', 'log'].includes(ext)) return 'text';
        return 'other';
    };

    const getDrivePreviewUrl = (url) => {
        const driveLinkRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
        const match = url.match(driveLinkRegex);
        if (match && match[1]) {
            return `https://drive.google.com/file/d/${match[1]}/preview`;
        }
        return null;
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

            {/* Preview container */}
            <div className="mt-4 border rounded-lg" style={{ height: '500px', overflow: 'auto' }}>
                {fileType === 'image' && (
                    <iframe
                        src={getDrivePreviewUrl(file.webViewLink) || file.path}
                        width="100%"
                        height="500"
                        allow="autoplay"
                        style={{ border: 'none' }}
                        sandbox="allow-scripts allow-same-origin"
                    ></iframe>
                )}
                {fileType === 'pdf' && (
                    <iframe
                        src={getDrivePreviewUrl(file.webViewLink) || file.path}
                        title={file.name}
                        width="100%"
                        height="100%"
                        style={{ minHeight: 500, border: 'none' }}
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
