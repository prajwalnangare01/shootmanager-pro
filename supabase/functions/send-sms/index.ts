import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  to: string;
  message: string;
  type: 'shoot_assigned' | 'photographer_reached' | 'qc_uploaded';
}

// Mock SMS function - replace with Twilio when credentials are available
async function sendSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Check if Twilio credentials are configured
  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (twilioSid && twilioToken && twilioPhone) {
    // Real Twilio implementation
    try {
      const credentials = btoa(`${twilioSid}:${twilioToken}`);
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: to,
            From: twilioPhone,
            Body: message,
          }),
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        console.log("SMS sent successfully via Twilio:", data.sid);
        return { success: true, messageId: data.sid };
      } else {
        console.error("Twilio error:", data);
        return { success: false, error: data.message };
      }
    } catch (error: unknown) {
      console.error("Twilio request failed:", error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  } else {
    // Mock SMS - log to console
    console.log("=== MOCK SMS ===");
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log("================");
    
    return { 
      success: true, 
      messageId: `mock_${Date.now()}`,
    };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, type }: SMSRequest = await req.json();

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: "Missing 'to' or 'message' field" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Processing SMS request - Type: ${type}, To: ${to}`);
    
    const result = await sendSMS(to, message);

    if (result.success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          messageId: result.messageId,
          note: Deno.env.get("TWILIO_ACCOUNT_SID") ? "Sent via Twilio" : "Mocked (Twilio not configured)"
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  } catch (error: unknown) {
    console.error("Error in send-sms function:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
