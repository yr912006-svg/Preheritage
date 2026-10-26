// Mobile OTP Service for PREHERITAGE (India & International)
// Supports Fast2SMS, MSG91, Twilio, and Mock mode for testing

export interface SendOtpResult {
  success: boolean;
  message: string;
  mockOtp?: string; // only returned in development / mock mode
}

export async function sendOtpSms(phone: string, otp: string): Promise<SendOtpResult> {
  const provider = (process.env.OTP_PROVIDER || "MOCK").toUpperCase();
  const cleanPhone = phone.replace(/[^0-9]/g, "");

  console.info(`[PREHERITAGE OTP] Dispatch requested via ${provider}`);

  // Development / Mock mode
  if (provider === "MOCK" && process.env.NODE_ENV !== "production") {
    return {
      success: true,
      message: `OTP sent successfully (Simulated: ${otp})`,
      mockOtp: otp,
    };
  }

  // 1. FAST2SMS (India Bulk SMS API)
  if (provider === "FAST2SMS") {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) return { success: false, message: "Fast2SMS API key not configured" };

    try {
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: otp,
          numbers: cleanPhone.slice(-10), // Last 10 digits for Indian mobile
        }),
      });

      const data = await response.json();
      if (data.return) {
        return { success: true, message: "OTP sent to your mobile phone" };
      }
      return { success: false, message: data.message || "Failed to send OTP via Fast2SMS" };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  // 2. MSG91
  if (provider === "MSG91") {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    if (!authKey || !templateId) return { success: false, message: "MSG91 not configured" };

    try {
      const formattedNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${formattedNumber}&authkey=${authKey}&otp=${otp}`;
      const response = await fetch(url, { method: "POST" });
      const data = await response.json();
      if (data.type === "success") {
        return { success: true, message: "OTP sent to your mobile phone" };
      }
      return { success: false, message: data.message || "Failed to send OTP" };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  // 3. TWILIO
  if (provider === "TWILIO") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!accountSid || !authToken || !fromNumber) {
      return { success: false, message: "Twilio not configured" };
    }

    try {
      const formattedPhone = cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`;
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

      const bodyParams = new URLSearchParams({
        From: fromNumber,
        To: formattedPhone,
        Body: `Your PREHERITAGE verification code is ${otp}. Valid for 10 minutes. Do not share with anyone.`,
      });

      const res = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: bodyParams.toString(),
      });

      if (res.ok) {
        return { success: true, message: "OTP sent successfully" };
      }
      const data = await res.json();
      return { success: false, message: data.message || "Failed to send SMS via Twilio" };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  return { success: false, message: "OTP delivery provider is not configured." };
}
