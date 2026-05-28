import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {PushSubscriptionResponse} from '../../api/responses/PushSubscriptionResponse';
import {PushSubscriptionStatusEnum} from '../../enums/PushSubscriptionStatusEnum';
import {formatDate} from '../../utils/dateFormat';

interface UserPushSubscriptionsTableProps {
    subscriptions: PushSubscriptionResponse[];
    isMyProfile: boolean;
    isAdmin: boolean;
    onManageClick: (subscription: PushSubscriptionResponse) => void;
}

export const UserPushSubscriptionsTable: React.FC<UserPushSubscriptionsTableProps> = ({
                                                                                          subscriptions,
                                                                                          isMyProfile,
                                                                                          isAdmin,
                                                                                          onManageClick
                                                                                      }) => {
    const {t} = useTranslation();

    if (subscriptions.length === 0) {
        return (
            <div className="table-responsive-custom">
                <table className="table table-bordered table-hover align-middle mb-0">
                    <tbody>
                    <tr>
                        <td colSpan={5} className="text-center text-muted">{t('noRecords')}</td>
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
                    <th>{t('browserDevice')}</th>
                    <th>{t('endpoint')}</th>
                    <th>{t('status')}</th>
                    <th>{t('createdAt')}</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {subscriptions.map(sub => (
                    <tr key={sub.id}>
                        <td>{sub.userAgent || '-'}</td>
                        <td>{sub.endpoint}</td>
                        <td>
                            <span className="badge bg-light text-dark border profile-theme-border">
                                {PushSubscriptionStatusEnum.getOptions(t).find(opt => String(opt.value) === String(sub.status))?.label || sub.status}
                            </span>
                        </td>
                        <td>{formatDate(sub.createdAt)}</td>
                        <td className="text-end">
                            {(isMyProfile || isAdmin) && (
                                <button className="btn btn-sm btn-profile-outline-primary" title={t('manage')}
                                        onClick={() => onManageClick(sub)}>
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