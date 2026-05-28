import {useEffect, useState} from 'react';
import {PageProvider} from '../../api/providers/PageProvider';
import {PageResponse} from '../../api/responses/PageResponse';
import {PageFilterQuery} from '../../api/queries/PageFilterQuery';
import {PageIndexQuery} from '../../api/queries/PageIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {useListFilters} from '../../utils/hooks/useListFilters';

export function usePages() {
    const access = useAppAccess();
    const pageProvider = new PageProvider();

    const [pages, setPages] = useState<PageResponse[]>([]);
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const list = useListFilters(new PageFilterQuery());

    const fetchPages = async () => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new PageFilterQuery();
            filterDto.title = list.filters.title;
            filterDto.link = list.filters.link;
            filterDto.status = list.filters.status ? Number(list.filters.status) : undefined;

            const indexDto = new PageIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
            indexDto.filter = filterDto;

            const data = await pageProvider.index(indexDto);
            setPages(data);
        } catch (err: any) {
            setDataError(err.error);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError) {
            fetchPages();
        }
    }, [access.authLoading, access.authError, list.page, list.limit, list.sort, list.filters]);

    return {
        ...access,
        ...list,
        pages,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        fetchPages
    };
}