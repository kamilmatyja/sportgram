import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { EventResponse } from '../../api/responses/EventResponse';
import { DisciplineEnum } from '../../enums/DisciplineEnum';

interface EventDisciplinesTableProps {
    eventObj: EventResponse;
    openListsModal: (distId: string) => void;
}

export const EventDisciplinesTable: React.FC<EventDisciplinesTableProps> = ({
                                                                                eventObj, openListsModal
                                                                            }) => {
    const { t } = useTranslation();

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-body">
                <h5 className="mb-3 text-profile-primary fw-bold">{t('disciplinesAndDistances')}</h5>

                <div className="table-responsive-custom">
                    <table className="table table-bordered table-hover align-middle mb-0">
                        <thead className="table-light">
                        <tr>
                            <th>{t('discipline')}</th>
                            <th>{t('distance')} [m]</th>
                            <th>{t('subDistances')}</th>
                            <th className="text-end">{t('manage')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {eventObj.disciplines.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center text-muted">{t('noRecords')}</td>
                            </tr>
                        ) : eventObj.disciplines.flatMap(disc =>
                            disc.distances.map(dist => (
                                <tr key={dist.id}>
                                    <td>{DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(disc.discipline))?.label || disc.discipline}</td>
                                    <td>{dist.distance}</td>
                                    <td>
                                        {dist.subDistances && dist.subDistances.length > 0 ? (
                                            <ul className="mb-0 list-unstyled small">
                                                {dist.subDistances.map(sub => (
                                                    <li key={sub.id}>
                                                        <i className="bi bi-dash me-1"></i>
                                                        {sub.subDistance} [m]
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-muted">-</span>
                                        )}
                                    </td>
                                    <td className="text-end">
                                        <div className="d-flex justify-content-end gap-2 flex-wrap">
                                            <button className="btn btn-sm btn-profile-outline-primary"
                                                    onClick={() => openListsModal(dist.id)}>
                                                <i className="bi bi-list-ul me-1"></i>
                                                <span className="visually-hidden">{t('eventTypes.eventDisciplineList')}</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};