import { useEffect, useCallback } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { toast } from 'react-toastify';

export const useRealTimeFiles = (onFileChange, onFolderChange, onAuditLog) => {
    const { subscribe } = useWebSocket();

    useEffect(() => {
        const unsubscribe = subscribe((message) => {
            console.log('Real-time update received:', message);

            switch (message.type) {
                case 'FILE_UPLOADED':
                    toast.info(`New file uploaded: ${message.data.fileName}`, {
                        position: "top-right",
                        autoClose: 3000,
                    });
                    if (onFileChange) onFileChange('upload', message.data);
                    break;

                case 'FILE_DELETED':
                    toast.info(`File deleted: ${message.data.fileName}`, {
                        position: "top-right",
                        autoClose: 3000,
                    });
                    if (onFileChange) onFileChange('delete', message.data);
                    break;

                case 'FILE_MOVED':
                    toast.info(`File moved: ${message.data.fileName}`, {
                        position: "top-right",
                        autoClose: 3000,
                    });
                    if (onFileChange) onFileChange('move', message.data);
                    break;

                case 'FOLDER_CREATED':
                    toast.info(`New folder created: ${message.data.name}`, {
                        position: "top-right",
                        autoClose: 3000,
                    });
                    if (onFolderChange) onFolderChange('create', message.data);
                    break;

                case 'FOLDER_DELETED':
                    toast.info(`Folder deleted: ${message.data.name}`, {
                        position: "top-right",
                        autoClose: 3000,
                    });
                    if (onFolderChange) onFolderChange('delete', message.data);
                    break;

                case 'PERMISSIONS_UPDATED':
                    toast.info(`Permissions updated for: ${message.data.resourceName}`, {
                        position: "top-right",
                        autoClose: 3000,
                    });
                    if (onFileChange) onFileChange('permissions', message.data);
                    break;

                case 'AUDIT_LOG_NEW':
                    if (onAuditLog) onAuditLog(message.data);
                    break;

                default:
                    console.log('Unknown message type:', message.type);
            }
        });

        return unsubscribe;
    }, [subscribe, onFileChange, onFolderChange, onAuditLog]);
};
