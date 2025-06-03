import React, { useState, useEffect } from 'react';

const FolderTree = ({ items, selectedItems, onSelectionChange }) => {
    const [expandedFolders, setExpandedFolders] = useState({});

    // Auto-expand folders that have selected children
    useEffect(() => {
        if (selectedItems.length > 0) {
            const shouldExpand = {};
            
            // Find all parent folders that should be expanded
            const findParentFolders = (itemId) => {
                const item = items.find(i => i.id === itemId);
                if (item) {
                    const parentId = item.parentId || item.parent_id || item.folderId;
                    if (parentId) {
                        shouldExpand[parentId] = true;
                        findParentFolders(parentId); // Recursively expand ancestors
                    }
                }
            };

            selectedItems.forEach(findParentFolders);
            
            setExpandedFolders(prev => ({ ...prev, ...shouldExpand }));
        }
    }, [selectedItems, items]);

    // Organize items into a tree structure with better parent-child detection
    const buildTreeData = () => {
        const rootItems = [];
        const childrenMap = {};
        const allItemIds = new Set(items.map(item => item.id));

        console.log("🔍 DEBUG: Building tree from items:", items.length);
        console.log("🔍 DEBUG: Sample items:", items.slice(0, 3));

        // If items already have a children property, use that structure
        const hasPrebuiltStructure = items.some(item => item.children && Array.isArray(item.children));
        
        if (hasPrebuiltStructure) {
            console.log("🔍 DEBUG: Using pre-built hierarchical structure");
            
            // Filter to get only root items (items without parentId)
            const rootNodes = items.filter(item => !item.parentId || item.parentId === null || item.parentId === "null");
            
            console.log("🔍 DEBUG: Found root nodes:", rootNodes.length);
            
            // Recursively process the tree structure
            const processNode = (node, depth = 0) => {
                console.log(`🔍 DEBUG: Processing node ${node.id} at depth ${depth}`);
                
                const isFolder = node.type === 'folder' || 
                               node.type === 'FOLDER' || 
                               node.mimeType === 'application/vnd.google-apps.folder' ||
                               (!node.fileName && !node.fileExtension);
                
                const processedChildren = [];
                if (node.children && Array.isArray(node.children)) {
                    node.children.forEach(child => {
                        processedChildren.push(processNode(child, depth + 1));
                    });
                }
                
                return {
                    ...node,
                    children: processedChildren,
                    isFolder: isFolder
                };
            };
            
            const processedTree = rootNodes.map(node => processNode(node));
            
            console.log("🔍 DEBUG: Processed tree structure:", processedTree.map(node => ({
                id: node.id,
                name: node.name || node.fileName,
                isFolder: node.isFolder,
                childCount: node.children?.length || 0
            })));
            
            return processedTree;
        }

        // Fallback to the original flat structure processing
        console.log("🔍 DEBUG: Using flat structure, building hierarchy from parent IDs");
        
        // First, group all items by their parentId
        items.forEach(item => {
            // Check for parent relationship using multiple possible fields
            const parentId = item.parentId || item.parent_id || item.folderId;
            
            console.log(`🔍 DEBUG: Item ${item.id} (${item.name || item.fileName}) has parentId: ${parentId}`);
            
            // Only consider it a child if the parent actually exists in our items
            if (!parentId || parentId === null || parentId === "null" || !allItemIds.has(parentId)) {
                console.log(`  ✅ Adding ${item.id} as ROOT item`);
                rootItems.push(item);
            } else {
                console.log(`  ➡️ Adding ${item.id} as CHILD of ${parentId}`);
                if (!childrenMap[parentId]) {
                    childrenMap[parentId] = [];
                }
                childrenMap[parentId].push(item);
            }
        });

        console.log("🔍 DEBUG: Root items found:", rootItems.length, rootItems.map(i => i.name || i.fileName));
        console.log("🔍 DEBUG: Children map:", Object.keys(childrenMap).length, "parents");

        // Function to recursively build the tree
        const buildTree = (items, depth = 0) => {
            console.log(`🔍 DEBUG: Building tree at depth ${depth} with ${items.length} items`);
            
            return items
                .sort((a, b) => {
                    // Sort folders first, then files
                    const aIsFolder = a.type === 'folder' || 
                                     a.type === 'FOLDER' || 
                                     a.mimeType === 'application/vnd.google-apps.folder' ||
                                     (!a.fileName && !a.fileExtension);
                    const bIsFolder = b.type === 'folder' || 
                                     b.type === 'FOLDER' || 
                                     b.mimeType === 'application/vnd.google-apps.folder' ||
                                     (!b.fileName && !b.fileExtension);
                    
                    if (aIsFolder && !bIsFolder) return -1;
                    if (!aIsFolder && bIsFolder) return 1;
                    
                    // Then sort alphabetically
                    const aName = a.name || a.fileName || '';
                    const bName = b.name || b.fileName || '';
                    return aName.localeCompare(bName);
                })
                .map(item => {
                    const children = childrenMap[item.id] ? buildTree(childrenMap[item.id], depth + 1) : [];
                    const isFolder = item.type === 'folder' || 
                                   item.type === 'FOLDER' || 
                                   item.mimeType === 'application/vnd.google-apps.folder' ||
                                   (!item.fileName && !item.fileExtension);
                    
                    console.log(`🔍 DEBUG: Item ${item.id} (${item.name || item.fileName}) - isFolder: ${isFolder}, children: ${children.length}`);
                    
                    return {
                        ...item,
                        children: children,
                        isFolder: isFolder
                    };
                });
        };

        const tree = buildTree(rootItems);
        console.log("🔍 DEBUG: Built tree with", tree.length, "root nodes");
        
        return tree;
    };

    const treeData = buildTreeData();

    // Toggle folder expansion
    const toggleFolder = (folderId) => {
        setExpandedFolders(prev => ({
            ...prev,
            [folderId]: !prev[folderId]
        }));
    };

    // Expand all folders
    const expandAll = () => {
        const allFolderIds = {};
        const collectFolderIds = (nodes) => {
            nodes.forEach(node => {
                if (node.isFolder) {
                    allFolderIds[node.id] = true;
                    if (node.children) {
                        collectFolderIds(node.children);
                    }
                }
            });
        };
        collectFolderIds(treeData);
        setExpandedFolders(allFolderIds);
    };

    // Collapse all folders
    const collapseAll = () => {
        setExpandedFolders({});
    };

    // Get all descendant IDs recursively
    const getAllDescendantIds = (node, accumulatedIds = []) => {
        // Add current node ID
        accumulatedIds.push(node.id);

        // If it has children, process them recursively
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                getAllDescendantIds(child, accumulatedIds);
            });
        }

        return accumulatedIds;
    };

    // Check if any descendants are selected (for indeterminate state)
    const hasSelectedDescendants = (node) => {
        if (node.children && node.children.length > 0) {
            return node.children.some(child => 
                selectedItems.includes(child.id) || hasSelectedDescendants(child)
            );
        }
        return false;
    };

    // Check if all descendants are selected
    const allDescendantsSelected = (node) => {
        const descendantIds = getAllDescendantIds(node, []);
        return descendantIds.every(id => selectedItems.includes(id));
    };

    // Handle item selection with recursive selection for children
    const handleItemSelect = (item, isChecked) => {
        let newSelectedItems = [...selectedItems];

        if (isChecked) {
            // If checking, add this item and all its descendants
            if (item.isFolder && item.children && item.children.length > 0) {
                const descendantIds = getAllDescendantIds(item, []);

                // Add all descendant IDs without duplicates
                descendantIds.forEach(id => {
                    if (!newSelectedItems.includes(id)) {
                        newSelectedItems.push(id);
                    }
                });
            } else {
                // Just add this item if it's not already selected
                if (!newSelectedItems.includes(item.id)) {
                    newSelectedItems.push(item.id);
                }
            }
        } else {
            // If unchecking, remove this item and all its descendants
            if (item.isFolder && item.children && item.children.length > 0) {
                const descendantIds = getAllDescendantIds(item, []);
                newSelectedItems = newSelectedItems.filter(id => !descendantIds.includes(id));
            } else {
                // Just remove this item
                newSelectedItems = newSelectedItems.filter(id => id !== item.id);
            }
        }

        // Update the parent component with the new selection
        onSelectionChange(newSelectedItems);
    };

    // Select all items
    const selectAll = () => {
        const allIds = items.map(item => item.id);
        onSelectionChange(allIds);
    };

    // Deselect all items
    const deselectAll = () => {
        onSelectionChange([]);
    };

    // Get appropriate icon for file type
    const getFileIcon = (item) => {
        if (item.isFolder) {
            return expandedFolders[item.id] ? '📂' : '📁';
        }
        
        // File type icons based on extension or mime type
        const fileName = item.fileName || item.name || '';
        const extension = fileName.split('.').pop()?.toLowerCase();
        const mimeType = item.mimeType || '';
        
        if (mimeType.includes('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
            return '🖼️';
        }
        if (mimeType.includes('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension)) {
            return '🎥';
        }
        if (mimeType.includes('audio/') || ['mp3', 'wav', 'flac', 'aac'].includes(extension)) {
            return '🎵';
        }
        if (mimeType.includes('pdf') || extension === 'pdf') {
            return '📄';
        }
        if (mimeType.includes('text/') || ['txt', 'doc', 'docx'].includes(extension)) {
            return '📝';
        }
        if (mimeType.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(extension)) {
            return '📊';
        }
        if (mimeType.includes('presentation') || ['ppt', 'pptx'].includes(extension)) {
            return '📽️';
        }
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
            return '🗜️';
        }
        
        return '📄'; // Default file icon
    };

    // Recursive function to render tree nodes with improved indentation
    const renderTreeNodes = (nodes, depth = 0) => {
        return nodes.map(node => {
            const hasChildren = node.children && node.children.length > 0;
            const isExpanded = expandedFolders[node.id];
            const isSelected = selectedItems.includes(node.id);
            const hasPartialSelection = !isSelected && hasSelectedDescendants(node);

            return (
                <div key={node.id} className="select-none">
                    <div className={`flex items-center py-1 px-2 hover:bg-gray-50 rounded-md transition-colors ${depth > 0 ? `ml-${Math.min(depth * 4, 16)}` : ''}`}>
                        {/* Indentation lines for better visual hierarchy */}
                        {depth > 0 && (
                            <div className="flex items-center">
                                {Array.from({ length: depth }, (_, i) => (
                                    <div key={i} className="w-4 h-4 flex items-center justify-center">
                                        {i === depth - 1 ? (
                                            <div className="w-2 h-px bg-gray-300"></div>
                                        ) : (
                                            <div className="w-px h-4 bg-gray-200"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Checkbox with indeterminate state support */}
                        <div className="relative">
                            <input
                                type="checkbox"
                                id={`node-${node.id}`}
                                checked={isSelected}
                                ref={(input) => {
                                    if (input) {
                                        input.indeterminate = hasPartialSelection;
                                    }
                                }}
                                onChange={(e) => handleItemSelect(node, e.target.checked)}
                                className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2"
                            />
                            {hasPartialSelection && (
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="w-4 h-4 bg-blue-600 opacity-50 rounded"></div>
                                </div>
                            )}
                        </div>

                        {/* Expand/collapse button for folders */}
                        {hasChildren ? (
                            <button
                                className="cursor-pointer mr-2 w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                onClick={() => toggleFolder(node.id)}
                                type="button"
                                title={isExpanded ? 'Collapse folder' : 'Expand folder'}
                            >
                                <span className="text-xs">
                                    {isExpanded ? '▼' : '▶'}
                                </span>
                            </button>
                        ) : (
                            <span className="w-4 mr-2"></span>
                        )}

                        {/* File/folder icon and label */}
                        <label
                            htmlFor={`node-${node.id}`}
                            className="cursor-pointer flex items-center flex-1 text-sm min-w-0"
                        >
                            <span className="mr-2 text-base flex-shrink-0">
                                {getFileIcon(node)}
                            </span>
                            <span className="truncate font-medium">
                                {node.name || node.fileName || 'Unnamed'}
                            </span>
                            {hasChildren && (
                                <span className="ml-2 text-xs text-gray-400 flex-shrink-0">
                                    ({node.children.length})
                                </span>
                            )}
                            {node.fullPath && (
                                <span className="ml-2 text-xs text-gray-400 truncate">
                                    {node.fullPath}
                                </span>
                            )}
                        </label>
                    </div>

                    {/* Render children with better visual hierarchy */}
                    {hasChildren && isExpanded && (
                        <div className="relative">
                            {/* Connection line for children */}
                            <div className={`absolute left-${Math.min((depth + 1) * 4 + 2, 18)} top-0 bottom-0 w-px bg-gray-200`}></div>
                            {renderTreeNodes(node.children, depth + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    // If no items are provided, show a message
    if (!items || items.length === 0) {
        return (
            <div className="text-gray-500 text-center py-8">
                <div className="text-4xl mb-2">📁</div>
                <div className="font-medium">No resources available</div>
                <div className="text-sm">Add some files or folders to get started</div>
            </div>
        );
    }

    // Add this function right after the buildTreeData function:
    const debugDataStructure = () => {
        console.log("🔍 DEBUG: Full data structure analysis:");
        console.log("Total items:", items.length);
        
        // Check all possible parent field names
        const parentFields = ['parentId', 'parent_id', 'folderId', 'parentFolderId', 'parent'];
        
        parentFields.forEach(field => {
            const itemsWithField = items.filter(item => item[field] !== undefined && item[field] !== null);
            console.log(`Items with ${field}:`, itemsWithField.length);
            if (itemsWithField.length > 0) {
                console.log(`Sample ${field} values:`, itemsWithField.slice(0, 3).map(item => ({
                    id: item.id,
                    name: item.name || item.fileName,
                    [field]: item[field]
                })));
            }
        });
        
        // Check for items that look like folders
        const potentialFolders = items.filter(item => 
            item.type === 'folder' || 
            item.type === 'FOLDER' || 
            item.mimeType === 'application/vnd.google-apps.folder' ||
            (!item.fileName && !item.fileExtension)
        );
        console.log("Potential folders found:", potentialFolders.length);
        
        // Check for items that look like files
        const potentialFiles = items.filter(item => 
            item.fileName || item.fileExtension || (item.mimeType && !item.mimeType.includes('folder'))
        );
        console.log("Potential files found:", potentialFiles.length);
    };

    // Call this function at the beginning of your component
    useEffect(() => {
        if (items.length > 0) {
            debugDataStructure();
        }
    }, [items]);

    return (
        <div className="folder-tree border rounded-lg bg-white">
            {/* Header with controls */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-lg">
                <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium text-gray-700">
                        Resources ({selectedItems.length} selected)
                    </div>
                    {treeData.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={selectAll}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                type="button"
                            >
                                Select All
                            </button>
                            <button
                                onClick={deselectAll}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                type="button"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>
                
                {/* Expand/Collapse controls */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={expandAll}
                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        type="button"
                        title="Expand all folders"
                    >
                        Expand All
                    </button>
                    <button
                        onClick={collapseAll}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        type="button"
                        title="Collapse all folders"
                    >
                        Collapse
                    </button>
                </div>
            </div>

            {/* Tree content */}
            <div className="max-h-80 overflow-y-auto p-3">
                {treeData.length > 0 ? (
                    renderTreeNodes(treeData)
                ) : (
                    <div className="text-center text-gray-500 py-8">
                        <div className="text-2xl mb-2">🔍</div>
                        <div>No folder structure found</div>
                        <div className="text-sm">Items may not have proper parent-child relationships</div>
                    </div>
                )}
            </div>

            {/* Footer with summary */}
            {selectedItems.length > 0 && (
                <div className="p-3 border-t bg-gray-50 rounded-b-lg">
                    <div className="text-xs text-gray-600">
                        <strong>{selectedItems.length}</strong> resources selected
                        {selectedItems.length > 5 && (
                            <span className="ml-2">
                                (First 5: {selectedItems.slice(0, 5).map(id => {
                                    const item = items.find(i => i.id === id);
                                    return item ? (item.name || item.fileName || 'Unnamed') : id;
                                }).join(', ')}, ...)
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FolderTree;