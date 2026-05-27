import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { UserResponse } from '../../api/responses/UserResponse';
import { Link } from 'react-router-dom';

interface UserSubpageHeaderProps {
    user: UserResponse;
    title: string;
}

export const UserSubpageHeader: React.FC<UserSubpageHeaderProps> = ({ user, title }) => {
    const { t } = useTranslation();

    return (
        <>
            <div className="card shadow-sm mb-4 border-0">
                <div className="card-img-top bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border profile-bg-container">
                    {user.backgroundPhoto && (
                        <img src={`data:image/webp;base64,${user.backgroundPhoto}`} alt="Background" className="w-100 h-100 object-fit-cover" />
                    )}
                </div>
                <div className="card-body position-relative pt-5 d-flex justify-content-between align-items-end">
                    <div>
                        {user.profilePhoto ? (
                            <img src={`data:image/webp;base64,${user.profilePhoto}`} alt="Profile" className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover" />
                        ) : (
                            <div className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar d-flex align-items-center justify-content-center">
                                <i className="bi bi-person fs-1 text-muted"></i>
                            </div>
                        )}
                        <div className="mt-3">
                            <h2 className="mb-0 profile-theme-text fw-bold">{user.firstName} {user.lastName}</h2>
                            <p className="text-muted mb-0">@{user.link} - {title}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="d-flex flex-wrap gap-2 mb-4 overflow-x-auto">
                <Link to={`/users/${user.link}`} className="btn btn-profile-outline-primary">
                    <i className="bi bi-arrow-left me-1"></i> {t('profile')}
                </Link>
            </div>
        </>
    );
};