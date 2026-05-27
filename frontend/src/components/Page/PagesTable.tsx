import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { PageResponse } from '../../api/responses/PageResponse';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';

interface PagesTableProps {
    pages: PageResponse[];
}

export const PagesTable: React.FC<PagesTableProps> = ({ pages }) => {
    const { t } = useTranslation();

    if (pages.length === 0) {
        return (
            <div className="table-responsive-custom">
                <table className="table table-bordered table-hover align-middle">
                    <tbody>
                    <tr>
                        <td colSpan={6} className="text-center text-muted">{t('noPages')}</td>
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
                    <th>{t('title')}</th>
                    <th>{t('link')}</th>
                    <th>{t('status')}</th>
                    <th>{t('createdAt')}</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {pages.map(pageObj => (
                    <tr key={pageObj.id}>
                        <td className="text-center align-middle feed-photo-cell">
                            {pageObj.profilePhoto ? (
                                <img src={`data:image/webp;base64,${pageObj.profilePhoto}`} alt="page" className="rounded-circle img-fluid feed-photo" />
                            ) : (
                                <span className="text-muted">-</span>
                            )}
                        </td>
                        <td>
                            <a href={`/pages/${pageObj.link}`} className="btn btn-link p-0 text-decoration-none">
                                {pageObj.title}
                            </a>
                        </td>
                        <td>{pageObj.link}</td>
                        <td>{ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(pageObj.status))?.label || pageObj.status}</td>
                        <td>{formatDate(pageObj.createdAt)}</td>
                        <td className="text-end">
                            <a href={`/pages/${pageObj.link}`} className="btn btn-sm btn-outline-primary" title={t('profile')}>
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