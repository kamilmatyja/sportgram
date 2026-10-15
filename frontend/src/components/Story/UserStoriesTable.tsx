import React from 'react';
import { Stack, Table } from 'react-bootstrap';

import { StoryResponse } from '../../api/responses/StoryResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import { Base64Image } from '../Common/Base64Image';
import { EnumBadge } from '../Common/EnumBadge';
import { IconButton } from '../Common/IconButton';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface UserStoriesTableProps {
    stories: StoryResponse[];
    isMyProfile: boolean;
    isAdmin: boolean;
    onManageClick: (story: StoryResponse) => void;
}

export const UserStoriesTable: React.FC<UserStoriesTableProps> = ({ stories, isMyProfile, isAdmin, onManageClick }) => {
    const { t } = useTranslation();

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0 shadow-sm">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('photo')}</TableHeaderCell>
                        <TableHeaderCell>{t('text')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                        <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {stories.length === 0 ? (
                        <EmptyTableRow colSpan={5} />
                    ) : (
                        stories.map((story) => (
                            <TableRow key={story.id}>
                                <TableCell className="feed-photo-cell text-center">
                                    <Base64Image
                                        data={story.photo}
                                        fallback={
                                            <Stack as="span" className="text-muted">
                                                -
                                            </Stack>
                                        }
                                        rounded
                                        fluid
                                        className="feed-photo shadow-sm"
                                        alt="story"
                                    />
                                </TableCell>
                                <TableCell className="small">{story.text}</TableCell>
                                <TableCell>
                                    <EnumBadge options={ElementStatusEnum.getOptions(t)} value={story.status} />
                                </TableCell>
                                <TableCell className="small text-muted">{formatDate(story.createdAt)}</TableCell>
                                <TableCell className="text-end">
                                    {(isMyProfile || isAdmin) && (
                                        <IconButton icon="gear" onClick={() => onManageClick(story)} />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};
