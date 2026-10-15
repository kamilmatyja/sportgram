import { type ChangeEvent, type FC } from 'react';
import { Button, Card, Stack } from 'react-bootstrap';

import BootstrapIcon from './BootstrapIcon';
import { type FieldErrors, InputField, SelectField } from './FormFields';
import { useTranslation } from '../../context/TranslationContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';

interface EditorSubDistance {
    subDistance: number;
    time?: number;
}

interface EditorDistance {
    distance: number;
    time?: number;
    subDistances?: EditorSubDistance[];
}

interface EditorDiscipline {
    discipline: number;
    distances?: EditorDistance[];
}

export interface DisciplinesEditorHandlers {
    addDiscipline: () => void;
    updateDisciplineType: (discIndex: number, type: number) => void;
    removeDiscipline: (discIndex: number) => void;
    addDistance: (discIndex: number) => void;
    updateDistanceValue: (discIndex: number, distIndex: number, field: 'distance' | 'time', val: number) => void;
    removeDistance: (discIndex: number, distIndex: number) => void;
    addSubDistance: (discIndex: number, distIndex: number) => void;
    updateSubDistanceValue: (
        discIndex: number,
        distIndex: number,
        subIndex: number,
        field: 'subDistance' | 'time',
        val: number,
    ) => void;
    removeSubDistance: (discIndex: number, distIndex: number, subIndex: number) => void;
}

interface DisciplinesEditorProps extends DisciplinesEditorHandlers {
    disciplines: EditorDiscipline[] | undefined;
    fieldErrors: FieldErrors;
    withTime?: boolean;
}

const toNumber = (e: ChangeEvent<HTMLInputElement>) => e.target.valueAsNumber;

const RemoveButton: FC<{ onClick: () => void; size?: 'sm' }> = ({ onClick, size }) => {
    const { t } = useTranslation();

    return (
        <Button variant="outline-danger" size={size} onClick={onClick} aria-label={t('delete')}>
            <BootstrapIcon name="trash" />
        </Button>
    );
};

