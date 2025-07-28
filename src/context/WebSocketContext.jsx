import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

const WebSocketContext = createContext();

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

export const WebSocketProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const [subscribers, setSubscribers] = useState(new Map());
    const [connectionEnabled, setConnectionEnabled] = useState(false);

    const connect = () => {
        try {
            const token = localStorage.getItem('token');
            if (!token || !connectionEnabled) {
                console.log('No token found or connection disabled, skipping WebSocket connection');
                return;
            }

            // Only connect if we don't already have an active connection
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                console.log('WebSocket already connected');
                return;
            }

            // Replace with your WebSocket server URL
            const wsUrl = `ws://20.80.82.90:3000/ws?token=${token}`;
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
                // Clear any pending reconnection attempts
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('WebSocket message received:', message);
                    setLastMessage(message);
                    
                    // Notify all subscribers
                    subscribers.forEach((callback, id) => {
                        try {
                            callback(message);
                        } catch (error) {
                            console.error('Error in WebSocket subscriber:', error);
                        }
                    });
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            wsRef.current.onclose = (event) => {
                console.log('WebSocket disconnected', event.code, event.reason);
                setIsConnected(false);
                
                // Only attempt to reconnect if it wasn't a deliberate close and connection is enabled
                if (event.code !== 1000 && connectionEnabled) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('Attempting to reconnect WebSocket...');
                        connect();
                    }, 3000);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
            };

        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            setIsConnected(false);
        }
    };

    const disconnect = () => {
        setConnectionEnabled(false);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.close(1000, 'Manual disconnect');
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        setIsConnected(false);
    };

    const enableConnection = () => {
        setConnectionEnabled(true);
    };

    const subscribe = (callback) => {
        const id = Math.random().toString(36).substr(2, 9);
        setSubscribers(prev => new Map(prev).set(id, callback));
        
        // Return unsubscribe function
        return () => {
            setSubscribers(prev => {
                const newMap = new Map(prev);
                newMap.delete(id);
                return newMap;
            });
        };
    };

    // Enable connection after component mounts
    useEffect(() => {
        const timer = setTimeout(() => {
            setConnectionEnabled(true);
        }, 1000); // Wait 1 second after app loads

        return () => clearTimeout(timer);
    }, []);

    // Connect when enabled
    useEffect(() => {
        if (connectionEnabled) {
            connect();
        }
        return () => {
            disconnect();
        };
    }, [connectionEnabled]);

    const value = {
        isConnected,
        lastMessage,
        subscribe,
        connect,
        disconnect,
        enableConnection,
        connectionEnabled
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};
