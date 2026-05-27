import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { UserResponse } from '../../api/responses/UserResponse';
import { GenderEnum } from '../../enums/GenderEnum';
import { CountryEnum } from '../../enums/CountryEnum';
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import { formatDate } from '../../utils/dateFormat';

interface UsersTableProps {
    users: UserResponse[];
}

export const UsersTable: React.FC<UsersTableProps> = ({ users }) => {
    const { t } = useTranslation();

    if (users.length === 0) {
        return (
            <div className="table-responsive-custom">
            <table className="table table-bordered table-hover">
            <tbody>
                <tr>
                    <td colSpan={9} className="text-center">{t('noUsers')}</td>
        </tr>
        </tbody>
        </table>
        </div>
    );
    }

    return (
        <div className="table-responsive-custom">
        <table className="table table-bordered table-hover align-middle">
        <thead className="table-light">
            <tr>
                <th>{t('photo')}</th>
    <th>{t('firstName')}</th>
    <th>{t('lastName')}</th>
    <th>{t('email')}</th>
    <th>{t('gender')}</th>
    <th>{t('country')}</th>
    <th>{t('status')}</th>
    <th>{t('createdAt')}</th>
    <th></th>
    </tr>
    </thead>
    <tbody>
    {users.map(u => (
            <tr key={u.id}>
            <td className="text-center">
                {u.profilePhoto ? (
                        <img src={`data:image/webp;base64,${u.profilePhoto}`} alt="avatar" className="rounded-circle object-fit-cover feed-avatar-32" />
) : (
        <span className="text-muted">-</span>
    )}
    </td>
    <td>{u.firstName}</td>
    <td>{u.lastName}</td>
    <td>{u.email}</td>
    <td>{GenderEnum.getOptions(t).find(opt => String(opt.value) === String(u.gender))?.label || u.gender}</td>
    <td>{CountryEnum.getOptions(t).find(opt => String(opt.value) === String(u.country))?.label || u.country}</td>
    <td>{UserStatusEnum.getOptions(t).find(opt => String(opt.value) === String(u.status))?.label || u.status}</td>
    <td>{formatDate(u.createdAt)}</td>
    <td className="text-end">
    <a href={`/users/${u.link}`} className="btn btn-sm btn-outline-primary" title={t('profile')}>
    <i className="bi bi-box-arrow-in-right" aria-hidden="true"></i>
        <span className="visually-hidden">{t('profile')}</span>
    </a>
    </td>
    </tr>
))}
    </tbody>
    </table>
    </div>
);
};