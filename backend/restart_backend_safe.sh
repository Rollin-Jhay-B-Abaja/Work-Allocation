#!/bin/bash
# Safe restart script for backend server
# Adjust commands as needed for your environment

# Find the PID of the Flask server (assuming it runs with 'flask run')
PID=$(pgrep -f "flask run")

if [ -n "$PID" ]; then
  echo "Stopping Flask server with PID $PID"
  kill -TERM $PID
  # Wait for the process to terminate
  while kill -0 $PID 2>/dev/null; do
    sleep 1
  done
  echo "Flask server stopped"
else
  echo "Flask server not running"
fi

# Start the Flask server in background
echo "Starting Flask server"
nohup flask run > /dev/null 2>&1 &

echo "Flask server restarted"
