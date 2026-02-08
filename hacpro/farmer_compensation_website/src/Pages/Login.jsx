import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import bgImage from "../assets/bgfarmerdashboard.png";
import Header from "../Components/Header";
import loginImage from "../assets/farmer.png";

const Login = () => {
  const [aadhar, setAadhar] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhar, dob }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        
        localStorage.setItem("token", data.token);

        alert("Login successful ✅");
        navigate("/dashboard"); // 
      } else {
        alert("❌ Invalid credentials");
      }
    } catch (error) {
      alert("❌ Server error: " + error.message);
    }

    setLoading(false);
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <div className="relative z-20">
        <Header />
      </div>

      <div className="absolute inset-0 bg-black/40"></div>

      <div className="flex items-center justify-center min-h-screen relative z-10">
        <div className="bg-gray-200 p-6 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-center">Log In</h2>

          <div className="flex justify-center h-40 object-contain mb-3">
            <img
              src={loginImage}
              alt="Farmer Login"
              className="w-35 h-40 bg-white/50 p-3 rounded-lg"
            />
          </div>

          <p className="text-center text-gray-700 text-xl font-sans mb-4">
            Welcome Farmer! Please enter your details to continue.
          </p>

          {/* WhatsApp Bot Information */}
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-green-800 mb-1">
                  📱 Register via WhatsApp (No Website Needed!)
                </h3>
                <p className="text-xs text-green-700 mb-2">
                  Don't have internet? Register directly on WhatsApp! Just send <strong>"hi"</strong> to our WhatsApp number and follow the simple steps.
                </p>
                <div className="flex items-center justify-between">
                  <a 
                    href="https://wa.me/14155238886?text=hi" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Chat on WhatsApp
                  </a>
                  <span className="text-xs text-green-600 font-medium">+1 (415) 523-8886</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <input
              type="text"
              value={aadhar}
              onChange={(e) => setAadhar(e.target.value)}
              placeholder="Aadhar Number"
              className="w-full px-4 py-2 border rounded-lg mb-3"
              required
            />
            <input
              type="text"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              placeholder="DOB (DD.MM.YYYY)"
              className="w-full px-4 py-2 border rounded-lg mb-3"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg text-white ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
