import os
import io
import base64
import torch
import torch.nn.functional as F
import timm
import numpy as np
from PIL import Image
import SimpleITK as sitk
from torchvision import transforms
from collections import OrderedDict
import cv2

# --- NEW IMPORTS FOR NODE21 PREPROCESSING ---
import opencxr
from opencxr.utils.file_io import read_file

from wsod_model import WSODModel

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_PATH = "best_wsod_resnet50.pth"
CLASS_NAMES = ["No Nodule", "Nodule Detected"]

# ============================================================
# LOAD PREPROCESSING ALGORITHM (NODE21 STANDARD)
# ============================================================
try:
    cxr_std_algorithm = opencxr.load(opencxr.algorithms.cxr_standardize)
except Exception as e:
    print(f"Error loading opencxr: {e}")
    raise e

# ============================================================
# LOAD MODEL
# ============================================================
print("Loading classification model...")
base_model = timm.create_model('resnet50', pretrained=False, num_classes=2)
model = WSODModel(base_model, num_classes=2)

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

ckpt = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=False)
if isinstance(ckpt, dict):
    state_dict = ckpt.get("model_state_dict", ckpt.get("state_dict", ckpt))
else:
    state_dict = ckpt

new_state_dict = OrderedDict()
for k, v in state_dict.items():
    new_key = k[len("module."):] if k.startswith("module.") else k
    new_state_dict[new_key] = v

