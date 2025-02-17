import { RmqContext } from '@nestjs/microservices';

export class RmqAckHelper {
  private static readonly MAX_RETRIES = 5; // Global Retry Limit

  static handleMessageProcessing(
    context: RmqContext,
    callback: () => Promise<any>,
  ) {
    return async () => {
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      const headers = originalMsg.properties.headers || {};
      const retryCount = headers['x-retry-count']
        ? headers['x-retry-count'] + 1
        : 1;

      try {
        // Execute the actual processing function
        await callback();
        channel.ack(originalMsg); // Acknowledge successful processing
      } catch (error) {
        console.error('Error processing message:', error);

        if (retryCount >= this.MAX_RETRIES) {
          console.error(
            `Max retry limit reached (${this.MAX_RETRIES}), rejecting message.`,
          );
          channel.reject(originalMsg, false); // Permanently discard message
        } else {
          console.warn(
            `Retrying message (${retryCount}/${this.MAX_RETRIES})...`,
          );

          // Re-publish the message with updated retry count
          channel.sendToQueue(
            originalMsg.fields.routingKey,
            originalMsg.content,
            {
              headers: { 'x-retry-count': retryCount },
            },
          );

          // Acknowledge the failed attempt
          channel.ack(originalMsg);
        }
      }
    };
  }
}
