import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/repositories/base.repository';

@Injectable()
export class CompanyRepository extends BaseRepository<any> {
  constructor(prisma: PrismaService) {
    const relations = {
      stores: true,
      categories: true,
    };
    super(prisma, 'company', relations, true); // 'role' is the Prisma model name
  }
}
