import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/repositories/base.repository';

@Injectable()
export class ProductRepository extends BaseRepository<any> {
  constructor(prisma: PrismaService) {
    const relations = {
      store: true,
      type: {
        include: {
          category: true,
        },
      },
      product_codes: {
        where: {
          deleted_at: null,
        },
      },
    };
    super(prisma, 'product', relations, true); // 'role' is the Prisma model name
  }

  async getTypeCode(type_id: string) {
    return this.prisma.type.findFirst({
      where: {
        id: type_id,
      },
      select: {
        code: true,
      },
    });
  }
}
