import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';
import {PageResponse} from '../../api/responses/PageResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {PageParticipantsTable} from './PageParticipantsTable';
import {PageFollowsTable} from './PageFollowsTable';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Table.tsx';
import {Table, Stack, Image, Badge, Button, Card, Nav} from 'react-bootstrap';
import BootstrapIcon from '../Common/BootstrapIcon';

interface UserPagesTableProps {
    pages: PageResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    actionLoading: string | null;
    onManageClick: (pageObj: PageResponse) => void;
    interactions: any;
}

export const UserPagesTable: React.FC<UserPagesTableProps> = ({
                                                                  pages,
                                                                  relatedUsers,
                                                                  currentUser,
                                                                  isMyProfile,
                                                                  isAdmin,
                                                                  actionLoading,
                                                                  onManageClick,
                                                                  interactions
                                                              }) => {
    const {t} = useTranslation();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'participants' | 'follows'>('participants');

    const toggleRow = (id: string) => {
        setExpandedRow(prev => prev === id ? null : id);
    };

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('photo')}</TableHeaderCell>
                        <TableHeaderCell>{t('title')}</TableHeaderCell>
                        <TableHeaderCell>{t('link')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                        <TableHeaderCell>{t('details')}</TableHeaderCell>
                        <TableHeaderCell></TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {pages.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted">{t('noRecords')}</TableCell>
                        </TableRow>
                    ) : pages.map(pageObj => (
                        <React.Fragment key={pageObj.id}>
                            <TableRow>
                                <TableCell className="text-center align-middle feed-photo-cell">
                                    {pageObj.profilePhoto ? (
                                        <Image src={`data:image/webp;base64,${pageObj.profilePhoto}`} alt="page"
                                               className="rounded-circle img-fluid feed-photo"/>
                                    ) : (
                                        <Stack as="span" className="text-muted">-</Stack>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Link to={`/pages/${pageObj.link}`} className="btn btn-link p-0 text-decoration-none">
                                        {pageObj.title}
                                    </Link>
                                </TableCell>
                                <TableCell>{pageObj.link}</TableCell>
                                <TableCell>
                                    <Badge bg="light" text="dark" className="border profile-theme-border">
                                        {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(pageObj.status))?.label || pageObj.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{formatDate(pageObj.createdAt)}</TableCell>
                                <TableCell>
                                    <Button variant="outline-secondary" size="sm" onClick={() => toggleRow(pageObj.id)}>
                                        <BootstrapIcon name={expandedRow === pageObj.id ? 'chevron-up' : 'chevron-down'} /> {t('participants')} / {t('pageFollows')}
                                    </Button>
                                </TableCell>
                                <TableCell className="text-end">
                                    {(isMyProfile || isAdmin) && (
                                        <Button variant="profile-outline-primary" size="sm" title={t('manage')}
                                                onClick={() => onManageClick(pageObj)}>
                                            <BootstrapIcon name="gear" aria-hidden="true" />
                                            <Stack as="span" className="visually-hidden">{t('manage')}</Stack>
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                            {expandedRow === pageObj.id && (
                                <TableRow className="bg-light">
                                    <TableCell colSpan={7} className="p-3">
                                        <Card className="border rounded border-profile-primary bg-white overflow-hidden">
                                            <Nav variant="tabs" className="px-3 pt-2 bg-light border-bottom">
                                                <Nav.Item>
                                                    <Button
                                                        variant="link"
                                                        className={`nav-link text-decoration-none ${activeTab === 'participants' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                                                        onClick={() => setActiveTab('participants')}>
                                                        {t('participants')} ({pageObj.participants?.length || 0})
                                                    </Button>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Button
                                                        variant="link"
                                                        className={`nav-link text-decoration-none ${activeTab === 'follows' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                                                        onClick={() => setActiveTab('follows')}>
                                                        {t('pageFollows')} ({pageObj.follows?.length || 0})
                                                    </Button>
                                                </Nav.Item>
                                            </Nav>
                                            <Card.Body className="p-3">
                                                {activeTab === 'participants' ? (
                                                    <PageParticipantsTable
                                                        participants={pageObj.participants || []}
                                                        relatedUsers={relatedUsers}
                                                        currentUser={currentUser}
                                                        actionLoading={actionLoading}
                                                        onUpdateStatus={interactions.handleParticipantStatusSubmit}
                                                    />
                                                ) : (
                                                    <PageFollowsTable
                                                        follows={pageObj.follows || []}
                                                        relatedUsers={relatedUsers}
                                                        currentUser={currentUser}
                                                        isMyProfile={isMyProfile}
                                                        isAdmin={isAdmin}
                                                        actionLoading={actionLoading}
                                                        onUpdateStatus={interactions.handleFollowStatusSubmit}
                                                    />
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        </Stack>
    );
};