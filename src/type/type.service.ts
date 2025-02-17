import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/base.service';
import { TypeRepository } from 'src/repositories/type.repository';
import { ValidationService } from 'src/validation/validation.service';
import { CreateTypeRequest } from './dto/create-type.dto';
import { UpdateTypeRequest } from './dto/update-type.dto';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';
import { CategoryRepository } from 'src/repositories/category.repository';

@Injectable()
export class TypeService extends BaseService {
  protected repository = this.typeRepository;
  protected createSchema = CreateTypeRequest.schema();
  protected updateSchema = UpdateTypeRequest.schema();

  constructor(
    private readonly typeRepository: TypeRepository,
    protected readonly validation: ValidationService,
    private readonly categoryRepository: CategoryRepository,
  ) {
    super(validation);
  }

  protected transformCreateData(data: any) {
    return new CreateTypeRequest(data);
  }

  protected transformUpdateData(data: any) {
    return new UpdateTypeRequest(data);
  }

  async bulkCreate(data: Record<string, any>[]): Promise<CustomResponse> {
    if (data.length === 0) {
      return CustomResponse.error('Data cannot be empty', null, 400);
    }
    const catCode = (await this.categoryRepository.findOne(data[0].category_id))
      .code;
    data = await Promise.all(
      data.map(async (d) => {
        d.code = `${catCode}${await this.generateCode(d.category_id)}`;
        return d; // Return the modified object
      }),
    );
    console.log(data);
    return super.bulkCreate(data);
  }

  async create(data: Record<string, any>): Promise<CustomResponse> {
    const catCode = await this.generateCode(data.category_id);
    const comp = await this.categoryRepository.findOne(data.category_id);
    data.code = comp.code + catCode;
    console.log(data);
    return super.create(data);
  }

  async generateCode(category_id: string): Promise<string> {
    const count = await this.typeRepository.count({ category_id });
    return (count + 1).toString().padStart(2, '0');
  }
}
