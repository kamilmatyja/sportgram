import React from 'react';
import { Stack, Table, Image, Badge, Button } from 'react-bootstrap';

import { StoryResponse } from '../../api/responses/StoryResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

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
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted">
                                {t('noRecords')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        stories.map((story) => (
                            <TableRow key={story.id}>
                                <TableCell className="feed-photo-cell text-center">
                                    {story.photo ? (
                                        <Image
                                            src={`data:image/webp;base64,${story.photo}`}
                                            rounded
                                            fluid
                                            className="feed-photo shadow-sm"
                                            alt="story"
                                        />
                                    ) : (
                                        <Stack as="span" className="text-muted">
                                            -
                                        </Stack>
                                    )}
                                </TableCell>
                                <TableCell className="small">{story.text}</TableCell>
                                <TableCell>
                                    <Badge bg="light" text="dark" className="border profile-theme-border">
                                        {ElementStatusEnum.getOptions(t).find((opt) => opt.value === story.status)
                                            ?.label || story.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="small text-muted">{formatDate(story.createdAt)}</TableCell>
                                <TableCell className="text-end">
                                    {(isMyProfile || isAdmin) && (
                                        <Button
                                            variant="profile-outline-primary"
                                            size="sm"
                                            className="rounded-circle shadow-sm"
                                            onClick={() => onManageClick(story)}
                                        >
                                            <BootstrapIcon name="gear" />
                                        </Button>
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
