import type { operations } from './schema';
import type {
    SuccessResponse,
    ResponseObjectMap,
    OperationRequestBodyContent,
    RequiredKeysOf,
    Writable,
    IsOperationRequestBodyOptional,
} from 'openapi-typescript-helpers';

type ParamsOption<T> = T extends { parameters: any }
    ? RequiredKeysOf<T['parameters']> extends never
        ? { params?: T['parameters'] }
        : { params: T['parameters'] }
    : { params?: never };

type RequestBodyOption<T> =
    Writable<OperationRequestBodyContent<T>> extends never
        ? { body?: never }
        : IsOperationRequestBodyOptional<T> extends true
          ? { body?: Writable<OperationRequestBodyContent<T>> }
          : { body: Writable<OperationRequestBodyContent<T>> };

export type ApiRequest<Op extends keyof operations> = ParamsOption<operations[Op]> & RequestBodyOption<operations[Op]>;

export type ApiResponse<Op extends keyof operations> = SuccessResponse<ResponseObjectMap<operations[Op]>>;
