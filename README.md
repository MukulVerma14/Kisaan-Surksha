# 🌾 KisaanSuraksha - Farmer Compensation Management System

A comprehensive digital platform designed to help Indian farmers register for crop damage compensation, manage their profiles, and receive AI-powered agricultural assistance. The system includes a web application, WhatsApp bot, and ML-powered crop damage assessment.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [ML Model](#ml-model)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

KisaanSuraksha (Farmer Protection) is a multi-platform solution that enables farmers to:

- **Register for crop damage compensation** through web portal or WhatsApp
- **Upload crop images** for AI-powered damage assessment
- **Track compensation status** and receive updates
- **Get AI-powered agricultural guidance** in Hinglish (Hindi-English mix)
- **Generate compensation reports** with automated PDF generation

The system consists of three main components:

1. **Web Application** - React-based frontend for farmers and admins
2. **Backend API** - Express.js server with ML integration
3. **WhatsApp Bot** - Conversational AI bot for farmer registration and assistance

## ✨ Features

### 🌐 Web Application Features

- **Farmer Portal**:
  - User registration and authentication
  - Profile management (Aadhaar, DOB, land registration, location)
  - Crop damage image upload
  - View compensation status
  - Download compensation reports (PDF)

- **Admin Dashboard**:
  - View all registered farmers
  - Upload and process drone images
  - Run ML model for crop damage assessment
  - Generate compensation reports
  - View statistics (total farmers, processed reports, pending reviews)

### 🤖 WhatsApp Bot Features

- **Multi-step Registration**: Complete registration through WhatsApp (including **total farm area in sq meters**)
- **AI-Powered Chat**: Groq LLM for agricultural Q&A in English, Hindi, or Telugu
- **Voice Notes**: Sarvam AI speech-to-text, then Groq-generated replies
- **Session Management**: Context-aware conversations
- **Database Integration**: Seamless sync with MongoDB

### 🤖 ML Model Features

- **Crop Damage Detection**: U-Net segmentation model
- **Geospatial Damage %**: EXIF altitude + camera FOV → ground coverage per drone image
- **Multi-Image Aggregation**: Sums damaged area across uploads vs farmer's **total land area**
- **Visual Overlays**: Per-image mask and overlay for admin reports and PDFs

## 📁 Project Structure

```
hacpro/
│
├── backend/                    # Express.js Backend API
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT authentication
│   ├── models/
│   │   └── Farmer.js          # Farmer schema
│   ├── routes/
│   │   ├── adminRoutes.js     # Admin endpoints
│   │   ├── adminAuthRoutes.js # Admin authentication
│   │   ├── authRoutes.js      # Farmer authentication
│   │   ├── dashboardRoutes.js # Dashboard endpoints
│   │   ├── farmerRoutes.js    # Farmer CRUD operations
│   │   └── mlRoutes.js        # ML model endpoints
│   ├── ml_model.py            # Python ML model script
│   ├── generate_pdf.py        # PDF generation script
│   ├── server.js              # Express server entry point
│   └── package.json           # Backend dependencies
│
├── farmer_compensation_website/  # React Frontend
│   ├── src/
│   │   ├── Components/        # Reusable components
│   │   │   ├── AdminLoginSection.jsx
│   │   │   ├── FarmerDashboardSection.jsx
│   │   │   ├── FarmerLoginSection.jsx
│   │   │   ├── FarmerSignupSection.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Navbar.jsx
│   │   ├── Pages/             # Page components
│   │   │   ├── Homepage.jsx
│   │   │   ├── Adminuploadimages.jsx
│   │   │   └── Admindashboard.jsx
│   │   ├── assets/            # Images and static files
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # React entry point
│   ├── public/                # Public assets
│   ├── index.html             # HTML template
│   └── package.json           # Frontend dependencies
│
├── whatsapp-bot/              # WhatsApp Bot
│   ├── controllers/
│   │   └── whatsappController.js  # Bot logic
│   ├── models/
│   │   └── Farmer.js          # Farmer schema
│   ├── routes/
│   │   └── whatsappRoutes.js  # Webhook routes
│   ├── services/
│   │   ├── groqService.js     # Groq chat AI
│   │   ├── sarvamService.js   # Sarvam voice STT
│   │   └── twilioService.js   # Twilio messaging
│   ├── utils/                 # Utility scripts
│   ├── index.js               # Bot entry point
│   └── package.json           # Bot dependencies
│
└── README.md                   # This file
```

## 🛠️ Tech Stack

### Backend
- **Node.js** (v18+) - JavaScript runtime
- **Express.js** (v5.1.0) - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** (v8.18.0) - MongoDB ODM
- **JWT** (jsonwebtoken) - Authentication
- **Multer** (v2.0.2) - File upload handling
- **Python** - ML model execution
- **TensorFlow/Keras** - Deep learning framework

### Frontend
- **React** (v19.1.0) - UI library
- **Vite** (v7.0.4) - Build tool
- **React Router** (v7.6.3) - Routing
- **Redux Toolkit** (v2.8.2) - State management
- **Tailwind CSS** (v4.1.11) - Styling
- **GSAP** (v3.13.0) - Animations
- **Axios** (v1.10.0) - HTTP client
- **jsPDF** (v3.0.3) - PDF generation

### WhatsApp Bot
- **Twilio** - WhatsApp API
- **Groq API** - LLM chat responses
- **Sarvam AI** - Voice note transcription
- **Express.js** - Webhook server

### ML Model
- **Python 3.x**
- **TensorFlow/Keras** - Deep learning
- **OpenCV** - Image processing
- **NumPy** - Numerical operations

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **Python** (v3.8 or higher) - [Download](https://www.python.org/)
3. **MongoDB** - Cloud instance (MongoDB Atlas) or local installation
4. **Git** - Version control

### Additional Services Required

- **Twilio Account** - For WhatsApp bot (optional)
- **Groq API Key** - For WhatsApp chat AI (optional)
- **Sarvam API Key** - For WhatsApp voice notes (optional)
- **Firebase** (optional) - For additional features

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd hacpro
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies

```bash
cd ../farmer_compensation_website
npm install
```

### Step 4: Install WhatsApp Bot Dependencies (Optional)

```bash
cd ../whatsapp-bot
npm install
```

### Step 5: Install Python Dependencies

```bash
cd ../backend
pip install -r requirements.txt
```

Includes `tensorflow`, `keras`, `opencv-python`, `Pillow`, `exifread`, and `numpy`.

## ⚙️ Configuration

### Backend Configuration

Create a `.env` file in the `backend/` directory:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Server Port
PORT=5000

# ML Model Path (if different)
MODEL_PATH=../crop_damage_unet_model.keras
```

### Frontend Configuration

Create a `.env` file in the `farmer_compensation_website/` directory:

```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
```

### WhatsApp Bot Configuration

Create a `.env` file in the `whatsapp-bot/` directory:

```env
# MongoDB Connection (same as backend)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Twilio Credentials
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

# Groq + Sarvam AI
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
SARVAM_API_KEY=your_sarvam_api_key

# Server Port
PORT=5002
```

## 📱 Usage

### Running the Backend Server

```bash
cd backend
npm start
# or for development with auto-reload
npm run dev
```

The backend server will run on `http://localhost:5000`

### Running the Frontend Application

```bash
cd farmer_compensation_website
npm run dev
```

The frontend will run on `http://localhost:5173` (default Vite port)

### Running the WhatsApp Bot (Optional)

```bash
cd whatsapp-bot
npm start
```

The bot server will run on `http://localhost:5002`

**Note**: For WhatsApp bot development, you'll need to set up ngrok for webhook tunneling:

```bash
ngrok http 5002
```

> 📖 **For detailed WhatsApp Bot documentation**, including setup, configuration, troubleshooting, and usage examples, see the [WhatsApp Bot README](./whatsapp-bot/README.md)

## 🔌 API Documentation

### Authentication Endpoints

#### Farmer Registration
```
POST /auth/register
Body: {
  aadhar: string,
  dob: string,
  name: string,
  landReg: string,
  city: string,
  state: string,
  reason: string,
  totalLandArea: number  // optional, sq meters
}
```

#### Farmer Login
```
POST /auth/login
Body: {
  aadhar: string,
  dob: string
}
```

#### Admin Login
```
POST /admin/login
Body: {
  username: string,
  password: string
}
```

### Dashboard Endpoints

#### Get Farmer Dashboard Data
```
GET /dashboard/:aadhar
Headers: Authorization: Bearer <token>
```

#### Upload Images
```
POST /dashboard/upload
Headers: Authorization: Bearer <token>
Body: FormData with image files
```

### ML Model Endpoints

#### Run Crop Damage Assessment
```
POST /api/admin/run-ml
Body: FormData
  - total_land_area: number (farmer's total farm area in sq meters)
  - images: one or more drone image files
Response: {
  total_absolute_damage_sq_m: number,
  final_damage_percentage: number,
  damage_percent: number,
  images_processed: number,
  per_image: [{ mask_image, overlay_image, absolute_damage_sq_m, ... }],
  mask_image: string (base64, first image),
  overlay_image: string (base64, first image)
}
```

### Admin Endpoints

#### Get Statistics
```
GET /api/admin/stats
Response: {
  totalFarmers: number,
  reportsProcessed: number,
  pendingReviews: number
}
```

#### Mark PDF Generated
```
POST /api/admin/mark-pdf-generated
Body: {
  aadhar: string
}
```

## 🤖 ML Model

The project includes a U-Net based deep learning model for crop damage detection.

### Model Details

- **Architecture**: U-Net (Convolutional Neural Network)
- **Input Size**: 128x128 pixels (inference); full-resolution masks for display
- **Output**: Segmentation mask + land-based damage percentage
- **Framework**: TensorFlow/Keras

### Damage Calculation Pipeline

1. **EXIF altitude** from each drone photo (fallback: 50 m)
2. **Ground footprint** from camera FOV (84°) and 4:3 aspect ratio
3. **U-Net mask** → damaged pixel ratio per image
4. **Absolute damage** = ratio × ground area (sq m) per image
5. **Final %** = (sum of absolute damage / `total_land_area`) × 100, capped at 100%

### Usage

Invoked when admin runs prediction from the dashboard or calls `POST /api/admin/run-ml`.

### Model Output

- **final_damage_percentage** / **total_absolute_damage_sq_m**
- **per_image**: mask, overlay, altitude, coverage, and damage per photo
- **Mask / Overlay images** for each uploaded drone photo

### Model File

Place the trained model file (`crop_damage_unet_model.keras`) in the project root directory or update the `MODEL_PATH` in `ml_model.py`.

## 🚀 Deployment

### Backend Deployment

1. **Set environment variables** on your hosting platform
2. **Install dependencies**: `npm install`
3. **Start server**: `npm start`
4. **Use process manager** (PM2) for production:
   ```bash
   pm2 start server.js --name backend
   ```

### Frontend Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```
2. **Deploy the `dist/` folder** to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Any static hosting service

### WhatsApp Bot Deployment

1. **Deploy to cloud platform** (Heroku, AWS, DigitalOcean)
2. **Set environment variables**
3. **Update Twilio webhook URL** to your deployed URL
4. **Start the server**: `npm start`

### Environment Variables Checklist

- [ ] MongoDB connection string
- [ ] JWT secret key
- [ ] API URLs (frontend)
- [ ] Twilio credentials (WhatsApp bot)
- [ ] Gemini API key (WhatsApp bot)
- [ ] Firebase credentials (if used)

## 🧪 Testing

### Backend Testing

```bash
cd backend
# Add test scripts to package.json
npm test
```

### Frontend Testing

```bash
cd farmer_compensation_website
npm run test
```

### ML Model Testing

Test the ML model directly:

```bash
cd backend
python ml_model.py <path_to_image>
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation for new features
- Test thoroughly before submitting PR
- Handle errors gracefully

## 📝 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- **TensorFlow/Keras** - Deep learning framework
- **React** - UI library
- **Express.js** - Web framework
- **Twilio** - WhatsApp API integration
- **Google Gemini** - AI-powered responses
- **MongoDB** - Database solution

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact the development team
- Check component-specific README files:
  - **[WhatsApp Bot README](./whatsapp-bot/README.md)** - Comprehensive guide for the WhatsApp bot component (setup, configuration, troubleshooting, API details)

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Farmer registration and authentication
- Admin dashboard
- ML-powered crop damage assessment
- WhatsApp bot integration
- PDF report generation
- AI-powered chat assistant

---

**Made with ❤️ for Indian Farmers**
