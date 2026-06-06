class BPlusTreeNode:
    def __init__(self, order, is_leaf=True):
        self.order = order
        self.is_leaf = is_leaf
        self.keys = []
        self.children = []
        self.next = None  

class BPlusTree:
    def __init__(self, order=5):
        """Initialize an empty B+ Tree with specified order (default 5)"""
        self.root = BPlusTreeNode(order)
        self.order = order
    
    def insert(self, key, value):
        """Insert a key-value pair into the B+ Tree"""
       
        if len(self.root.keys) == 2 * self.order - 1:
            new_root = BPlusTreeNode(self.order, is_leaf=False)
            new_root.children.append(self.root)
            self.split_child(new_root, 0)
            self.root = new_root
        
        self._insert_non_full(self.root, key, value)
    
    def split_child(self, parent, index):
        """Split the child node at the given index of parent"""
        child = parent.children[index]
        new_node = BPlusTreeNode(self.order, is_leaf=child.is_leaf)
        
      
        if child.is_leaf:
          
            mid_point = self.order
            new_node.keys = child.keys[mid_point:]
            child.keys = child.keys[:mid_point]
            new_node.next = child.next
            child.next = new_node
        else:
         
            mid_point = self.order - 1
            parent.keys.insert(index, child.keys[mid_point])
            
            new_node.keys = child.keys[mid_point + 1:]
            child.keys = child.keys[:mid_point]
            
            new_node.children = child.children[mid_point + 1:]
            child.children = child.children[:mid_point + 1]
        
        parent.children.insert(index + 1, new_node)
    
    def _insert_non_full(self, node, key, value):
        """Insert key-value into a non-full node"""
        i = len(node.keys) - 1
        
        if node.is_leaf:
            # Insert key-value in leaf node
            while i >= 0 and key < node.keys[i][0]:
                i -= 1
            node.keys.insert(i + 1, (key, value))
        else:
            # Find the child where key should go
            while i >= 0 and key < node.keys[i]:
                i -= 1
            i += 1
            
            # If child is full, split it
            if len(node.children[i].keys) == 2 * self.order - 1:
                self.split_child(node, i)
                if key > node.keys[i]:
                    i += 1
            
            self._insert_non_full(node.children[i], key, value)
    
    def search(self, key):
        """Search for a key in the B+ Tree"""
        return self._search(self.root, key)
    
    def _search(self, node, key):
        """Recursive search for a key, returns the value or None"""
        i = 0
        # Find the position where key should be
        while i < len(node.keys) and (node.is_leaf and key > node.keys[i][0] or 
                                     not node.is_leaf and key > node.keys[i]):
            i += 1
        
        if node.is_leaf:
            # Check if key exists in leaf node
            if i < len(node.keys) and node.keys[i][0] == key:
                return node.keys[i][1]
            return None
        else:
            # Continue search in child node
            return self._search(node.children[i], key)
    
    def list_all(self):
        """List all key-value pairs in the B+ Tree"""
        result = []
        node = self.root
        
        # Find leftmost leaf node
        while not node.is_leaf:
            node = node.children[0]
        
        # Traverse leaf nodes using next pointers
        while node:
            for key, value in node.keys:
                result.append((key, value))
            node = node.next
            
        return result
    
    def delete(self, key):
        """Delete a key from the B+ Tree"""
        self._delete(self.root, key)
        
        # If root is empty and has children, make first child the new root
        if not self.root.is_leaf and len(self.root.keys) == 0:
            self.root = self.root.children[0]
    
    def _delete(self, node, key):
        """Recursively delete a key from the tree"""
        i = 0
        # Find position where key should be
        while i < len(node.keys) and (node.is_leaf and key > node.keys[i][0] or 
                                     not node.is_leaf and key > node.keys[i]):
            i += 1
            
        if node.is_leaf:
            # Delete key if it exists in leaf node
            if i < len(node.keys) and node.keys[i][0] == key:
                node.keys.pop(i)
            return
        
        # Delete from child node
        self._delete(node.children[i], key)
        
        # Handle underflow
        if len(node.children[i].keys) < self.order - 1:
            self._handle_underflow(node, i)
    
    def _handle_underflow(self, parent, index):
        """Handle underflow in a child node"""
        child = parent.children[index]
        
        # Try to borrow from left sibling
        if index > 0 and len(parent.children[index-1].keys) > self.order - 1:
            self._borrow_from_left(parent, index)
        # Try to borrow from right sibling
        elif index < len(parent.children) - 1 and len(parent.children[index+1].keys) > self.order - 1:
            self._borrow_from_right(parent, index)
        # Merge with a sibling
        else:
            if index > 0:
                self._merge_with_left(parent, index)
            else:
                self._merge_with_right(parent, index)
    
    def _borrow_from_left(self, parent, index):
        """Borrow a key from left sibling"""
        child = parent.children[index]
        left_sibling = parent.children[index-1]
        
        if child.is_leaf:
            # Move the rightmost key from left sibling
            child.keys.insert(0, left_sibling.keys.pop())
        else:
            # Move a key from parent down to child and up from left sibling
            child.keys.insert(0, parent.keys[index-1])
            parent.keys[index-1] = left_sibling.keys.pop()
            
            # Move the rightmost child pointer too
            if left_sibling.children:
                child.children.insert(0, left_sibling.children.pop())
    
    def _borrow_from_right(self, parent, index):
        """Borrow a key from right sibling"""
        child = parent.children[index]
        right_sibling = parent.children[index+1]
        
        if child.is_leaf:
            # Move the leftmost key from right sibling
            child.keys.append(right_sibling.keys.pop(0))
        else:
            # Move a key from parent down to child and up from right sibling
            child.keys.append(parent.keys[index])
            parent.keys[index] = right_sibling.keys.pop(0)
            
            # Move the leftmost child pointer too
            if right_sibling.children:
                child.children.append(right_sibling.children.pop(0))
    
    def _merge_with_left(self, parent, index):
        """Merge child with its left sibling"""
        child = parent.children[index]
        left_sibling = parent.children[index-1]
        
        # Move parent key down to left sibling
        if not child.is_leaf:
            left_sibling.keys.append(parent.keys[index-1])
        
        # Move all keys and children from child to left sibling
        left_sibling.keys.extend(child.keys)
        if not child.is_leaf:
            left_sibling.children.extend(child.children)
        
        # Update linked list for leaf nodes
        if child.is_leaf:
            left_sibling.next = child.next
            
        # Remove the parent key and child pointer
        parent.keys.pop(index-1)
        parent.children.pop(index)
    
    def _merge_with_right(self, parent, index):
        """Merge child with its right sibling"""
        child = parent.children[index]
        right_sibling = parent.children[index+1]
        
        # Move parent key down to child
        if not child.is_leaf:
            child.keys.append(parent.keys[index])
        
        # Move all keys and children from right sibling to child
        child.keys.extend(right_sibling.keys)
        if not child.is_leaf:
            child.children.extend(right_sibling.children)
        
        # Update linked list for leaf nodes
        if child.is_leaf:
            child.next = right_sibling.next
            
        # Remove the parent key and right sibling pointer
        parent.keys.pop(index)
        parent.children.pop(index+1)