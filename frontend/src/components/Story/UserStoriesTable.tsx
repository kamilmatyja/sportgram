import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {StoryResponse} from '../../api/responses/StoryResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Table';
import {Stack, Table, Image, Badge, Button} from 'react-bootstrap';
import BootstrapIcon from '../Common/BootstrapIcon';

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

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('photo')}</TableHeaderCell>
                        <TableHeaderCell>{t('text')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                        <TableHeaderCell></TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {stories.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted">{t('noRecords')}</TableCell>
                        </TableRow>
                    ) : stories.map(story => (
                        <TableRow key={story.id}>
                            <TableCell className="text-center align-middle feed-photo-cell">
                                {story.photo ? (
                                    <Image src={`data:image/webp;base64,${story.photo}`} alt="story"
                                           className="rounded img-fluid feed-photo"/>
                                ) : (
                                    <Stack as="span" className="text-muted">-</Stack>
                                )}
                            </TableCell>
                            <TableCell>{story.text}</TableCell>
                            <TableCell>
                                <Badge bg="light" text="dark" className="border profile-theme-border">
                                    {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(story.status))?.label || story.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{formatDate(story.createdAt)}</TableCell>
                            <TableCell className="text-end">
                                {(isMyProfile || isAdmin) && (
                                    <Button variant="profile-outline-primary" size="sm" title={t('manage')}
                                            onClick={() => onManageClick(story)}>
                                        <BootstrapIcon name="gear" aria-hidden="true" />
                                        <Stack as="span" className="visually-hidden">{t('manage')}</Stack>
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Stack>
    );
};