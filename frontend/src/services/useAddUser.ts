import React, {useState} from 'react';
import {UserProvider} from '../api/providers/UserProvider';
import {UserCreateBody} from '../api/body/UserCreateBody';
import {createFormHandler} from '../utils/formHandler';
import {useTranslation} from '../context/TranslationContext';

export function useAddUser(onSuccess: () => void) {
    const {t} = useTranslation();
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});
    const [formData, setFormData] = useState(new UserCreateBody('', '', '', 0, 0, '', '', '', 0, 0, 0, 0, '', '', '', [], []));

    const userProvider = new UserProvider();
    const handleChange = createFormHandler(setFormData);

    const openModal = () => setShow(true);
    const closeModal = () => setShow(false);

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        if (!formData.profilePhoto || !formData.backgroundPhoto) {
            setGlobalError(t('photosRequired'));
            setLoading(false);
            return;
        }

        try {
            await userProvider.create(formData);
            closeModal();
            onSuccess();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    return {show, loading, globalError, fieldErrors, formData, openModal, closeModal, handleChange, handleSubmit};
}