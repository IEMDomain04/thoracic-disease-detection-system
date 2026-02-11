import os
import importlib
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import shutil

# ============================================================
# DYNAMIC MODULE LOADING (controlled by environment variable)
# ============================================================
# Set PREDICT_MODULE env var to choose predictor:
#   - "predict_nodule_spatial" → heatmap model
#   - "predict_nodule" → baseline model
# Default: predict_nodule_spatial

ALLOWED_MODULES = {
    "predict_nodule",
    "predict_nodule_spatial"
}

# Read from environment, default to spatial (heatmap) version
PREDICT_MODULE = os.getenv("PREDICT_MODULE", "predict_nodule_spatial")

# Validate
if PREDICT_MODULE not in ALLOWED_MODULES:
    raise RuntimeError(
        f"Invalid PREDICT_MODULE='{PREDICT_MODULE}'. "
        f"Allowed: {ALLOWED_MODULES}"
    )

# Import the chosen module dynamically
try:
    predictor_module = importlib.import_module(PREDICT_MODULE)
    predict_image = predictor_module.predict_image
    print(f"✓ Loaded predictor: {PREDICT_MODULE}.predict_image")
    
    if hasattr(predictor_module, 'generate_preview'):
        generate_preview = predictor_module.generate_preview
    else:
        generate_preview = None
except Exception as e:
    raise RuntimeError(f"Failed to import {PREDICT_MODULE}: {e}")

# ============================================================
# FASTAPI APP
# ============================================================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "Nodule detection API running",
        "active_predictor": PREDICT_MODULE
    }

@app.post("/preview")
async def preview(file: UploadFile = File(...)):
    """Generate preview image without classification"""
    suffix = file.filename.split('.')[-1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{suffix}") as tmp:
        shutil.copyfileobj(file.file, tmp)
        temp_path = tmp.name

    try:
        if generate_preview is not None:
            preview_image = generate_preview(temp_path)
            result = {"preview_image": preview_image}
        else:
            result = {"error": "Preview generation not available for this predictor"}
    except Exception as e:
        result = {"error": f"Preview generation failed: {str(e)}"}
    finally:
        tmp.close()
        os.remove(temp_path)

    return result

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    suffix = file.filename.split('.')[-1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{suffix}") as tmp:
        shutil.copyfileobj(file.file, tmp)
        temp_path = tmp.name

    try:
        result = predict_image(temp_path)
    finally:
        tmp.close()
        os.remove(temp_path)

    return result