<?php

namespace App\Service;

use App\Dto\{ElementStatusDto, PageDto, PageFollowIndexDto, PageFollowStatusDto, PageIndexDto, SaveStatusDto};
use App\Entity\{Page, PageFollow, PageParticipant, User};
use App\Enum\{ElementStatusEnum, NotificationTypeEnum, SaveStatusEnum};
use App\Event\NotificationEvent;
use App\Repository\{FriendRepository, PageFollowRepository, PageParticipantRepository, PageRepository, UserRepository};
use Doctrine\ORM\Tools\Pagination\WindowPage;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;

readonly class PageService
{
    public function __construct(
        private PageRepository $pageRepository,
        private PageParticipantRepository $pageParticipantRepository,
        private PageFollowRepository $pageFollowRepository,
        private UserRepository $userRepository,
        private FriendRepository $friendRepository,
        private EventDispatcherInterface $eventDispatcher,
        private Security $security,
    ) {
    }

    final public function create(PageDto $dto): Uuid
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $page = new Page(
            $user,
            $dto->title,
            $dto->description,
            $dto->link,
            $dto->profilePhoto,
            $dto->backgroundPhoto,
            $dto->color,
            ElementStatusEnum::Active,
        );

        $this->pageRepository->save($page);

        if (! in_array($user->id, $dto->userIds)) {
            $dto->userIds[] = $user->id;
        }

        foreach ($dto->userIds as $userId) {
            $participantUser = $this->userRepository->findById($userId);

            if (! $this->friendRepository->isFriend($user->id, $participantUser->id) && ! $user->id->equals(
                $participantUser->id,
            )) {
                throw new ValidatorException('User is not friend.');
            }

            $status = $userId->equals($user->id) ? SaveStatusEnum::Accepted : SaveStatusEnum::Pending;

            $pageParticipant = new PageParticipant($page, $participantUser, $status);

            $this->pageParticipantRepository->save($pageParticipant);

            if (! $participantUser->id->equals($user->id)) {
                $this->eventDispatcher->dispatch(
                    new NotificationEvent(
                        $participantUser,
                        NotificationTypeEnum::PageParticipant,
                        $page->title,
                        '/pages/' . $page->link,
                    ),
                );
            }
        }

        return $page->id;
    }

    final public function update(Uuid $pageId, PageDto $dto): Uuid
    {
        $page = $this->pageRepository->findById($pageId);

        $page->title = $dto->title;
        $page->description = $dto->description;
        $page->link = $dto->link;
        $page->profilePhoto = $dto->profilePhoto;
        $page->backgroundPhoto = $dto->backgroundPhoto;
        $page->color = $dto->color;

        /** @var User $user */
        $user = $this->security->getUser();

        if (! in_array($user->id, $dto->userIds)) {
            $dto->userIds[] = $user->id;
        }

        $currentIds = array_map(
            fn (PageParticipant $p) => $p->user->id,
            $page->participants->toArray(),
        );

        $toAdd = array_diff($dto->userIds, $currentIds);
        $toRemove = array_diff($currentIds, $dto->userIds);

        foreach ($page->participants as $participant) {
            if (in_array($participant->user->id, $toRemove)) {
                if ($participant->events->count() > 0) {
                    throw new ValidatorException('Cannot delete page participant with events.');
                }

                $this->pageParticipantRepository->delete($participant);
            }
        }

        foreach ($toAdd as $userId) {
            $participantUser = $this->userRepository->findById($userId);

            if (! $this->friendRepository->isFriend($user->id, $participantUser->id) && ! $user->id->equals(
                $participantUser->id,
            )) {
                throw new ValidatorException('User is not friend.');
            }

            $this->pageParticipantRepository->save(
                new PageParticipant($page, $participantUser, SaveStatusEnum::Pending),
            );

            if (! $participantUser->id->equals($user->id)) {
                $this->eventDispatcher->dispatch(
                    new NotificationEvent(
                        $participantUser,
                        NotificationTypeEnum::PageParticipant,
                        $page->title,
                        '/pages/' . $page->link,
                    ),
                );
            }
        }

        $this->pageRepository->save($page);

        return $page->id;
    }

    final public function updateStatus(Uuid $pageId, ElementStatusDto $dto): Uuid
    {
        $page = $this->pageRepository->findById($pageId);

        $page->status = $dto->status;
        $this->pageRepository->save($page);

        foreach ($page->participants as $participant) {
            $this->eventDispatcher->dispatch(
                new NotificationEvent(
                    $participant->user,
                    NotificationTypeEnum::PageStatus,
                    $page->title,
                    '/pages/' . $page->link,
                ),
            );
        }

        return $page->id;
    }

    final public function delete(Uuid $pageId): Uuid
    {
        $page = $this->pageRepository->findById($pageId);

        foreach ($page->participants as $participant) {
            if ($participant->events->count() > 0) {
                throw new ValidatorException('Cannot delete page with participant events.');
            }
        }

        $this->pageRepository->delete($page);

        return $pageId;
    }

    final public function index(PageIndexDto $dto): WindowPage
    {
        return $this->pageRepository->findPages($dto);
    }

    final public function details(Uuid $pageId): Page
    {
        return $this->pageRepository->findById($pageId);
    }

    final public function updateParticipantStatus(Uuid $pageParticipantId, SaveStatusDto $dto): Uuid
    {
        $pageParticipant = $this->pageParticipantRepository->findById($pageParticipantId);

        $pageParticipant->status = $dto->status;
        $this->pageParticipantRepository->save($pageParticipant);

        $page = $pageParticipant->page;

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $pageParticipant->user,
                NotificationTypeEnum::PageParticipantStatus,
                $page->title,
                '/pages/' . $page->link,
            ),
        );

        return $pageParticipant->id;
    }

    final public function createFollow(Uuid $pageId, PageFollowStatusDto $dto): Uuid
    {
        /** @var User $user */
        $user = $this->security->getUser();

        if ($this->pageFollowRepository->hasRow($user->id, $pageId)) {
            throw new ValidatorException('User already follows this page.');
        }

        $page = $this->pageRepository->findById($pageId);

        $pageFollow = new PageFollow($page, $user, $dto->status);

        $this->pageFollowRepository->save($pageFollow);

        foreach ($page->participants as $participant) {
            if (! $participant->user->id->equals($user->id)) {
                $this->eventDispatcher->dispatch(
                    new NotificationEvent(
                        $participant->user,
                        NotificationTypeEnum::PageFollow,
                        $page->title,
                        '/pages/' . $page->link,
                    ),
                );
            }
        }

        return $pageFollow->id;
    }

    final public function updateFollowStatus(Uuid $pageFollowId, PageFollowStatusDto $dto): Uuid
    {
        $pageFollow = $this->pageFollowRepository->findById($pageFollowId);

        $pageFollow->status = $dto->status;
        $this->pageFollowRepository->save($pageFollow);

        $page = $pageFollow->page;

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $pageFollow->user,
                NotificationTypeEnum::PageFollowStatus,
                $page->title,
                '/pages/' . $page->link,
            ),
        );

        return $pageFollow->id;
    }

    final public function deleteFollow(Uuid $pageFollowId): Uuid
    {
        $pageFollow = $this->pageFollowRepository->findById($pageFollowId);

        $this->pageFollowRepository->delete($pageFollow);

        return $pageFollowId;
    }

    final public function indexFollows(PageFollowIndexDto $dto): WindowPage
    {
        return $this->pageFollowRepository->findPageFollows($dto);
    }

    final public function detailsFollow(Uuid $pageFollowId): PageFollow
    {
        return $this->pageFollowRepository->findById($pageFollowId);
    }
}
