import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Login Successful ✅");
        localStorage.setItem("adminToken", data.token);
        navigate("/admindashboard"); 
      } else {
        alert(data.message || "Invalid credentials ❌");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Server error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-96">
        <h2 className="text-2xl font-bold text-center text-green-700 mb-6">
          Admin Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Admin ID</label>
            <input
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              required
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter Admin ID"
            />
          </div>
          <div>
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter Password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
