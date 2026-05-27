import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { PageResponse } from '../../api/responses/PageResponse';

interface PageHeaderProps {
    pageObj: PageResponse;
    canManage: boolean;
    onManageClick: (page: PageResponse) => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ pageObj, canManage, onManageClick }) => {
    const { t } = useTranslation();

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-img-top bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border profile-bg-container">
                {pageObj.backgroundPhoto && (
                    <img src={`data:image/webp;base64,${pageObj.backgroundPhoto}`} alt="Background" className="w-100 h-100 object-fit-cover" />
                )}
            </div>
            <div className="card-body position-relative pt-5 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
                <div>
                    {pageObj.profilePhoto ? (
                        <img src={`data:image/webp;base64,${pageObj.profilePhoto}`} alt="Profile" className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover" />
                    ) : (
                        <div className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar d-flex align-items-center justify-content-center">
                            <i className="bi bi-file-earmark-text fs-1 text-muted"></i>
                        </div>
                    )}
                    <div className="mt-4 mt-md-3">
                        <h2 className="mb-0 profile-theme-text fw-bold">{pageObj.title}</h2>
                        <p className="text-muted mb-0">@{pageObj.link}</p>
                    </div>
                </div>

                <div className="d-flex flex-wrap gap-2 align-items-center">
                    {canManage && (
                        <button className="btn btn-profile-primary" onClick={() => onManageClick(pageObj)}>
                            <i className="bi bi-gear me-1"></i> {t('manage')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};