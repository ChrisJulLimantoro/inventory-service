import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/repositories/base.repository';
import { Category } from '@prisma/client';

@Injectable()
export class CategoryRepository extends BaseRepository<any> {
  constructor(prisma: PrismaService) {
    const relations = {
      types: {
        where: {
          deleted_at: null,
        },
      },
      company: true,
    };
    super(prisma, 'category', relations, true); // 'role' is the Prisma model name
  }

  async findAll(filter?: Record<string, any>): Promise<Category[]> {
    if (filter.company_id) {
      return super.findAll({ company_id: filter.company_id });
    }
    // the filter recieved is by owner_id
    const company = this.prisma.company.findMany({
      where: filter,
    });
    // Change the filter for all the categories that belong to the company owned
    const newFilter = {
      company_id: { in: (await company).map((c) => c.id) },
    };
    return super.findAll(newFilter);
  }
}
