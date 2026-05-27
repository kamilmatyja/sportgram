import {useParams} from 'react-router-dom';
import {useUserStories} from '../services/User/useUserStories';
import {useStoryModals} from '../services/Story/useStoryModals';
import {UserStoriesView} from '../components/User/UserStoriesView';
import {AddStoryModal} from '../components/Story/AddStoryModal';
import {ManageStoryModal} from '../components/Story/ManageStoryModal';

export default function UserStories() {
    const {link} = useParams<{ link: string }>();

    const storiesService = useUserStories(link);
    const modalsService = useStoryModals(storiesService.refreshStories);

    return (
        <>
            <UserStoriesView
                user={storiesService.targetUser}
                stories={storiesService.stories}
                isMyProfile={storiesService.isMyProfile}
                isAdmin={storiesService.isAdmin}
                loading={storiesService.loading}
                error={storiesService.error}
                page={storiesService.page}
                limit={storiesService.limit}
                sort={storiesService.sort}
                filters={storiesService.filters}
                onFilterChange={storiesService.handleFilterChange}
                onSortChange={storiesService.handleSortChange}
                onLimitChange={storiesService.handleLimitChange}
                onPrevPage={storiesService.handlePrevPage}
                onNextPage={storiesService.handleNextPage}
                onAddClick={modalsService.openAddModal}
                onManageClick={modalsService.openManageModal}
            />

            <AddStoryModal
                user={storiesService.targetUser}
                show={modalsService.showAdd}
                closeModal={modalsService.closeAddModal}
                loading={modalsService.loading}
                globalError={modalsService.globalError}
                fieldErrors={modalsService.fieldErrors}
                formData={modalsService.formData}
                handleChange={modalsService.handleChange}
                handleSubmit={modalsService.handleAddSubmit}
            />

            <ManageStoryModal
                user={storiesService.targetUser}
                show={modalsService.showManage}
                story={modalsService.currentStory}
                isMyProfile={storiesService.isMyProfile}
                isAdmin={storiesService.isAdmin}
                closeModal={modalsService.closeManageModal}
                loading={modalsService.loading}
                globalError={modalsService.globalError}
                fieldErrors={modalsService.fieldErrors}
                formData={modalsService.formData}
                handleChange={modalsService.handleChange}
                handleEditSubmit={modalsService.handleEditSubmit}
                handleStatusSubmit={modalsService.handleStatusSubmit}
                handleDelete={modalsService.handleDelete}
            />
        </>
    );
}