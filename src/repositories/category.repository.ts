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

  async findAll(
    filter?: Record<string, any>,
    page?: number,
    limit?: number,
    sort?: Record<string, 'asc' | 'desc'>,
    search?: string,
  ): Promise<{
    data: Category[];
    total?: number;
    page?: number;
    totalPages?: number;
  }> {
    if (filter?.company_id) {
      return super.findAll(filter, page, limit, sort, search);
    }

    // Find all companies owned by the given owner_id
    const companies = await this.prisma.company.findMany({
      where: filter,
      select: { id: true },
    });

    // Extract company IDs and adjust the filter
    const companyIds = companies.map((c) => c.id);
    const newFilter = { company_id: { in: companyIds } };

    // Call the base repository findAll with the updated filter
    return super.findAll(newFilter, page, limit, sort, search);
  }
}
