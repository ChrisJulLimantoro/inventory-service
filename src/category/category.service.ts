import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/base.service';
import { CategoryRepository } from 'src/repositories/category.repository';
import { ValidationService } from 'src/validation/validation.service';
import { CreateCategoryRequest } from './dto/create-category.dto';
import { UpdateCategoryRequest } from './dto/update-category.dto';
import { CompanyRepository } from 'src/repositories/company.repository';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService extends BaseService {
  protected repository = this.categoryRepository;
  protected createSchema = CreateCategoryRequest.schema();
  protected updateSchema = UpdateCategoryRequest.schema();

  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly companyRepository: CompanyRepository,
    protected readonly validation: ValidationService,
    private readonly prisma: PrismaService,
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

  async findAllPriceCategory(): Promise<CustomResponse> {
    const categories = await this.prisma.category.findMany({
      include: {
        types: {
          where: {
            deleted_at: null,
          },
          orderBy: {
            code: 'asc',
          },
          include: {
            prices: {
              where: {
                deleted_at: null,
              },
              orderBy: {
                date: 'desc',
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
      where: {
        deleted_at: null,
      },
    });

    if (!categories) {
      return CustomResponse.error('No data found', []);
    }

    var data = [];

    for (const category of categories) {
      for (const type of category.types) {
        for (const price of type.prices) {
          // Ensure date comparison is consistent
          let categoryEntry = data.find(
            (x) =>
              x.category.id === category.id &&
              new Date(x.date).toISOString().split('T')[0] ===
                new Date(price.date).toISOString().split('T')[0],
          );

          if (!categoryEntry) {
            categoryEntry = {
              id: `${category.id};${new Date(price.date).toISOString()}`,
              category: {
                id: category.id,
                name: category.name,
                code: category.code,
              },
              types: [],
              date: price.date,
            };
            data.push(categoryEntry);
          }

          let typeEntry = categoryEntry.types.find((y) => y.id === type.id);
          if (!typeEntry) {
            categoryEntry.types.push({
              id: type.id,
              name: type.name,
              code: type.code,
              price: price.price,
            });
          } else {
            typeEntry.price = price.price;
          }
        }
      }
    }

    return CustomResponse.success('Data found', data);
  }

  async findPriceCategoryDetail(body: {
    category_id: string;
    date: string;
  }): Promise<CustomResponse> {
    const category = await this.prisma.category.findFirst({
      where: {
        id: body.category_id,
        deleted_at: null,
      },
      include: {
        types: {
          where: {
            deleted_at: null, // Ensure only non-deleted types are included
          },
          include: {
            prices: {
              where: {
                deleted_at: null,
                date: new Date(body.date), // Ensure correct Date format
              },
            },
          },
        },
      },
    });

    if (!category) {
      return CustomResponse.error('No data found', []);
    }

    const data = {
      category_id: category.id,
      date: body.date,
      prices: category.types.map((type) => {
        const price = type.prices[0];
        return {
          id: price.id,
          type_id: type.id,
          type_name: `${type.code}-${type.name}`,
          price: price ? price.price : null,
        };
      }),
    };

    return CustomResponse.success('Data Found', data);
  }
}
