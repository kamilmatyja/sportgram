<?php

namespace App\Service;

use App\Dto\{ElementStatusDto,
    PageDetailsQueryDto,
    PageDto,
    PageFollowIndexDto,
    PageFollowStatusDto,
    PageIndexDto,
    SaveStatusDto};
use App\Entity\{Page, PageFollow, PageParticipant, User};
use App\Enum\{ColorEnum, ElementStatusEnum, PageFollowStatusEnum, SaveStatusEnum};
use App\Repository\{FriendRepository, PageFollowRepository, PageParticipantRepository, PageRepository, UserRepository};
use Symfony\Bundle\SecurityBundle\Security;
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
            base64_decode($dto->profilePhoto, true),
            base64_decode($dto->backgroundPhoto, true),
            ColorEnum::from($dto->color),
            ElementStatusEnum::Active,
        );

        $this->pageRepository->save($page);

        $pageParticipant = new PageParticipant($page, $user, SaveStatusEnum::Accepted);

        $this->pageParticipantRepository->save($pageParticipant);

        /** @var string $userId */
        foreach ($dto->participants as $userId) {
            $participantUser = $this->userRepository->findById(Uuid::fromString($userId));

            if ($this->friendRepository->isFriend($user->id, $participantUser->id)) {
                throw new ValidatorException('User is not friend.');
            }

            $pageParticipant = new PageParticipant($page, $participantUser, SaveStatusEnum::Pending);

            $this->pageParticipantRepository->save($pageParticipant);
        }

        return $page->id;
    }

    final public function update(Uuid $pageId, PageDto $dto): Uuid
    {
        $page = $this->pageRepository->findById($pageId);

        $page->title = $dto->title;
        $page->description = $dto->description;
        $page->link = $dto->link;
        $page->profilePhoto = base64_decode($dto->profilePhoto, true);
        $page->backgroundPhoto = base64_decode($dto->backgroundPhoto, true);
        $page->color = ColorEnum::from($dto->color);

        $currentParticipants = array_map(
            fn (PageParticipant $participant) => $participant->user->id->toString(),
            $page->participants->toArray(),
        );
        $participantsToAdd = array_diff($dto->participants, $currentParticipants);
        $participantsToRemove = array_diff($currentParticipants, $dto->participants);

        /** @var User $user */
        $user = $this->security->getUser();

        /** @var PageParticipant $participant */
        foreach ($page->participants as $participant) {
            if ($participant->user->id->toString() !== $user->id->toString() && in_array($participant->user->id->toString(), $participantsToRemove, true)) {
                $participant->softDelete();
                $this->pageParticipantRepository->save($participant);
            }
        }

        /** @var string $userId */
        foreach ($participantsToAdd as $userId) {
            $participantUser = $this->userRepository->findById(Uuid::fromString($userId));

            if ($this->friendRepository->isFriend($user->id, $participantUser->id)) {
                throw new ValidatorException('User is not friend.');
            }

            $participantEntity = new PageParticipant($page, $participantUser, SaveStatusEnum::Pending);
            $this->pageParticipantRepository->save($participantEntity);
        }

        $this->pageRepository->save($page);

        return $page->id;
    }

    final public function updateStatus(Uuid $pageId, ElementStatusDto $dto): Uuid
    {
        $page = $this->pageRepository->findById($pageId);

        $page->status = ElementStatusEnum::from($dto->status);
        $this->pageRepository->save($page);

        return $page->id;
    }

    final public function delete(Uuid $pageId): Uuid
    {
        $page = $this->pageRepository->findById($pageId);

        $page->softDelete();
        $this->pageRepository->save($page);

        return $page->id;
    }

    final public function index(PageIndexDto $dto): array
    {
        return $this->pageRepository->findPages($dto);
    }

    final public function details(Uuid $pageId, PageDetailsQueryDto $dto): Page
    {
        $page = $this->pageRepository->findById($pageId);

        return $page;
    }

    final public function updateParticipantStatus(Uuid $pageParticipantId, SaveStatusDto $dto): Uuid
    {
        $pageParticipant = $this->pageParticipantRepository->findById($pageParticipantId);

        $pageParticipant->status = SaveStatusEnum::from($dto->status);
        $this->pageParticipantRepository->save($pageParticipant);

        return $pageParticipant->id;
    }

    final public function createFollow(Uuid $pageId, PageFollowStatusDto $dto): Uuid
    {
        $page = $this->pageRepository->findById($pageId);

        /** @var User $user */
        $user = $this->security->getUser();

        $pageFollow = new PageFollow($page, $user, PageFollowStatusEnum::from($dto->status));

        $this->pageFollowRepository->save($pageFollow);

        return $pageFollow->id;
    }

    final public function updateFollowStatus(Uuid $pageFollowId, PageFollowStatusDto $dto): Uuid
    {
        $pageFollow = $this->pageFollowRepository->findById($pageFollowId);

        $pageFollow->status = PageFollowStatusEnum::from($dto->status);
        $this->pageFollowRepository->save($pageFollow);

        return $pageFollow->id;
    }

    final public function deleteFollow(Uuid $pageFollowId): Uuid
    {
        $pageFollow = $this->pageFollowRepository->findById($pageFollowId);

        $pageFollow->softDelete();
        $this->pageFollowRepository->save($pageFollow);

        return $pageFollow->id;
    }

    final public function indexFollows(PageFollowIndexDto $dto): array
    {
        return $this->pageFollowRepository->findPageFollows($dto);
    }

    final public function detailsFollow(Uuid $pageFollowId): PageFollow
    {
        $pageFollow = $this->pageFollowRepository->findById($pageFollowId);

        return $pageFollow;
    }
}
