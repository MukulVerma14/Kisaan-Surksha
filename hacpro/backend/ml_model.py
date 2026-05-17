import sys
import json
import math
import re
import numpy as np
import tensorflow as tf

try:
    from tensorflow.keras.models import load_model
except ModuleNotFoundError:
    from keras.models import load_model
import cv2
import base64
import os
import logging
from PIL import Image
from PIL.ExifTags import GPSTAGS

try:
    import exifread
except ImportError:
    exifread = None


os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
tf.get_logger().setLevel(logging.ERROR)

HORIZONTAL_FOV_DEGREES = 84.0
ASPECT_RATIO = 4.0 / 3.0
DEFAULT_ALTITUDE_METERS = 50.0
MAX_DAMAGE_PERCENTAGE = 100.0

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
MODEL_PATH = os.path.join(PROJECT_ROOT, "crop_damage_unet_model.keras")
INPUT_SIZE = (128, 128)
THRESHOLD = 0.1
ZERO_DAMAGE_TOL = 0.01
OVERLAY_ALPHA = 0.5

RELATIVE_ALTITUDE_PATTERN = re.compile(
    rb"RelativeAltitude[^0-9\-+.]*([0-9]+\.?[0-9]*)", re.IGNORECASE
)

model = load_model(MODEL_PATH)


def _parse_rational(value):
    if value is None:
        return None
    if hasattr(value, "numerator") and hasattr(value, "denominator"):
        denom = value.denominator or 1
        return float(value.numerator) / float(denom)
    if isinstance(value, tuple) and len(value) == 2:
        return float(value[0]) / float(value[1] or 1)
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _gps_altitude_from_pillow_exif(exif):
    if not exif:
        return None
    gps_info = exif.get(34853)
    if not gps_info:
        return None
    gps = {}
    for key, value in gps_info.items():
        tag = GPSTAGS.get(key, key)
        gps[tag] = value
    altitude = _parse_rational(gps.get("GPSAltitude"))
    if altitude is None:
        return None
    ref = gps.get("GPSAltitudeRef")
    if ref in (1, b"\x01"):
        altitude = -altitude
    return altitude


def _altitude_from_exifread(img_path):
    if exifread is None:
        return None
    with open(img_path, "rb") as image_file:
        tags = exifread.process_file(image_file, details=False)
    for key in ("EXIF Relative Altitude", "GPS GPSAltitude"):
        if key not in tags:
            continue
        value = str(tags[key])
        match = re.search(r"[-+]?\d*\.?\d+", value)
        if match:
            return float(match.group())
    return None


def _altitude_from_xmp_blob(img_path):
    with open(img_path, "rb") as image_file:
        data = image_file.read()
    match = RELATIVE_ALTITUDE_PATTERN.search(data)
    if match:
        return float(match.group(1))
    return None


def extract_relative_altitude(img_path):
    try:
        altitude = _altitude_from_xmp_blob(img_path)
        if altitude is not None and altitude > 0:
            return altitude

        altitude = _altitude_from_exifread(img_path)
        if altitude is not None and altitude > 0:
            return altitude

        with Image.open(img_path) as image:
            exif = image.getexif()
            if exif:
                altitude = _gps_altitude_from_pillow_exif(exif)
                if altitude is not None and abs(altitude) > 0:
                    return abs(altitude)
    except Exception:
        pass

    return DEFAULT_ALTITUDE_METERS


def calculate_image_coverage_area(altitude_meters):
    fov_radians = math.radians(HORIZONTAL_FOV_DEGREES)
    ground_width = 2 * altitude_meters * math.tan(fov_radians / 2)
    ground_height = ground_width / ASPECT_RATIO
    return ground_width * ground_height


def preprocess_image(img_path):
    img = cv2.imread(img_path)
    if img is None:
        raise FileNotFoundError(f"Image not found: {img_path}")
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_resized = cv2.resize(img_rgb, INPUT_SIZE)
    img_array = img_resized / 255.0
    return np.expand_dims(img_array, axis=0), img


def compute_damage_ratio(prediction):
    pred_mask = (prediction[0, :, :, 0] > THRESHOLD).astype(np.uint8)
    return float(np.sum(pred_mask) / pred_mask.size), pred_mask


