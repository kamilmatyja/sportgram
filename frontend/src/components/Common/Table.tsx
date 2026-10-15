import { type ComponentPropsWithoutRef, type FC } from 'react';

import { useTranslation } from '../../context/TranslationContext';

export const TableHead: FC<ComponentPropsWithoutRef<'thead'>> = (props) => <thead {...props} />;
export const TableBody: FC<ComponentPropsWithoutRef<'tbody'>> = (props) => <tbody {...props} />;
export const TableRow: FC<ComponentPropsWithoutRef<'tr'>> = (props) => <tr {...props} />;
export const TableHeaderCell: FC<ComponentPropsWithoutRef<'th'>> = (props) => <th {...props} />;
export const TableCell: FC<ComponentPropsWithoutRef<'td'>> = (props) => <td {...props} />;

export const EmptyTableRow: FC<{ colSpan: number }> = ({ colSpan }) => {
    const { t } = useTranslation();

    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="text-center text-muted">
                {t('noRecords')}
            </TableCell>
        </TableRow>
    );
};
