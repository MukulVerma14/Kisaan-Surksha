import React from 'react';
import logo from '../assets/logo.jpg'; 


const Header = () => {
  return (
    <div className="w-full h-20 bg-gray-50 backdrop-blur-sm shadow-md py-4 px-6 flex items-center">
      <img src={logo} alt="Website Logo" className="mix-blend-multiply h-20 w-70 relative ml-[43%]" />
     
    </div>
  );
};

export default Header;
