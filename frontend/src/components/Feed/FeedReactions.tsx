import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { FeedReactionEnum } from '../../enums/FeedReactionEnum';
import { FeedResponse } from '../../api/responses/FeedResponse';

interface FeedReactionsProps {
    feed: FeedResponse;
    myReactionType?: number;
    isFeedLoading: boolean;
    onReact: (feedId: string, type: number) => void;
}

export const FeedReactions: React.FC<FeedReactionsProps> = ({ feed, myReactionType, isFeedLoading, onReact }) => {
    const { t } = useTranslation();

    const getReactionIcon = (type: number) => {
        switch (type) {
            case FeedReactionEnum.LIKE: return 'bi-hand-thumbs-up-fill text-profile-primary';
            case FeedReactionEnum.LOVE: return 'bi-heart-fill text-danger';
            case FeedReactionEnum.HAHA: return 'bi-emoji-laughing-fill text-warning';
            case FeedReactionEnum.WOW: return 'bi-emoji-surprise-fill text-warning';
            case FeedReactionEnum.SAD: return 'bi-emoji-frown-fill text-warning';
            case FeedReactionEnum.ANGRY: return 'bi-emoji-angry-fill text-danger';
            default: return 'bi-hand-thumbs-up';
        }
    };

    return (
        <div className="d-flex flex-wrap gap-1 border-top border-bottom py-2 justify-content-between">
            {FeedReactionEnum.getOptions(t).map(opt => {
                const isActive = myReactionType === opt.value;
                return (
                    <button
                        key={opt.value}
                        className={`btn btn-sm flex-grow-1 ${isActive ? 'bg-light fw-bold profile-theme-text' : 'btn-light bg-transparent'}`}
                        disabled={isFeedLoading}
                        onClick={() => onReact(feed.id, opt.value)}
                    >
                        <i className={`${getReactionIcon(opt.value)} me-1`}></i>
                        <span className="d-none d-sm-inline">{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
};