import sys
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import cv2
import base64
import os
import logging


os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
tf.get_logger().setLevel(logging.ERROR)

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Go up two levels from backend/ to reach hackpro root, then find the model
# backend -> hacpro -> hackpro root
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
MODEL_PATH = os.path.join(PROJECT_ROOT, "crop_damage_unet_model.keras")
INPUT_SIZE = (128, 128)
THRESHOLD = 0.1
ZERO_DAMAGE_TOL = 0.01
OVERLAY_ALPHA = 0.5

model = load_model(MODEL_PATH)


def preprocess_image(img_path):
    img = cv2.imread(img_path)
    if img is None:
        raise FileNotFoundError(f"Image not found: {img_path}")
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_resized = cv2.resize(img_rgb, INPUT_SIZE)
    img_array = img_resized / 255.0
    return np.expand_dims(img_array, axis=0), img

def postprocess_and_save(original, prediction, save_prefix="output"):
  
    pred_mask = (prediction[0, :, :, 0] > THRESHOLD).astype(np.uint8)

    damage_ratio = np.sum(pred_mask) / pred_mask.size

    mask_resized = cv2.resize(pred_mask * 255, (original.shape[1], original.shape[0]))

    if damage_ratio < ZERO_DAMAGE_TOL:
        damage_percent = 0.0

        mask_resized[:] = 0

        overlay = original.copy()
    else:
        damage_percent = damage_ratio * 100

        overlay = original.copy()
        red_mask = np.zeros_like(original)
        red_mask[:, :] = (0, 0, 255)  
        mask_bool = mask_resized > 127
        overlay[mask_bool] = cv2.addWeighted(original[mask_bool], 1 - OVERLAY_ALPHA,
                                             red_mask[mask_bool], OVERLAY_ALPHA, 0)

    mask_path = f"{save_prefix}_mask.png"
    overlay_path = f"{save_prefix}_overlay.png"
    cv2.imwrite(mask_path, mask_resized)
    cv2.imwrite(overlay_path, overlay)

    with open(mask_path, "rb") as f:
        mask_b64 = base64.b64encode(f.read()).decode("utf-8")
    with open(overlay_path, "rb") as f:
        overlay_b64 = base64.b64encode(f.read()).decode("utf-8")

    return {
        "damage_percent": round(damage_percent, 2),
        "mask_image": f"data:image/png;base64,{mask_b64}",
        "overlay_image": f"data:image/png;base64,{overlay_b64}"
    }



if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Please provide an image path"}))
        sys.exit(1)

    img_path = sys.argv[1]

    try:
        img_array, original = preprocess_image(img_path)
        prediction = model.predict(img_array, verbose=0)
        result = postprocess_and_save(original, prediction, save_prefix="result")
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
