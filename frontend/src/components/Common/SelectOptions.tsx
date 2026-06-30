import { type FC } from 'react';

export interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectOptionsProps {
    options: SelectOption[];
    placeholder?: string;
}

const SelectOptions: FC<SelectOptionsProps> = ({ options, placeholder }) => (
    <>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
                {option.label}
            </option>
        ))}
    </>
);

export default SelectOptions;
