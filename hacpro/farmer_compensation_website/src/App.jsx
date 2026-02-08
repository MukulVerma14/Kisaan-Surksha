import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./Pages/Signup";
import Login from "./Pages/Login";
import Homepage from "./Pages/Homepage";
import Dashboard from "./Pages/Dashboard";
import AdminLogin from "./Pages/Adminlogin";
import AdminDashboard from "./Pages/Admindashboard";
import Adminuploadimages from "./Pages/Adminuploadimages";


function App() {
  return (
    <Router>
    
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/signup" element={<Signup />} />
         <Route path="/login" element={<Login />} />
         <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<AdminLogin/>} />
      <Route path="/admindashboard" element={<AdminDashboard/>}/>
      <Route path="/adminupload" element={<Adminuploadimages/>} />
      </Routes>
    </Router>
  );
}

export default App;
