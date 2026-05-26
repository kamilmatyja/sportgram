import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {PageProvider} from '../api/providers/PageProvider';
import {UserProvider} from '../api/providers/UserProvider';
import {FriendProvider} from '../api/providers/FriendProvider';
import {EventProvider} from '../api/providers/EventProvider';
import {PageBody} from '../api/body/PageBody';
import {StatusBody} from '../api/body/StatusBody';
import {PageResponse} from '../api/responses/PageResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {EventResponse} from '../api/responses/EventResponse';
import {createFormHandler} from '../utils/formHandler';
import {useCheckPermission} from '../utils/checkPermission';
import {UserIndexQuery} from '../api/queries/UserIndexQuery';
import {FriendFilterQuery} from '../api/queries/FriendFilterQuery';
import {FriendIndexQuery} from '../api/queries/FriendIndexQuery';
import {FriendStatusEnum} from '../enums/FriendStatusEnum';
import {UserFilterQuery} from '../api/queries/UserFilterQuery';
import {PageFilterQuery} from '../api/queries/PageFilterQuery';
import {PageIndexQuery} from '../api/queries/PageIndexQuery';
import {EventFilterQuery} from '../api/queries/EventFilterQuery';
import {EventIndexQuery} from '../api/queries/EventIndexQuery';
import {RoleEnum} from '../enums/RoleEnum';

