import type { ParamsOption, RequestBodyOption } from 'openapi-fetch';
import type { ResponseObjectMap, SuccessResponse } from 'openapi-typescript-helpers';
import type { components, operations } from './schema';

export type ApiRequest<Op extends keyof operations> = ParamsOption<operations[Op]> & RequestBodyOption<operations[Op]>;

export type ApiResponse<Op extends keyof operations> = SuccessResponse<ResponseObjectMap<operations[Op]>>;

export type Schema<T extends keyof components['schemas']> = components['schemas'][T];
