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
  @Describe({
    description: 'Get all category',
    fe: [
      'master/category:open',
      'master/price:add',
      'master/price:detail',
      'inventory/product:add',
      'inventory/product:edit',
      'inventory/product:detail',
    ],
  })
  async findAll(@Payload() data: any): Promise<CustomResponse> {
    // Filter by owner id because it is an master data determined by the owner
    var filter: any = {
      company: {
        owner_id: data.body.owner_id,
      },
      company_id: data.body.auth.company_id,
    };
    return this.service.findAll(filter);
  }

  @MessagePattern({ cmd: 'get:category/*' })
  @Describe({
    description: 'Get a category by id',
    fe: [
      'master/category:detail',
      'master/category:edit',
      'master/price:add',
      'master/price:detail',
    ],
  })
  async findOne(@Payload() data: any): Promise<CustomResponse | null> {
    const param = data.params;
    return this.service.findOne(param.id);
  }

  @MessagePattern({ cmd: 'post:category' })
  @Describe({
    description: 'Create a new category',
    fe: ['master/category:add'],
  })
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
  @Describe({ description: 'Modify category', fe: ['master/category:edit'] })
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
  @Describe({ description: 'Delete category', fe: ['master/category:delete'] })
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
  @Describe({
    description: 'Get all category price',
    fe: ['master/price:open'],
  })
  async findAllPriceCategory(): Promise<CustomResponse> {
    return this.service.findAllPriceCategory();
  }

  @MessagePattern({ cmd: 'get:price-category-detail' })
  @Describe({
    description: 'Get price detail by category',
    fe: ['master/price:detail'],
  })
  async findPriceCategoryDetail(@Payload() data: any): Promise<CustomResponse> {
    const body = data.body;
    return this.service.findPriceCategoryDetail(body);
  }
}
