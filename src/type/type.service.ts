import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/base.service';
import { TypeRepository } from 'src/repositories/type.repository';
import { ValidationService } from 'src/validation/validation.service';
import { CreateTypeRequest } from './dto/create-type.dto';
import { UpdateTypeRequest } from './dto/update-type.dto';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';

@Injectable()
export class TypeService extends BaseService {
  protected repository = this.typeRepository;
  protected createSchema = CreateTypeRequest.schema();
  protected updateSchema = UpdateTypeRequest.schema();

  constructor(
    private readonly typeRepository: TypeRepository,
    protected readonly validation: ValidationService,
  ) {
    super(validation);
  }

  protected transformCreateData(data: any) {
    return new CreateTypeRequest(data);
  }

  protected transformUpdateData(data: any) {
    return new UpdateTypeRequest(data);
  }

  async createBulk(data: Record<string, any>) {
    // Store valid data and errors separately
    const errors: { index: string; error: string }[] = [];
    const entries = Object.entries(data);
    console.log(entries);

    // Validate all data before insertion
    const validatedData = entries
      .map(([key, item]) => {
        console.log(item);
        try {
          return this.validation.validate(item, this.createSchema);
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
      return CustomResponse.error('No valid data to insert.', errors, 400);
    }

    try {
      // Perform bulk insert in parallel
      const createdData = await Promise.all(
        validatedData.map((item) => this.repository.create(item)),
      );

      return CustomResponse.success(
        `New ${createdData.length} Data Created!`,
        createdData,
        201,
      );
    } catch (error) {
      return CustomResponse.error('Failed to insert data.', error, 500);
    }
  }
}
