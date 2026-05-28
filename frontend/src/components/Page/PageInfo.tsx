import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {PageResponse} from '../../api/responses/PageResponse';
import {PageFollowResponse} from '../../api/responses/PageFollowResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {PageFollowStatusEnum} from '../../enums/PageFollowStatusEnum';

interface PageInfoProps {
    pageObj: PageResponse;
    myFollow: PageFollowResponse | null;
    followLoading: boolean;
    handleToggleFollow: () => void;
    canManage: boolean;
    onManageClick: (page: PageResponse) => void;
}

export const PageInfo: React.FC<PageInfoProps> = ({
                                                      pageObj,
                                                      myFollow,
                                                      followLoading,
                                                      handleToggleFollow,
                                                      canManage,
                                                      onManageClick
                                                  }) => {
    const {t} = useTranslation();

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0 text-profile-primary fw-bold">
                        <i className="bi bi-info-circle me-2"></i>{t('basicInformation')}
                    </h4>
                    {canManage && (
                        <button className="btn btn-profile-primary" onClick={() => onManageClick(pageObj)}>
                            <i className="bi bi-gear me-1"></i> {t('manage')}
                        </button>
                    )}
                </div>

                <h4 className="mb-3 fw-bold">{pageObj.title}</h4>
                <p className="mb-4 text-break fs-5">{pageObj.description}</p>

                <div className="d-flex align-items-center gap-2 mt-2 mb-4">
                    <strong>{t('status')}: </strong>
                    <span className="badge bg-light text-dark border profile-theme-border">
                        {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(pageObj.status))?.label || pageObj.status}
                    </span>
                </div>

                <div className="d-flex align-items-center gap-2 mt-3 pt-3 border-top">
                    <button
                        className={`btn btn-sm ${myFollow?.status === PageFollowStatusEnum.ACCEPTED ? 'btn-outline-danger' : 'btn-profile-primary'}`}
                        onClick={handleToggleFollow}
                        disabled={followLoading}
                    >
                        {followLoading ? (
                            <span className="spinner-border spinner-border-sm"/>
                        ) : myFollow?.status === PageFollowStatusEnum.ACCEPTED ? (
                            <><i className="bi bi-dash-circle me-1"></i> {t('unfollowPage')}</>
                        ) : (
                            <><i className="bi bi-plus-circle me-1"></i> {t('followPage')}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};