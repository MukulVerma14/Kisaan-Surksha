import Farmer from "../models/Farmer.js";
import { sendMessage } from "../services/twilioService.js";
import { generateFarmerResponse } from "../services/geminiService.js";

// In-memory session tracking
const sessions = {};

const resetSession = (from) => {
  sessions[from] = {
    mode: "registration",
    step: 0,
    data: {
      name: null,
      aadhar: null,
      dob: null,
      landReg: null,
      city: null,
      state: null,
      reason: null,
    },
    history: [],
  };
};

// Validation helper functions
const validateName = (name) => {
  if (!name || name.trim().length < 2) {
    return { valid: false, error: "Name should be at least 2 characters long. Please enter your full name." };
  }
  // Reject if name is only numbers
  if (/^\d+$/.test(name.replace(/\s+/g, ""))) {
    return { valid: false, error: "Name cannot be only numbers. Please enter your actual name." };
  }
  // Reject if name has too many special characters
  const specialCharCount = (name.match(/[^a-zA-Z0-9\s]/g) || []).length;
  if (specialCharCount > name.length * 0.3) {
    return { valid: false, error: "Name contains too many special characters. Please use only letters and spaces." };
  }
  return { valid: true };
};

const validateAadhaar = (aadhaar) => {
  const digits = aadhaar.replace(/\s+/g, "");
  if (!/^\d{12}$/.test(digits)) {
    if (digits.length === 0) {
      return { valid: false, error: "Aadhaar number cannot be empty. Please enter your 12-digit Aadhaar number." };
    }
    if (digits.length < 12) {
      return { valid: false, error: `Aadhaar should be exactly 12 digits. You entered ${digits.length} digits. Please re-enter.` };
    }
    if (digits.length > 12) {
      return { valid: false, error: `Aadhaar should be exactly 12 digits. You entered ${digits.length} digits. Please re-enter.` };
    }
    if (!/^\d+$/.test(digits)) {
      return { valid: false, error: "Aadhaar should contain only numbers (0-9). Please re-enter without spaces or special characters." };
    }
    return { valid: false, error: "Invalid Aadhaar format. Please enter exactly 12 digits." };
  }
  return { valid: true, value: digits };
};

const validateDOB = (dobInput) => {
  // Normalize separators
  const normalized = dobInput.replace(/[.\-]/g, "/");
  
  // Check format
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = normalized.match(dateRegex);
  
  if (!match) {
    return { 
      valid: false, 
      error: "Invalid date format. Please enter DOB in dd/mm/yyyy format.\nExample: 15/01/1990 or 05/12/1985" 
    };
  }
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  
  // Validate date range
  if (month < 1 || month > 12) {
    return { valid: false, error: "Invalid month. Month should be between 01 and 12. Please re-enter (dd/mm/yyyy)." };
  }
  
  if (day < 1 || day > 31) {
    return { valid: false, error: "Invalid day. Day should be between 01 and 31. Please re-enter (dd/mm/yyyy)." };
  }
  
  // Check for reasonable year (not future, not too old)
  const currentYear = new Date().getFullYear();
  if (year > currentYear) {
    return { valid: false, error: "Year cannot be in the future. Please enter a valid year." };
  }
  if (year < 1900) {
    return { valid: false, error: "Year seems too old. Please enter a valid year." };
  }
  
  // Validate actual date (handle leap years, month days correctly)
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { valid: false, error: "Invalid date. Please check the day, month, and year are correct.\nExample: 15/01/1990" };
  }
  
  // Format with leading zeros
  const formattedDay = day.toString().padStart(2, "0");
  const formattedMonth = month.toString().padStart(2, "0");
  const formattedDOB = `${formattedDay}/${formattedMonth}/${year}`;
  
  return { valid: true, value: formattedDOB };
};

const validateLandReg = (landReg) => {
  if (!landReg || landReg.trim().length === 0) {
    return { valid: false, error: "Land Registration number cannot be empty. Please enter your Land Registration number." };
  }
  if (landReg.trim().length < 3) {
    return { valid: false, error: "Land Registration number seems too short. Please enter a valid registration number." };
  }
  if (landReg.trim().length > 50) {
    return { valid: false, error: "Land Registration number seems too long. Please enter a valid registration number (max 50 characters)." };
  }
  return { valid: true, value: landReg.trim() };
};

