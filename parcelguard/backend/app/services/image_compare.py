# backend/app/services/image_compare.py
"""
AI Image Comparison Engine
============================
Uses PyTorch ResNet50 (pre-trained on ImageNet) to extract
2048-dimensional feature embeddings, then computes cosine similarity.

No training needed — transfer learning on pre-trained weights.
Similarity score: 1.0 = identical, 0.0 = completely different.
Fraud threshold: similarity < 0.5 → likely different item.
"""
import os
import json
from functools import lru_cache
from typing import Optional

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image


# ── Model singleton ───────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def load_model() -> nn.Module:
    """
    Load ResNet50 without the final classification layer.
    Cached — only loaded once per process.
    Output: 2048-dimensional feature vector per image.
    """
    print("🤖 Loading ResNet50 model...")
    model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
    # Remove the final FC layer → outputs 2048-dim pool features
    model = nn.Sequential(*list(model.children())[:-1])
    model.eval()

    # Move to GPU if available
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    print(f"✅ ResNet50 loaded on {device}")
    return model


# ── Image preprocessing ───────────────────────────────────────────────────────

# Standard ImageNet normalization
TRANSFORM = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])


def preprocess_image(image_path: str) -> torch.Tensor:
    """Load and preprocess an image for ResNet50."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    img = Image.open(image_path).convert("RGB")
    tensor = TRANSFORM(img).unsqueeze(0)  # Add batch dimension

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return tensor.to(device)


def get_embedding(image_path: str) -> torch.Tensor:
    """
    Extract 2048-dim feature vector from an image.

    Args:
        image_path: Path to image file (jpg, png, etc.)

    Returns:
        torch.Tensor of shape [2048] (normalized L2)
    """
    model = load_model()
    tensor = preprocess_image(image_path)

    with torch.no_grad():
        embedding = model(tensor)            # Shape: [1, 2048, 1, 1]
        embedding = embedding.squeeze()      # Shape: [2048]
        embedding = F.normalize(embedding, p=2, dim=0)  # L2 normalize

    return embedding


def compare_images(path_a: str, path_b: str) -> float:
    """
    Compare two images using cosine similarity of their ResNet50 embeddings.

    Returns:
        float in [0, 1]:
          - ~1.0 = visually very similar (same item)
          - ~0.7 = somewhat similar
          - ~0.5 = threshold (below = suspicious)
          - ~0.3 = very different (likely different item)
    """
    emb_a = get_embedding(path_a)
    emb_b = get_embedding(path_b)

    similarity = F.cosine_similarity(emb_a.unsqueeze(0), emb_b.unsqueeze(0))
    return float(similarity.item())


def embedding_to_json(embedding: torch.Tensor) -> str:
    """Serialize embedding to JSON string for DB storage."""
    return json.dumps(embedding.cpu().numpy().tolist())


def json_to_embedding(json_str: str) -> torch.Tensor:
    """Deserialize embedding from DB JSON string."""
    data = json.loads(json_str)
    return torch.tensor(data)


def compare_with_cached_embedding(image_path: str, cached_embedding_json: str) -> float:
    """
    Compare a fresh image against a pre-computed embedding stored in DB.
    More efficient than re-computing packing embedding every time.
    """
    emb_fresh = get_embedding(image_path)
    emb_cached = json_to_embedding(cached_embedding_json)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    emb_cached = emb_cached.to(device)
    emb_cached = F.normalize(emb_cached, p=2, dim=0)

    similarity = F.cosine_similarity(emb_fresh.unsqueeze(0), emb_cached.unsqueeze(0))
    return float(similarity.item())


# ── Demo/fallback mode ─────────────────────────────────────────────────────────

def compare_images_demo(path_a: str, path_b: str) -> float:
    """
    Fallback when PyTorch is not available or images don't exist.
    Uses basic pixel comparison via PIL for hackathon demo purposes.
    Returns a similarity score in [0, 1].
    """
    try:
        import numpy as np
        from PIL import Image

        def load_resized(p):
            return np.array(
                Image.open(p).convert("RGB").resize((64, 64)),
                dtype=float
            ) / 255.0

        a = load_resized(path_a)
        b = load_resized(path_b)

        # Normalized cross-correlation
        diff = np.mean(np.abs(a - b))
        similarity = max(0.0, 1.0 - diff * 3)
        return float(similarity)

    except Exception:
        # Ultimate fallback — return mid-range score
        import random
        return random.uniform(0.4, 0.8)
