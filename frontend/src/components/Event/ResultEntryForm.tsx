import React from 'react';
import { Button, Card, Col, Row, Stack } from 'react-bootstrap';

import { EventResultBody } from '../../api/body/EventResultBody';
import { EventDisciplineSubDistanceResponse } from '../../api/responses/EventDisciplineSubDistanceResponse';
import { useTranslation } from '../../context/TranslationContext';
import { type FieldErrors, FormErrorAlert, InputField } from '../Common/FormFields';

interface ResultEntryFormProps {
    formData: EventResultBody;
    onChange: (formData: EventResultBody) => void;
    subDistances: EventDisciplineSubDistanceResponse[];
    fieldErrors?: FieldErrors;
    globalError?: string;
    saving: boolean;
    onCancel: () => void;
    onSave: () => void;
}

const toSeconds = (e: React.ChangeEvent<HTMLInputElement>): number => e.target.valueAsNumber;

export const ResultEntryForm: React.FC<ResultEntryFormProps> = ({
    formData,
    onChange,
    subDistances,
    fieldErrors,
    globalError,
    saving,
    onCancel,
    onSave,
}) => {
    const { t } = useTranslation();

    const updateSubResultTime = (index: number, time: number) =>
        onChange({
            ...formData,
            subResults: formData.subResults.map((sr, idx) => (idx === index ? { ...sr, time } : sr)),
        });

    return (
        <Card className="border-profile-primary">
            <Card.Body>
                <Card.Title as="h6" className="text-profile-primary mb-3">
                    {t('resultFormTitle')}
                </Card.Title>
                <FormErrorAlert error={globalError} />
                <Row className="g-3">
                    <Col xs={12}>
                        <InputField
                            label={t('finalTimeSeconds')}
                            type="number"
                            min={0}
                            step={1}
                            size="sm"
                            value={formData.time}
                            onChange={(e) => onChange({ ...formData, time: toSeconds(e) })}
                            error={fieldErrors?.time}
                            required
                        />
                    </Col>
                    {formData.subResults.length > 0 && (
                        <Col xs={12}>
                            <Stack as="strong" className="small">
                                {t('subDistances')}:
                            </Stack>
                        </Col>
                    )}
                    {formData.subResults.map((sr, idx) => {
                        const sdMeta = subDistances.find((sd) => sd.id === sr.eventDisciplineSubDistanceId);

                        return (
                            <Col md={6} key={idx}>
                                <InputField
                                    label={`${t('forDistance')} ${sdMeta?.subDistance || '?'} [m]`}
                                    type="number"
                                    min={0}
                                    step={1}
                                    size="sm"
                                    value={sr.time}
                                    onChange={(e) => updateSubResultTime(idx, toSeconds(e))}
                                    error={fieldErrors?.[`subResults[${idx}].time`]}
                                    required
                                />
                            </Col>
                        );
                    })}
                    <Col xs={12}>
                        <Stack direction="horizontal" gap={2} className="justify-content-end">
                            <Button variant="secondary" size="sm" onClick={onCancel}>
                                {t('cancel')}
                            </Button>
                            <Button variant="profile-primary" size="sm" onClick={onSave} disabled={saving}>
                                {t('save')}
                            </Button>
                        </Stack>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};
