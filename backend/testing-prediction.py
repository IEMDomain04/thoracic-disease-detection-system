import os
import torch
import timm
import numpy as np
from PIL import Image
import SimpleITK as sitk
from torchvision import transforms
from wsod_model import WSODModel

# ============================================================
# CONFIGURATION
# ============================================================
MODEL_PATH = "best_wsod_resnet50.pth"
TEST_DIR = "test"  # folder containing .mha files
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Class labels (adjust if your dataset uses different naming)
CLASS_NAMES = ["No Nodule", "Nodule Detected"]

# ============================================================
# IMAGE PREPROCESSING FUNCTION
# ============================================================
def load_mha_image(image_path):
    """Load and preprocess an .mha image into a tensor."""
    # Read .mha image
    image = sitk.ReadImage(image_path)
    img_array = sitk.GetArrayFromImage(image)
    
    # Handle different array shapes
    if len(img_array.shape) == 3:
        img_array = img_array[0]  # take first slice if 3D

    # Normalize to [0, 255]
    img_array = img_array.astype(np.float32)
    img_min, img_max = img_array.min(), img_array.max()
    if img_max > img_min:
        img_array = ((img_array - img_min) / (img_max - img_min) * 255).astype(np.uint8)
    else:
        img_array = np.zeros_like(img_array, dtype=np.uint8)

    # Convert grayscale to RGB (3 channels)
    img_array = np.stack([img_array, img_array, img_array], axis=-1)
    image = Image.fromarray(img_array)

    # Apply same transforms as during training
    transform = transforms.Compose([
        transforms.Resize((224, 224)),  # match ResNet input size
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])
    return transform(image).unsqueeze(0)  # shape: (1, 3, 224, 224)

# ============================================================
# LOAD MODEL
# ============================================================
print("Loading model...")
base_model = timm.create_model('resnet50', pretrained=False, num_classes=2)
model = WSODModel(base_model, num_classes=2)
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model = model.to(DEVICE)
model.eval()
print("Model loaded successfully.")

# ============================================================
# RUN PREDICTION ON TEST IMAGES
# ============================================================
with torch.no_grad():
    for filename in os.listdir(TEST_DIR):
        if filename.endswith(".mha"):
            file_path = os.path.join(TEST_DIR, filename)
            img_tensor = load_mha_image(file_path).to(DEVICE)

            outputs = model(img_tensor)
            probs = torch.softmax(outputs, dim=1)
            pred_class = torch.argmax(probs, dim=1).item()
            confidence = probs[0][pred_class].item()

            print(f"\n🩻 File: {filename}")
            print(f"→ Prediction: {CLASS_NAMES[pred_class]}")
            print(f"→ Confidence: {confidence:.2f}")
