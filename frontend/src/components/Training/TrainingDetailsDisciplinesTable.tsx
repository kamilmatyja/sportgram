import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {TrainingDisciplineResponse} from '../../api/responses/TrainingDisciplineResponse';
import {DisciplineEnum} from '../../enums/DisciplineEnum';

interface TrainingDetailsDisciplinesTableProps {
    disciplines: TrainingDisciplineResponse[];
}

export const TrainingDetailsDisciplinesTable: React.FC<TrainingDetailsDisciplinesTableProps> = ({disciplines}) => {
    const {t} = useTranslation();

    if (disciplines.length === 0) {
        return (
            <div className="table-responsive-custom">
                <table className="table table-bordered table-hover align-middle mb-0">
                    <tbody>
                    <tr>
                        <td colSpan={4} className="text-center text-muted">{t('noRecords')}</td>
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
                    <th>{t('discipline')}</th>
                    <th>{t('distance')} [m]</th>
                    <th>{t('timeSeconds')}</th>
                    <th>{t('subDistances')}</th>
                </tr>
                </thead>
                <tbody>
                {disciplines.flatMap(disc =>
                    disc.distances.map(dist => (
                        <tr key={dist.id}>
                            <td>{DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(disc.discipline))?.label || disc.discipline}</td>
                            <td>{dist.distance}</td>
                            <td>{dist.time}</td>
                            <td>
                                {dist.subDistances && dist.subDistances.length > 0 ? (
                                    <ul className="mb-0 list-unstyled small">
                                        {dist.subDistances.map(sub => (
                                            <li key={sub.id}>
                                                <i className="bi bi-dash me-1"></i>
                                                {sub.subDistance} [m] - {sub.time} [s]
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="text-muted">-</span>
                                )}
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
    );
};