export function usePageDetails(link?: string) {
    const navigate = useNavigate();
    const {getCurrentUser} = useCheckPermission();

    const [pageObj, setPageObj] = useState<PageResponse | null>(null);
    const [ownerUser, setOwnerUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);

    const [events, setEvents] = useState<EventResponse[]>([]);
    const [eventPage, setEventPage] = useState<number>(1);
    const [eventLimit, setEventLimit] = useState<number>(10);
    const [eventSort, setEventSort] = useState<string>('createdAt:desc');
    const [eventFilters, setEventFilters] = useState(new EventFilterQuery());
    const [eventsLoading, setEventsLoading] = useState<boolean>(false);

    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(true);
    const [submitLoading, setSubmitLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});
    const [successMsg, setSuccessMsg] = useState<string>('');

    const [formData, setFormData] = useState(new PageBody('', '', '', '', '', 0, []));

    const pageProvider = new PageProvider();
    const userProvider = new UserProvider();
    const friendProvider = new FriendProvider();
    const eventProvider = new EventProvider();

    const loadAvailableFriends = async (currentUsr: UserResponse) => {
        const fFilter = new FriendFilterQuery();
        fFilter.userIds = [currentUsr.id];
        fFilter.status = FriendStatusEnum.ACCEPTED;
        const fIndexDto = new FriendIndexQuery();
        fIndexDto.filter = fFilter;

        const myFriends = await friendProvider.index(fIndexDto);

        const acceptedFriendIds = new Set<string>();
        myFriends.forEach(f => {
            if (f.senderUserId !== currentUsr.id) acceptedFriendIds.add(f.senderUserId);
            if (f.receiverUserId !== currentUsr.id) acceptedFriendIds.add(f.receiverUserId);
        });

        if (acceptedFriendIds.size > 0) {
            const uFilter = new UserFilterQuery();
            uFilter.userIds = Array.from(acceptedFriendIds);
            const uIndexDto = new UserIndexQuery();
            uIndexDto.filter = uFilter;
            const acceptedFriendsUsers = await userProvider.index(uIndexDto);
            setAvailableUsers(acceptedFriendsUsers);
        } else {
            setAvailableUsers([]);
        }
    };

    const fetchEvents = async (targetPageId: string) => {
        setEventsLoading(true);
        try {
            const filterDto = new EventFilterQuery();
            filterDto.pageId = targetPageId;
            filterDto.title = eventFilters.title;
            filterDto.link = eventFilters.link;
            filterDto.status = eventFilters.status ? Number(eventFilters.status) : undefined;

            const indexDto = new EventIndexQuery();
            indexDto.page = eventPage;
            indexDto.limit = eventLimit;
            indexDto.sort = eventSort;
            indexDto.filter = filterDto;

            const data = await eventProvider.index(indexDto);
            setEvents(data);
        } catch (err: any) {
            console.error(err);
        } finally {
            setEventsLoading(false);
        }
    };

    const fetchPageData = async () => {
        setLoading(true);
        setError(null);
        try {
            const currentUsr = await getCurrentUser();
            setCurrentUser(currentUsr);

            if (!currentUsr || !link) {
                setError('unauthorizedEdit');
                return;
            }

            const adminCheck = currentUsr.roles?.some((r: any) => r.role === RoleEnum.ADMINISTRATOR) ?? false;
            setIsAdmin(adminCheck);

            const filterDto = new PageFilterQuery();
            filterDto.link = link;
            const indexDto = new PageIndexQuery();
            indexDto.filter = filterDto;

            const pagesData = await pageProvider.index(indexDto);

            if (pagesData.length === 0) {
                setError('noPages');
                return;
            }

            const targetPage = await pageProvider.details(pagesData[0].id, [
                'pageParticipants',
                'pageFollows'
            ]);

            setPageObj(targetPage);

            const owner = await userProvider.details(targetPage.userId);
            setOwnerUser(owner);

            const isOwner = currentUsr.id === owner.id;
            setIsMyProfile(isOwner);

            setFormData(new PageBody(
                targetPage.title,
                targetPage.description,
                targetPage.link,
                '',
                '',
                targetPage.color,
                targetPage.participants.map(p => p.userId)
            ));

            if (isOwner || adminCheck) {
                await loadAvailableFriends(owner);
            }

            await fetchEvents(targetPage.id);

        } catch (err: any) {
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPageData();
    }, [link]);

    useEffect(() => {
        if (pageObj) {
            fetchEvents(pageObj.id);
        }
    }, [eventPage, eventLimit, eventSort, eventFilters]);

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!pageObj) return;
        setSubmitLoading(true);
        setGlobalError('');
        setFieldErrors({});
        setSuccessMsg('');
        try {
            formData.profilePhoto = formData.profilePhoto ? formData.profilePhoto : pageObj.profilePhoto;
            formData.backgroundPhoto = formData.backgroundPhoto ? formData.backgroundPhoto : pageObj.backgroundPhoto;

            await pageProvider.update(pageObj.id, formData);
            setSuccessMsg('settingsUpdated');
            await fetchPageData();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!pageObj) return;
        setSubmitLoading(true);
        setGlobalError('');
        setSuccessMsg('');
        try {
            await pageProvider.updateStatus(pageObj.id, new StatusBody(newStatus));
            await fetchPageData();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleParticipantStatusSubmit = async (participantId: string, newStatus: number) => {
        setSubmitLoading(true);
        setGlobalError('');
        setSuccessMsg('');
        try {
            await pageProvider.updateParticipantStatus(participantId, new StatusBody(newStatus));
            await fetchPageData();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!pageObj || !ownerUser) return;
        setSubmitLoading(true);
        setGlobalError('');
        try {
            await pageProvider.delete(pageObj.id);
            navigate(`/users/${ownerUser.link}/pages`);
        } catch (err: any) {
            setGlobalError(err.error);
            setSubmitLoading(false);
        }
    };

    const handleChange = createFormHandler(setFormData);

    const handleParticipantsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions).map(o => o.value);
        setFormData(prev => ({...prev, participants: selected}));
    };

    const handleEventFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEventFilters(prev => ({...prev, [e.target.name]: e.target.value}));
        setEventPage(1);
    };

    const handleEventSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setEventSort(e.target.value);
    };

    const handleEventLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setEventLimit(Number(e.target.value));
        setEventPage(1);
    };

    const handleEventPrevPage = () => setEventPage(prev => Math.max(prev - 1, 1));
    const handleEventNextPage = () => setEventPage(prev => prev + 1);

    return {
        pageObj,
        currentUser,
        availableUsers,
        isMyProfile,
        isAdmin,
        loading,
        submitLoading,
        error,
        globalError,
        fieldErrors,
        successMsg,
        formData,
        handleChange,
        handleParticipantsChange,
        handleEditSubmit,
        handleStatusSubmit,
        handleParticipantStatusSubmit,
        handleDelete,
        events,
        eventsLoading,
        eventPage,
        eventLimit,
        eventSort,
        eventFilters,
        handleEventFilterChange,
        handleEventSortChange,
        handleEventLimitChange,
        handleEventPrevPage,
        handleEventNextPage
    };
}