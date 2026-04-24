#!/bin/bash


cd "$(dirname "$0")"

echo "======================================"
echo " Building Smart Home - State Pattern  "
echo "======================================"

echo "[1/2] Compiling Java classes..."
javac -d out $(find src/main/java -name "*.java")

if [ $? -ne 0 ]; then
    echo "Compilation failed!"
    exit 1
fi

echo "[2/2] Starting local HTTP Server..."
echo "Server will be available at http://localhost:8080"
echo "Press Ctrl+C to stop the server."
echo "======================================"


java -cp out smarthome.Main
