import type { FilterQuery, Model } from 'mongoose';

export type QueryString = Record<string, string | undefined>;

export class ApiFeatures<TDoc> {
  mongooseQuery: ReturnType<Model<TDoc>['find']>;

  queryString: QueryString;

  paginationData?: Record<string, unknown>;

  constructor(mongooseQuery: ReturnType<Model<TDoc>['find']>, queryString: QueryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  filter(): this {
    const queryStringObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'keyword'];
    excludedFields.forEach((field) => {
      delete queryStringObj[field];
    });
    let queryStr = JSON.stringify(queryStringObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    const filters = JSON.parse(queryStr) as FilterQuery<TDoc>;
    this.mongooseQuery = this.mongooseQuery.find(filters);
    return this;
  }

  search(modelName: string): this {
    const keyword = this.queryString.keyword;
    if (keyword) {
      let query: FilterQuery<TDoc> = {};
      if (modelName === 'Product') {
        query = {
          $or: [
            { title: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
          ],
        } as FilterQuery<TDoc>;
      } else {
        query = { name: { $regex: keyword, $options: 'i' } } as FilterQuery<TDoc>;
      }
      this.mongooseQuery = this.mongooseQuery.find(query);
    }
    return this;
  }

  sort(): this {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort('-createdAt');
    }
    return this;
  }

  limitFields(): this {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select('-__v');
    }
    return this;
  }

  paginate(documentsCount: number): this {
    const page = (this.queryString.page ? Number(this.queryString.page) : 1) || 1;
    const limit = (this.queryString.limit ? Number(this.queryString.limit) : 50) || 50;
    const skip = (page - 1) * limit;
    const endIndex = page * limit;

    const pagination: Record<string, unknown> = {};
    pagination.page = page;
    pagination.limit = limit;
    pagination.numberOfPages = Math.ceil(documentsCount / limit);

    if (endIndex < documentsCount) {
      pagination.next = page + 1;
    }
    if (skip > 0) {
      pagination.prev = page - 1;
    }

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    this.paginationData = pagination;
    return this;
  }
}
