import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';
import { TypeService } from './type.service';

@Controller('type')
export class TypeController {
  constructor(
    private readonly service: TypeService,
    @Inject('MARKETPLACE') private readonly marketplaceClient: ClientProxy,
    @Inject('TRANSACTION') private readonly transactionClient: ClientProxy,
  ) {}

  @MessagePattern({ cmd: 'get:type' })
  @Describe('Get all type')
  async findAll(): Promise<CustomResponse> {
    return this.service.findAll();
  }

  @MessagePattern({ cmd: 'get:type/*' })
  @Describe('Get a type by id')
  async findOne(@Payload() data: any): Promise<CustomResponse | null> {
    const param = data.params;
    return this.service.findOne(param.id);
  }

  @MessagePattern({ cmd: 'post:type' })
  @Describe('Create a new type')
  async create(@Payload() data: any): Promise<CustomResponse> {
    const createData = data.body;
    console.log(data.params);
    createData.owner_id = data.params.user.id;

    const response = await this.service.create(createData);
    if (response.success) {
      this.marketplaceClient.emit(
        { service: 'marketplace', module: 'type', action: 'create' },
        response.data,
      );
      this.transactionClient.emit({ cmd: 'type_created' }, response.data);
    }
    return response;
  }

  @MessagePattern({ cmd: 'put:type/*' })
  @Describe('Modify type')
  async update(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const body = data.body;
    const response = await this.service.update(param.id, body);
    if (response.success) {
      this.marketplaceClient.emit(
        { service: 'marketplace', module: 'type', action: 'update' },
        response.data,
      );
      this.transactionClient.emit({ cmd: 'type_updated' }, response.data);
    }
    return response;
  }

  @MessagePattern({ cmd: 'delete:type/*' })
  @Describe('Delete type')
  async delete(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const response = await this.service.delete(param.id);
    if (response.success) {
      this.marketplaceClient.emit(
        { service: 'marketplace', module: 'type', action: 'softdelete' },
        { id: response.data.id },
      );
      this.transactionClient.emit({ cmd: 'type_deleted' }, response.data.id);
    }
    return response;
  }
}
