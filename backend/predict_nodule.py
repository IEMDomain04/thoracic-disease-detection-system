import os
import io
import base64
import torch
import timm
import numpy as np
from PIL import Image
import SimpleITK as sitk
from torchvision import transforms
from collections import OrderedDict

from wsod_model import WSODModel

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# MODEL_PATH = "best_wsod_resnet50.pth"
MODEL_PATH = "resnet50-baseline-nodule.pth"
CLASS_NAMES = ["No Nodule", "Nodule Detected"]

# ============================================================
# LOAD MODEL (only once)
# ============================================================
print("Loading model...")
model = timm.create_model("resnet50", pretrained=False, num_classes=2)
# base_model = timm.create_model('resnet50', pretrained=False, num_classes=2)
# model = WSODModel(base_model, num_classes=2)

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

ckpt = torch.load(MODEL_PATH, map_location=DEVICE)
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


def predict_image(image_path):
    """Run model prediction and return class + confidence."""
    img_tensor = load_mha_image(image_path).to(DEVICE)
    with torch.no_grad():
        outputs = model(img_tensor)
        probs = torch.softmax(outputs, dim=1)
        pred_class = torch.argmax(probs, dim=1).item()
        confidence = probs[0][pred_class].item()
    
    # Convert MHA to base64 PNG for browser display
    preview_image = mha_to_base64_png(image_path)
    
    return {
        "prediction": CLASS_NAMES[pred_class],
        "confidence": round(confidence, 4),
        "preview_image": preview_image
    }
