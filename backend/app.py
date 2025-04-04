import os
import pandas as pd
import numpy as np
import openai
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
from dotenv import load_dotenv  # Import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Get the API key from the environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

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

        # Replace NaN with None so it's valid JSON
        df_top = df_top.replace({np.nan: None})
        data = df_top.to_dict(orient='records')
        print("Returning data:", data)  # Debug
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/ask', methods=['POST'])
def ask():
    """
    Expects a JSON payload with:
    {
      "prompt": "User question here",
      "fileName": "example.csv"
    }
    """
    data = request.get_json()
    prompt = data.get('prompt', '')
    file_name = data.get('fileName', '')

    if not file_name:
        return jsonify({"error": "No file name provided"}), 400

    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_name)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    ext = os.path.splitext(file_name)[1].lower()
    try:
        if ext == '.csv':
            df = pd.read_csv(file_path)
        elif ext in ['.xls', '.xlsx']:
            df = pd.read_excel(file_path)
        else:
            return jsonify({"error": "Unsupported file type"}), 400

        # Take a sample (first 10 rows) for context
        df_sample = df.head(10)
        df_sample = df_sample.replace({np.nan: None})
        csv_context = df_sample.to_csv(index=False)

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant. Use the following CSV data as context:\n"
                    + csv_context +
                    "\nWhen answering, please provide your response as valid JSON containing two keys: "
                    "\"text\" for your plain text explanation, and \"graphData\" for a JSON array of objects with keys \"x\" and \"y\" for graphing. "
                    "Do not include any extra text."
                )
            },
            {
                "role": "user",
                "content": f"Question: {prompt}"
            }
        ]

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7
        )

        # Extract the answer from the response
        answer = response['choices'][0]['message']['content']
        return jsonify({'answer': answer}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
