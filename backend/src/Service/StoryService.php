<?php

namespace App\Service;

use App\Dto\{ElementStatusDto, StoryDto, StoryIndexDto};
use App\Entity\{Story, User};
use App\Enum\{ElementStatusEnum, NotificationTypeEnum};
use App\Event\NotificationEvent;
use App\Repository\{StoryRepository};
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\Uid\Uuid;

readonly class StoryService
{
    public function __construct(
        private StoryRepository $storyRepository,
        private EventDispatcherInterface $eventDispatcher,
        private Security $security,
    ) {
    }

    final public function create(StoryDto $dto): Uuid
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $story = new Story(
            $user,
            $dto->text,
            base64_decode($dto->photo, true),
            ElementStatusEnum::Active,
        );

        $this->storyRepository->save($story);

        return $story->id;
    }

    final public function update(Uuid $storyId, StoryDto $dto): Uuid
    {
        $story = $this->storyRepository->findById($storyId);

        $story->text = $dto->text;
        $story->photo = base64_decode($dto->photo, true);

        $this->storyRepository->save($story);

        return $story->id;
    }

    final public function updateStatus(Uuid $storyId, ElementStatusDto $dto): Uuid
    {
        $story = $this->storyRepository->findById($storyId);

        $story->status = ElementStatusEnum::from($dto->status);
        $this->storyRepository->save($story);

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $story->user,
                NotificationTypeEnum::StoryStatus,
                $story->text,
                '/users/' . $story->user->link,
            ),
        );

        return $story->id;
    }

    final public function delete(Uuid $storyId): Uuid
    {
        $story = $this->storyRepository->findById($storyId);

        $this->storyRepository->delete($story);

        return $storyId;
    }

    final public function index(StoryIndexDto $dto): array
    {
        /** @var User $user */
        $user = $this->security->getUser();

        return $this->storyRepository->findStories($user->id, $dto);
    }

    final public function details(Uuid $storyId): Story
    {
        return $this->storyRepository->findById($storyId);
    }
}
