import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {StoryResponse} from '../../api/responses/StoryResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {formatDate} from '../../utils/dateFormat';

interface UserStoriesTableProps {
    stories: StoryResponse[];
    isMyProfile: boolean;
    isAdmin: boolean;
    onManageClick: (story: StoryResponse) => void;
}

export const UserStoriesTable: React.FC<UserStoriesTableProps> = ({
                                                                      stories, isMyProfile, isAdmin, onManageClick
                                                                  }) => {
    const {t} = useTranslation();

    if (stories.length === 0) {
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
                    <th>{t('photo')}</th>
                    <th>{t('text')}</th>
                    <th>{t('status')}</th>
                    <th>{t('createdAt')}</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {stories.map(story => (
                    <tr key={story.id}>
                        <td className="text-center align-middle feed-photo-cell">
                            {story.photo ? (
                                <img src={`data:image/webp;base64,${story.photo}`} alt="story"
                                     className="rounded img-fluid feed-photo"/>
                            ) : (
                                <span className="text-muted">-</span>
                            )}
                        </td>
                        <td>{story.text}</td>
                        <td>
                            <span className="badge bg-light text-dark border profile-theme-border">
                                {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(story.status))?.label || story.status}
                            </span>
                        </td>
                        <td>{formatDate(story.createdAt)}</td>
                        <td className="text-end">
                            {(isMyProfile || isAdmin) && (
                                <button className="btn btn-sm btn-profile-outline-primary" title={t('manage')}
                                        onClick={() => onManageClick(story)}>
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