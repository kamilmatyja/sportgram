<?php

namespace App\Service;

use App\Dto\{ElementStatusDto, StoryDto, StoryIndexDto};
use App\Entity\{Story, User};
use App\Enum\{ElementStatusEnum};
use App\Repository\{StoryRepository};
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Uid\Uuid;

readonly class StoryService
{
    public function __construct(
        private StoryRepository $storyRepository,
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

        return $story->id;
    }

    final public function delete(Uuid $storyId): Uuid
    {
        $story = $this->storyRepository->findById($storyId);

        $story->softDelete();
        $this->storyRepository->save($story);

        return $story->id;
    }

    final public function index(StoryIndexDto $dto): array
    {
        return $this->storyRepository->findStories($dto);
    }

    final public function details(Uuid $storyId): Story
    {
        $story = $this->storyRepository->findById($storyId);

        return $story;
    }
}
