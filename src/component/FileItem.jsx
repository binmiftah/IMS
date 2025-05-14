import React from 'react';

export default function FileItem({ file }) {
    // Helper to determine file type
    const getFileType = (file) => {
        if (!file || !file.name) return '';
        const ext = file.name.split('.').pop().toLowerCase();
        if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
        if (['pdf'].includes(ext)) return 'pdf';
        if (['txt', 'md', 'csv', 'json', 'js', 'py', 'java', 'log'].includes(ext)) return 'text';
        return 'other';
    };

    const fileType = getFileType(file);

    return (
        <div>
            <div className="p-4 border rounded-lg hover:bg-gray-100 cursor-pointer">
                {file.name}
            </div>

            {/* Preview container */}
            <div className="mt-4 border rounded-lg" style={{ height: '500px', overflow: 'auto' }}>
                {fileType === 'image' && (
                    <img
                        src={file.url || file.path}
                        alt={file.name}
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                )}
                {fileType === 'pdf' && (
                    <iframe
                        src={file.url || file.path}
                        title={file.name}
                        width="100%"
                        height="100%"
                        style={{ minHeight: 500, border: 'none' }}
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
