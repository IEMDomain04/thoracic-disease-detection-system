import torch
import torch.nn as nn

# ============================================================================
# WSOD Model with Attention Loss
# ============================================================================

class WSODModel(nn.Module):
    def __init__(self, base_model, num_classes=2):
        super(WSODModel, self).__init__()
        self.base_model = base_model
        self.num_classes = num_classes
        
        # Get the last convolutional layer for attention
        self.target_layer = base_model.layer4[-1]  # ResNet50's last conv block
        
    def forward(self, x):
        return self.base_model(x)
    
    def get_attention_map(self, x):
        """Get attention map from last conv layer"""
        # Forward pass to get activations
        features = x
        for name, module in self.base_model.named_children():
            features = module(features)
            if name == 'layer4':
                # Get attention from layer4 output
                attention = features.mean(dim=1, keepdim=True)  # Average across channels
                break
        
        # Normalize attention
        attention = F.relu(attention)
        attention = attention - attention.min()
        attention = attention / (attention.max() + 1e-8)
        
        return attention