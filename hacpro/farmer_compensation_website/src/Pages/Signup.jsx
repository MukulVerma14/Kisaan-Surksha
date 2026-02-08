import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import bgImage from "../assets/farmerlogo.png";
import authimage from "../assets/adhaarlogo.png";

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [dob, setDob] = useState("");
  const [showOtpForm, setShowOtpForm] = useState(false);

 
const handleGetOtp = async (e) => {
  e.preventDefault();


  const aadhaarRegex = /^\d{12}$/;
  if (!aadhaarRegex.test(aadhaar)) {
    alert("Invalid Aadhaar! Must be exactly 12 digits.");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/auth/signup/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aadhar: aadhaar, dob }),
    });

    const data = await res.json();
    console.log("Backend response:", data); 

    if (data.otp !== undefined) {
      setShowOtpForm(true);  
      setOtp("");            
      alert(`OTP generated! ✅ Your OTP is: ${data.otp}`);
    } else {
      alert("Error: " + data.message);
    }
  } catch (error) {
    alert("Server error: " + error.message);
  }
};


  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/auth/signup/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhar: aadhaar, dob, otp }),
      });

      const data = await res.json();
      if (res.ok || res.status === 200) {
        alert("Signup successful ✅");
        navigate("/login");
      } else {
        alert("Failed ❌ " + data.message);
      }
    } catch (error) {
      alert("Server error: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
    
      <div
        className="w-[65%] bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      ></div>

      <div className="w-[35%] bg-yellow-50 flex flex-col justify-center p-8">
        <h2 className="text-3xl font-bold mb-4 text-center">Signup</h2>
        <p className="text-center text-gray-600 mb-6">
          Enter Aadhaar & DOB, then verify OTP to register.
        </p>

        {/* WhatsApp Bot Information */}
        <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-lg mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </div>
            <div className="ml-2 flex-1">
              <h3 className="text-xs font-semibold text-green-800 mb-1">
                📱 Or Register via WhatsApp
              </h3>
              <p className="text-xs text-green-700 mb-2">
                Send <strong>"hi"</strong> to <strong>+1 (415) 523-8886</strong> on WhatsApp for easy registration!
              </p>
              <a 
                href="https://wa.me/14155238886?text=hi" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded transition-colors"
              >
                <svg className="h-3.5 w-3.5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp Signup
              </a>
            </div>
          </div>
        </div>

        <img
          src={authimage}
          alt="Aadhaar"
          className="bg-cover bg-center h-[45%] mx-auto mb-6"
        />

        {!showOtpForm ? (
         
          <form onSubmit={handleGetOtp}>
            <input
              type="text"
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value)}
              placeholder="Enter Aadhaar Number"
              className="w-full px-4 py-3 border rounded-lg mb-4"
              required
            />
            <input
              type="text"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              placeholder="Enter DOB (dd.mm.yyyy)"
              className="w-full px-4 py-3 border rounded-lg mb-4"
              required
            />
            <button
              type="submit"
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 mb-4"
            >
              Get OTP
            </button>

            
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600"
            >
              Login
            </button>
          </form>
        ) : (
        
          <form onSubmit={handleVerifyOtp}>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full px-4 py-3 border rounded-lg mb-4"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Signup;
