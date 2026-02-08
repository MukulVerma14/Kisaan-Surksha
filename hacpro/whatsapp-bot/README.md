# 🌾 KisaanSuraksha WhatsApp Bot

A comprehensive WhatsApp bot for Indian farmers that enables registration, profile management, and AI-powered agricultural assistance through WhatsApp. Built with Node.js, Express, Twilio, MongoDB, and Google Gemini AI.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Bot Flow & User Journey](#bot-flow--user-journey)
- [AI Integration](#ai-integration)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

KisaanSuraksha WhatsApp Bot is an intelligent chatbot designed to help Indian farmers register for crop damage compensation and get AI-powered agricultural assistance. The bot eliminates the need for farmers to visit a website by allowing them to complete the entire registration process and receive guidance directly through WhatsApp.

### Key Benefits

- **No Website Required**: Farmers can register and interact entirely through WhatsApp
- **Native Language Support**: AI responds in Hinglish (Hindi + English mix)
- **Multi-step Registration**: Guided conversation flow for data collection
- **AI-Powered Assistance**: Get answers about compensation, crop recovery, and agricultural practices
- **Database Integration**: Seamlessly syncs with existing MongoDB database

## ✨ Features

### 1. **Farmer Registration**
   - Complete registration flow through WhatsApp
   - Multi-step data collection:
     - Full Name
     - 12-digit Aadhaar number (with validation)
     - Date of Birth (multiple format support)
     - Land Registration number
     - City/Village
     - State
     - Crop damage reason/description
   - Data confirmation before submission
   - Auto-update existing farmer records

### 2. **AI-Powered Chat Assistant**
   - Conversational AI using Google Gemini 2.x models
   - Responds in Hinglish (Hindi-English mix)
   - Context-aware responses based on farmer profile
   - Handles questions about:
     - Crop damage compensation
     - Recovery steps after crop loss
     - Future crop planning
     - Agricultural best practices
     - Government schemes and assistance
   - Conversation history tracking

### 3. **Session Management**
   - In-memory session tracking
   - State management for multi-step flows
   - Session reset commands (`quit`, `exit`, `restart`)
   - Context preservation during conversations

### 4. **Data Validation**
   - Aadhaar number format validation (12 digits)
   - Date of Birth format normalization
   - Input validation at each step
   - Error handling and user feedback

### 5. **Database Integration**
   - MongoDB connection with Mongoose ODM
   - Farmer profile CRUD operations
   - Duplicate Aadhaar handling
   - Data persistence across sessions

## 🏗️ Architecture

```
┌─────────────────┐
│   WhatsApp      │
│     User        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Twilio API    │
│   (Webhook)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│  Express Server │─────▶│  MongoDB        │
│  (Port 5002)    │      │  (Farmer Data)  │
└────────┬────────┘      └─────────────────┘
         │
         ├──────────────┐
         ▼              ▼
┌──────────────┐  ┌──────────────┐
│  Controller  │  │   Gemini AI  │
│  (Flow Logic)│  │   Service    │
└──────────────┘  └──────────────┘
         │
         ▼
┌──────────────┐
│  Twilio      │
│  Service     │
│  (Send MSG)  │
└──────────────┘
```

### Flow Diagram

1. **Registration Flow**:
   ```
   User → "hi" → Name → Aadhaar → DOB → Land Reg → City → State → Reason → Confirm → Save to DB → AI Chat Enabled
   ```

2. **AI Chat Flow**:
   ```
   User Question → Gemini API → Context-aware Response → Send to User
   ```

## 🛠️ Tech Stack

### Core Technologies
- **Node.js** (v20+): JavaScript runtime
- **Express.js** (v4.21.2): Web framework
- **MongoDB**: NoSQL database
- **Mongoose** (v7.8.7): MongoDB ODM

### Communication & AI
- **Twilio** (v4.23.0): WhatsApp API integration
- **Google Gemini AI** (@google/generative-ai v0.24.1): AI chatbot
- **Axios** (v1.12.2): HTTP client for REST API calls

### Utilities
- **dotenv** (v16.6.1): Environment variable management
- **body-parser** (v1.20.3): Request body parsing

## 📦 Prerequisites

Before you begin, ensure you have the following:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **MongoDB** - Cloud instance (MongoDB Atlas) or local installation
3. **Twilio Account** - [Sign up](https://www.twilio.com/try-twilio)
   - WhatsApp Sandbox access or WhatsApp Business API
4. **Google AI Studio API Key** - [Get API Key](https://makersuite.google.com/app/apikey)
   - Access to Gemini 2.x models
5. **ngrok** (for local development) - [Download](https://ngrok.com/)
6. **Git** (optional) - For version control

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd hacpro/whatsapp-bot
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`.

### Step 3: Environment Configuration

Create a `.env` file in the `whatsapp-bot` directory:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Twilio Credentials
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Server Configuration
PORT=5002
```

### Step 4: Verify Installation

```bash
node index.js
```

You should see:
```
✅ WhatsApp Bot connected to MongoDB
✅ WhatsApp Bot running on port 5002
```

## ⚙️ Configuration

### MongoDB Setup

1. **Create MongoDB Atlas Account** (if using cloud):
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster
   - Get connection string
   - Update `MONGO_URI` in `.env`

2. **Database Schema**:
   The bot uses the `Farmer` collection with the following schema:
   ```javascript
   {
     aadhar: String (required, unique),
     dob: String (required),
     name: String,
     landReg: String,
     city: String,
     state: String,
     reason: String,
     images: [String],
     droneImages: [String]
   }
   ```

### Twilio Setup

1. **Create Twilio Account**:
   - Sign up at [Twilio](https://www.twilio.com/)
   - Navigate to Console Dashboard
   - Copy Account SID and Auth Token

2. **Enable WhatsApp**:
   - For Testing: Use WhatsApp Sandbox
     - Go to Messaging → Try it out → Send a WhatsApp message
     - Follow instructions to join sandbox
     - Use: `whatsapp:+14155238886` as phone number
   - For Production: Get WhatsApp Business API
     - Apply for WhatsApp Business API access
     - Get approved phone number

3. **Configure Webhook**:
   - Development: Use ngrok URL
   - Production: Use your server URL
   - Webhook URL: `https://your-url.com/whatsapp/incoming`
   - Method: `POST`

### Google Gemini API Setup

1. **Get API Key**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with Google account
   - Click "Create API Key"
   - Copy the API key

2. **Verify Model Access**:
   ```bash
   node utils/listGeminiModels.js
   ```
   This will list all available Gemini models for your API key.

3. **Configure Model** (optional):
   - Default: `gemini-2.5-flash`
   - Available models: `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.5-pro`
   - Update `GEMINI_MODEL` in `.env` if needed

### ngrok Setup (Local Development)

1. **Install ngrok**:
   ```bash
   # Windows (via Chocolatey)
   choco install ngrok

   # macOS (via Homebrew)
   brew install ngrok

   # Or download from https://ngrok.com/
   ```

2. **Start ngrok**:
   ```bash
   ngrok http 5002
   ```

3. **Use ngrok URL**:
   - Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.dev`)
   - Update Twilio webhook with: `https://abc123.ngrok-free.dev/whatsapp/incoming`

## 📱 Usage

### Starting the Bot

#### Development Mode (with ngrok)

**Terminal 1 - Start the bot:**
```bash
npm start
```

**Terminal 2 - Start ngrok tunnel:**
```bash
npm run tunnel
# OR
ngrok http 5002
```

#### Production Mode

```bash
npm start
```

### User Interaction Flow

#### 1. Registration Process

```
Farmer: hi
Bot: 🌾 Welcome to KisaanSuraksha WhatsApp portal! Let's get you registered.
     What's your full name?

Farmer: Ram Kumar
Bot: 📄 Please enter your 12-digit Aadhaar number:

Farmer: 123456789012
Bot: 📅 Enter your Date of Birth (dd.mm.yyyy or dd/mm/yyyy):

Farmer: 15/01/1990
Bot: 🧾 What's your Land Registration number?

Farmer: LR123456
Bot: 🏠 Which city or village are you from?

Farmer: Delhi
Bot: 🌍 Which state are you located in?

Farmer: Delhi
Bot: 📝 Briefly describe the crop loss or assistance you need.

Farmer: Heavy rainfall damaged my wheat crop
Bot: ✅ Please confirm the details:
     [Shows summary]
     Reply 'yes' to submit or 'no' to restart.

Farmer: yes
Bot: 🎉 Registration complete! You're now part of KisaanSuraksha.
     🤖 I can now answer your crop questions in Hinglish! Ask me anything...
```

#### 2. AI Chat Mode

After registration, farmers can ask questions:

```
Farmer: What compensation can I get for crop damage?
Bot: [AI-generated response in Hinglish about compensation procedures]

Farmer: What should I do next after crop loss?
Bot: [AI-generated response about recovery steps]

Farmer: How to prepare for next season?
Bot: [AI-generated response about crop planning]
```

#### 3. Session Management

```
Farmer: quit
Bot: 👋 Session ended. Type 'hi' to start again.
```

Available commands:
- `quit` / `exit` - End current session
- `restart` / `start over` - Restart registration
- `hi` / `hello` - Start new registration

## 📁 Project Structure

```
whatsapp-bot/
│
├── controllers/
│   └── whatsappController.js    # Main bot logic and flow control
│
├── models/
│   └── Farmer.js                # MongoDB schema for Farmer model
│
├── routes/
│   └── whatsappRoutes.js        # Express routes for webhook
│
├── services/
│   ├── twilioService.js         # Twilio messaging service
│   └── geminiService.js         # Gemini AI integration service
│
├── utils/
│   ├── listGeminiModels.js      # Utility to list available Gemini models
│   └── testGeminiModels.js      # Test script for Gemini models
│
├── index.js                     # Application entry point
├── package.json                 # Dependencies and scripts
├── .env                         # Environment variables (create this)
└── README.md                    # This file
```

### File Descriptions

#### `index.js`
- Express server setup
- MongoDB connection
- Route registration
- Server startup

#### `controllers/whatsappController.js`
- Message handling logic
- Session management
- Registration flow control
- AI chat mode handling
- Data validation

#### `services/twilioService.js`
- Twilio client initialization
- Send message functionality
- Phone number formatting

#### `services/geminiService.js`
- Gemini AI client setup
- Model selection and fallback
- Prompt engineering
- Response generation
- REST API fallback

#### `models/Farmer.js`
- Mongoose schema definition
- Farmer data model
- Database operations

#### `routes/whatsappRoutes.js`
- Webhook endpoint handler
- Request processing
- Error handling

## 🔌 API Endpoints

### POST `/whatsapp/incoming`

Twilio webhook endpoint for receiving incoming WhatsApp messages.

**Request Body** (from Twilio):
```json
{
  "From": "whatsapp:+919876543210",
  "Body": "hello",
  "MessageSid": "SMxxxxxxxxxxxxxxxxxxxxx",
  "AccountSid": "ACxxxxxxxxxxxxxxxxxxxxx"
}
```

**Response**:
- Status: `200 OK` (immediate response to Twilio)
- Processing happens asynchronously

**Flow**:
1. Twilio sends POST request to webhook
2. Server responds immediately with 200
3. Message processing happens in background
4. Response sent to user via Twilio API

## 🗄️ Database Schema

### Farmer Collection

```javascript
{
  _id: ObjectId,
  aadhar: String (required, unique, 12 digits),
  dob: String (required, format: "dd/mm/yyyy"),
  name: String,
  landReg: String,
  city: String,
  state: String,
  reason: String,
  images: [String],
  droneImages: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `aadhar`: Unique index for fast lookup

### Operations

- **Create**: New farmer registration
- **Read**: Find farmer by Aadhaar
- **Update**: Update existing farmer profile
- **Delete**: (Not implemented in bot)

## 🤖 Bot Flow & User Journey

### Registration Flow State Machine

```
State 0: Initial
  └─ Input: "hi", "hello", "hey"
  └─ Action: Request name
  └─ Next: State 1

State 1: Name Collection
  └─ Input: Full name
  └─ Action: Request Aadhaar
  └─ Next: State 2

State 2: Aadhaar Collection
  └─ Input: 12-digit Aadhaar
  └─ Validation: Regex check (12 digits)
  └─ Action: Request DOB
  └─ Next: State 3

State 3: DOB Collection
  └─ Input: Date of Birth
  └─ Validation: Format normalization
  └─ Action: Request Land Registration
  └─ Next: State 4

State 4: Land Registration
  └─ Input: Land Registration number
  └─ Action: Request City
  └─ Next: State 5

State 5: City Collection
  └─ Input: City/Village name
  └─ Action: Request State
  └─ Next: State 6

State 6: State Collection
  └─ Input: State name
  └─ Action: Request Reason
  └─ Next: State 7

State 7: Reason Collection
  └─ Input: Crop damage description
  └─ Action: Show confirmation
  └─ Next: State 8

State 8: Confirmation
  └─ Input: "yes" or "no"
  └─ Action: Save to DB / Restart
  └─ Next: Chat Mode (if yes)
```

### Chat Mode Flow

```
Chat Mode: Active
  └─ Input: Any question
  └─ Action: 
     1. Load farmer profile from DB
     2. Build context with profile + history
     3. Send to Gemini API
     4. Get AI response
     5. Send to user
     6. Update conversation history
  └─ Continue: Until user sends "quit"
```

## 🧠 AI Integration

### Gemini AI Service

The bot uses Google Gemini 2.x models for AI-powered conversations.

#### Model Selection

The service tries models in this order:
1. `gemini-2.5-flash` (default, fastest)
2. `gemini-2.0-flash`
3. `gemini-2.5-pro` (more capable)
4. `gemini-2.0-flash-001`
5. `gemini-2.5-flash-lite`
6. `gemini-2.0-flash-lite`
7. `gemini-2.0-flash-lite-001`

#### Prompt Engineering

The AI is configured with a system instruction:
```
"You are KisaanSuraksha Mitra, an agriculture support assistant for Indian 
farmers. Respond in friendly Hinglish (mix of Hindi and English) using simple 
words. Provide empathetic, practical advice referencing Indian farming context. 
Always add a brief reminder that final decisions should involve local agriculture 
officers or trusted experts. Keep answers within 6-8 sentences maximum."
```

#### Context Building

Each AI request includes:
- Farmer profile information
- Conversation history (last 10 messages)
- Current question

#### Fallback Mechanism

1. **SDK Approach**: Uses `@google/generative-ai` package
2. **REST API v1**: Direct API calls to v1 endpoint
3. **REST API v1beta**: Fallback to v1beta endpoint

### Testing AI Integration

```bash
# List available models
node utils/listGeminiModels.js

# Test model responses
node utils/testGeminiModels.js
```

## 💻 Development

### Running in Development Mode

```bash
# Install dependencies
npm install

# Start server
npm start

# Start ngrok (separate terminal)
npm run tunnel
```

### Environment Variables

Create `.env` file with:
```env
MONGO_URI=your_mongodb_uri
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
PORT=5002
```

### Available Scripts

```bash
npm start              # Start the bot server
npm run tunnel         # Start ngrok tunnel (requires ngrok)
npm run dev            # Alias for start
```

### Debugging

Enable verbose logging by adding to code:
```javascript
console.log("Debug:", variable);
```

Check logs for:
- MongoDB connection status
- Twilio message sending
- Gemini API responses
- Session state changes

### Testing

#### Manual Testing

1. Send WhatsApp message to Twilio number
2. Follow registration flow
3. Test AI chat after registration
4. Verify data in MongoDB

#### Test Utilities

```bash
# Test Gemini models
node utils/testGeminiModels.js

# List available models
node utils/listGeminiModels.js
```

## 🚀 Deployment

### Production Deployment

#### Option 1: Heroku

1. **Install Heroku CLI**
2. **Create Heroku App**:
   ```bash
   heroku create kisaan-whatsapp-bot
   ```

3. **Set Environment Variables**:
   ```bash
   heroku config:set MONGO_URI=your_mongodb_uri
   heroku config:set TWILIO_ACCOUNT_SID=your_sid
   heroku config:set TWILIO_AUTH_TOKEN=your_token
   heroku config:set TWILIO_PHONE_NUMBER=whatsapp:+1234567890
   heroku config:set GEMINI_API_KEY=your_key
   heroku config:set PORT=5002
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

5. **Update Twilio Webhook**:
   - Use Heroku URL: `https://your-app.herokuapp.com/whatsapp/incoming`

#### Option 2: AWS EC2

1. **Launch EC2 Instance**
2. **Install Node.js and MongoDB**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone Repository**:
   ```bash
   git clone <repo-url>
   cd whatsapp-bot
   npm install
   ```

4. **Setup Environment**:
   ```bash
   nano .env
   # Add all environment variables
   ```

5. **Use PM2 for Process Management**:
   ```bash
   npm install -g pm2
   pm2 start index.js --name whatsapp-bot
   pm2 save
   pm2 startup
   ```

6. **Setup Nginx Reverse Proxy** (optional):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5002;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

#### Option 3: DigitalOcean App Platform

1. **Create App** in DigitalOcean
2. **Connect GitHub Repository**
3. **Configure Environment Variables**
4. **Deploy**

### Production Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection secure
- [ ] Twilio webhook URL updated
- [ ] Gemini API key valid
- [ ] Error logging enabled
- [ ] Process manager (PM2) configured
- [ ] HTTPS enabled
- [ ] Rate limiting configured (optional)
- [ ] Monitoring setup (optional)

## 🐛 Troubleshooting

### Common Issues

#### 1. Bot Not Receiving Messages

**Symptoms**: Messages sent but no response

**Solutions**:
- Check ngrok is running (development)
- Verify webhook URL in Twilio console
- Check server logs for errors
- Ensure webhook URL is accessible (test with curl)
- Verify webhook URL uses HTTPS (required by Twilio)

```bash
# Test webhook endpoint
curl -X POST http://localhost:5002/whatsapp/incoming \
  -H "Content-Type: application/json" \
  -d '{"From":"whatsapp:+123","Body":"test"}'
```

#### 2. MongoDB Connection Failed

**Symptoms**: `❌ MongoDB connection error`

**Solutions**:
- Verify `MONGO_URI` in `.env`
- Check MongoDB network access (IP whitelist)
- Verify MongoDB credentials
- Test connection with MongoDB Compass
- Check firewall settings

#### 3. Twilio Send Message Errors

**Symptoms**: `Twilio sendMessage error: Invalid channel type`

**Solutions**:
- Verify `TWILIO_PHONE_NUMBER` format: `whatsapp:+14155238886`
- Check Account SID and Auth Token
- Ensure WhatsApp access is enabled
- Verify phone number is correct (no extra characters)

#### 4. Gemini API Not Working

**Symptoms**: `AI assistant is not configured yet` or `404 Not Found`

**Solutions**:
- Verify `GEMINI_API_KEY` in `.env`
- Check API key has access to Gemini models
- List available models: `node utils/listGeminiModels.js`
- Verify model name is correct
- Check API quota/limits

#### 5. Session Not Persisting

**Symptoms**: Bot restarts conversation on every message

**Solutions**:
- Sessions are in-memory (lost on server restart)
- This is expected behavior
- For persistence, implement Redis or database sessions

#### 6. Port Already in Use

**Symptoms**: `Error: listen EADDRINUSE: address already in use :::5002`

**Solutions**:
```bash
# Find process using port
netstat -ano | findstr :5002  # Windows
lsof -i :5002                  # macOS/Linux

# Kill process
taskkill /PID <pid> /F         # Windows
kill -9 <pid>                  # macOS/Linux

# Or change PORT in .env
```

#### 7. ngrok URL Changes

**Symptoms**: Webhook stops working after ngrok restart

**Solutions**:
- ngrok free tier generates new URL on restart
- Update Twilio webhook with new URL
- Use ngrok paid plan for static domain
- Or deploy to production server

### Debug Mode

Enable detailed logging:

```javascript
// In controllers/whatsappController.js
console.log("Session state:", session);
console.log("Received message:", body);
console.log("From:", from);
```

### Error Logs

Check server console for:
- MongoDB connection status
- Twilio API errors
- Gemini API errors
- Session state
- Message processing errors

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes**:
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update README for new features
- Test before submitting PR
- Handle errors gracefully

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Twilio** - WhatsApp API integration
- **Google Gemini** - AI-powered responses
- **MongoDB** - Database solution
- **Express.js** - Web framework
- **Node.js** - Runtime environment

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact the development team
- Check existing documentation

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Farmer registration flow
- AI-powered chat assistant
- MongoDB integration
- Twilio WhatsApp integration
- Gemini 2.x AI support

## 📚 Additional Resources

- [Twilio WhatsApp Documentation](https://www.twilio.com/docs/whatsapp)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Documentation](https://nodejs.org/docs/)

---

**Made with ❤️ for Indian Farmers**