const validateCity = (city) => {
  if (!city || city.trim().length === 0) {
    return { valid: false, error: "City/Village name cannot be empty. Please enter your city or village name." };
  }
  if (city.trim().length < 2) {
    return { valid: false, error: "City/Village name should be at least 2 characters. Please enter a valid name." };
  }
  return { valid: true, value: city.trim() };
};

const validateState = (state) => {
  if (!state || state.trim().length === 0) {
    return { valid: false, error: "State name cannot be empty. Please enter your state name." };
  }
  if (state.trim().length < 2) {
    return { valid: false, error: "State name should be at least 2 characters. Please enter a valid state name." };
  }
  return { valid: true, value: state.trim() };
};

const validateReason = (reason) => {
  if (!reason || reason.trim().length === 0) {
    return { valid: false, error: "Description cannot be empty. Please describe your crop loss or assistance need." };
  }
  if (reason.trim().length < 5) {
    return { valid: false, error: "Description is too short. Please share at least a few words about your situation." };
  }
  if (reason.trim().length > 500) {
    return { valid: false, error: "Description is too long. Please keep it under 500 characters." };
  }
  return { valid: true, value: reason.trim() };
};

export const handleIncomingMessage = async (data) => {
  const from = data.From;
  const body = (data.Body || "").trim();
  const normalized = body.toLowerCase();

  if (!sessions[from]) resetSession(from);
  const session = sessions[from];

  // Quit or restart commands (works anytime)
  if (["quit", "exit", "restart", "start over"].includes(normalized)) {
    await sendMessage(from, "👋 Session ended. Type 'hi' to start again.");
    delete sessions[from];
    return;
  }

  // Conversational AI mode (after onboarding)
  if (session.mode === "chat") {
    try {
      if (!body) {
        await sendMessage(from, "Please share your question so I can help.");
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        await sendMessage(from, "AI assistant is not configured yet. Please contact support.");
        return;
      }

      const profile = session.data?.aadhar
        ? await Farmer.findOne({ aadhar: session.data.aadhar }).lean()
        : session.data;

      const history = session.history || [];
      const aiReply = await generateFarmerResponse(profile || session.data, history, body);

      session.history = [...history, { role: "farmer", text: body }, { role: "bot", text: aiReply }].slice(-10);

      await sendMessage(from, aiReply);
    } catch (err) {
      console.error("AI conversation error:", err);
      await sendMessage(
        from,
        "⚠️ I'm having trouble answering right now. Please try again later or contact your local agriculture office."
      );
    }
    return;
  }

  try {
    switch (session.step) {
      case 0: {
        if (["hi", "hello", "hey", "hola"].includes(normalized)) {
          await sendMessage(
            from,
            "🌾 Welcome to KisaanSuraksha WhatsApp portal! Let's get you registered.\nWhat's your full name?"
          );
          session.step = 1;
        } else {
          await sendMessage(from, "Say 'hi' to begin your registration.");
        }
        break;
      }

      case 1: {
        // Validate name
        const nameValidation = validateName(body);
        if (!nameValidation.valid) {
          await sendMessage(from, `❗ ${nameValidation.error}`);
          // Stay on step 1 to ask again
          break;
        }
        session.data.name = body.trim();
        await sendMessage(from, "📄 Please enter your 12-digit Aadhaar number:");
        session.step = 2;
        break;
      }

      case 2: {
        // Validate Aadhaar
        const aadhaarValidation = validateAadhaar(body);
        if (!aadhaarValidation.valid) {
          await sendMessage(from, `❗ ${aadhaarValidation.error}`);
          // Stay on step 2 to ask again
          break;
        }
        session.data.aadhar = aadhaarValidation.value;
        await sendMessage(from, "📅 Enter your Date of Birth (dd/mm/yyyy or dd.mm.yyyy):\nExample: 15/01/1990");
        session.step = 3;
        break;
      }

      case 3: {
        // Validate DOB
        const dobValidation = validateDOB(body);
        if (!dobValidation.valid) {
          await sendMessage(from, `❗ ${dobValidation.error}`);
          // Stay on step 3 to ask again
          break;
        }
        session.data.dob = dobValidation.value;
        await sendMessage(from, "🧾 What's your Land Registration number?");
        session.step = 4;
        break;
      }

      case 4: {
        // Validate Land Registration
        const landRegValidation = validateLandReg(body);
        if (!landRegValidation.valid) {
          await sendMessage(from, `❗ ${landRegValidation.error}`);
          // Stay on step 4 to ask again
          break;
        }
        session.data.landReg = landRegValidation.value;
        await sendMessage(from, "🏠 Which city or village are you from?");
        session.step = 5;
        break;
      }

      case 5: {
        // Validate City
        const cityValidation = validateCity(body);
        if (!cityValidation.valid) {
          await sendMessage(from, `❗ ${cityValidation.error}`);
          // Stay on step 5 to ask again
          break;
        }
        session.data.city = cityValidation.value;
        await sendMessage(from, "🌍 Which state are you located in?");
        session.step = 6;
        break;
      }

      case 6: {
        // Validate State
        const stateValidation = validateState(body);
        if (!stateValidation.valid) {
          await sendMessage(from, `❗ ${stateValidation.error}`);
          // Stay on step 6 to ask again
          break;
        }
        session.data.state = stateValidation.value;
        await sendMessage(from, "📝 Briefly describe the crop loss or assistance you need.");
        session.step = 7;
        break;
      }

      case 7: {
        // Validate Reason
        const reasonValidation = validateReason(body);
        if (!reasonValidation.valid) {
          await sendMessage(from, `❗ ${reasonValidation.error}`);
          // Stay on step 7 to ask again
          break;
        }
        session.data.reason = reasonValidation.value;
        const summary = `✅ Please confirm the details:\n\nName: ${session.data.name}\nAadhaar: ${session.data.aadhar}\nDOB: ${session.data.dob}\nLand Reg: ${session.data.landReg}\nCity: ${session.data.city}\nState: ${session.data.state}\nReason: ${session.data.reason}\n\nReply 'yes' to submit or 'no' to restart.`;
        await sendMessage(from, summary);
        session.step = 8;
        break;
      }

      case 8: {
        if (["yes", "y"].includes(normalized)) {
          try {
            const { aadhar, name, dob, landReg, city, state, reason } = session.data;

            let farmer = await Farmer.findOne({ aadhar });
            if (farmer) {
              farmer.set({ name, dob, landReg, city, state, reason });
              await farmer.save();
              await sendMessage(from, "✅ Your details are updated successfully. Thank you!");
            } else {
              farmer = new Farmer({ aadhar, name, dob, landReg, city, state, reason });
              await farmer.save();
              await sendMessage(from, "🎉 Registration complete! You're now part of KisaanSuraksha.");
            }

            await sendMessage(
              from,
              "🤖 I can now answer your crop questions in Hinglish! Ask me anything about compensation, recovery steps, or future crop planning."
            );
            session.mode = "chat";
            session.step = null;
            session.history = [];
            session.data = {
              ...session.data,
              name: farmer.name,
              aadhar: farmer.aadhar,
              dob: farmer.dob,
              landReg: farmer.landReg,
              city: farmer.city,
              state: farmer.state,
              reason: farmer.reason,
            };
          } catch (dbError) {
            console.error("Database error during registration:", dbError);
            // Check if it's a duplicate Aadhaar error
            if (dbError.code === 11000 || dbError.message?.includes("duplicate")) {
              await sendMessage(
                from,
                "⚠️ This Aadhaar number is already registered. Please use a different Aadhaar or contact support."
              );
            } else {
              await sendMessage(
                from,
                "⚠️ Sorry, we couldn't save your details. Please try again or type 'quit' to restart."
              );
            }
            // Stay on step 8 so user can try again or restart
          }
        } else if (["no", "n"].includes(normalized)) {
          await sendMessage(from, "No worries. Let's start over. Say 'hi' to begin again.");
          delete sessions[from];
        } else {
          await sendMessage(from, "❗ Please reply with 'yes' to submit or 'no' to restart.");
          // Stay on step 8 to ask again
        }
        break;
      }

      default: {
        await sendMessage(from, "Something went wrong. Type 'hi' to restart your registration.");
        delete sessions[from];
      }
    }
  } catch (err) {
    console.error("Error handling message:", err);
    await sendMessage(from, "⚠️ Sorry, something went wrong. Please try again later.");
    delete sessions[from];
  }
};
