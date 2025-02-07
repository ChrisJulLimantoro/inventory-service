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
  @Describe('Get all operation')
  async findAll(): Promise<CustomResponse> {
    return this.service.findAll();
  }

  @MessagePattern({ cmd: 'get:operation/*' })
  @Describe('Get a operation by id')
  async findOne(@Payload() data: any): Promise<CustomResponse | null> {
    const param = data.params;
    return this.service.findOne(param.id);
  }

  @MessagePattern({ cmd: 'post:operation' })
  @Describe('Create a new operation')
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
  @Describe('Modify operation')
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
  @Describe('Delete operation')
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
