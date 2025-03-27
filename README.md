# Growthbeans_CyberSierra - AI Powered CSV/Excel App

This project is an AI-powered application that enables users to upload CSV/Excel files, view and interact with their data, and ask natural language questions about the data. The AI response is enhanced with a graph generated from the response data for clearer visualization. Additionally, the application maintains a history of user prompts in the browser’s local storage for easy retrieval.

## Features

### File Upload and Management
- **Upload CSV/Excel Files:**  
  Users can upload CSV or Excel files. The uploaded files are stored on the server in an "uploads" directory.
  
- **View Uploaded Files:**  
  A list of uploaded files is displayed. Users can select a file from this list for further analysis.

### Data Preview
- **View Top N Rows:**  
  After selecting a file, users can specify a number (N) and view the top N rows of the data. This feature uses the `pandas` library to read the CSV or Excel file and convert the top rows into a JSON response that is then displayed in a table format.

### AI Query and Response
- **Ask a Question / Prompt:**  
  Users can enter a natural language question related to the data. The application sends the prompt and a sample of the CSV/Excel data as context to an AI model (GPT-3.5-turbo).
  
- **Composite AI Response:**  
  The AI response is augmented to include:
  - **Text Explanation:** A plain text explanation addressing the query.
  - **Graph Data:** A JSON array (with keys `"x"` and `"y"`) that is used to generate a graph, providing a visual representation of the AI's response.
  
- **Graph Visualization:**  
  The generated graph is rendered using ReCharts, helping users better understand the AI's output.

### Prompt History (Local Storage)
- **Client-Side Prompt History:**  
  Each time a user submits a prompt, the prompt along with the AI’s response (and corresponding graph data) is saved in the browser's local storage.
  
- **View and Reuse History:**  
  Users can view a history of their prompts, and by clicking on a previous prompt, they can reload the past query and its response for review or reuse.

## Project Structure

- **backend/app.py**  
  A Flask backend that handles file uploads, data previews, and communication with the OpenAI API.  
  - **Endpoints:**
    - `/upload`: Upload files.
    - `/files`: Retrieve a list of uploaded files.
    - `/view`: Retrieve the top N rows from the selected file.
    - `/ask`: Handle AI queries using the file data as context.

- **backend/requirements.txt**  
  A list of Python dependencies (and their versions) required by the backend. This file makes it easy for other developers to install the exact versions of libraries needed.

- **frontend/App.tsx**  
  A React frontend built with Material‑UI and ReCharts.  
  - Users can upload files, view file data, ask questions, and view both the AI response and a generated graph.
  - The frontend also implements local storage for prompt history, enabling users to quickly revisit past queries.

## Setup and Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ai-powered-csv-excel-app.git
cd ai-powered-csv-excel-app
```

### 2. cd backend

### 3. pip install -r requirements.txt

### 4. Create a .env file with your OpenAI API key

### 5. Run the Flask backend: python app.py

### 6. cd ../frontend

### 7. npm install

### 8. npm start
