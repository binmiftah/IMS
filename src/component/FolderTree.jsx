// FolderTree Component - Add within the same file or create a new component
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
  
  // Handle item selection
  const handleItemSelect = (item) => {
    onSelectionChange(prev => 
      prev.includes(item.id)
        ? prev.filter(id => id !== item.id)
        : [...prev, item.id]
    );
  };
  
  // Recursive component to render tree nodes
  const renderTreeNode = (item, level = 0) => {
    const isFolder = item.type === 'folder';
    const isExpanded = expandedFolders[item.id];
    const hasChildren = isFolder && item.children && item.children.length > 0;
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <div key={item.id} className="select-none">
        <div 
          className={`flex items-center py-1 ${level > 0 ? 'ml-' + (level * 4) : ''}`}
        >
          {/* Expand/collapse icon for folders with children */}
          {isFolder && hasChildren ? (
            <button 
              onClick={() => toggleFolder(item.id)}
              className="mr-1 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? '▼' : '►'}
            </button>
          ) : (
            <span className="w-5 mr-1"></span>
          )}
          
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleItemSelect(item)}
            className="form-checkbox h-5 w-5 text-blue-600 mr-2"
          />
          
          {/* Icon based on type */}
          <span className="mr-2">
            {isFolder ? (
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a2 2 0 012 2v2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4z" clipRule="evenodd" />
              </svg>
            )}
          </span>
          
          {/* Item name */}
          <span className={`truncate ${isSelected ? 'font-medium' : ''}`}>
            {item.name}
            {!isFolder && item.fileName && (
              <span className="text-sm text-gray-500 ml-1">({item.fileName})</span>
            )}
          </span>
        </div>
        
        {/* Render children if expanded */}
        {isFolder && isExpanded && item.children && (
          <div>
            {item.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="folder-tree">
      {treeData.length > 0 ? (
        treeData.map(item => renderTreeNode(item))
      ) : (
        <div className="text-gray-500 py-2">No resources available</div>
      )}
    </div>
  );
};

export default FolderTree;