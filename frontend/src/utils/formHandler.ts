import React, {ChangeEvent} from 'react';
import {FileUtil} from './FileUtil';

export function createFormHandler<T>(setter: React.Dispatch<React.SetStateAction<T>>) {
    return async (e: ChangeEvent<any>) => {
        const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        const {name, type, value, checked, multiple, options, files} = target as any;

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
            newValue = Array.from(options).filter((o: any) => o.selected).map((o: any) => o.value);
            newValue = newValue.map((v: string) => Number(v));
        } else {
            if (typeof value === 'string' && value === '') {
                newValue = null;
            } else if (typeof value === 'string' && /^\d+$/.test(value)) {
                newValue = Number(value);
            } else {
                newValue = value;
            }
        }
        setter((prev: any) => ({...prev, [name]: newValue}));
    };
}
