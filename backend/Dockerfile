# 1. Use Python 3.9 (Stable and compatible with most ML libraries)
FROM python:3.10-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy requirements first (for caching layers)
COPY requirements.txt .

# 4. Install dependencies
# We use the CPU version of torch to keep the image size small and avoid errors on non-GPU servers
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# 5. Copy the rest of the backend files
COPY . .

# 6. Create a temp directory (Often needed by Hugging Face/Streamlit apps)
RUN mkdir -p /app/temp && chmod 777 /app/temp

# 7. Expose the port (Hugging Face uses 7860 by default)
EXPOSE 7860

# 8. Command to run the app
# We tell uvicorn to look for 'app' inside 'main.py'
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]