import os
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Define the upload directory (absolute path)
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload directory exists; if not, create it
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Secure the file name and save it
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    return jsonify({'fileName': filename}), 200

@app.route('/files', methods=['GET'])
def list_files():
    # List all files in the upload directory
    try:
        files = os.listdir(app.config['UPLOAD_FOLDER'])
        return jsonify(files), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/view', methods=['GET'])
def view_file():
    file_name = request.args.get('fileName')
    n = request.args.get('n', default=5, type=int)

    if not file_name:
        return jsonify({"error": "No file name provided"}), 400

    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_name)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    ext = os.path.splitext(file_name)[1].lower()
    try:
        # Read file using pandas
        if ext == '.csv':
            df = pd.read_csv(file_path)
        elif ext in ['.xls', '.xlsx']:
            df = pd.read_excel(file_path)
        else:
            return jsonify({"error": "Unsupported file type"}), 400

        # Get top n rows
        df_top = df.head(n)

        # Replace NaN with empty string or None so it's valid JSON
        df_top = df_top.replace({np.nan: None})
        # Alternatively, df_top = df_top.fillna("")

        data = df_top.to_dict(orient='records')
        print("Returning data:", data)  # Debug
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# @app.route('/view', methods=['GET'])
# def view_file():
#     # Expect query parameters: fileName and n (number of rows)
#     file_name = request.args.get('fileName')
#     n = request.args.get('n', default=5, type=int)

#     if not file_name:
#         return jsonify({"error": "No file name provided"}), 400

#     file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_name)
#     if not os.path.exists(file_path):
#         return jsonify({"error": "File not found"}), 404

#     ext = os.path.splitext(file_name)[1].lower()
#     try:
#         # Read file using pandas based on file extension
#         if ext == '.csv':
#             df = pd.read_csv(file_path)
#         elif ext in ['.xls', '.xlsx']:
#             df = pd.read_excel(file_path)
#         else:
#             return jsonify({"error": "Unsupported file type"}), 400

#         # Get the top n rows
#         df_top = df.head(n)
#         data = df_top.to_dict(orient='records')
#         print("Returning data:", data)  # Debug log in the server console
#         return jsonify(data), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
