import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/repositories/base.repository';

@Injectable()
export class StockOpnameRepository extends BaseRepository<any> {
  constructor(prisma: PrismaService) {
    const relations = {
      details: {
        include: {
          productCode: true,
        },
      },
      store: true,
      category: true,
    };
    super(prisma, 'stockOpname', relations, true);
  }
}
