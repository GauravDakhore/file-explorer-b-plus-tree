import os
import shutil
import json
from datetime import datetime
from b_plus_tree import BPlusTree

class FileSystem:
    def __init__(self, base_folder="uploads"):
        self.base_folder = base_folder
        # Create base folder if it doesn't exist
        if not os.path.exists(base_folder):
            os.makedirs(base_folder)
        
        # Initialize B+ Tree
        self.b_tree = BPlusTree(order=5)
        
        # Load existing file structure
        self._load_existing_files()    
    
    def _load_existing_files(self):
        """Scan the existing files and folders and build B+ Tree"""
        for root, dirs, files in os.walk(self.base_folder):
            # Create relative path from base_folder
            rel_path = os.path.relpath(root, self.base_folder)
            if rel_path != ".":
                # Add folder to B+ Tree
                folder_key = self._generate_key(rel_path)
                self.b_tree.insert(folder_key, {
                    "type": "folder",
                    "path": rel_path,
                    "name": os.path.basename(rel_path),
                    "created_at": datetime.fromtimestamp(os.path.getctime(root)).isoformat()
                })
            
            # Add files to B+ Tree
            for file in files:
                file_path = os.path.join(rel_path, file) if rel_path != "." else file
                abs_path = os.path.join(self.base_folder, file_path)
                file_key = self._generate_key(file_path)
                self.b_tree.insert(file_key, {
                    "type": "file",
                    "path": file_path,
                    "name": file,
                    "size": os.path.getsize(abs_path),
                    "created_at": datetime.fromtimestamp(os.path.getctime(abs_path)).isoformat()
                })
    
    def _generate_key(self, path):
        """Generate a unique key for B+ Tree based on path"""
        return path.lower().replace("\\", "/")
    
    def create_folder(self, folder_path):
        """Create a new folder in the file system"""
        # Normalize path and ensure it's relative to base_folder
        folder_path = folder_path.replace("\\", "/").strip("/")
        full_path = os.path.join(self.base_folder, folder_path)
        
        if os.path.exists(full_path):
            return {"success": False, "message": "Folder already exists"}
        
        try:
            # Create intermediate directories if needed
            os.makedirs(full_path)
            
            # Add to B+ Tree
            folder_key = self._generate_key(folder_path)
            self.b_tree.insert(folder_key, {
                "type": "folder",
                "path": folder_path,
                "name": os.path.basename(folder_path),
                "created_at": datetime.now().isoformat()
            })
            
            return {"success": True, "message": f"Folder {folder_path} created successfully"}
        except Exception as e:
            return {"success": False, "message": f"Error creating folder: {str(e)}"}
    
    def create_file(self, folder_path, file_name, content):
        """Create a new file with content"""
        # Normalize paths
        folder_path = folder_path.replace("\\", "/").strip("/")
        
        # Ensure folder exists
        folder_full_path = os.path.join(self.base_folder, folder_path)
        if not os.path.exists(folder_full_path):
            result = self.create_folder(folder_path)
            if not result["success"]:
                return result
        
        # Create file path
        file_path = os.path.join(folder_path, file_name) if folder_path else file_name
        full_path = os.path.join(self.base_folder, file_path)
        
        if os.path.exists(full_path):
            return {"success": False, "message": "File already exists"}
        
        try:
            # Write content to file
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Add to B+ Tree
            file_key = self._generate_key(file_path)
            file_info = {
                "type": "file",
                "path": file_path,
                "name": file_name,
                "size": os.path.getsize(full_path),
                "created_at": datetime.now().isoformat()
            }
            self.b_tree.insert(file_key, file_info)
            
            return {"success": True, "message": f"File {file_name} created successfully", "file": file_info}
        except Exception as e:
            return {"success": False, "message": f"Error creating file: {str(e)}"}
    
    def upload_file(self, folder_path, file_obj):
        """Save an uploaded file to the specified folder"""
        # Normalize folder path
        folder_path = folder_path.replace("\\", "/").strip("/")
        
        # Ensure folder exists
        folder_full_path = os.path.join(self.base_folder, folder_path)
        if not os.path.exists(folder_full_path):
            result = self.create_folder(folder_path)
            if not result["success"]:
                return result
        
        file_name = file_obj.filename
        file_path = os.path.join(folder_path, file_name) if folder_path else file_name
        full_path = os.path.join(self.base_folder, file_path)
        
        try:
            # Save uploaded file
            file_obj.save(full_path)
            
            # Add to B+ Tree
            file_key = self._generate_key(file_path)
            file_info = {
                "type": "file",
                "path": file_path,
                "name": file_name,
                "size": os.path.getsize(full_path),
                "created_at": datetime.now().isoformat()
            }
            self.b_tree.insert(file_key, file_info)
            
            return {"success": True, "message": f"File {file_name} uploaded successfully", "file": file_info}
        except Exception as e:
            return {"success": False, "message": f"Error uploading file: {str(e)}"}
    
    def rename_file(self, file_path, new_name):
        """Rename a file or folder"""
        # Normalize paths
        file_path = file_path.replace("\\", "/").strip("/")
        
        full_path = os.path.join(self.base_folder, file_path)
        if not os.path.exists(full_path):
            return {"success": False, "message": "File or folder not found"}
        
        # Get parent directory and create new path
        parent_dir = os.path.dirname(file_path)
        new_path = os.path.join(parent_dir, new_name) if parent_dir else new_name
        new_full_path = os.path.join(self.base_folder, new_path)
        
        if os.path.exists(new_full_path):
            return {"success": False, "message": f"A file or folder named {new_name} already exists"}
        
        try:
            # Rename the file or folder
            os.rename(full_path, new_full_path)
            
            # Remove old entry from B+ Tree
            old_key = self._generate_key(file_path)
            self.b_tree.delete(old_key)
            
            # Add new entry to B+ Tree
            is_folder = os.path.isdir(new_full_path)
            new_key = self._generate_key(new_path)
            new_entry = {
                "type": "folder" if is_folder else "file",
                "path": new_path,
                "name": new_name,
                "created_at": datetime.fromtimestamp(os.path.getctime(new_full_path)).isoformat()
            }
            
            if not is_folder:
                new_entry["size"] = os.path.getsize(new_full_path)
                
            self.b_tree.insert(new_key, new_entry)
            
            return {"success": True, "message": f"{new_name} renamed successfully", "item": new_entry}
        except Exception as e:
            return {"success": False, "message": f"Error renaming: {str(e)}"}
    
    def delete_file(self, file_path):
        """Delete a file or folder"""
        # Normalize path
        file_path = file_path.replace("\\", "/").strip("/")
        
        full_path = os.path.join(self.base_folder, file_path)
        if not os.path.exists(full_path):
            return {"success": False, "message": "File or folder not found"}
        
        try:
            # Delete the file or folder
            if os.path.isdir(full_path):
                shutil.rmtree(full_path)
                
                # Recursively delete all children from B+ Tree
                all_items = self.get_all_files()
                for item in all_items:
                    if item["path"].startswith(file_path + "/") or item["path"] == file_path:
                        self.b_tree.delete(self._generate_key(item["path"]))
            else:
                os.remove(full_path)
                # Delete from B+ Tree
                self.b_tree.delete(self._generate_key(file_path))
            
            return {"success": True, "message": f"{os.path.basename(file_path)} deleted successfully"}
        except Exception as e:
            return {"success": False, "message": f"Error deleting: {str(e)}"}
    
    def get_all_files(self):
        """Get all files and folders in the file system"""
        items = []
        for _, item in self.b_tree.list_all():
            items.append(item)
        return items
    
    def get_file_tree(self):
        """Generate a nested tree structure of files and folders"""
        flat_items = self.get_all_files()
        root = {"name": "root", "type": "folder", "path": "", "children": []}
        
        # First pass: create all folders
        for item in flat_items:
            if item["type"] == "folder":
                parts = item["path"].split("/")
                current = root
                
                # Navigate to parent folder
                for i in range(len(parts) - 1):
                    found = False
                    for child in current["children"]:
                        if child["name"] == parts[i] and child["type"] == "folder":
                            current = child
                            found = True
                            break
                    
                    if not found:
                        new_folder = {
                            "name": parts[i],
                            "type": "folder",
                            "path": "/".join(parts[:i+1]),
                            "children": []
                        }
                        current["children"].append(new_folder)
                        current = new_folder
                
                # Add current folder
                folder_exists = False
                for child in current["children"]:
                    if child["name"] == parts[-1] and child["type"] == "folder":
                        folder_exists = True
                        break
                
                if not folder_exists:
                    current["children"].append({
                        "name": parts[-1],
                        "type": "folder",
                        "path": item["path"],
                        "children": []
                    })
        
        # Second pass: add files to folders
        for item in flat_items:
            if item["type"] == "file":
                parts = item["path"].split("/")
                current = root
                
                # Navigate to parent folder
                for i in range(len(parts) - 1):
                    found = False
                    for child in current["children"]:
                        if child["name"] == parts[i] and child["type"] == "folder":
                            current = child
                            found = True
                            break
                    
                    if not found:
                        new_folder = {
                            "name": parts[i],
                            "type": "folder",
                            "path": "/".join(parts[:i+1]),
                            "children": []
                        }
                        current["children"].append(new_folder)
                        current = new_folder
                
                # Add file to current folder
                file_info = item.copy()
                if "children" not in file_info:
                    file_info["children"] = []
                current["children"].append(file_info)
        
        return root