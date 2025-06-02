import React from 'react';
import {
    FileText, FileImage, FileCode, FileAudio,
    FileVideo, FileArchive, File
} from 'lucide-react';

const FileCard = ({ file, onClick }) => {
    const getFileIcon = () => {
        switch (file.type) {
            case 'image':
                return <FileImage className="h-10 w-10 text-blue-500" />;
            case 'document':
                return <FileText className="h-10 w-10 text-green-500" />;
            case 'pdf':
                return <FileText className="h-10 w-10 text-red-500" />;
            case 'code':
                return <FileCode className="h-10 w-10 text-purple-500" />;
            case 'audio':
                return <FileAudio className="h-10 w-10 text-yellow-500" />;
            case 'video':
                return <FileVideo className="h-10 w-10 text-pink-500" />;
            case 'archive':
                return <FileArchive className="h-10 w-10 text-orange-500" />;
            default:
                return <File className="h-10 w-10 text-gray-500" />;
        }
    };

    return (
        <div
            className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 flex flex-col items-center space-y-2 h-48 border border-gray-200 rounded-lg bg-white"
            onClick={onClick}
        >
            {file.type === 'image' && file.thumbnailUrl ? (
                <div className="relative h-24 w-full overflow-hidden rounded-md">
                    <img
                        src={file.thumbnailUrl}
                        alt={file.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            ) : (
                <div className="flex items-center justify-center h-24">
                    {getFileIcon()}
                </div>
            )}
            <div className="text-center w-full">
                <p className="font-medium text-sm truncate" title={file.name}>{file.name}</p>
                <p className="text-xs text-gray-500">{file.size}</p>
            </div>
        </div>
    );
};

export default FileCard;