model.load_state_dict(new_state_dict, strict=False)
model = model.to(DEVICE)
model.eval()
print("Model loaded successfully.")

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def preprocess_node21_style(image_path):
    """
    Applies NODE21 standardization and fixes orientation issues.
    For .mha/.mhd files (already preprocessed), just read them.
    For other formats, apply full preprocessing pipeline.
    
    This handles the domain shift problem:
    - NODE21 .mha files are already preprocessed (cropped, normalized, 1024x1024)
    - Other formats (DICOM, PNG, JPG, etc.) need preprocessing to match training data
    """
    try:
        # 1. Check file extension first
        file_extension = os.path.splitext(image_path)[1].lower()
        
        # 2. Read file based on type
        if file_extension in ['.mha', '.mhd']:
            # Already preprocessed - use opencxr to read
            img_np, spacing, _ = read_file(image_path)
            std_img = img_np
            std_img = np.rot90(std_img, k=-1)
        elif file_extension in ['.dcm', '.dicom']:
            # DICOM files - opencxr can handle these
            img_np, spacing, _ = read_file(image_path)
            
            std_img, new_spacing, size_changes = cxr_std_algorithm.run(img_np, spacing)
            
        elif file_extension in ['.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff']:
            # Image files - read with PIL/OpenCV, then preprocess
            # Read image
            img_pil = Image.open(image_path).convert('L')  # Convert to grayscale
            img_np = np.array(img_pil)
            spacing = (0.143, 0.143)
            
            try:
                std_img, new_spacing, size_changes = cxr_std_algorithm.run(img_np, spacing)
            except Exception as preproc_error:
                print(f"WARNING: OpenCXR preprocessing failed: {str(preproc_error)}")
                print(f"  Using fallback: simple resize to 1024x1024")
                # Fallback: simple resize
                img_pil_resized = img_pil.resize((1024, 1024), Image.Resampling.LANCZOS)
                std_img = np.array(img_pil_resized)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}. "
                           f"Supported formats: .mha, .mhd, .dcm, .jpg, .jpeg, .png, .bmp, .tif, .tiff")
        
        return std_img
        
    except Exception as e:
        print(f"FATAL ERROR in preprocess_node21_style: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

def numpy_to_base64(img_np):
    """Convert numpy array (standardized image) to base64 PNG."""
    # Ensure image is in 0-255 uint8 format
    img_array = img_np.astype(np.float32)
    img_min, img_max = img_array.min(), img_array.max()
    
    if img_max > img_min:
        img_array = ((img_array - img_min) / (img_max - img_min) * 255).astype(np.uint8)
    else:
        img_array = img_array.astype(np.uint8)
        
    pil_img = Image.fromarray(img_array, mode='L')
    
    buf = io.BytesIO()
    pil_img.save(buf, format='PNG')
    buf.seek(0)
    
    img_base64 = base64.b64encode(buf.getvalue()).decode('ascii')
    return f"data:image/png;base64,{img_base64}"

def prepare_tensor_for_model(std_img_np):
    """
    Convert the standardized numpy image to a tensor compatible with ResNet50.
    """
    # Ensure uint8 for PIL
    img_array = std_img_np.astype(np.float32)
    img_min, img_max = img_array.min(), img_array.max()
    if img_max > img_min:
        img_array = ((img_array - img_min) / (img_max - img_min) * 255).astype(np.uint8)
    else:
        img_array = img_array.astype(np.uint8)

    # Convert to RGB (ResNet expects 3 channels)
    # Even though it's grayscale, we replicate channels
    img_pil = Image.fromarray(img_array).convert('RGB')

    # Standard ImageNet transforms required by the model
    transform = transforms.Compose([
        transforms.Resize((224, 224)),  # Resize the 1024x1024 crop to model input
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])
    
    return transform(img_pil).unsqueeze(0)

def generate_heatmap_overlay_from_data(img_np, attention_map):
    """
    Generate heatmap overlay using the standardized image data directly.
    """
    # Normalize image to 0-255 uint8
    img_array = img_np.astype(np.float32)
    img_min, img_max = img_array.min(), img_array.max()
    if img_max > img_min:
        img_array = ((img_array - img_min) / (img_max - img_min) * 255).astype(np.uint8)
    else:
        img_array = img_array.astype(np.uint8)
        
    # Convert grayscale to RGB for overlay
    img_rgb = cv2.cvtColor(img_array, cv2.COLOR_GRAY2RGB)
    
    # Get dimensions of the preprocessed image
    original_height, original_width = img_rgb.shape[:2]
    
    # Resize attention map to match the preprocessed image size
    attention_resized = cv2.resize(attention_map, (original_width, original_height), 
                                   interpolation=cv2.INTER_LINEAR)
    
    # Normalize attention to 0-255
    attention_norm = (attention_resized * 255).astype(np.uint8)
    
    # Apply colormap
    heatmap = cv2.applyColorMap(attention_norm, cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
    
    # Blend
    overlay = cv2.addWeighted(img_rgb, 0.6, heatmap, 0.4, 0)
    
    # Convert to base64
    pil_img = Image.fromarray(overlay)
    buf = io.BytesIO()
    pil_img.save(buf, format='PNG')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.getvalue()).decode('ascii')
    
    return f"data:image/png;base64,{img_base64}"

def get_attention_from_model(model, img_tensor):
    """Extract attention map from WSODModel."""
    if not hasattr(model, 'get_attention_map'):
        # Fallback: use feature maps from layer4
        features = img_tensor
        for name, module in model.base_model.named_children():
            features = module(features)
            if name == 'layer4':
                attention = features.mean(dim=1, keepdim=True)
                attention = F.relu(attention)
                break
    else:
        attention = model.get_attention_map(img_tensor)
    
    attention_np = attention.detach().cpu().squeeze().numpy()
    
    att_min, att_max = attention_np.min(), attention_np.max()
    if att_max > att_min:
        attention_np = (attention_np - att_min) / (att_max - att_min)
    else:
        attention_np = np.zeros_like(attention_np)
    
    return attention_np

def predict_image(image_path):
    """Run model prediction with NODE21 preprocessing."""
    # 1. PREPROCESSING (Domain Shift Fix)
    # .mha files are already preprocessed, other formats need preprocessing
    try:
        std_img_np = preprocess_node21_style(image_path)
    except Exception as e:
        error_msg = f"Preprocessing failed: {str(e)}"
        print(f"{error_msg}")
        import traceback
        traceback.print_exc()
        return {"error": error_msg}

    # 2. PREPARE TENSOR
    try:
        img_tensor = prepare_tensor_for_model(std_img_np).to(DEVICE)
    except Exception as e:
        error_msg = f"Tensor preparation failed: {str(e)}"
        print(f"{error_msg}")
        import traceback
        traceback.print_exc()
        return {"error": error_msg}
    
    # 3. INFERENCE
    try:
        with torch.no_grad():
            outputs = model(img_tensor)
            probs = torch.softmax(outputs, dim=1)
            pred_class = torch.argmax(probs, dim=1).item()
            confidence = probs[0][pred_class].item()
            
            # Generate attention map
            attention_map = get_attention_from_model(model, img_tensor)
    except Exception as e:
        error_msg = f"Model inference failed: {str(e)}"
        print(f"{error_msg}")
        import traceback
        traceback.print_exc()
        return {"error": error_msg}
    
    # 4. VISUALIZATION
    try:
        # We display the *Standardized* image, not the raw one.
        # If we displayed the raw one, the heatmap (which is based on the crop)
        # would not line up with the anatomy.
        preview_image = numpy_to_base64(std_img_np)
        
        # Generate heatmap overlay on the standardized image
        heatmap_image = generate_heatmap_overlay_from_data(std_img_np, attention_map)
    except Exception as e:
        error_msg = f"Visualization failed: {str(e)}"
        print(f"{error_msg}")
        import traceback
        traceback.print_exc()
        return {"error": error_msg}
    
    return {
        "prediction": CLASS_NAMES[pred_class],
        "confidence": round(confidence, 4),
        "preview_image": heatmap_image, 
        "original_image": preview_image,
        "has_heatmap": True
    }