import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {NotificationResponse} from '../../api/responses/NotificationResponse';
import {NotificationStatusEnum} from '../../enums/NotificationStatusEnum';
import {formatDate} from '../../utils/dateFormat';

interface UserNotificationsTableProps {
    notifications: NotificationResponse[];
    isMyProfile: boolean;
    onManageClick: (notification: NotificationResponse) => void;
}

export const UserNotificationsTable: React.FC<UserNotificationsTableProps> = ({
                                                                                  notifications,
                                                                                  isMyProfile,
                                                                                  onManageClick
                                                                              }) => {
    const {t} = useTranslation();

    if (notifications.length === 0) {
        return (
            <div className="table-responsive-custom">
                <table className="table table-bordered table-hover align-middle mb-0">
                    <tbody>
                    <tr>
                        <td colSpan={4} className="text-center text-muted">{t('noNotifications')}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="table-responsive-custom">
            <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                <tr>
                    <th>{t('text')}</th>
                    <th>{t('status')}</th>
                    <th>{t('createdAt')}</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {notifications.map(notif => (
                    <tr key={notif.id} className="text-muted">
                        <td>
                            {notif.link ? (
                                <a href={notif.link} className="btn btn-link p-0 text-decoration-none">
                                    {notif.text}
                                </a>
                            ) : (
                                notif.text
                            )}
                        </td>
                        <td>
                            <span className="badge bg-light text-dark border profile-theme-border">
                                {NotificationStatusEnum.getOptions(t).find(opt => String(opt.value) === String(notif.status))?.label || notif.status}
                            </span>
                        </td>
                        <td>{formatDate(notif.createdAt)}</td>
                        <td className="text-end">
                            {isMyProfile && (
                                <button className="btn btn-sm btn-profile-outline-primary" title={t('manage')}
                                        onClick={() => onManageClick(notif)}>
                                    <i className="bi bi-gear" aria-hidden="true"></i>
                                    <span className="visually-hidden">{t('manage')}</span>
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};