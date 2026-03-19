export interface MetaData {
  total: number;
  page: number;
  lastPage: number;
}

export interface GlobalResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
  meta?: MetaData;
  errors?: any;
}
