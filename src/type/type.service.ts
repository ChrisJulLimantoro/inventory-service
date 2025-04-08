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
      data.map(async (d, index) => {
        d.code = `${catCode}${await this.generateCode(d.category_id, index)}`;
        try {
          if (Number(d.percent_price_reduction) > 0) {
            d.fixed_price_reduction = 0;
          }
          if (Number(d.percent_broken_reduction) > 0) {
            d.fixed_broken_reduction = 0;
          }
        } catch (e) {
          console.log('error', e);
        }
        return d; // Return the modified object
      }),
    );

    console.log(data);
    return super.bulkCreate(data);
  }

  async bulkUpdate(data: Record<string, any>[]): Promise<CustomResponse> {
    if (data.length === 0) {
      return CustomResponse.error('Data cannot be empty', null, 400);
    }
    data = await Promise.all(
      data.map(async (d) => {
        if (Number(d.percent_price_reduction) > 0) {
          d.fixed_price_reduction = 0;
        }
        if (Number(d.percent_broken_reduction) > 0) {
          d.fixed_broken_reduction = 0;
        }
        return d; // Return the modified object
      }),
    );
    // Validate all the data
    const errors: { index: string; error: string }[] = [];
    const entries = Object.entries(data);
    const validatedData = entries
      .map(([key, item]) => {
        try {
          const id = item.id;
          item = this.transformUpdateData(item);
          return {
            id: id,
            data: this.validation.validate(item, this.updateSchema),
          };
        } catch (error) {
          errors.push({
            index: key,
            error: error.message || 'Validation failed',
          });
          return null; // Skip invalid items
        }
      })
      .filter((item) => item !== null); // Remove `null` (invalid entries)

    if (validatedData.length === 0) {
      return CustomResponse.error('No valid data to update.', errors, 400);
    }

    try {
      // Perform bulk insert in parallel
      const updatedData = await Promise.all(
        validatedData.map((item) => this.repository.update(item.id, item.data)),
      );

      return CustomResponse.success(
        `New ${updatedData.length} Data Created!`,
        updatedData,
        201,
      );
    } catch (error) {
      return CustomResponse.error('Failed to insert data.', error, 500);
    }
  }

  async create(data: Record<string, any>): Promise<CustomResponse> {
    const catCode = await this.generateCode(data.category_id);
    const comp = await this.categoryRepository.findOne(data.category_id);
    data.code = comp.code + catCode;
    if (Number(data.percent_price_reduction) > 0) {
      data.fixed_price_reduction = 0;
    }
    if (Number(data.percent_broken_reduction) > 0) {
      data.fixed_broken_reduction = 0;
    }
    console.log(data);
    return super.create(data);
  }

  async update(id: string, data: Record<string, any>): Promise<CustomResponse> {
    if (Number(data.percent_price_reduction) > 0) {
      data.fixed_price_reduction = 0;
    }
    if (Number(data.percent_broken_reduction) > 0) {
      data.fixed_broken_reduction = 0;
    }
    return super.update(id, data);
  }

  async generateCode(category_id: string, index: number = 0): Promise<string> {
    const count = await this.typeRepository.count({ category_id });
    return (count + 1 + index).toString().padStart(2, '0');
  }

  async delete(id: string): Promise<CustomResponse> {
    const type = await this.typeRepository.findOne(id);
    if (!type) {
      throw new Error('Type not found');
    }
    if (type.products.length > 0) {
      throw new Error(
        'Cannot delete type with associated products. Please remove the products first.',
      );
    }
    return super.delete(id);
  }
}