def postprocess_and_save(original, prediction, save_prefix="output"):
    damage_ratio, pred_mask = compute_damage_ratio(prediction)

    mask_resized = cv2.resize(pred_mask * 255, (original.shape[1], original.shape[0]))

    if damage_ratio < ZERO_DAMAGE_TOL:
        mask_resized[:] = 0
        overlay = original.copy()
    else:
        overlay = original.copy()
        red_mask = np.zeros_like(original)
        red_mask[:, :] = (0, 0, 255)
        mask_bool = mask_resized > 127
        overlay[mask_bool] = cv2.addWeighted(
            original[mask_bool],
            1 - OVERLAY_ALPHA,
            red_mask[mask_bool],
            OVERLAY_ALPHA,
            0,
        )

    mask_path = f"{save_prefix}_mask.png"
    overlay_path = f"{save_prefix}_overlay.png"
    cv2.imwrite(mask_path, mask_resized)
    cv2.imwrite(overlay_path, overlay)

    with open(mask_path, "rb") as f:
        mask_b64 = base64.b64encode(f.read()).decode("utf-8")
    with open(overlay_path, "rb") as f:
        overlay_b64 = base64.b64encode(f.read()).decode("utf-8")

    return {
        "mask_image": f"data:image/png;base64,{mask_b64}",
        "overlay_image": f"data:image/png;base64,{overlay_b64}",
    }


def process_single_image(img_path, save_visualization=False, save_prefix="result"):
    altitude_meters = extract_relative_altitude(img_path)
    image_coverage_area = calculate_image_coverage_area(altitude_meters)

    img_array, original = preprocess_image(img_path)
    prediction = model.predict(img_array, verbose=0)
    damage_ratio, _ = compute_damage_ratio(prediction)
    absolute_damage_sq_m = damage_ratio * image_coverage_area

    result = {
        "image_path": img_path,
        "altitude_meters": round(altitude_meters, 2),
        "image_coverage_area_sq_m": round(image_coverage_area, 2),
        "damage_ratio": round(damage_ratio, 6),
        "absolute_damage_sq_m": round(absolute_damage_sq_m, 2),
    }

    if save_visualization:
        visuals = postprocess_and_save(original, prediction, save_prefix=save_prefix)
        result.update(visuals)

    return result


def aggregate_damage_assessment(image_paths, total_land_area):
    if not image_paths:
        raise ValueError("At least one image path is required")
    if total_land_area <= 0:
        raise ValueError("total_land_area must be greater than zero")

    per_image = []
    total_absolute_damage = 0.0

    for index, img_path in enumerate(image_paths):
        image_result = process_single_image(
            img_path,
            save_visualization=True,
            save_prefix=f"result_{index}",
        )
        image_result["image_index"] = index
        per_image.append(image_result)
        total_absolute_damage += image_result["absolute_damage_sq_m"]

    final_damage_percentage = (total_absolute_damage / total_land_area) * 100
    final_damage_percentage = min(final_damage_percentage, MAX_DAMAGE_PERCENTAGE)

    response = {
        "total_absolute_damage_sq_m": round(total_absolute_damage, 2),
        "final_damage_percentage": round(final_damage_percentage, 2),
        "damage_percent": round(final_damage_percentage, 2),
        "total_land_area_sq_m": round(float(total_land_area), 2),
        "images_processed": len(image_paths),
        "per_image": per_image,
    }

    if per_image:
        response["mask_image"] = per_image[0]["mask_image"]
        response["overlay_image"] = per_image[0]["overlay_image"]

    return response


def _load_request_payload():
    if not sys.stdin.isatty():
        return json.load(sys.stdin)

    if len(sys.argv) >= 3:
        return {
            "total_land_area": float(sys.argv[1]),
            "image_paths": sys.argv[2:],
        }

    raise ValueError(
        "Provide JSON via stdin with total_land_area and image_paths, "
        "or pass: python ml_model.py <total_land_area> <image1> [image2...]"
    )


if __name__ == "__main__":
    try:
        payload = _load_request_payload()
        total_land_area = float(payload["total_land_area"])
        image_paths = payload["image_paths"]
        result = aggregate_damage_assessment(image_paths, total_land_area)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
