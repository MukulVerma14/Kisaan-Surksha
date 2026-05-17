import React, { useState,useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Upload, FileText, LogOut, Search } from "lucide-react";
import axios from "axios";
import { jsPDF } from "jspdf"; 

const AdminUploadImage = () => {
  const navigate = useNavigate();

  const [aadhar, setAadhar] = useState("");
  const [images, setImages] = useState([]);
  const [farmerData, setFarmerData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [prediction, setPrediction] = useState(null); 
  const [totalLandArea, setTotalLandArea] = useState("");
  const [loading, setLoading] = useState(false);

    useEffect(() => {
    if (loading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [loading]);
 
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/");
  };

  const handleSearch = async () => {
    if (!aadhar) {
      alert("Please enter Aadhaar number");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/admin/farmer/${aadhar}`);
      const data = await res.json();

      if (res.ok) {
        setFarmerData(data);
      } else {
        alert(data.message || "Farmer not found");
        setFarmerData(null);
      }
    } catch (error) {
      console.error("Error fetching farmer:", error);
      alert("Server error");
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      alert("You can upload a maximum of 5 images.");
      return;
    }
    setImages([...images, ...files]);
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handlePrediction = async () => {
    if (images.length === 0) {
      alert("Please upload at least one drone image.");
      return;
    }

    const landArea = parseFloat(totalLandArea);
    if (!Number.isFinite(landArea) || landArea <= 0) {
      alert("Please enter the farmer's total land area in square meters.");
      return;
    }

    const formData = new FormData();
    formData.append("total_land_area", String(landArea));
    images.forEach((file) => formData.append("images", file));

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/admin/run-ml", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPrediction(res.data); 
    } catch (err) {
      console.error("Prediction Error:", err);
      alert("Error running ML model");
    } finally {
      setLoading(false);
    }
  };

const handleGeneratePDF = async () => {
  if (!farmerData) {
    alert("Please fetch farmer details first.");
    return;
  }
  if (!prediction) {
    alert("Run the prediction before generating the PDF.");
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();


  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Farmer Damage Report", pageWidth / 2, 20, { align: "center" });

  const leftX = 15;
  let y = 40;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Farmer Details:", leftX, y);
  y += 10;

  const addDetail = (label, value) => {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, leftX, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${value}`, leftX + 50, y);
    y += 8;
  };

  addDetail("Aadhar", aadhar);
  addDetail("Name", farmerData.name);
  addDetail("City", farmerData.city);
  addDetail("State", farmerData.state);
  addDetail("Land Reg. No", farmerData.landReg);
  addDetail("Reason", farmerData.reason);

  y += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Prediction Result:", leftX, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Total Damaged Area: ${prediction.total_absolute_damage_sq_m} sq m`,
    leftX,
    y
  );
  y += 8;
  doc.text(
    `Damage Percentage: ${prediction.final_damage_percentage ?? prediction.damage_percent}%`,
    leftX,
    y
  );
  y += 8;
  doc.text(`Images Processed: ${prediction.images_processed ?? images.length}`, leftX, y);

  const perImageResults = prediction.per_image || [];
  const imgWidth = (pageWidth - 40) / 3;
  const imgHeight = 55;
  const marginX = 15;

  const toBase64 = async (url) => {
    const blob = await fetch(url).then((res) => res.blob());
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  const addImageAt = async (label, imgUrl, x, yPos) => {
    if (!imgUrl) return;
    const imgData = await toBase64(imgUrl);
    const format = String(imgData).includes("image/png") ? "PNG" : "JPEG";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(label, x, yPos);
    doc.addImage(imgData, format, x, yPos + 5, imgWidth, imgHeight);
  };

  for (let i = 0; i < perImageResults.length; i++) {
    doc.addPage();
    let rowY = 25;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Drone Image ${i + 1} of ${perImageResults.length}`, marginX, rowY);
    rowY += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Damaged area: ${perImageResults[i].absolute_damage_sq_m} sq m | Altitude: ${perImageResults[i].altitude_meters} m`,
      marginX,
      rowY
    );
    rowY += 12;

    const originalUrl =
      images[i] ? URL.createObjectURL(images[i]) : null;

    await addImageAt("Original", originalUrl, marginX, rowY);
    await addImageAt(
      "Overlay",
      perImageResults[i].overlay_image,
      marginX + imgWidth + 5,
      rowY
    );
    await addImageAt(
      "Mask",
      perImageResults[i].mask_image,
      marginX + (imgWidth + 5) * 2,
      rowY
    );

    if (originalUrl) URL.revokeObjectURL(originalUrl);
  }

  doc.save(`Farmer_Report_${aadhar}.pdf`);

 try {
    const token = localStorage.getItem("adminToken"); 
    await fetch("http://localhost:5000/api/admin/mark-pdf-generated", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, 
      },
      body: JSON.stringify({ aadhar }),
    });
    console.log("Marked PDF as generated in backend");
  } catch (err) {
    console.error("Error marking PDF generated:", err);
  }
};





  return (
    <div className="flex min-h-screen bg-gray-100">
      
      <aside className="w-64 bg-green-700 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-green-600">
          Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-4">
          <button
            className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-green-600"
            onClick={() => navigate("/Admindashboard")}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button
            className="flex items-center gap-3 w-full text-left p-2 rounded-lg bg-green-800"
            onClick={() => navigate("/Adminupload")}
          >
            <Upload size={20} /> Upload Drone Images
          </button>
          
        </nav>
        <div className="p-4 border-t border-green-600">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-red-600 bg-red-500"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-green-700 mb-6">
          Upload Drone Images
        </h1>

        
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <label className="block text-lg font-medium mb-2">
            Enter Farmer Aadhaar Number
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              value={aadhar}
              onChange={(e) => setAadhar(e.target.value)}
              placeholder="Enter Aadhaar number"
              className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              <Search size={18} /> Fetch Data
            </button>
          </div>
        </div>

        
        {farmerData && (
          <div className="bg-white p-6 rounded-xl shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Farmer Details</h2>
            <p><strong>Name:</strong> {farmerData.name}</p>
            <p><strong>City:</strong> {farmerData.city}</p>
            <p><strong>State:</strong> {farmerData.state}</p>
            <p><strong>Land Reg. No.:</strong> {farmerData.landReg}</p>
            <p><strong>Reason:</strong> {farmerData.reason}</p>

            {farmerData.images && farmerData.images.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Farmer Uploaded Images:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {farmerData.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`farmer-img-${idx}`}
                      className="w-full h-40 object-cover rounded-lg shadow-md cursor-pointer"
                      onClick={() => setSelectedImage(img)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <img
              src={selectedImage}
              alt="full-view"
              className="max-w-5xl max-h-[90vh] rounded-lg shadow-lg"
            />
            <button
              className="absolute top-6 right-6 text-white text-3xl font-bold"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
          </div>
        )}

        
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <label className="block text-lg font-medium mb-2">
            Total Land Area (sq meters)
          </label>
          <input
            type="number"
            min="1"
            step="any"
            value={totalLandArea}
            onChange={(e) => setTotalLandArea(e.target.value)}
            placeholder="e.g. 10000"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400 mb-6"
          />
          <label className="block text-lg font-medium mb-2">
            Upload Drone Images (Max 5)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="w-full p-2 border rounded-lg"
          />
          <div className="flex gap-4 mt-4 flex-wrap">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative w-28 h-28 rounded-lg overflow-hidden shadow-md"
              >
                <img
                  src={URL.createObjectURL(img)}
                  alt="drone"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs hover:bg-red-600"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>

       
        {prediction && (
          <div className="bg-white p-6 rounded-xl shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Prediction Results</h2>
            <p><strong>Total Damaged Area:</strong> {prediction.total_absolute_damage_sq_m} sq m</p>
            <p><strong>Damage Percent:</strong> {prediction.final_damage_percentage ?? prediction.damage_percent}%</p>
            <p><strong>Images Processed:</strong> {prediction.images_processed}</p>

            {(prediction.per_image || []).map((item, idx) => (
              <div key={idx} className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold mb-2">Drone Image {idx + 1}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Damaged: {item.absolute_damage_sq_m} sq m · Coverage:{" "}
                  {item.image_coverage_area_sq_m} sq m · Altitude: {item.altitude_meters} m
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {images[idx] && (
                    <div>
                      <p className="text-sm font-medium mb-1">Original</p>
                      <img
                        src={URL.createObjectURL(images[idx])}
                        alt={`Original ${idx + 1}`}
                        className="rounded-lg shadow-md w-full"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium mb-1">Overlay</p>
                    <img
                      src={item.overlay_image}
                      alt={`Overlay ${idx + 1}`}
                      className="rounded-lg shadow-md w-full"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Mask</p>
                    <img
                      src={item.mask_image}
                      alt={`Mask ${idx + 1}`}
                      className="rounded-lg shadow-md w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}



        <div className="flex gap-6">
          <button
            onClick={handlePrediction}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Processing..." : "Run Prediction"}
          </button>
          <button
            onClick={handleGeneratePDF}
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            Generate PDF
          </button>
        </div>
      </main>
  
   {loading && (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm">
    <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-white text-2xl mt-4 font-semibold">Running Prediction...</p>
  </div>
)}
    </div>
  );
};

export default AdminUploadImage;
