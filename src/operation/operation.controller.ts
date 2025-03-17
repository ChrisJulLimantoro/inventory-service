import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';
import { OperationService } from './operation.service';

@Controller('operation')
export class OperationController {
  constructor(
    private readonly service: OperationService,
    @Inject('TRANSACTION') private readonly transactionClient: ClientProxy,
    @Inject('MARKETPLACE') private readonly marketplaceClient: ClientProxy,
  ) {}

  @MessagePattern({ cmd: 'get:operation' })
  @Describe({
    description: 'Get all operation',
    fe: [
      'inventory/operation:open',
      'transaction/sales:add',
      'transaction/sales:edit',
      'transaction/sales:detail',
    ],
  })
  async findAll(@Payload() data: any): Promise<CustomResponse> {
    const filter = { store_id: data.body.auth.store_id };
    const { page, limit, sort, search } = data.body;
    return this.service.findAll(filter, page, limit);
  }

  @MessagePattern({ cmd: 'get:operation/*' })
  @Describe({
    description: 'Get a operation by id',
    fe: ['inventory/operation:edit', 'inventory/operation:detail'],
  })
  async findOne(@Payload() data: any): Promise<CustomResponse | null> {
    const param = data.params;
    return this.service.findOne(param.id);
  }

  @MessagePattern({ cmd: 'post:operation' })
  @Describe({
    description: 'Create a new operation',
    fe: ['inventory/operation:add'],
  })
  async create(@Payload() data: any): Promise<CustomResponse> {
    const createData = data.body;
    console.log(data.params);
    createData.owner_id = data.params.user.id;

    const response = await this.service.create(createData);
    if (response.success) {
      this.transactionClient.emit({ cmd: 'operation_created' }, response.data);
      this.marketplaceClient.emit({ cmd: 'operation_created' }, response.data);
    }
    return response;
  }

  @MessagePattern({ cmd: 'put:operation/*' })
  @Describe({
    description: 'Modify operation',
    fe: ['inventory/operation:edit'],
  })
  async update(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const body = data.body;
    const response = await this.service.update(param.id, body);
    if (response.success) {
      this.transactionClient.emit({ cmd: 'operation_updated' }, response.data);
      this.marketplaceClient.emit({ cmd: 'operation_updated' }, response.data);
    }
    return response;
  }

  @MessagePattern({ cmd: 'delete:operation/*' })
  @Describe({
    description: 'Delete operation',
    fe: ['inventory/operation:delete'],
  })
  async delete(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const response = await this.service.delete(param.id);
    if (response.success) {
      this.transactionClient.emit(
        { cmd: 'operation_deleted' },
        response.data.id,
      );
      this.marketplaceClient.emit(
        { cmd: 'operation_deleted' },
        response.data.id,
      );
    }
    return response;
  }
}
