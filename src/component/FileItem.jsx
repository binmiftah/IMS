import React, { useEffect, useRef, useState } from 'react';
import { MdInsertDriveFile } from 'react-icons/md';

const FileItem = ({ file, isModal = false, className = "" }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const iframeRef = useRef(null);

    // Use webViewLink as the primary URL for preview
    const fileUrl = file?.webViewLink || file?.url;

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
        if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return 'audio';
        if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return 'video';
        return 'other';
    };

    const getDrivePreviewUrl = (url) => {
        console.log("Getting Drive preview URL for:", url);

        if (!url) return null;

        // Handle different Google Drive URL formats
        let fileId = null;

        // Format 1: https://drive.google.com/file/d/{fileId}/view
        let match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
            fileId = match[1];
        }

        // Format 2: https://drive.google.com/open?id={fileId}
        if (!fileId) {
            match = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
            if (match) {
                fileId = match[1];
            }
        }

        // Format 3: https://docs.google.com/document/d/{fileId}/
        if (!fileId) {
            match = url.match(/docs\.google\.com\/(?:document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/);
            if (match) {
                fileId = match[1];
            }
        }

        const previewUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;
        console.log("Extracted file ID:", fileId);
        console.log("Generated preview URL:", previewUrl);
        return previewUrl;
    };

    const getDriveDirectUrl = (url) => {
        console.log("Getting Drive direct URL for:", url);

        if (!url) return null;

        // Extract file ID using the same logic
        let fileId = null;

        let match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
            fileId = match[1];
        }

        if (!fileId) {
            match = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
            if (match) {
                fileId = match[1];
            }
        }

        if (!fileId) {
            match = url.match(/docs\.google\.com\/(?:document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/);
            if (match) {
                fileId = match[1];
            }
        }

        // Use webContentLink if available, otherwise generate direct URL
        const directUrl = file?.webContentLink || 
                         (fileId ? `https://drive.google.com/uc?export=view&id=${fileId}` : null);
        console.log("Generated direct URL:", directUrl);
        return directUrl;
    };

    const canPreview = () => {
        // Check if file has a Google Drive URL or is a previewable type
        if (fileUrl && fileUrl.includes('drive.google.com')) {
            return true; // Google Drive can preview most file types
        }

        if (!file?.fileName) return false;

        const extension = file.fileName.split('.').pop().toLowerCase();
        const previewableTypes = ['txt', 'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'mp3', 'wav', 'mp4', 'avi'];
        return previewableTypes.includes(extension);
    };

    const renderFilePreview = () => {
        console.log("Rendering preview for file:", file);
        console.log("Using URL:", fileUrl);

        // If it's a Google Drive file, use Google Drive preview
        if (fileUrl && fileUrl.includes('drive.google.com')) {
            const previewUrl = getDrivePreviewUrl(fileUrl);
            const directUrl = getDriveDirectUrl(fileUrl);

            console.log("Google Drive file detected");
            console.log("Preview URL:", previewUrl);
            console.log("Direct URL:", directUrl);

            // If we couldn't extract URLs, show error
            if (!previewUrl && !directUrl) {
                return (
                    <div className="flex flex-col items-center space-y-4">
                        {getFileIcon()}
                        <p className="text-red-600 text-center">
                            Invalid Google Drive URL format
                        </p>
                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                        >
                            Open original link
                        </a>
                    </div>
                );
            }

            const extension = file?.fileName?.split('.').pop().toLowerCase() || '';
            const fileType = getFileType(file);

            // For images, try direct URL first
            if (fileType === 'image') {
                return (
                    <div className="w-full h-full flex items-center justify-center relative">
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-gray-600">Loading image...</span>
                            </div>
                        )}

                        {!error && directUrl && (
                            <img
                                src={directUrl}
                                alt={file.fileName}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                onLoad={() => {
                                    console.log("Image loaded successfully");
                                    setLoading(false);
                                    setError(false);
                                }}
                                onError={(e) => {
                                    console.error('Direct image load error, trying iframe:', e);
                                    setError(true);
                                    setLoading(false);
                                }}
                                style={{ display: loading || error ? 'none' : 'block' }}
                            />
                        )}

                        {(error || !directUrl) && previewUrl && (
                            <iframe
                                src={previewUrl}
                                className="w-full h-full border rounded-lg"
                                title={file.fileName}
                                onLoad={() => {
                                    console.log("Iframe preview loaded");
                                    setLoading(false);
                                }}
                                onError={() => {
                                    console.error('Iframe preview also failed');
                                }}
                                style={{ display: loading ? 'none' : 'block' }}
                            />
                        )}

                        {error && !previewUrl && (
                            <div className="flex flex-col items-center space-y-2">
                                {getFileIcon()}
                                <p className="text-gray-600">Unable to preview image</p>
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    Open in Google Drive
                                </a>
                            </div>
                        )}
                    </div>
                );
            }

            // For audio files
            if (fileType === 'audio') {
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                        {getFileIcon()}
                        <h3 className="text-lg font-medium text-gray-800">{file.fileName}</h3>
                        
                        {/* Try to embed audio player */}
                        {directUrl && (
                            <audio controls className="w-full max-w-md">
                                <source src={directUrl} type={file.fileType} />
                                Your browser does not support the audio element.
                            </audio>
                        )}
                        
                        <div className="flex space-x-2">
                            <a
                                href={directUrl || fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                                Download
                            </a>
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                            >
                                Open in Drive
                            </a>
                        </div>
                    </div>
                );
            }

            // For other file types, use iframe with Google Drive preview
            if (previewUrl) {
                return (
                    <div className="w-full h-full relative">
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-gray-600">Loading preview...</span>
                            </div>
                        )}
                        <iframe
                            ref={iframeRef}
                            src={previewUrl}
                            className="w-full h-full border rounded-lg"
                            title={file.fileName}
                            onLoad={() => {
                                console.log("Google Drive preview loaded");
                                setLoading(false);
                            }}
                            onError={() => {
                                console.error('Google Drive preview failed');
                                setError(true);
                                setLoading(false);
                            }}
                            style={{ display: loading ? 'none' : 'block' }}
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                        />
                        {error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 rounded-lg">
                                {getFileIcon()}
                                <p className="text-gray-600 mt-2">Unable to preview this file</p>
                                <p className="text-gray-500 text-sm mt-1">The file might be private or require authentication</p>
                                <div className="flex space-x-2 mt-4">
                                    <a
                                        href={directUrl || file?.webContentLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                    >
                                        Download
                                    </a>
                                    <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                                    >
                                        Open in Drive
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
        }

        // Fallback for non-Google Drive files
        return (
            <div className="flex flex-col items-center space-y-4">
                {getFileIcon()}
                <p className="text-gray-600 text-center">
                    Preview not available for this file type
                </p>
                <p className="text-gray-500 text-sm text-center">
                    {fileUrl ? 'This is not a Google Drive file' : 'No file URL available'}
                </p>
            </div>
        );
    };

    // Debug useEffect
    useEffect(() => {
        if (file) {
            console.log("=== FILE DEBUG INFO ===");
            console.log("File object:", file);
            console.log("File webViewLink:", file.webViewLink);
            console.log("File webContentLink:", file.webContentLink);
            console.log("Using URL:", fileUrl);
            console.log("File name:", file.fileName);
            console.log("File type:", file.fileType);
            console.log("File extension:", file.fileName?.split('.').pop());
            console.log("Detected type:", getFileType(file));
            console.log("Can preview:", canPreview());

            if (fileUrl && fileUrl.includes('drive.google.com')) {
                console.log("Google Drive URLs:");
                console.log("- Preview URL:", getDrivePreviewUrl(fileUrl));
                console.log("- Direct URL:", getDriveDirectUrl(fileUrl));
            }
            console.log("=======================");
        }
    }, [file, fileUrl]);

    // Reset states when file changes
    useEffect(() => {
        setLoading(true);
        setError(false);
    }, [file]);

    // Updated DebugPanel
    const DebugPanel = ({ file }) => {
        if (!fileUrl) return null;

        const previewUrl = getDrivePreviewUrl(fileUrl);
        const directUrl = getDriveDirectUrl(fileUrl);

        return (
            <div className="absolute top-2 left-2 bg-white p-2 border rounded shadow text-xs z-20 max-w-xs">
                <div className="mb-1">
                    <strong>View:</strong> 
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 ml-1">
                        Link
                    </a>
                </div>
                {file?.webContentLink && (
                    <div className="mb-1">
                        <strong>Download:</strong> 
                        <a href={file.webContentLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 ml-1">
                            Link
                        </a>
                    </div>
                )}
                {previewUrl && (
                    <div className="mb-1">
                        <strong>Preview:</strong> 
                        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 ml-1">
                            Link
                        </a>
                    </div>
                )}
                {directUrl && (
                    <div>
                        <strong>Direct:</strong> 
                        <a href={directUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 ml-1">
                            Link
                        </a>
                    </div>
                )}
            </div>
        );
    };

    const getFileIcon = () => {
        if (!file?.fileName) {
            return <MdInsertDriveFile size={48} className="text-gray-400" />;
        }

        const extension = file.fileName.split('.').pop().toLowerCase();

        const iconMap = {
            pdf: '📄',
            doc: '📝', docx: '📝',
            xls: '📊', xlsx: '📊',
            ppt: '📊', pptx: '📊',
            txt: '📄',
            jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️',
            mp4: '🎥', avi: '🎥', mov: '🎥', wmv: '🎥',
            mp3: '🎵', wav: '🎵', flac: '🎵',
            zip: '📦', rar: '📦', '7z': '📦',
            js: '💻', ts: '💻', jsx: '💻', tsx: '💻',
            html: '🌐', css: '🎨', json: '⚙️',
        };

        return (
            <span className="text-4xl">
                {iconMap[extension] || '📄'}
            </span>
        );
    };

    return (
        <div className={`flex flex-col items-center justify-center h-full relative ${className}`}>
            {/* Debug panel */}
            <DebugPanel file={file} />

            {canPreview() ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                    {renderFilePreview()}
                </div>
            ) : (
                <div className="flex flex-col items-center space-y-4 text-center">
                    {getFileIcon()}
                    <div>
                        <h3 className="text-lg font-medium text-gray-800">
                            {file?.fileName}
                        </h3>
                        <p className="text-gray-600">
                            {file?.fileName?.split('.').pop()?.toUpperCase()} file
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Preview not available for this file type
                        </p>
                        {fileUrl && (
                            <div className="flex space-x-2 mt-4">
                                <a
                                    href={file?.webContentLink || fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                >
                                    Download
                                </a>
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                                >
                                    Open in Drive
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileItem;
