import { useEffect, useState } from 'react';
import { UserService } from '../api/UserService';
import { UserIndexDto } from '../api/dto/UserIndexDto';
import { UserFilterDto } from '../api/dto/UserFilterDto';
import { useTranslation } from '../context/TranslationContext';
import UsersView from '../components/UsersView';

export default function Users() {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState('createdAt:desc');
    const [filters, setFilters] = useState({
        firstName: '',
        lastName: '',
        gender: '',
        email: '',
        country: '',
        status: '',
        link: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const userService = new UserService();

    useEffect(() => {
        fetchUsers();
    }, [page, limit, sort, filters]);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const filterDto = new UserFilterDto(
                filters.firstName || null,
                filters.lastName || null,
                filters.gender ? Number(filters.gender) : null,
                filters.email || null,
                filters.country ? Number(filters.country) : null,
                filters.status ? Number(filters.status) : null,
                null,
                filters.link || null
            );

            const indexDto = new UserIndexDto(page, limit, sort, filterDto);

            const data = await userService.index(indexDto);
            setUsers(data);
        } catch (err) {
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setPage(1);
    };

    const handleSortChange = (e) => {
        setSort(e.target.value);
    };

    const handleLimitChange = (e) => {
        setLimit(Number(e.target.value));
        setPage(1);
    };

    const handlePrevPage = () => {
        setPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setPage(prev => prev + 1);
    };

    return (
        <UsersView
            t={t}
            filters={filters}
            onFilterChange={handleFilterChange}
            sort={sort}
            onSortChange={handleSortChange}
            limit={limit}
            onLimitChange={handleLimitChange}
            users={users}
            loading={loading}
            error={error}
            page={page}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
        />
    );
}