export const DisciplinesEditor: FC<DisciplinesEditorProps> = ({
    disciplines,
    fieldErrors,
    withTime = false,
    addDiscipline,
    updateDisciplineType,
    removeDiscipline,
    addDistance,
    updateDistanceValue,
    removeDistance,
    addSubDistance,
    updateSubDistanceValue,
    removeSubDistance,
}) => {
    const { t } = useTranslation();
    const disciplineOptions = DisciplineEnum.getOptions(t);

    return (
        <Stack gap={3}>
            <Stack direction="horizontal" className="justify-content-between align-items-center">
                <Card.Title as="h6" className="text-profile-primary fw-bold mb-0">
                    {t('disciplinesAndDistances')}
                </Card.Title>
                <Button variant="profile-outline-primary" size="sm" onClick={addDiscipline}>
                    {t('add')}
                </Button>
            </Stack>
            {disciplines?.map((disc, dIndex) => (
                <Card key={dIndex}>
                    <Card.Body>
                        <Stack direction="horizontal" gap={3} className="align-items-end mb-3">
                            <SelectField
                                label={t('discipline')}
                                groupClassName="flex-grow-1"
                                value={disc.discipline}
                                onChange={(e) => updateDisciplineType(dIndex, parseInt(e.target.value))}
                                error={fieldErrors[`disciplines[${dIndex}].discipline`]}
                                options={disciplineOptions}
                                required
                            />
                            <RemoveButton onClick={() => removeDiscipline(dIndex)} />
                        </Stack>
                        <Stack gap={2} className="ps-3 border-start border-primary border-2">
                            <Stack direction="horizontal" className="justify-content-between">
                                <Stack as="span" className="fw-bold small">
                                    {t('distances')}
                                </Stack>
                                <Button variant="profile-outline-primary" size="sm" onClick={() => addDistance(dIndex)}>
                                    {t('add')}
                                </Button>
                            </Stack>
                            {disc.distances?.map((dist, distIndex) => {
                                const distPath = `disciplines[${dIndex}].distances[${distIndex}]`;

                                return (
                                    <Stack key={distIndex} gap={2} className="p-2 border rounded">
                                        <Stack direction="horizontal" gap={2} className="align-items-end">
                                            <InputField
                                                label={`${t('distance')} [m]`}
                                                groupClassName="flex-grow-1"
                                                type="number"
                                                min={0}
                                                step={1}
                                                size="sm"
                                                value={dist.distance}
                                                onChange={(e) =>
                                                    updateDistanceValue(dIndex, distIndex, 'distance', toNumber(e))
                                                }
                                                error={fieldErrors[`${distPath}.distance`]}
                                                required
                                            />
                                            {withTime && (
                                                <InputField
                                                    label={`${t('time')} [s]`}
                                                    groupClassName="flex-grow-1"
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    size="sm"
                                                    value={dist.time}
                                                    onChange={(e) =>
                                                        updateDistanceValue(dIndex, distIndex, 'time', toNumber(e))
                                                    }
                                                    error={fieldErrors[`${distPath}.time`]}
                                                    required
                                                />
                                            )}
                                            <RemoveButton size="sm" onClick={() => removeDistance(dIndex, distIndex)} />
                                        </Stack>
                                        <Stack gap={1} className="ps-3 border-start">
                                            <Stack direction="horizontal" className="justify-content-between">
                                                <Stack as="small" className="text-muted">
                                                    {t('subDistances')}
                                                </Stack>
                                                <Button
                                                    variant="profile-outline-primary"
                                                    className="btn-xs py-0 px-2"
                                                    onClick={() => addSubDistance(dIndex, distIndex)}
                                                >
                                                    {t('add')}
                                                </Button>
                                            </Stack>
                                            {dist.subDistances?.map((sub, subIndex) => {
                                                const subPath = `${distPath}.subDistances[${subIndex}]`;

                                                return (
                                                    <Stack
                                                        key={subIndex}
                                                        direction="horizontal"
                                                        gap={2}
                                                        className="align-items-start"
                                                    >
                                                        <InputField
                                                            groupClassName="flex-grow-1"
                                                            type="number"
                                                            min={0}
                                                            step={1}
                                                            size="sm"
                                                            placeholder={t('subDistanceMeters')}
                                                            aria-label={t('subDistanceMeters')}
                                                            value={sub.subDistance}
                                                            onChange={(e) =>
                                                                updateSubDistanceValue(
                                                                    dIndex,
                                                                    distIndex,
                                                                    subIndex,
                                                                    'subDistance',
                                                                    toNumber(e),
                                                                )
                                                            }
                                                            error={fieldErrors[`${subPath}.subDistance`]}
                                                            required
                                                        />
                                                        {withTime && (
                                                            <InputField
                                                                groupClassName="flex-grow-1"
                                                                type="number"
                                                                min={0}
                                                                step={1}
                                                                size="sm"
                                                                placeholder={t('timeSeconds')}
                                                                aria-label={t('timeSeconds')}
                                                                value={sub.time}
                                                                onChange={(e) =>
                                                                    updateSubDistanceValue(
                                                                        dIndex,
                                                                        distIndex,
                                                                        subIndex,
                                                                        'time',
                                                                        toNumber(e),
                                                                    )
                                                                }
                                                                error={fieldErrors[`${subPath}.time`]}
                                                                required
                                                            />
                                                        )}
                                                        <RemoveButton
                                                            size="sm"
                                                            onClick={() =>
                                                                removeSubDistance(dIndex, distIndex, subIndex)
                                                            }
                                                        />
                                                    </Stack>
                                                );
                                            })}
                                        </Stack>
                                    </Stack>
                                );
                            })}
                        </Stack>
                    </Card.Body>
                </Card>
            ))}
        </Stack>
    );
};
