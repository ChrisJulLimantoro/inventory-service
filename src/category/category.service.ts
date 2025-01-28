import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/base.service';
import { CategoryRepository } from 'src/repositories/category.repository';
import { ValidationService } from 'src/validation/validation.service';
import { CreateCategoryRequest } from './dto/create-category.dto';
import { UpdateCategoryRequest } from './dto/update-category.dto';
import { CompanyRepository } from 'src/repositories/company.repository';

@Injectable()
export class CategoryService extends BaseService {
  protected repository = this.categoryRepository;
  protected createSchema = CreateCategoryRequest.schema();
  protected updateSchema = UpdateCategoryRequest.schema();

  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly companyRepository: CompanyRepository,
    protected readonly validation: ValidationService,
  ) {
    super(validation);
  }

  protected transformCreateData(data: any) {
    return new CreateCategoryRequest(data);
  }

  protected transformUpdateData(data: any) {
    return new UpdateCategoryRequest(data);
  }

  async create(data: any) {
    const count = await this.repository.count({
      company_id: data.company_id,
    });
    const company = await this.companyRepository.findOne(data.company_id);
    data.code = `${company.code}${(count + 1).toString().padStart(3, '0')}`;
    return super.create(data);
  }
}
