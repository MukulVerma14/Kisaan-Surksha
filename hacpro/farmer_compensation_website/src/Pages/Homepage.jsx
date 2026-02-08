import React from 'react';
import { useNavigate } from 'react-router-dom';
import backgroundImage from '../assets/background.png';
import adminImage from '../assets/admin.png';
import farmerImage from '../assets/farmer.png';
import Header from '../Components/Header';

const Homepage = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Header />


      <div className="flex-grow flex flex-col items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 backdrop-blur-md bg-white/30 p-12 rounded-2xl shadow-2xl mt-10 z-10">
          <div
            onClick={() => navigate("/signup")}
            className="bg-white bg-opacity-90 rounded-xl p-6 text-center shadow-md cursor-pointer transform transition duration-300 hover:shadow-2xl hover:scale-105"
          >
            <img
              src={farmerImage}
              alt="Farmer"
              className="w-36 h-36 mx-auto object-contain mb-4"
            />
            <h2 className="text-2xl font-bold mb-2 text-green-800">Farmer</h2>
            <p className="text-gray-600">Signup & Upload Crop Damage</p>
          </div>

          <div
            onClick={() => navigate("/admin")}
            className="bg-white bg-opacity-90 rounded-xl p-6 text-center shadow-md cursor-pointer transform transition duration-300 hover:shadow-2xl hover:scale-105"
          >
            <img
              src={adminImage}
              alt="Admin"
              className="w-36 h-36 mx-auto object-contain mb-4"
            />
            <h2 className="text-2xl font-bold mb-2 text-blue-800">Admin</h2>
            <p className="text-gray-600">Login to Verify Submissions</p>
          </div>
        </div>
      </div>

   
      <div className="w-full  bg-white bg-opacity-50 text-gray-800 py-4 px-6 md:px-20 mt-auto">
        <h3 className="text-3xl font-semibold mb-2">About the Platform</h3>
        <p className=" text-xl leading-relaxed font-italics">
          This platform helps peri urban farmers and form a bridge between rural administration and urban authority so that people doing farming in urban and rural region can apply for government compensation after crop damage
          by uploading photos or videos of damaged fields along with relevant land and personal details.
          Admins can verify submissions to ensure a transparent and efficient process.
        </p>
      </div>
    </div>
  );
};

export default Homepage;
