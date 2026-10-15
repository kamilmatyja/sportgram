import React from 'react';
import { Stack } from 'react-bootstrap';

import { GoalParticipantResponse } from '../../api/responses/GoalParticipantResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import BootstrapIcon from '../Common/BootstrapIcon';
import { EnumBadge } from '../Common/EnumBadge';
import { ParticipantsTable } from '../Common/ParticipantsTable';
import { canChangeOwnStatus } from '../Common/statusPermissions';
import { StatusButtons } from '../Common/StatusButtons';
import { TableRow, TableCell } from '../Common/Table';

interface GoalParticipantsTableProps {
    participants: GoalParticipantResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    actionLoading: string | null;
    onUpdateParticipantStatus: (participantId: string, status: number) => void;
    onUpdateResultStatus: (resultId: string, status: number) => void;
}

export const GoalParticipantsTable: React.FC<GoalParticipantsTableProps> = ({
    participants,
    relatedUsers,
    currentUser,
    actionLoading,
    onUpdateParticipantStatus,
    onUpdateResultStatus,
}) => {
    const { t } = useTranslation();
    const statusOptions = SaveStatusEnum.getOptions(t);
    const canManage = canChangeOwnStatus(currentUser);

    return (
        <ParticipantsTable
            compact
            participants={participants}
            relatedUsers={relatedUsers}
            canManage={canManage}
            actionLoading={actionLoading}
            onUpdateStatus={onUpdateParticipantStatus}
            renderDetails={(p) =>
                p.results?.map((r) => (
                    <TableRow key={r.id} className="bg-light">
                        <TableCell colSpan={3} className="ps-4">
                            <Stack direction="horizontal" gap={3} className="small align-items-center">
                                <BootstrapIcon name="arrow-return-right" className="text-muted" />
                                <Stack direction="horizontal" gap={2}>
                                    <Stack as="strong">{t('results')}:</Stack>
                                    <Stack as="span">
                                        {r.distance}m / {r.time}s
                                    </Stack>
                                </Stack>
                                <EnumBadge options={statusOptions} value={r.status} className="ms-2" />
                                <Stack className="ms-auto">
                                    {canManage(p) && (
                                        <StatusButtons
                                            options={statusOptions}
                                            current={r.status}
                                            canSelect={(status) => status !== SaveStatusEnum.PENDING}
                                            onSelect={(status) => onUpdateResultStatus(r.id, status)}
                                            disabled={actionLoading === r.id}
                                        />
                                    )}
                                </Stack>
                            </Stack>
                        </TableCell>
                    </TableRow>
                ))
            }
        />
    );
};
