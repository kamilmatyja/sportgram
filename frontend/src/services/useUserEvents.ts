import React, {useEffect, useState} from 'react';
import {UserProvider} from '../api/providers/UserProvider';
import {EventProvider} from '../api/providers/EventProvider';
import {EventResponse} from '../api/responses/EventResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {EventFilterQuery} from '../api/queries/EventFilterQuery';
import {EventIndexQuery} from '../api/queries/EventIndexQuery';
import {UserFilterQuery} from '../api/queries/UserFilterQuery';
import {UserIndexQuery} from '../api/queries/UserIndexQuery';
import {useCheckPermission} from '../utils/checkPermission';
import {RoleEnum} from '../enums/RoleEnum';

export function useUserEvents(link?: string) {
    const {getCurrentUser} = useCheckPermission();

    const [events, setEvents] = useState<EventResponse[]>([]);
    const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isOrganizer, setIsOrganizer] = useState<boolean>(false);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new EventFilterQuery());

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const userProvider = new UserProvider();
    const eventProvider = new EventProvider();

    const fetchEvents = async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const filterDto = new EventFilterQuery();
            filterDto.userId = userId;
            filterDto.title = filters.title;
            filterDto.link = filters.link;
            filterDto.status = filters.status ? Number(filters.status) : undefined;

            const indexDto = new EventIndexQuery();
            indexDto.page = page;
            indexDto.limit = limit;
            indexDto.sort = sort;
            indexDto.filter = filterDto;

            const data = await eventProvider.index(indexDto);

            const detailedEvents = await Promise.all(data.map(async (ev) => {
                return await eventProvider.details(ev.id, ['eventDisciplines', 'eventDisciplineDistances', 'eventDisciplineSubDistances']);
            }));

            setEvents(detailedEvents);
        } catch (err: any) {
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkAccessAndFetch = async () => {
            try {
                setLoading(true);
                const currentUsr = await getCurrentUser();
                setCurrentUser(currentUsr);

                if (!currentUsr || !link) {
                    setError('unauthorizedEdit');
                    return;
                }

                const adminCheck = currentUsr.roles?.some((r: any) => r.role === RoleEnum.ADMINISTRATOR) ?? false;
                setIsAdmin(adminCheck);

                const organizerCheck = currentUsr.roles?.some((r: any) => r.role === RoleEnum.ORGANIZER) ?? false;
                setIsOrganizer(organizerCheck);

                const uFilter = new UserFilterQuery();
                uFilter.link = link;
                const uIndexDto = new UserIndexQuery();
                uIndexDto.filter = uFilter;
                const targetUsers = await userProvider.index(uIndexDto);

                if (targetUsers.length === 0) {
                    setError('userNotFound');
                    return;
                }

                const tUser = targetUsers[0];
                const fullTargetUser = await userProvider.details(tUser.id, ['userRoles', 'userDisciplines']);
                setTargetUser(fullTargetUser);

                const isOwner = currentUsr.id === tUser.id;
                setIsMyProfile(isOwner);

                await fetchEvents(tUser.id);
            } catch (err: any) {
                setError(err.error);
            } finally {
                setLoading(false);
            }
        };

        checkAccessAndFetch();
    }, [link, page, limit, sort, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({...prev, [e.target.name]: e.target.value}));
        setPage(1);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSort(e.target.value);
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLimit(Number(e.target.value));
        setPage(1);
    };

    const handlePrevPage = () => setPage(prev => Math.max(prev - 1, 1));
    const handleNextPage = () => setPage(prev => prev + 1);

    const refreshEvents = () => {
        if (targetUser) fetchEvents(targetUser.id);
    };

    return {
        events, targetUser, currentUser, isMyProfile, isAdmin, isOrganizer, page, limit, sort, filters, loading, error,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshEvents
    };
}