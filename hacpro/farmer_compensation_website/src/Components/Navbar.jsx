import React from "react";
import logo from "../assets/logo.jpg";
import { useNavigate } from "react-router-dom";

const Header = () => {
 const navigate=useNavigate()

const onclick=()=>{
 navigate('/')
}

  return (
    
    <div className="w-full h-20 bg-gray-50 backdrop-blur-sm shadow-md py-4 px-6 flex items-center relative">
   
      <button onClick={onclick} className="absolute left-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md">
        Logout
      </button>
      <img
        src={logo}
        alt="Website Logo"
        className="mix-blend-multiply h-20 w-70 absolute left-1/2 transform -translate-x-1/2"
      />
    </div>
  );
};

export default Header;
