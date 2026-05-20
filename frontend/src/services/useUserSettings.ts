import React, {useEffect, useState} from 'react';
import {UserProvider} from '../api/providers/UserProvider';
import {UserUpdateBody} from '../api/body/UserUpdateBody';
import {useCheckPermission} from '../utils/checkPermission';
import {createFormHandler} from '../utils/formHandler';
import {UserFilterQuery} from '../api/queries/UserFilterQuery';
import {UserResponse} from '../api/responses/UserResponse';
import {UserIndexQuery} from '../api/queries/UserIndexQuery';

export function useUserSettings(link?: string) {
    const {getCurrentUser} = useCheckPermission();
    const userProvider = new UserProvider();

    const [user, setUser] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitLoading, setSubmitLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [globalError, setGlobalError] = useState<string>('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});
    const [successMsg, setSuccessMsg] = useState<string>('');

    const [formData, setFormData] = useState(new UserUpdateBody('', '', '', 0, 0, '', '', 0, 0, 0, 0, '', '', '', [], null, []));

    useEffect(() => {
        const loadUser = async () => {
            try {
                setLoading(true);
                const currentUsr = await getCurrentUser();

                if (!currentUsr || !link) {
                    setError('unauthorizedEdit');
                    return;
                }

                const filter = new UserFilterQuery();
                filter.link = link;
                const indexDto = new UserIndexQuery();
                indexDto.filter = filter;

                const targetUsers = await userProvider.index(indexDto);

                if (targetUsers.length === 0) {
                    setError('userNotFound');
                    return;
                }

                const targetUser = await userProvider.details(targetUsers[0].id, ['userRoles', 'userDisciplines']);

                if (currentUsr.id !== targetUser.id) {
                    setError('unauthorizedEdit');
                    return;
                }

                setUser(targetUser);
                setFormData({
                    birthAt: targetUser.birthAt.split('T')[0],
                    firstName: targetUser.firstName,
                    lastName: targetUser.lastName,
                    gender: targetUser.gender,
                    phone: targetUser.phone,
                    email: targetUser.email,
                    password: null,
                    link: targetUser.link,
                    language: targetUser.language,
                    country: targetUser.country,
                    theme: targetUser.theme,
                    color: targetUser.color,
                    bio: targetUser.bio,
                    profilePhoto: targetUser.profilePhoto,
                    backgroundPhoto: targetUser.backgroundPhoto,
                    roles: targetUser.roles?.map((r: any) => r.role) || [],
                    disciplines: targetUser.disciplines?.map((d: any) => d.discipline) || [],
                });
            } catch (err: any) {
                setError(err.error);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [link]);

    const handleChange = createFormHandler(setFormData);

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitLoading(true);
        setGlobalError('');
        setFieldErrors({});
        setSuccessMsg('');

        if (!user) return;

        try {
            await userProvider.update(user.id, formData);
            setSuccessMsg('settingsUpdated');
            setUser({...user, ...formData} as any);
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setSubmitLoading(false);
        }
    };

    return {
        user,
        loading,
        submitLoading,
        error,
        globalError,
        fieldErrors,
        successMsg,
        formData,
        handleChange,
        handleSubmit
    };
}