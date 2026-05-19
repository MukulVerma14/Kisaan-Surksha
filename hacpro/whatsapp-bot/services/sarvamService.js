import axios from "axios";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import FormData from "form-data";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Transcribes an audio file from a given media URL using Sarvam AI.
 * Designed for processing WhatsApp voice notes.
 *
 * @param {string} mediaUrl - Publicly accessible URL to the audio file.
 * @returns {Promise<{ text: string, language: string }>}
 */
export async function transcribeAudio(mediaUrl) {
  let tempFilePath;

  try {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      console.error("❌ SARVAM_API_KEY is not set in environment variables");
      console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes('SARVAM') || k.includes('API')));
      throw new Error("SARVAM_API_KEY is not set");
    }
    
    // Debug: Log first few characters of API key (for verification, not full key)
    console.log("🔑 Sarvam API Key loaded:", apiKey.substring(0, 10) + "..." + (apiKey.length > 20 ? apiKey.substring(apiKey.length - 5) : ""));

    const urlExt = (() => {
      try {
        const ext = path.extname(new URL(mediaUrl).pathname);
        return ext || ".ogg";
      } catch (err) {
        return ".ogg";
      }
    })();

    // Generate a truly unique temporary file path to prevent collisions
    // Use UUID if available, otherwise use timestamp + random + process ID for maximum uniqueness
    const uniqueId = crypto.randomUUID 
      ? crypto.randomUUID() 
      : `${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2, 11)}`;
    tempFilePath = path.join(__dirname, `temp_audio_${uniqueId}${urlExt}`);
    
    console.log(`📁 Using unique temp file: ${path.basename(tempFilePath)}`);

    // Download media to temp file
    // Twilio media URLs require authentication using Account SID and Auth Token
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!twilioAccountSid || !twilioAuthToken) {
      console.error("❌ TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set");
      throw new Error("Twilio credentials not configured");
    }
    
    console.log("📥 Downloading audio from:", mediaUrl.substring(0, 50) + "...");
    try {
      const response = await axios.get(mediaUrl, { 
        responseType: "stream",
        timeout: 30000,
        auth: {
          username: twilioAccountSid,
          password: twilioAuthToken
        }
      });
      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(tempFilePath);
        response.data.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
        response.data.on("error", reject);
      });
      console.log("✅ Audio downloaded successfully");
    } catch (downloadError) {
      const downloadErrMsg = downloadError?.message || String(downloadError);
      console.error("❌ Failed to download audio:", downloadErrMsg);
      throw new Error(`Failed to download audio: ${downloadErrMsg}`);
    }

    console.log("📤 Sending request to Sarvam API...");
    console.log("📍 Endpoint: https://api.sarvam.ai/speech-to-text");
    console.log("📁 File:", tempFilePath);
    console.log("📊 File size:", (await fs.promises.stat(tempFilePath)).size, "bytes");

    // Helper function to create form data
    // Sarvam API requires model to be one of: 'saarika:v1', 'saarika:v2', 'saarika:v2.5', or 'saarika:flash'
    const createFormData = () => {
      const fd = new FormData();
      fd.append("file", fs.createReadStream(tempFilePath));
      // Use 'saarika:flash' for fastest response (can be changed to v2.5 for better accuracy)
      const modelName = "saarika:v2.5";
      fd.append("model", modelName);
      console.log(`📦 FormData created with model: ${modelName}`);
      return fd;
    };

    // Try different endpoints and authentication methods
    // Based on error logs: https://api.sarvam.ai/speech-to-text works (got 400 with model error, not 404)
    // Auth method 'api-subscription-key' works (got 400 with model error, not 401)
    // Now that model is fixed to 'saarika:flash', this should work
    const endpoints = [
      "https://api.sarvam.ai/speech-to-text", // Confirmed working endpoint
      "https://api.sarvam.ai/v1/speech-to-text", // Fallback
    ];
    
    const authMethods = [
      { name: "api-subscription-key", header: "api-subscription-key", value: apiKey }, // Confirmed working
      { name: "Authorization Bearer", header: "Authorization", value: `Bearer ${apiKey}` }, // Fallback
    ];

    let data;
    let lastError;

    // Try all combinations
    for (const endpoint of endpoints) {
      for (const authMethod of authMethods) {
        try {
          const formData = createFormData();
          const headers = {
            ...formData.getHeaders(),
            [authMethod.header]: authMethod.value,
          };
          
          // Debug: Log what we're sending
          console.log(`🔑 Trying: ${endpoint} with ${authMethod.name}`);
          console.log(`📋 Model being sent: saarika:flash`);

          const response = await axios.post(
            endpoint,
            formData,
            { 
              headers,
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
              timeout: 30000, // 30 second timeout
            }
          );
          
          data = response.data;
          console.log(`✅ Success! Used: ${endpoint} with ${authMethod.name}`);
          break; // Success, exit loops
        } catch (err) {
          lastError = err;
          const status = err?.response?.status;
          const errorData = err?.response?.data;
          
          // Log detailed error for 400 (bad request) to understand what's wrong
          if (status === 400) {
            try {
              const errorMsg = errorData?.error?.message || errorData?.message || JSON.stringify(errorData);
              console.log(`   ❌ 400 Bad Request: ${errorMsg}`);
              console.log(`   💡 Check Sarvam API docs for correct endpoint/format`);
              // Log full response for debugging
              if (errorData) {
                console.log(`   📋 Full error response:`, JSON.stringify(errorData, null, 2));
              }
            } catch (e) {
              console.log(`   ❌ 400 Bad Request (could not parse error)`);
            }
            // Try next auth method, might be auth issue
            continue;
          } else if (status === 401) {
            console.log(`   ❌ 401 with ${authMethod.name} - trying next method...`);
            continue; // Try next auth method
          } else if (status === 404) {
            console.log(`   ⚠️ 404 - endpoint not found: ${endpoint}`);
            break; // Try next endpoint
          } else if (status) {
            // Other HTTP error
            console.log(`   ⚠️ ${status} with ${endpoint} - trying next endpoint...`);
            break; // Try next endpoint
          }
        }
      }
      if (data) break; // Success, exit endpoint loop
    }

    if (!data) {
      throw lastError || new Error("All authentication methods and endpoints failed");
    }

    return {
      text: data?.transcript || "",
      language: data?.language_code || "unknown",
    };
  } catch (error) {
    const statusCode = error?.response?.status;
    const errorData = error?.response?.data;
    
    // Safely extract error message without circular references
    let errorMessage = "Unknown error";
    try {
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : String(errorData.error);
        } else {
          // Try to stringify safely, but catch circular reference errors
          try {
            errorMessage = JSON.stringify(errorData);
          } catch (e) {
            errorMessage = String(errorData);
          }
        }
      } else if (error?.message) {
        errorMessage = error.message;
      } else {
        errorMessage = String(error);
      }
    } catch (e) {
      errorMessage = "Error occurred but could not extract message";
    }
    
    // Log error details safely (avoid circular references)
    console.error("❌ Sarvam API Error Details:");
    console.error("  Status Code:", statusCode || "N/A");
    console.error("  Error Message:", errorMessage);
    
    // Safely log response data
    if (errorData) {
      try {
        const safeData = {};
        if (errorData.message) safeData.message = errorData.message;
        if (errorData.error) safeData.error = errorData.error;
        if (errorData.detail) safeData.detail = errorData.detail;
        if (Object.keys(safeData).length > 0) {
          console.error("  Response Data:", JSON.stringify(safeData, null, 2));
        }
      } catch (e) {
        console.error("  Response Data: (could not parse)");
      }
    }
    
    // Safely extract request URL
    try {
      const requestUrl = error?.config?.url || error?.request?.responseURL || "N/A";
      console.error("  Request URL:", requestUrl);
    } catch (e) {
      console.error("  Request URL: (could not extract)");
    }
    
    // Safely extract header keys
    try {
      if (error?.config?.headers) {
        const headerKeys = Object.keys(error.config.headers).filter(k => 
          !k.toLowerCase().includes('content-type') && 
          !k.toLowerCase().includes('content-length')
        );
        console.error("  Request Headers:", headerKeys.join(", "));
      }
    } catch (e) {
      console.error("  Request Headers: (could not extract)");
    }
    
    if (statusCode === 401) {
      console.error("🔐 Authentication failed (401). Possible issues:");
      console.error("  1. API key might be incorrect, expired, or not activated");
      console.error("  2. Check if API key needs to be activated in Sarvam dashboard");
      console.error("  3. Verify API key format matches Sarvam documentation");
      console.error("  4. Check if your account has speech-to-text API access enabled");
      console.error("  5. API endpoint might be: https://api.sarvam.ai/v1/speech-to-text (with /v1/)");
    } else if (statusCode === 400) {
      console.error("📝 Bad request (400) - check file format and parameters");
    } else if (statusCode >= 500) {
      console.error("🔧 Sarvam API server error - try again later");
    } else if (statusCode) {
      console.error(`⚠️ HTTP ${statusCode} error occurred`);
    } else {
      console.error("⚠️ Network or connection error");
    }
    
    return { text: "", language: "unknown" };
  } finally {
    // Clean up temp file if it exists
    // CRITICAL: Must await unlink to prevent race conditions and resource leaks
    if (tempFilePath) {
      try {
        // Directly attempt to unlink - if file doesn't exist (ENOENT), that's fine
        // This is more efficient than checking access first
        await fs.promises.unlink(tempFilePath);
        console.log(`🗑️ Cleaned up temp file: ${path.basename(tempFilePath)}`);
      } catch (cleanupErr) {
        // File doesn't exist or already deleted - this is fine, just ignore ENOENT
        if (cleanupErr.code !== "ENOENT") {
          // Only log non-ENOENT errors (permission issues, etc.)
          console.warn(`⚠️ Temp file cleanup warning for ${path.basename(tempFilePath)}:`, cleanupErr?.message || cleanupErr);
        }
        // ENOENT errors are silently ignored as they indicate the file was already deleted
      }
    }
  }
}