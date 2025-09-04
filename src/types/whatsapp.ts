export interface WhatsAppIncoming {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: {
            body: string;
          };
          interactive?: {
            type: string;
            list_reply?: {
              title: string;
            };
            button_reply?: {
              title: string;
            };
          };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  components: Array<{
    type: string;
    parameters: Array<{
      type: string;
      text?: string;
      image?: {
        link: string;
      };
    }>;
  }>;
}

export interface WhatsAppText {
  messaging_product: string;
  to: string;
  type: string;
  text: {
    body: string;
  };
}

export interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}
