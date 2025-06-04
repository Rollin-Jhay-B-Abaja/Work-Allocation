from flask import Flask, jsonify, send_from_directory
import os
import json

app = Flask(__name__)

@app.route('/api/workload_distribution', methods=['GET'])
def get_workload_distribution():
    temp_dir = os.path.join(os.path.dirname(__file__), 'temp')
    output_file = os.path.join(temp_dir, 'output.json')
    if not os.path.exists(output_file):
        return jsonify({"error": "Output file not found"}), 404
    with open(output_file, 'r') as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/api/<path:filename>', methods=['GET'])
def serve_file(filename):
    # Serve static files if needed
    base_dir = os.path.join(os.path.dirname(__file__), 'temp')
    return send_from_directory(base_dir, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
