<?php

namespace App\Validator;

use App\Enum\EntryTypeEnum;
use App\Repository\{ConversationRepository, EventRepository, FeedRepository, GoalRepository, PageRepository, StoryRepository, TrainingRepository, UserRepository};
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\{Constraint, ConstraintValidator};
use Symfony\Component\Validator\Exception\{UnexpectedTypeException, UnexpectedValueException};

class EntryEntityExistsValidator extends ConstraintValidator
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly StoryRepository $storyRepository,
        private readonly ConversationRepository $conversationRepository,
        private readonly FeedRepository $feedRepository,
        private readonly GoalRepository $goalRepository,
        private readonly PageRepository $pageRepository,
        private readonly EventRepository $eventRepository,
        private readonly TrainingRepository $trainingRepository,
    ) {
    }

    final public function validate($value, Constraint $constraint): void
    {
        if (! $constraint instanceof EntryEntityExists) {
            throw new UnexpectedTypeException($constraint, EntryEntityExists::class);
        }

        if (! is_array($value) || ! isset($value['entityId'], $value['type']) || ! Uuid::isValid($value['entityId']) || ! EntryTypeEnum::tryFrom($value['type'])) {
            throw new UnexpectedValueException($value, 'array with entityId and type');
        }

        $entityId = Uuid::fromString($value['entityId']);
        $type = EntryTypeEnum::from($value['type']);

        $entityExists = match ($type) {
            EntryTypeEnum::User => (bool) $this->userRepository->findById($entityId),
            EntryTypeEnum::Story => (bool) $this->storyRepository->findById($entityId),
            EntryTypeEnum::Conversation => (bool) $this->conversationRepository->findById($entityId),
            EntryTypeEnum::Feed => (bool) $this->feedRepository->findById($entityId),
            EntryTypeEnum::Goal => (bool) $this->goalRepository->findById($entityId),
            EntryTypeEnum::Page => (bool) $this->pageRepository->findById($entityId),
            EntryTypeEnum::Event => (bool) $this->eventRepository->findById($entityId),
            EntryTypeEnum::Training => (bool) $this->trainingRepository->findById($entityId),
        };

        if (! $entityExists) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ entityId }}', $entityId)
                ->setParameter('{{ type }}', $type->name)
                ->addViolation();
        }
    }
}
