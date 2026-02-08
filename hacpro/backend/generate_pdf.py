import os
import sys
import json
from pymongo import MongoClient
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet



MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/kisaansuraksha")
PDF_OUTPUT_DIR = os.path.join(os.getcwd(), "uploads", "reports")
os.makedirs(PDF_OUTPUT_DIR, exist_ok=True)


def fetch_farmer_details(aadhar: str):
    client = MongoClient(MONGO_URI)
    db = client.get_default_database()
    farmer = db.farmers.find_one({"aadhar": aadhar}) 
    if not farmer:
        raise ValueError(f"No farmer found for Aadhar: {aadhar}")
    return {
        "name": farmer.get("name", ""),
        "state": farmer.get("state", ""),
        "city": farmer.get("city", ""),
        "land_reg": farmer.get("landReg", ""),
        "cause": farmer.get("reason", "")
    }


def create_damage_report(output_path, farmer_info, orig_img, mask_img, overlay_img, damage_percent):
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(output_path, pagesize=landscape(A4))
    story = []

    # Title
    story.append(Paragraph("<b>Kisaan Suraksha – Crop Damage Report</b>", styles["Title"]))
    story.append(Spacer(1, 12))

    # Farmer details
    details_html = f"""
        <b>Name:</b> {farmer_info['name']}<br/>
        <b>State:</b> {farmer_info['state']}<br/>
        <b>City:</b> {farmer_info['city']}<br/>
        <b>Land Reg. No:</b> {farmer_info['land_reg']}<br/>
        <b>Cause of Damage:</b> {farmer_info['cause']}<br/>
        <b>Predicted Damage:</b> {damage_percent:.2f} %
    """
    story.append(Paragraph(details_html, styles["Normal"]))
    story.append(Spacer(1, 20))

    # Three side-by-side images
    img_w, img_h = 180, 180
    story.append(
        Table(
            [[Image(orig_img, img_w, img_h),
              Image(mask_img, img_w, img_h),
              Image(overlay_img, img_w, img_h)]],
            hAlign='CENTER'
        )
    )

    doc.build(story)
    return output_path


def main():
    if len(sys.argv) != 6:
        print(json.dumps({"error": "Usage: python generate_pdf.py <aadhar> <orig> <mask> <overlay> <damage_percent>"}))
        sys.exit(1)

    aadhar, orig, mask, overlay, damage_str = sys.argv[1:]
    damage_percent = float(damage_str)

    try:
        farmer_info = fetch_farmer_details(aadhar)
        pdf_path = os.path.join(PDF_OUTPUT_DIR, f"{aadhar}_report.pdf")
        create_damage_report(pdf_path, farmer_info, orig, mask, overlay, damage_percent)
        print(json.dumps({"pdf_path": pdf_path}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
