import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Upload, FileText, LogOut } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalFarmers: 0,
    reportsProcessed: 0,
    pendingReviews: 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/stats");
        if (!res.ok) {
          const errData = await res.json();
          setError(errData.message || "Failed to fetch stats");
          console.error("Backend error:", errData.message);
          return;
        }
        const data = await res.json();
        setStats(data);
        setError(""); 
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Server error while fetching stats");
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); 
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/");
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
            onClick={() => navigate("/admindashboard")}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button
            className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-green-600"
            onClick={() => navigate("/adminupload")}
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
          Welcome, Admin 👩‍💼
        </h1>

        
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow-md p-6 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-700">
              Total Farmers
            </h2>
            <p className="text-3xl font-bold text-green-700 mt-2">
              {stats.totalFarmers}
            </p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-700">
              Reports Processed
            </h2>
            <p className="text-3xl font-bold text-green-700 mt-2">
              {stats.reportsProcessed}
            </p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-700">
              Pending Reviews
            </h2>
            <p className="text-3xl font-bold text-green-700 mt-2">
              {stats.pendingReviews}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
