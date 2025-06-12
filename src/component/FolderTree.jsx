// No filepath: Update your FolderTree.jsx component with this logic
import React from 'react';

const FolderTree = ({ 
  items, 
  selectedItems, 
  onSelectionChange, 
  disableCascadeSelection = false 
}) => {
  
  const handleCheckboxChange = (itemId, checked) => {
    let newSelectedItems;
    
    if (disableCascadeSelection) {
      // Independent selection - only toggle the clicked item
      if (checked) {
        // Add only this item (no children)
        newSelectedItems = [...selectedItems, itemId];
      } else {
        // Remove only this item (no children)
        newSelectedItems = selectedItems.filter(id => id !== itemId);
      }
    } else {
      // Original cascade behavior (if you want to keep both options)
      // ... your existing cascade logic here
      newSelectedItems = selectedItems; // placeholder
    }
    
    onSelectionChange(newSelectedItems);
  };

  const renderTreeItem = (item, level = 0) => {
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <div key={item.id} className="mb-1">
        <div className={`flex items-center space-x-2 p-1 hover:bg-gray-50 rounded ${level > 0 ? 'ml-6' : ''}`}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
            className="form-checkbox h-4 w-4 text-blue-600 flex-shrink-0"
          />
          <span className="text-sm flex items-center cursor-pointer">
            {item.type === 'folder' ? '📁' : '📄'} 
            <span className="ml-1">{item.name || item.fileName}</span>
          </span>
        </div>
        
        {/* Render children independently */}
        {item.children && item.children.length > 0 && (
          <div className="ml-4 border-l border-gray-200 pl-2">
            {item.children.map(child => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {items.map(item => renderTreeItem(item))}
    </div>
  );
};

export default FolderTree;