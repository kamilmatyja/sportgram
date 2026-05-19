import React, {useEffect, useState} from 'react';
import {UserProvider} from '../api/providers/UserProvider';
import type {UserFilterQuery, UserIndexQuery} from '../api/queries/UserIndexQuery';
import UsersView from '../components/UsersView';
import {UserResponse} from '../api/responses/UserResponse';
import {RoleEnum} from '../enums/RoleEnum';
import {useCheckPermission} from '../utils/checkPermission';
import {AddUserModal} from '../components/AddUserModal';
import {UserCreateBody} from '../api/body/UserCreateBody';

export default function Users() {
    const {check: checkPermission} = useCheckPermission();

    const [users, setUsers] = useState<UserResponse[]>([]);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [showAddModal, setShowAddModal] = useState<boolean>(false);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState({
        firstName: '', lastName: '', gender: '', email: '', country: '', status: '', link: '',
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const userProvider = new UserProvider();

    useEffect(() => {
        const check = async () => {
            try {
                const isAdmin = await checkPermission(RoleEnum.ADMINISTRATOR);
                setIsAdmin(isAdmin);
            } catch (err: any) {
                setError(err.error);
            }
        };
        check();
    });

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const filterDto: UserFilterQuery = {
                firstName: filters.firstName || undefined,
                lastName: filters.lastName || undefined,
                gender: filters.gender ? Number(filters.gender) : undefined,
                email: filters.email || undefined,
                country: filters.country ? Number(filters.country) : undefined,
                status: filters.status ? Number(filters.status) : undefined,
                userIds: undefined,
                link: filters.link || undefined
            };

            const indexDto: UserIndexQuery = {
                page,
                limit,
                sort,
                filter: filterDto
            };

            const data = await userProvider.index(indexDto);
            setUsers(data);
        } catch (err: any) {
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, limit, sort, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setPage(1);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSort(e.target.value);
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLimit(Number(e.target.value));
        setPage(1);
    };

    const handlePrevPage = () => {
        setPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setPage(prev => prev + 1);
    };

    const handleAddUserSubmit = async (dto: UserCreateBody) => {
        await userProvider.create(dto);
        fetchUsers();
    };

    return (
        <>
            <UsersView
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
                isAdmin={isAdmin}
                onAddUserClick={() => setShowAddModal(true)}
            />

            <AddUserModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleAddUserSubmit}
            />
        </>
    );
}