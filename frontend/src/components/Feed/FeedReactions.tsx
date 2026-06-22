import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {FeedReactionEnum} from '../../enums/FeedReactionEnum';
import {FeedResponse} from '../../api/responses/FeedResponse';
import BootstrapIcon from '../Common/BootstrapIcon';
import {Stack, Button} from 'react-bootstrap';

interface FeedReactionsProps {
    feed: FeedResponse;
    myReactionType?: number;
    isFeedLoading: boolean;
    onReact: (feedId: string, type: number) => void;
}

export const FeedReactions: React.FC<FeedReactionsProps> = ({feed, myReactionType, isFeedLoading, onReact}) => {
    const {t} = useTranslation();

    const getReactionIcon = (type: number): { name: string; className: string } => {
        switch (type) {
            case FeedReactionEnum.LIKE:
                return { name: 'hand-thumbs-up-fill', className: 'text-profile-primary' };
            case FeedReactionEnum.LOVE:
                return { name: 'heart-fill', className: 'text-danger' };
            case FeedReactionEnum.HAHA:
                return { name: 'emoji-laughing-fill', className: 'text-warning' };
            case FeedReactionEnum.WOW:
                return { name: 'emoji-surprise-fill', className: 'text-warning' };
            case FeedReactionEnum.SAD:
                return { name: 'emoji-frown-fill', className: 'text-warning' };
            case FeedReactionEnum.ANGRY:
                return { name: 'emoji-angry-fill', className: 'text-danger' };
            default:
                return { name: 'hand-thumbs-up', className: '' };
        }
    };

    return (
        <Stack direction="horizontal" className="flex-wrap gap-1 border-top border-bottom py-2 justify-content-between">
            {FeedReactionEnum.getOptions(t).map(opt => {
                const isActive = myReactionType === opt.value;
                const reactionCount = feed.reactions?.filter(r => r.reaction === opt.value).length || 0;
                const icon = getReactionIcon(opt.value);

                return (
                    <Button
                        key={opt.value}
                        variant={isActive ? 'light' : 'light'}
                        size="sm"
                        className={`flex-grow-1 ${isActive ? 'bg-light fw-bold profile-theme-text' : 'bg-transparent'}`}
                        disabled={isFeedLoading}
                        onClick={() => onReact(feed.id, opt.value)}
                    >
                        <BootstrapIcon name={icon.name} className={`${icon.className} me-1`} />
                        <Stack as="span" className="d-none d-sm-inline">{opt.label}</Stack>
                        {reactionCount > 0 && <Stack as="span" className="ms-1 small">({reactionCount})</Stack>}
                    </Button>
                );
            })}
        </Stack>
    );
};