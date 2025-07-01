import { CustomResponse } from './exception/dto/custom-response.dto';
import { ValidationService } from './validation/validation.service';

export abstract class BaseService {
  // Abstract repository, which will be defined by the child service
  protected abstract repository: any;
  protected abstract createSchema: any;
  protected abstract updateSchema: any;

  constructor(protected readonly validation: ValidationService) {}

  protected transformCreateData(data: any): any {
    return data; // Default implementation (no transformation)
  }

  protected transformUpdateData(data: any): any {
    return data; // Default implementation (no transformation)
  }

  // Create
  async create(data: any, user_id?: string): Promise<CustomResponse> {
    data = this.transformCreateData(data);
    const validatedData = this.validation.validate(data, this.createSchema);
    const newData = await this.repository.create(validatedData, user_id);
    if (!newData) {
      return CustomResponse.error('Failed to create new data', null, 500);
    }
    return CustomResponse.success('New Data Created!', newData, 201);
  }

  // Find all
  async findAll(
    filter?: Record<string, any>,
    page?: number,
    limit?: number,
    sort?: Record<string, 'asc' | 'desc'>,
    search?: string,
  ): Promise<CustomResponse> {
    try {
      page = page ? parseInt(page.toString()) : 0;
      limit = limit ? parseInt(limit.toString()) : 0;
    } catch (error) {
      return CustomResponse.error('Invalid page or limit', null, 400);
    }
    const data = await this.repository.findAll(
      filter,
      page,
      limit,
      sort,
      search,
    );
    console.log('category get', data);
    // const transform = {
    //   ...data,
    //   data: this.transformPrismaArray(data.data),
    // };
    return CustomResponse.success('Data Found!', data, 200);
  }

  // Find one by ID
  async findOne(id: string): Promise<CustomResponse | null> {
    const data = await this.repository.findOne(id);
    if (!data) {
      return CustomResponse.error('Data not found', null, 404);
    }
    return CustomResponse.success('Data found!', data, 200);
  }

  async createReplica(data: any, user_id?: string): Promise<CustomResponse> {
    const newData = await this.repository.create(data, user_id);
    if (!newData) {
      return CustomResponse.error('Failed to create new data', null, 500);
    }
    return CustomResponse.success('New Data Created!', newData, 201);
  }

  // Update
  async update(
    id: string,
    data: any,
    user_id?: string,
  ): Promise<CustomResponse> {
    data = this.transformUpdateData(data);
    const oldData = await this.repository.findOne(id);
    if (!oldData) {
      return CustomResponse.error('Data not found', null, 404);
    }
    const validatedData = this.validation.validate(data, this.updateSchema);
    const newData = await this.repository.update(id, validatedData, user_id);
    return CustomResponse.success('Data Updated!', newData, 204);
  }

  // Delete
  async delete(id: string, user_id?: string): Promise<CustomResponse> {
    const data = await this.repository.findOne(id);
    if (!data) {
      return CustomResponse.error('Data not found', null, 404);
    }
    await this.repository.delete(id, user_id);
    return CustomResponse.success('Data deleted!', data, 204);
  }

  async bulkCreate(
    data: Record<string, any>,
    user_id?: string,
  ): Promise<CustomResponse> {
    // Store valid data and errors separately
    const errors: { index: string; error: string }[] = [];
    const entries = Object.entries(data);

    console.log('entries', entries);

    // Validate all data before insertion
    const validatedData = entries
      .map(([key, item]) => {
        try {
          item = this.transformCreateData(item);
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
        validatedData.map((item) => this.repository.create(item, user_id)),
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

  parseBooleanValues = (filter: Record<string, any>) => {
    const parsedFilter: Record<string, any> = {};

    Object.keys(filter).forEach((key) => {
      if (filter[key] === 'true') {
        parsedFilter[key] = true;
      } else if (filter[key] === 'false') {
        parsedFilter[key] = false;
      } else {
        parsedFilter[key] = filter[key]; // Keep other values unchanged
      }
    });

    return parsedFilter;
  };

  async sync(data: any) {
    const transformedData = data.data.map((d) => this.transformCreateData(d));

    const d = await this.repository.sync(transformedData); // Pass all transformed data at once

    if (!d) {
      return CustomResponse.error('Failed to sync Data', null, 500);
    }

    return CustomResponse.success('Data Synced!', d, 200);
  }
}
