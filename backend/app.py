from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import os
from file_system import FileSystem
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  


file_system = FileSystem(base_folder="uploads")

@app.route('/create_folder', methods=['POST'])
def create_folder():
    data = request.get_json()
    folder_name = data.get('folder_name', '')
    
    if not folder_name:
        return jsonify({"success": False, "message": "Folder name is required"}), 400
    
    result = file_system.create_folder(folder_name)
    return jsonify(result)

@app.route('/create_file', methods=['POST'])
def create_file():
    data = request.get_json()
    folder_name = data.get('folder_name', '')
    file_name = data.get('file_name', '')
    content = data.get('content', '')
    
    if not file_name:
        return jsonify({"success": False, "message": "File name is required"}), 400
    
    result = file_system.create_file(folder_name, file_name, content)
    return jsonify(result)

@app.route('/upload_file', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "No file part"}), 400
    
    folder_name = request.form.get('folder_name', '')
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"success": False, "message": "No file selected"}), 400
    
    # Secure the filename
    filename = secure_filename(file.filename)
    
    result = file_system.upload_file(folder_name, file)
    return jsonify(result)

@app.route('/files', methods=['GET'])
def get_files():
    tree = file_system.get_file_tree()
    return jsonify(tree)

@app.route('/delete_file', methods=['POST'])
def delete_file():
    data = request.get_json()
    path = data.get('path', '')
    
    if not path:
        return jsonify({"success": False, "message": "File path is required"}), 400
    
    result = file_system.delete_file(path)
    return jsonify(result)

@app.route('/rename_file', methods=['POST'])
def rename_file():
    data = request.get_json()
    path = data.get('path', '')
    new_name = data.get('new_name', '')
    
    if not path or not new_name:
        return jsonify({"success": False, "message": "Path and new name are required"}), 400
    
    result = file_system.rename_file(path, new_name)
    return jsonify(result)

@app.route('/download/<path:filepath>', methods=['GET'])
def download_file(filepath):
    return send_from_directory(directory='uploads', path=filepath, as_attachment=True)

@app.route('/file_content/<path:filepath>', methods=['GET'])
def get_file_content(filepath):
    try:
        with open(os.path.join('uploads', filepath), 'r', encoding='utf-8') as f:
            content = f.read()
        return jsonify({"success": True, "content": content})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error reading file: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)