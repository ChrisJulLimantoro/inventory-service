import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';
import { CategoryService } from './category.service';

@Controller('category')
export class CategoryController {
  constructor(
    private readonly service: CategoryService,
    @Inject('MARKETPLACE') private readonly marketplaceClient: ClientProxy,
    @Inject('TRANSACTION') private readonly transactionClient: ClientProxy,
  ) {}

  @MessagePattern({ cmd: 'get:category' })
  @Describe('Get all category')
  async findAll(): Promise<CustomResponse> {
    return this.service.findAll();
  }

  @MessagePattern({ cmd: 'get:category/*' })
  @Describe('Get a category by id')
  async findOne(@Payload() data: any): Promise<CustomResponse | null> {
    const param = data.params;
    return this.service.findOne(param.id);
  }

  @MessagePattern({ cmd: 'post:category' })
  @Describe('Create a new category')
  async create(@Payload() data: any): Promise<CustomResponse> {
    const createData = data.body;
    console.log(data.params);
    createData.created_by = data.params.user.id;

    const response = await this.service.create(createData);
    if (response.success) {
      this.marketplaceClient.emit(
        { service: 'marketplace', module: 'category', action: 'create' },
        response.data,
      );
      this.transactionClient.emit({ cmd: 'category_created' }, response.data);
    }
    return response;
  }

  @MessagePattern({ cmd: 'put:category/*' })
  @Describe('Modify category')
  async update(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const body = data.body;
    const response = await this.service.update(param.id, body);
    if (response.success) {
      this.marketplaceClient.emit(
        { service: 'marketplace', module: 'category', action: 'update' },
        response.data,
      );
      this.transactionClient.emit({ cmd: 'category_updated' }, response.data);
    }
    return response;
  }

  @MessagePattern({ cmd: 'delete:category/*' })
  @Describe('Delete category')
  async delete(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const response = await this.service.delete(param.id);
    if (response.success) {
      this.marketplaceClient.emit(
        { service: 'marketplace', module: 'category', action: 'softdelete' },
        { id: response.data.id },
      );
      this.transactionClient.emit(
        { cmd: 'category_deleted' },
        response.data.id,
      );
    }
    return response;
  }

  @MessagePattern({ cmd: 'get:price-category' })
  @Describe('Get all category price')
  async findAllPriceCategory(): Promise<CustomResponse> {
    return this.service.findAllPriceCategory();
  }

  @MessagePattern({ cmd: 'get:price-category-detail' })
  @Describe('Get price detail by category')
  async findPriceCategoryDetail(@Payload() data: any): Promise<CustomResponse> {
    const body = data.body;
    return this.service.findPriceCategoryDetail(body);
  }
}
