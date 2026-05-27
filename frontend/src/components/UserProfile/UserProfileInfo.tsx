import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { UserResponse } from '../../api/responses/UserResponse';
import { CountryEnum } from '../../enums/CountryEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { getAgeFromDate } from '../../utils/dateFormat';

interface UserProfileInfoProps {
    user: UserResponse;
}

export const UserProfileInfo: React.FC<UserProfileInfoProps> = ({ user }) => {
    const { t } = useTranslation();

    return (
        <div className="card shadow-sm mb-4 border-0">
            <div className="card-body">
                <h4 className="mb-3 text-profile-primary fw-bold"><i className="bi bi-info-circle me-2"></i>{t('basicInformation')}</h4>
                <p className="mb-4 text-break">{user.bio || '-'}</p>

                <div className="row g-3">
                    <div className="col-sm-6 col-md-4">
                        <div className="text-muted small mb-1">{t('email')}</div>
                        <div className="fw-medium text-break">{user.email}</div>
                    </div>
                    <div className="col-sm-6 col-md-4">
                        <div className="text-muted small mb-1">{t('phone')}</div>
                        <div className="fw-medium">{user.phone}</div>
                    </div>
                    <div className="col-sm-6 col-md-4">
                        <div className="text-muted small mb-1">{t('age')}</div>
                        <div className="fw-medium">{getAgeFromDate(user.birthAt)}</div>
                    </div>
                    <div className="col-sm-6 col-md-4">
                        <div className="text-muted small mb-1">{t('country')}</div>
                        <div className="fw-medium">{CountryEnum.getOptions(t).find(opt => opt.value === user.country)?.label || user.country}</div>
                    </div>
                    <div className="col-sm-6 col-md-4">
                        <div className="text-muted small mb-1">{t('gender')}</div>
                        <div className="fw-medium">{GenderEnum.getOptions(t).find(opt => opt.value === user.gender)?.label || user.gender}</div>
                    </div>
                    <div className="col-sm-6 col-md-4">
                        <div className="text-muted small mb-1">{t('userStatus')}</div>
                        <div>
                            <span className="badge bg-light text-dark border profile-theme-border">
                                {UserStatusEnum.getOptions(t).find(opt => opt.value === user.status)?.label || user.status}
                            </span>
                        </div>
                    </div>
                </div>

                {user.roles && user.roles.length > 0 && (
                    <div className="mt-4 pt-3 border-top">
                        <div className="text-muted small mb-2">{t('role')}</div>
                        <div className="d-flex flex-wrap gap-2">
                            {user.roles.map((role: any) => (
                                <span key={role.id} className="badge profile-theme-bg">
                                    {RoleEnum.getOptions(t).find(opt => opt.value === role.role)?.label || role.role}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {user.disciplines && user.disciplines.length > 0 && (
                    <div className="mt-3">
                        <div className="text-muted small mb-2">{t('discipline')}</div>
                        <div className="d-flex flex-wrap gap-2">
                            {user.disciplines.map((disc: any) => (
                                <span key={disc.id} className="badge bg-light text-dark border profile-theme-border">
                                    {DisciplineEnum.getOptions(t).find(opt => opt.value === disc.discipline)?.label || disc.discipline}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};