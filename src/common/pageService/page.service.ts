import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { PaginationDto } from '../pagination/pagination.dto';

export abstract class AbstractService<T extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  protected createQuery(alias: string): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(alias);
  }
  protected baseQuery(
    alias: string,
    filters: Record<string, any> = {},
    searchFields: string[] = [],
  ): SelectQueryBuilder<T> {
    const qb = this.createQuery(alias);
    const { search, ...otherFilters } = filters;
    if (search && searchFields.length > 0) {
      this.applySearch(qb, alias, searchFields, search);
    }
    this.applyFilters(qb, alias, otherFilters);
    return qb;
  }

  protected applyFilters(
    qb: SelectQueryBuilder<T>,
    alias: string,
    filters: Record<string, any>,
  ) {
    if (!filters) return;
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        const paramName = `filter_${key.replace('.', '_')}`;
        qb.andWhere(`${alias}.${key} = :${paramName}`, {
          [paramName]: value,
        });
      }
    });
  }

  protected applySearch(
    qb: SelectQueryBuilder<T>,
    alias: string,
    fields: string[],
    search?: string,
  ) {
    if (!search || fields.length === 0) return;
    const conditions = fields
      .map((field) => `${alias}.${field} ILIKE :search`)
      .join(' OR ');
    qb.andWhere(`(${conditions})`, {
      search: `%${search}%`,
    });
  }

  protected async paginate(
    qb: SelectQueryBuilder<T>,
    pagination: PaginationDto,
  ) {
    const { page, limit } = pagination;
    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    const lastPage = Math.ceil(total / limit);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage,
      },
    };
  }
}
