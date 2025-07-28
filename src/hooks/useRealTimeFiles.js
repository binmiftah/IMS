import { useEffect, useCallback } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { toast } from 'react-toastify';

export const useRealTimeFiles = (callbacks = {}) => {
    const { subscribe, isConnected, connectionEnabled } = useWebSocket();

    const {
        onFileUploaded,
        onFileDeleted,
        onFilesMoved,
        onFolderCreated,
        onFolderDeleted,
        onPermissionsUpdated,
        onUserAction,
        onAuditLog
    } = callbacks;

    useEffect(() => {
        // Only subscribe if connection is enabled
        if (!connectionEnabled) {
            return;
        }

        const unsubscribe = subscribe((message) => {
            try {
                console.log('Real-time update received:', message);

                switch (message.type) {
                    case 'FILE_UPLOADED':
                        if (onFileUploaded) {
                            onFileUploaded(message.data);
                        }
                        toast.info(`New file uploaded: ${message.data?.fileName || 'Unknown'}`, {
                            position: "top-right",
                            autoClose: 3000,
                        });
                        break;

                    case 'FILE_DELETED':
                        if (onFileDeleted) {
                            onFileDeleted(message.data);
                        }
                        toast.info(`File deleted: ${message.data?.fileName || 'Unknown'}`, {
                            position: "top-right",
                            autoClose: 3000,
                        });
                        break;

                    case 'FILES_MOVED':
                        if (onFilesMoved) {
                            onFilesMoved(message.data);
                        }
                        toast.info(`File moved: ${message.data?.fileName || 'Unknown'}`, {
                            position: "top-right",
                            autoClose: 3000,
                        });
                        break;

                    case 'FOLDER_CREATED':
                        if (onFolderCreated) {
                            onFolderCreated(message.data);
                        }
                        toast.info(`New folder created: ${message.data?.name || 'Unknown'}`, {
                            position: "top-right",
                            autoClose: 3000,
                        });
                        break;

                    case 'FOLDER_DELETED':
                        if (onFolderDeleted) {
                            onFolderDeleted(message.data);
                        }
                        toast.info(`Folder deleted: ${message.data?.name || 'Unknown'}`, {
                            position: "top-right",
                            autoClose: 3000,
                        });
                        break;

                    case 'PERMISSIONS_UPDATED':
                        if (onPermissionsUpdated) {
                            onPermissionsUpdated(message.data);
                        }
                        toast.info(`Permissions updated for: ${message.data?.resourceName || 'Unknown'}`, {
                            position: "top-right",
                            autoClose: 3000,
                        });
                        break;

                    case 'USER_ACTION':
                        if (onUserAction) {
                            onUserAction(message.data);
                        }
                        break;

                    case 'AUDIT_LOG_NEW':
                        if (onAuditLog) {
                            onAuditLog(message.data);
                        }
                        break;

                    default:
                        console.log('Unknown WebSocket message type:', message.type);
                }
            } catch (error) {
                console.error('Error handling real-time message:', error);
            }
        });

        return unsubscribe;
    }, [subscribe, connectionEnabled, onFileUploaded, onFileDeleted, onFilesMoved, onFolderCreated, onFolderDeleted, onPermissionsUpdated, onUserAction, onAuditLog]);

    return { isConnected, connectionEnabled };
};
