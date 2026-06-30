import React, { useState, useEffect } from 'react';
import { Modal, Button, Image, Stack } from 'react-bootstrap';

import { FlatStory } from './StoriesCarousel';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';

interface StoryViewerModalProps {
    show: boolean;
    stories: FlatStory[];
    initialIndex: number;
    onClose: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({ show, stories, initialIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        if (show) setCurrentIndex(initialIndex);
    }, [show, initialIndex]);

    if (!show || stories.length === 0) return null;

    const handleNext = () => {
        if (currentIndex < stories.length - 1) setCurrentIndex((prev) => prev + 1);
        else onClose();
    };

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
    };

    const currentStory = stories[currentIndex];
    const user = currentStory.user;

    return (
        <Modal
            show={show}
            onHide={onClose}
            dialogClassName="modal-fullscreen-sm-down modal-lg modal-dialog-centered"
            backdropClassName="story-viewer-backdrop"
            contentClassName="bg-dark text-white border-0 position-relative"
        >
            <Stack className="position-absolute top-0 w-100 p-3 d-flex flex-row justify-content-between align-items-center story-viewer-header">
                <Stack direction="horizontal" gap={2} className="align-items-center">
                    {user.profilePhoto ? (
                        <Image
                            src={`data:image/webp;base64,${user.profilePhoto}`}
                            roundedCircle
                            className="story-viewer-avatar object-fit-cover"
                            alt="avatar"
                        />
                    ) : (
                        <Stack className="bg-secondary rounded-circle align-items-center justify-content-center story-viewer-avatar">
                            <BootstrapIcon name="person" />
                        </Stack>
                    )}
                    <Stack>
                        <Stack as="strong" className="d-block small">
                            {user.firstName} {user.lastName}
                        </Stack>
                        <Stack as="small" className="text-light opacity-75">
                            {formatDate(currentStory.createdAt)}
                        </Stack>
                    </Stack>
                </Stack>
                <Button variant="link" className="text-white p-0" onClick={onClose}>
                    <BootstrapIcon name="x-lg" className="fs-4" />
                </Button>
            </Stack>

            <Stack className="bg-black align-items-center justify-content-center story-viewer-container overflow-hidden">
                <Image src={`data:image/webp;base64,${currentStory.photo}`} className="story-viewer-img" alt="story" />

                {currentIndex > 0 && (
                    <Button
                        variant="dark"
                        className="position-absolute top-50 start-0 translate-middle-y ms-2 rounded-circle opacity-75 story-viewer-nav-btn"
                        onClick={handlePrev}
                    >
                        <BootstrapIcon name="chevron-left" />
                    </Button>
                )}

                <Button
                    variant="dark"
                    className="position-absolute top-50 end-0 translate-middle-y me-2 rounded-circle opacity-75 story-viewer-nav-btn"
                    onClick={handleNext}
                >
                    <BootstrapIcon name={currentIndex < stories.length - 1 ? 'chevron-right' : 'check-lg'} />
                </Button>
            </Stack>

            <Stack className="p-3 text-center">
                <Stack as="p" className="mb-0 fs-5">
                    {currentStory.text}
                </Stack>
            </Stack>
        </Modal>
    );
};
