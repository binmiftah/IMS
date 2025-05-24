import React, { useState } from 'react';

const FolderTree = ({ items, selectedItems, onSelectionChange }) => {
    const [expandedFolders, setExpandedFolders] = useState({});

    // Organize items into a tree structure
    const buildTreeData = () => {
        const rootItems = [];
        const childrenMap = {};

        // First, group all items by their parentId
        items.forEach(item => {
            if (!item.parentId) {
                rootItems.push(item);
            } else {
                if (!childrenMap[item.parentId]) {
                    childrenMap[item.parentId] = [];
                }
                childrenMap[item.parentId].push(item);
            }
        });

        // Function to recursively build the tree
        const buildTree = (items) => {
            return items.map(item => ({
                ...item,
                children: childrenMap[item.id] ? buildTree(childrenMap[item.id]) : []
            }));
        };

        return buildTree(rootItems);
    };

    const treeData = buildTreeData();

    // Toggle folder expansion
    const toggleFolder = (folderId) => {
        setExpandedFolders(prev => ({
            ...prev,
            [folderId]: !prev[folderId]
        }));
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

    // Handle item selection with recursive selection for children
    const handleItemSelect = (item, isChecked) => {
        let newSelectedItems = [...selectedItems];

        if (isChecked) {
            // If checking, add this item and all its descendants
            if (item.type === 'folder' && item.children && item.children.length > 0) {
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
            if (item.type === 'folder' && item.children && item.children.length > 0) {
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

    // Recursive function to render tree nodes
    const renderTreeNodes = (nodes) => {
        return nodes.map(node => {
            // Determine if the item is a folder based on various properties
            const isFolder =
                node.type === 'folder' ||
                node.type === 'FOLDER' ||
                (node.children && node.children.length > 0);

            return (
                <div key={node.id} className="pl-4">
                    <div className="flex items-center py-1">
                        <input
                            type="checkbox"
                            id={`node-${node.id}`}
                            checked={selectedItems.includes(node.id)}
                            onChange={(e) => handleItemSelect(node, e.target.checked)}
                            className="mr-2"
                        />

                        {isFolder && node.children && node.children.length > 0 ? (
                            <span
                                className="cursor-pointer mr-1 w-4 text-center"
                                onClick={() => toggleFolder(node.id)}
                            >
                                {expandedFolders[node.id] ? '▼' : '►'}
                            </span>
                        ) : (
                            <span className="w-4 mr-1"></span>
                        )}

                        <label
                            htmlFor={`node-${node.id}`}
                            className="cursor-pointer flex items-center"
                        >
                            {isFolder ? (
                                <span className="text-yellow-600 mr-1">📁</span>
                            ) : (
                                <span className="text-blue-600 mr-1">📄</span>
                            )}
                            <span>{node.name || node.fileName}</span>
                        </label>
                    </div>

                    {isFolder && node.children && node.children.length > 0 && expandedFolders[node.id] && (
                        <div className="ml-4 border-l border-gray-200">
                            {renderTreeNodes(node.children)}
                        </div>
                    )}
                </div>
            );
        });
    };

    // If no items are provided, show a message
    if (!items || items.length === 0) {
        return <div className="text-gray-500">No resources available</div>;
    }

    // Debugging logs
    //   console.log("Selected folders format:", selectedItems);
    //   console.log("Permissions format:", selectedItems);
    //   console.log("Permission payload:", {
    //     accountId: selectedItems.id,
    //     resourceType: "FOLDER",
    //     permissions: selectedItems.length > 0 ? selectedItems : ["READ_FILES"],
    //     folderIds: selectedItems,
    //     inherited: false
    //   });

    return (
        <div className="folder-tree">
            {renderTreeNodes(treeData)}
        </div>
    );
};

export default FolderTree;