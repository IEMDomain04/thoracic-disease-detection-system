import os
import io
import base64
import torch
import torch.nn.functional as F
import timm
import numpy as np
from PIL import Image, ImageDraw
import SimpleITK as sitk
from torchvision import transforms
from collections import OrderedDict
import cv2

from wsod_model import WSODModel

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_PATH = "best_wsod_resnet50.pth"
# MODEL_PATH = "resnet50-baseline-nodule.pth"
CLASS_NAMES = ["No Nodule", "Nodule Detected"]

# ============================================================
# LOAD MODEL (only once)
# ============================================================
print("Loading model...")
# model = timm.create_model("resnet50", pretrained=False, num_classes=2)
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
# HELPER FUNCTION
# ============================================================
def mha_to_base64_png(image_path):
    """Convert .mha image to base64-encoded PNG data URL for browser display."""
    image = sitk.ReadImage(image_path)
    img_array = sitk.GetArrayFromImage(image)
    
    # Take first slice if 3D
    if len(img_array.shape) == 3:
        img_array = img_array[0]
    
    # Normalize to 0-255
    img_array = img_array.astype(np.float32)
    img_min, img_max = img_array.min(), img_array.max()
    if img_max > img_min:
        img_array = ((img_array - img_min) / (img_max - img_min) * 255).astype(np.uint8)
    else:
        img_array = np.zeros_like(img_array, dtype=np.uint8)
    
    # Convert to PIL Image and save as PNG to bytes
    pil_img = Image.fromarray(img_array, mode='L')
    buf = io.BytesIO()
    pil_img.save(buf, format='PNG')
    buf.seek(0)
    
    # Encode to base64
    img_base64 = base64.b64encode(buf.getvalue()).decode('ascii')
    return f"data:image/png;base64,{img_base64}"


def load_mha_image(image_path):
    """Load and preprocess .mha image into a tensor."""
    image = sitk.ReadImage(image_path)
    img_array = sitk.GetArrayFromImage(image)

    if len(img_array.shape) == 3:
        img_array = img_array[0]

    img_array = img_array.astype(np.float32)
    img_min, img_max = img_array.min(), img_array.max()
    if img_max > img_min:
        img_array = ((img_array - img_min) / (img_max - img_min) * 255).astype(np.uint8)
    else:
        img_array = np.zeros_like(img_array, dtype=np.uint8)

    img_array = np.stack([img_array, img_array, img_array], axis=-1)
    image = Image.fromarray(img_array)

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])
    return transform(image).unsqueeze(0)


def generate_heatmap_overlay(image_path, attention_map):
    """
    Generate heatmap overlay on the original image.
    
    Args:
        image_path: Path to the original .mha image
        attention_map: 2D numpy array (HxW) with attention values [0-1]
    
    Returns:
        Base64 encoded PNG with heatmap overlay
    """
    # Load original image
    image = sitk.ReadImage(image_path)
    img_array = sitk.GetArrayFromImage(image)
    
    if len(img_array.shape) == 3:
        img_array = img_array[0]
    
    # Normalize original image to 0-255
    img_array = img_array.astype(np.float32)
    img_min, img_max = img_array.min(), img_array.max()
    if img_max > img_min:
        img_array = ((img_array - img_min) / (img_max - img_min) * 255).astype(np.uint8)
    else:
        img_array = np.zeros_like(img_array, dtype=np.uint8)
    
    # Convert grayscale to RGB
    img_rgb = cv2.cvtColor(img_array, cv2.COLOR_GRAY2RGB)
    
    # Resize attention map to match original image size
    attention_resized = cv2.resize(attention_map, (img_array.shape[1], img_array.shape[0]), 
                                   interpolation=cv2.INTER_LINEAR)
    
    # Normalize attention to 0-255
    attention_norm = (attention_resized * 255).astype(np.uint8)
    
    # Apply colormap (JET: blue=low, red=high attention)
    heatmap = cv2.applyColorMap(attention_norm, cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
    
    # Blend original image with heatmap (70% original, 30% heatmap for visibility)
    overlay = cv2.addWeighted(img_rgb, 0.6, heatmap, 0.4, 0)
    
    # Convert to PIL Image
    pil_img = Image.fromarray(overlay)
    
    # Save to base64
    buf = io.BytesIO()
    pil_img.save(buf, format='PNG')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.getvalue()).decode('ascii')
    
    return f"data:image/png;base64,{img_base64}"


def get_attention_from_model(model, img_tensor):
    """
    Extract attention map from WSODModel.
    
    Args:
        model: WSODModel instance
        img_tensor: Input tensor (1, 3, 224, 224)
    
    Returns:
        2D numpy array with normalized attention values [0-1]
    """
    if not hasattr(model, 'get_attention_map'):
        # Fallback: use feature maps from layer4
        features = img_tensor
        for name, module in model.base_model.named_children():
            features = module(features)
            if name == 'layer4':
                # Average across channels to get spatial attention
                attention = features.mean(dim=1, keepdim=True)
                attention = F.relu(attention)
                break
    else:
        # Use model's built-in attention method
        attention = model.get_attention_map(img_tensor)
    
    # Convert to numpy and normalize
    attention_np = attention.detach().cpu().squeeze().numpy()
    
    # Normalize to [0, 1]
    att_min, att_max = attention_np.min(), attention_np.max()
    if att_max > att_min:
        attention_np = (attention_np - att_min) / (att_max - att_min)
    else:
        attention_np = np.zeros_like(attention_np)
    
    return attention_np


def predict_image(image_path):
    """Run model prediction and return class + confidence + heatmap."""
    img_tensor = load_mha_image(image_path).to(DEVICE)
    
    with torch.no_grad():
        outputs = model(img_tensor)
        probs = torch.softmax(outputs, dim=1)
        pred_class = torch.argmax(probs, dim=1).item()
        confidence = probs[0][pred_class].item()
        
        # Generate attention map for heatmap visualization
        attention_map = get_attention_from_model(model, img_tensor)
    
    # Convert MHA to base64 PNG for browser display (original)
    preview_image = mha_to_base64_png(image_path)
    
    # Generate heatmap overlay image
    heatmap_image = generate_heatmap_overlay(image_path, attention_map)
    
    return {
        "prediction": CLASS_NAMES[pred_class],
        "confidence": round(confidence, 4),
        "preview_image": heatmap_image,  # Show heatmap as the main preview
        "original_image": preview_image,  # Keep original for reference
        "has_heatmap": True
    }
