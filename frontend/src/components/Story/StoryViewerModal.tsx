import React, {useState, useEffect} from 'react';
import {formatDate} from '../../utils/dateFormat';
import {FlatStory} from './StoriesCarousel';

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
        if (currentIndex < stories.length - 1) setCurrentIndex(prev => prev + 1);
        else onClose();
    };

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const currentStory = stories[currentIndex];
    const user = currentStory.user;

    return (
        <>
            <div className="modal d-block story-viewer-backdrop" tabIndex={-1}>
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-0 position-relative">

                        <div className="position-absolute top-0 w-100 p-3 d-flex justify-content-between align-items-center story-viewer-header">
                            <div className="d-flex align-items-center gap-2">
                                {user.profilePhoto ? (
                                    <img src={`data:image/webp;base64,${user.profilePhoto}`} alt="avatar" className="rounded-circle object-fit-cover story-viewer-avatar" />
                                ) : (
                                    <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center story-viewer-avatar">
                                        <i className="bi bi-person"></i>
                                    </div>
                                )}
                                <div>
                                    <strong className="d-block">{user.firstName} {user.lastName}</strong>
                                    <small className="text-light opacity-75">{formatDate(currentStory.createdAt)}</small>
                                </div>
                            </div>
                            <button className="btn btn-link text-white fs-4 p-0 text-decoration-none" onClick={onClose}><i className="bi bi-x-lg"></i></button>
                        </div>

                        <div className="position-relative d-flex justify-content-center bg-black align-items-center story-viewer-container">
                            <img src={`data:image/webp;base64,${currentStory.photo}`} className="story-viewer-img" alt="Story" />

                            {currentIndex > 0 && (
                                <button className="btn btn-dark position-absolute top-50 start-0 translate-middle-y ms-2 rounded-circle shadow opacity-75 d-flex align-items-center justify-content-center story-viewer-nav-btn" onClick={handlePrev}>
                                    <i className="bi bi-chevron-left fs-4"></i>
                                </button>
                            )}

                            <button className="btn btn-dark position-absolute top-50 end-0 translate-middle-y me-2 rounded-circle shadow opacity-75 d-flex align-items-center justify-content-center story-viewer-nav-btn" onClick={handleNext}>
                                <i className={currentIndex < stories.length - 1 ? "bi bi-chevron-right fs-4" : "bi bi-check-lg fs-4"}></i>
                            </button>
                        </div>

                        <div className="p-3 text-center fs-5">
                            {currentStory.text}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};