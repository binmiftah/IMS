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

    const connect = () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('No token found, skipping WebSocket connection');
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

            wsRef.current.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
                
                // Attempt to reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('Attempting to reconnect WebSocket...');
                    connect();
                }, 3000);
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
            };

        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
        }
    };

    const disconnect = () => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
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

    useEffect(() => {
        connect();
        return () => {
            disconnect();
        };
    }, []);

    const value = {
        isConnected,
        lastMessage,
        subscribe,
        connect,
        disconnect
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};
