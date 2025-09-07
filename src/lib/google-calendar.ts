import { google } from 'googleapis';
import { env } from './env';

// Carrega as credenciais da Service Account do Base64
function getServiceAccountCredentials() {
  if (!env.google.saJsonBase64) {
    throw new Error('GOOGLE_SA_JSON_BASE64 environment variable is not set.');
  }
  const decoded = Buffer.from(env.google.saJsonBase64, 'base64').toString('utf8');
  return JSON.parse(decoded);
}

// Inicializa o cliente JWT para autenticação
const auth = new google.auth.JWT(
  getServiceAccountCredentials().client_email,
  undefined,
  getServiceAccountCredentials().private_key,
  ['https://www.googleapis.com/auth/calendar']
);

// Inicializa o serviço do Google Calendar
const calendar = google.calendar({ version: 'v3', auth });

interface CreateEventParams {
  summary: string;
  description?: string;
  startDateTime: string; // ISO 8601 format
  endDateTime: string;   // ISO 8601 format
  attendees?: string[]; // Array of emails
  calendarId?: string; // Defaults to 'primary'
}

export async function createCalendarEvent({
  summary,
  description,
  startDateTime,
  endDateTime,
  attendees,
  calendarId = 'primary',
}: CreateEventParams) {
  try {
    const event = {
      summary,
      description,
      start: {
        dateTime: startDateTime,
        timeZone: env.app.tz, // Use application's timezone
      },
      end: {
        dateTime: endDateTime,
        timeZone: env.app.tz,
      },
      attendees: attendees?.map(email => ({ email })),
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    return { success: true, eventId: response.data.id, htmlLink: response.data.htmlLink };
  } catch (error: any) {
    console.error('Error creating calendar event:', error.message);
    return { success: false, error: error.message };
  }
}
