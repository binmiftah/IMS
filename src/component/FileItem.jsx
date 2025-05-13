import React, { useRef } from 'react';
import { handleFileClickInIframe } from '../utils/fileOpenHandlers';

export default function FileItem({ file }) {
    const previewRef = useRef();

    return (
        <div>
            <div
                className="p-4 border rounded-lg hover:bg-gray-100 cursor-pointer"
                onClick={() => handleFileClickInIframe(file, previewRef.current)}
            >
                {file.name}
            </div>

            {/* Preview container */}
            <div
                ref={previewRef}
                className="mt-4 border rounded-lg"
                style={{ height: '500px', overflow: 'hidden' }}
            />
        </div>
    );
}
