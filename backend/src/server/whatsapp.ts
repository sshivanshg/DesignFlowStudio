import { IStorage } from "./storage";

// Interfaces for WhatsApp API
interface WhatsAppMessage {
  to: string;
  templateName: string;
  variables?: Record<string, string>;
  language?: string;
}

interface WhatsAppMessageLog {
  id: string;
  leadId?: number;
  clientId?: number;
  messageType: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  content: string;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  metadata?: any;
  retryCount?: number;
}

// Maximum retry attempts for failed messages
const MAX_RETRY_ATTEMPTS = 3;

/**
 * WhatsApp service for integrating with Interakt API
 */
export class WhatsAppService {
  private storage: IStorage;
  private interaktApiKey: string;
  private interaktApiUrl: string;
  private apiInitialized: boolean = false;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.interaktApiKey = process.env.INTERAKT_API_KEY || '';
    this.interaktApiUrl = 'https://api.interakt.ai/v1';
    this.apiInitialized = !!this.interaktApiKey;

    if (!this.apiInitialized) {
      console.warn('Interakt API key not found. WhatsApp functionality will be simulated.');
    }
  }

  /**
   * Send a WhatsApp message using a template
   */
  async sendTemplateMessage(
    phone: string, 
    templateName: string, 
    variables: Record<string, string>,
    leadId?: number,
    clientId?: number
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    try {
      if (!phone) {
        throw new Error('Phone number is required');
      }

      // Format phone number (remove spaces, ensure it starts with +)
      const formattedPhone = this.formatPhoneNumber(phone);
      
      // Create message
      const message: WhatsAppMessage = {
        to: formattedPhone,
        templateName,
        variables,
        language: 'en', // Default to English
      };

      // For demo, log the message content for easy reference
      const messageContent = this.previewTemplateContent(templateName, variables);
      console.log(`[WhatsApp] Sending template "${templateName}" to ${formattedPhone}:`, messageContent);

      // Track in logs
      await this.logMessage({
        id: messageId,
        leadId,
        clientId,
        messageType: templateName,
        status: 'sent',
        content: messageContent,
        sentAt: new Date(),
        metadata: { variables },
        retryCount: 0
      });

      if (this.apiInitialized) {
        // Actual API call to Interakt (if API key is available)
        const response = await fetch(`${this.interaktApiUrl}/public/message/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${this.interaktApiKey}`
          },
          body: JSON.stringify(message)
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to send WhatsApp message');
        }
        
        // Update status in logs
        await this.updateMessageStatus(messageId, 'delivered');
        
        return { 
          success: true, 
          messageId: data.messageId || messageId
        };
      } else {
        // Simulate successful message delivery with delay
        setTimeout(async () => {
          await this.updateMessageStatus(messageId, 'delivered');
          console.log(`[WhatsApp] Message ${messageId} delivered`);
          
          // Simulate read status after another delay
          setTimeout(async () => {
            await this.updateMessageStatus(messageId, 'read');
            console.log(`[WhatsApp] Message ${messageId} read`);
          }, 5000);
        }, 2000);
        
        return { 
          success: true, 
          messageId 
        };
      }
    } catch (error) {
      console.error('[WhatsApp] Error sending message:', error);
      
      // Update log with failed status
      await this.updateMessageStatus(messageId, 'failed', { error: error.message });
      
      return { 
        success: false, 
        messageId,
        error: error.message 
      };
    }
  }

  /**
   * Send welcome message to new lead
   */
  async sendWelcomeMessage(
    leadId: number, 
    name: string, 
    phone: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const variables = {
      name: name || 'there',
      company_name: 'Wonder Creative Studio'
    };
    
    return this.sendTemplateMessage(phone, 'welcome_lead', variables, leadId);
  }

  /**
   * Send proposal follow-up reminder
   */
  async sendProposalFollowUp(
    leadId: number,
    clientId: number,
    name: string,
    phone: string,
    proposalLink: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const variables = {
      name: name || 'there',
      proposal_link: proposalLink,
      company_name: 'Wonder Creative Studio'
    };
    
    return this.sendTemplateMessage(phone, 'proposal_followup', variables, leadId, clientId);
  }

  /**
   * Send site visit confirmation
   */
  async sendSiteVisitConfirmation(
    clientId: number,
    name: string,
    phone: string,
    siteVisitDate: string,
    address: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const variables = {
      name: name || 'there',
      site_visit_date: siteVisitDate,
      address: address,
      company_name: 'Wonder Creative Studio'
    };
    
    return this.sendTemplateMessage(phone, 'site_visit_confirmation', variables, undefined, clientId);
  }

  /**
   * Retry sending failed messages
   */
  async retryFailedMessages(): Promise<{ success: boolean; retriedCount: number }> {
    try {
      // Get failed messages with retry count less than max
      const failedMessages = await this.storage.getWhatsAppFailedMessages(MAX_RETRY_ATTEMPTS);
      
      if (!failedMessages || failedMessages.length === 0) {
        return { success: true, retriedCount: 0 };
      }
      
      let successCount = 0;
      
      for (const message of failedMessages) {
        try {
          // Increment retry count
          const newRetryCount = (message.retryCount || 0) + 1;
          
          // Get variables from metadata
          const variables = message.metadata?.variables || {};
          
          // Make sure phone number is properly formatted
          const formattedPhone = message.to || '';
          
          if (!formattedPhone) {
            console.error(`[WhatsApp] Missing phone number for message ${message.id}`);
            continue;
          }
          
          // Attempt to resend
          const result = await this.sendTemplateMessage(
            formattedPhone, 
            message.messageType, 
            variables, 
            message.leadId, 
            message.clientId
          );
          
          if (result.success) {
            successCount++;
          } else {
            // Update retry count in message log
            await this.storage.updateWhatsAppMessageRetryCount(message.id, newRetryCount);
          }
        } catch (err) {
          console.error(`[WhatsApp] Error retrying message ${message.id}:`, err);
        }
      }
      
      return { 
        success: true, 
        retriedCount: successCount 
      };
    } catch (error) {
      console.error('[WhatsApp] Error retrying failed messages:', error);
      return { 
        success: false, 
        retriedCount: 0 
      };
    }
  }

  /**
   * Log message to database
   */
  private async logMessage(message: WhatsAppMessageLog): Promise<void> {
    try {
      await this.storage.createWhatsAppMessageLog(message);
    } catch (error) {
      console.error('[WhatsApp] Error logging message:', error);
    }
  }

  /**
   * Update message status in logs
   */
  private async updateMessageStatus(
    messageId: string, 
    status: 'sent' | 'delivered' | 'read' | 'failed', 
    metadata?: any
  ): Promise<void> {
    try {
      const statusUpdate: Partial<WhatsAppMessageLog> = { status };
      
      if (status === 'delivered') {
        statusUpdate.deliveredAt = new Date();
      } else if (status === 'read') {
        statusUpdate.readAt = new Date();
      }
      
      if (metadata) {
        statusUpdate.metadata = metadata;
      }
      
      await this.storage.updateWhatsAppMessageStatus(messageId, statusUpdate);
    } catch (error) {
      console.error('[WhatsApp] Error updating message status:', error);
    }
  }

  /**
   * Format phone number for WhatsApp API
   */
  private formatPhoneNumber(phone: string): string {
    // Strip spaces and other non-digit characters except +
    let formatted = phone.replace(/[^0-9+]/g, '');
    
    // Ensure it starts with +
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }
    
    return formatted;
  }

  /**
   * Preview the content of a template (for demo purposes)
   */
  private previewTemplateContent(templateName: string, variables: Record<string, string>): string {
    const templates = {
      'welcome_lead': `Hello {{name}}! 👋 Thank you for your interest in {{company_name}}. We're excited to learn more about your interior design project. Our team will be in touch with you soon to discuss your needs.`,
      
      'proposal_followup': `Hello {{name}}! We noticed you haven't reviewed your proposal from {{company_name}} yet. You can view it here: {{proposal_link}}. Let us know if you have any questions or if you'd like to schedule a call.`,
      
      'site_visit_confirmation': `Hello {{name}}! This is a confirmation for your site visit with {{company_name}} scheduled for {{site_visit_date}} at {{address}}. Please let us know if you need to reschedule.`
    };
    
    let content = templates[templateName] || 'Template not found';
    
    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    
    return content;
  }
}