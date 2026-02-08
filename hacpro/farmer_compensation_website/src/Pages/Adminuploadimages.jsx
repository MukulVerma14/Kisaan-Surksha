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

    const formData = new FormData();
    formData.append("image", images[0]); 

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
  const midLine = pageWidth / 2; 

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
  doc.text(`Damage Percentage: ${prediction.damage_percent}%`, leftX, y);

  const rightX = midLine + 10;
  let imgY = 40;
  const imgWidth = pageWidth / 2 - 30; 
  const imgHeight = 68; 

  const toBase64 = async (url) => {
    const blob = await fetch(url).then(res => res.blob());
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  const addImageWithLabel = async (label, imgUrl) => {
    if (!imgUrl) return;
    const imgData = await toBase64(imgUrl);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(label, rightX, imgY);
    imgY += 6;

    doc.addImage(imgData, "JPEG", rightX, imgY, imgWidth, imgHeight);
    imgY += imgHeight + 15;
  };

  if (images.length > 0) {
    await addImageWithLabel("Original Image", URL.createObjectURL(images[0]));
  }
  await addImageWithLabel("Overlay Image", prediction.overlay_image);
  await addImageWithLabel("Masked Image", prediction.mask_image);

 
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
            <p><strong>Damage Percent:</strong> {prediction.damage_percent}%</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <img
                src={prediction.mask_image}
                alt="Mask"
                className="rounded-lg shadow-md"
              />
              <img
                src={prediction.overlay_image}
                alt="Overlay"
                className="rounded-lg shadow-md"
              />
            </div>
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
