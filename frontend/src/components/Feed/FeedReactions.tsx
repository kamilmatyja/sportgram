import React from 'react';
import { Stack, Button } from 'react-bootstrap';

import { FeedResponse } from '../../api/responses/FeedResponse';
import { useTranslation } from '../../context/TranslationContext';
import { FeedReactionEnum } from '../../enums/FeedReactionEnum';
import BootstrapIcon from '../Common/BootstrapIcon';

interface FeedReactionsProps {
    feed: FeedResponse;
    myReactionType?: number;
    isFeedLoading: boolean;
    onReact: (feedId: string, type: number) => void;
}

export const FeedReactions: React.FC<FeedReactionsProps> = ({ feed, myReactionType, isFeedLoading, onReact }) => {
    const { t } = useTranslation();

    return (
        <Stack direction="horizontal" className="flex-wrap gap-1 border-top border-bottom py-2 justify-content-between">
            {FeedReactionEnum.getOptions(t).map((opt) => {
                const isActive = myReactionType === opt.value;
                const icon = FeedReactionEnum.getClass(opt.value);

                return (
                    <Button
                        key={opt.value}
                        variant={isActive ? 'light' : 'light'}
                        size="sm"
                        className={`flex-grow-1 border-0 ${isActive ? 'fw-bold profile-theme-text' : 'text-muted'}`}
                        disabled={isFeedLoading}
                        onClick={() => onReact(feed.id, opt.value)}
                    >
                        <BootstrapIcon name={icon.name} className={`${icon.className} me-1`} />
                        <Stack as="span" className="d-none d-md-inline">
                            {opt.label}
                        </Stack>
                    </Button>
                );
            })}
        </Stack>
    );
};
