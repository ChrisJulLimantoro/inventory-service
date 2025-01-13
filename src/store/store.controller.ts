import { Controller } from '@nestjs/common';
import { StoreService } from './store.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { Exempt } from 'src/decorator/exempt.decorator';

@Controller('store')
export class StoreController {
  constructor(private readonly service: StoreService) {}

  @EventPattern({ cmd: 'store_created' })
  @Exempt()
  async storeCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Store created emit received', data);
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    const sanitizedData = {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      deleted_at: data.deleted_at ? new Date(data.deleted_at) : null,
    };

    try {
      const response = await this.service.create(sanitizedData);
      if (response.success) {
        channel.ack(originalMsg);
      }
    } catch (error) {
      console.error('Error processing store_created event', error.stack);
      channel.nack(originalMsg);
      // Optional: Send the error message to a DLQ (Dead Letter Queue) or retry queue
    }
  }

  @EventPattern({ cmd: 'store_deleted' })
  @Exempt()
  async storeDeleted(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Store deleted emit received', data);
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const response = await this.service.delete(data);
      if (response.success) {
        channel.ack(originalMsg);
      }
    } catch (error) {
      console.error('Error processing store_deleted event', error.stack);
      channel.nack(originalMsg);
      // Optional: Send the error message to a DLQ (Dead Letter Queue) or retry queue
    }
  }

  @EventPattern({ cmd: 'store_updated' })
  @Exempt()
  async storeUpdated(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Store Updated emit received', data);
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    const sanitizedData = {
      code: data.code,
      name: data.name,
    };

    try {
      const response = await this.service.update(data.id, sanitizedData);
      if (response.success) {
        channel.ack(originalMsg);
      }
    } catch (error) {
      console.error('Error processing store_updated event', error.stack);
      channel.nack(originalMsg);
      // Optional: Send the error message to a DLQ (Dead Letter Queue) or retry queue
    }
  }
}
