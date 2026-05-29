import React, {useState} from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {EventResponse} from '../../api/responses/EventResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {EventListsManager} from './EventListsManager';

interface UserEventsTableProps {
    events: EventResponse[];
    isMyProfile: boolean;
    isAdmin: boolean;
    actionLoading: string | null;
    onManageClick: (eventObj: EventResponse) => void;
    interactions: any;
}

export const UserEventsTable: React.FC<UserEventsTableProps> = ({
                                                                    events,
                                                                    isMyProfile,
                                                                    isAdmin,
                                                                    onManageClick,
                                                                    interactions
                                                                }) => {
    const {t} = useTranslation();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const toggleRow = (id: string) => {
        setExpandedRow(prev => prev === id ? null : id);
    };

    return (
        <div className="table-responsive-custom">
            <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                <tr>
                    <th>{t('photo')}</th>
                    <th>{t('title')}</th>
                    <th>{t('location')}</th>
                    <th>{t('startedAt')}</th>
                    <th>{t('endedAt')}</th>
                    <th>{t('status')}</th>
                    <th>{t('details')}</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {events.length === 0 ? (
                    <tr>
                        <td colSpan={8} className="text-center text-muted">{t('noRecords')}</td>
                    </tr>
                ) : events.map(ev => (
                    <React.Fragment key={ev.id}>
                        <tr>
                            <td className="text-center align-middle feed-photo-cell">
                                <img src={`data:image/webp;base64,${ev.photo}`} alt="Photo"
                                     className="w-100 h-100 object-fit-cover"/>
                            </td>
                            <td>
                                <a href={`/events/${ev.link}`} className="btn btn-link p-0 text-decoration-none">
                                    {ev.title}
                                </a>
                            </td>
                            <td>{ev.location}</td>
                            <td>{formatDate(ev.startedAt)}</td>
                            <td>{formatDate(ev.endedAt)}</td>
                            <td>
                                <span className="badge bg-light text-dark border profile-theme-border">
                                    {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(ev.status))?.label || ev.status}
                                </span>
                            </td>
                            <td>
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleRow(ev.id)}>
                                    {expandedRow === ev.id ? <i className="bi bi-chevron-up"></i> :
                                        <i className="bi bi-chevron-down"></i>} {t('lists')} / {t('results')}
                                </button>
                            </td>
                            <td className="text-end">
                                {(isMyProfile || isAdmin) && (
                                    <button className="btn btn-sm btn-profile-outline-primary" title={t('manage')}
                                            onClick={() => onManageClick(ev)}>
                                        <i className="bi bi-gear" aria-hidden="true"></i>
                                        <span className="visually-hidden">{t('manage')}</span>
                                    </button>
                                )}
                            </td>
                        </tr>
                        {expandedRow === ev.id && (
                            <tr className="bg-light">
                                <td colSpan={8} className="p-0">
                                    <div className="border rounded border-profile-primary bg-white m-3">
                                        <EventListsManager
                                            eventObj={ev}
                                            isMyProfile={isMyProfile}
                                            isAdmin={isAdmin}
                                            interactions={interactions}
                                        />
                                    </div>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
                </tbody>
            </table>
        </div>
    );
};