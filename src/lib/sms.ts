import { supabase } from '@/integrations/supabase/client';

type SMSType = 'shoot_assigned' | 'photographer_reached' | 'qc_uploaded';

interface SMSResult {
  success: boolean;
  messageId?: string;
  note?: string;
  error?: string;
}

export async function sendSMS(
  to: string,
  message: string,
  type: SMSType
): Promise<SMSResult> {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: { to, message, type },
    });

    if (error) {
      console.error('SMS error:', error);
      return { success: false, error: error.message };
    }

    return data as SMSResult;
  } catch (err) {
    console.error('SMS request failed:', err);
    return { success: false, error: 'Failed to send SMS' };
  }
}

// Pre-built message templates
export const smsTemplates = {
  shootAssigned: (location: string, date: string) =>
    `New Shoot assigned at ${location} on ${date}. Log in to accept.`,
  
  photographerReached: (merchantName: string, photographerName: string) =>
    `${photographerName} has reached ${merchantName} location.`,
  
  qcUploaded: (merchantName: string, link: string) =>
    `QC Uploaded for ${merchantName}. Review here: ${link}`,
};
