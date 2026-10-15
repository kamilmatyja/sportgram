import React, { ChangeEvent } from 'react';

import { FileUtil } from './FileUtil';

const NUMERIC_INPUT_TYPES = ['number', 'range', 'select-one'];

function parseValue(type: string, value: string): string | number | null {
    if (value === '') return null;
    if (!NUMERIC_INPUT_TYPES.includes(type)) return value;
    return /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
}

export function createFormHandler<T>(setter: React.Dispatch<React.SetStateAction<T>>) {
    return async (e: ChangeEvent<any>) => {
        const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        const { name, type, value, checked, multiple, options, files } = target as any;

        let newValue: any;
        if (type === 'file') {
            const file = files?.[0];
            if (file) {
                newValue = await FileUtil.fileToBase64(file);
            } else {
                newValue = '';
            }
        } else if (type === 'checkbox') {
            newValue = checked;
        } else if (multiple) {
            newValue = Array.from(options)
                .filter((o: any) => o.selected)
                .map((o: any) => parseValue('select-one', o.value));
        } else {
            newValue = parseValue(type, value);
        }
        setter((prev: any) => ({ ...prev, [name]: newValue }));
    };
}

export function createSubmitHandler(handler: () => Promise<unknown> | void) {
    return async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        await handler();
    };
}
