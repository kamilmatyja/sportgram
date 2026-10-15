import { type ChangeEvent, type FC, type ReactNode } from 'react';
import { Col, Form, Row } from 'react-bootstrap';

import { type EventBody } from '../../api/body/EventBody';
import { useTranslation } from '../../context/TranslationContext';
import { DisciplinesEditor } from '../Common/DisciplinesEditor';
import { type FieldErrors, InputField } from '../Common/FormFields';

export interface EventFormHandlers {
    handleChange: (e: ChangeEvent<any>) => void;
    addDiscipline: () => void;
    updateDisciplineType: (index: number, type: number) => void;
    removeDiscipline: (index: number) => void;
    addDistance: (discIndex: number) => void;
    updateDistanceValue: (discIndex: number, distIndex: number, val: number) => void;
    removeDistance: (discIndex: number, distIndex: number) => void;
    addSubDistance: (discIndex: number, distIndex: number) => void;
    updateSubDistanceValue: (discIndex: number, distIndex: number, subIndex: number, val: number) => void;
    removeSubDistance: (discIndex: number, distIndex: number, subIndex: number) => void;
}

interface EventFormFieldsProps extends EventFormHandlers {
    formData: EventBody;
    fieldErrors: FieldErrors;
    isEdit?: boolean;
    children?: ReactNode;
}

export const EventFormFields: FC<EventFormFieldsProps> = ({
    formData,
    fieldErrors,
    isEdit = false,
    children,
    handleChange,
    updateDistanceValue,
    updateSubDistanceValue,
    ...disciplineHandlers
}) => {
    const { t } = useTranslation();

    return (
        <Row className="g-3">
            {children}
            <Col md={6}>
                <InputField
                    label={t('startedAt')}
                    type="datetime-local"
                    name="startedAt"
                    value={formData.startedAt || ''}
                    onChange={handleChange}
                    error={fieldErrors.startedAt}
                    required
                />
            </Col>
            <Col md={6}>
                <InputField
                    label={t('endedAt')}
                    type="datetime-local"
                    name="endedAt"
                    value={formData.endedAt || ''}
                    onChange={handleChange}
                    error={fieldErrors.endedAt}
                    required
                />
            </Col>
            <Col md={6}>
                <InputField
                    label={t('title')}
                    type="text"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleChange}
                    error={fieldErrors.title}
                    required
                />
            </Col>
            <Col md={6}>
                <InputField
                    label={t('link')}
                    type="text"
                    name="link"
                    value={formData.link || ''}
                    onChange={handleChange}
                    error={fieldErrors.link}
                    required
                />
            </Col>
            <Col xs={12}>
                <InputField
                    label={t('location')}
                    type="text"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleChange}
                    error={fieldErrors.location}
                    required
                />
            </Col>
            <Col xs={12}>
                <InputField
                    label={t('description')}
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    error={fieldErrors.description}
                    required
                />
            </Col>
            <Col xs={12}>
                <InputField
                    label={t('rules')}
                    as="textarea"
                    rows={3}
                    name="rules"
                    value={formData.rules || ''}
                    onChange={handleChange}
                    error={fieldErrors.rules}
                    required
                />
            </Col>
            <Col xs={12}>
                <InputField
                    label={t('photo')}
                    type="file"
                    accept="image/*"
                    name="photo"
                    onChange={handleChange}
                    error={fieldErrors.photo}
                    required={!isEdit}
                />
                {isEdit && <Form.Text className="text-muted small">{t('photoOptional')}</Form.Text>}
            </Col>
            <Col xs={12}>
                <DisciplinesEditor
                    disciplines={formData.disciplines}
                    fieldErrors={fieldErrors}
                    updateDistanceValue={(discIndex, distIndex, _field, val) =>
                        updateDistanceValue(discIndex, distIndex, val)
                    }
                    updateSubDistanceValue={(discIndex, distIndex, subIndex, _field, val) =>
                        updateSubDistanceValue(discIndex, distIndex, subIndex, val)
                    }
                    {...disciplineHandlers}
                />
            </Col>
        </Row>
    );
};
