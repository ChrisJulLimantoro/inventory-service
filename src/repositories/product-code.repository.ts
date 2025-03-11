import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/repositories/base.repository';

@Injectable()
export class ProductCodeRepository extends BaseRepository<any> {
  constructor(prisma: PrismaService) {
    const relations = {
      product: {
        include: {
          type: {
            include: {
              category: true,
            },
          },
          store: {
            include: {
              company: true,
            },
          },
        },
      },
    };
    super(prisma, 'productCode', relations, true); // 'role' is the Prisma model name
  }

  async getProductCode(code: string) {
    if (!code) {
      return null;
    }
    return this.prisma.productCode.findFirst({
      where: {
        barcode: code,
        deleted_at: null,
      },
      include: {
        product: {
          include: {
            type: {
              include: {
                prices: {
                  where: {
                    deleted_at: null,
                    is_active: true,
                  },
                  orderBy: {
                    created_at: 'desc',
                  },
                },
                category: true,
              },
            },
          },
        },
      },
    });
  }
}
