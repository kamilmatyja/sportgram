<?php

namespace App\Service;

use App\Dto\{GoalDetailsQueryDto, GoalDto, GoalIndexDto, GoalStatusDto, SaveStatusDto};
use App\Entity\{Feed, Goal, GoalParticipant, User};
use App\Enum\{DisciplineEnum, ElementStatusEnum, GoalStatusEnum, SaveStatusEnum};
use App\Repository\{FeedRepository,
    FriendRepository,
    GoalParticipantRepository,
    GoalParticipantResultRepository,
    GoalRepository,
    UserRepository};
use DateMalformedStringException;
use DateTimeImmutable;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;

readonly class GoalService
{
    public function __construct(
        private GoalRepository $goalRepository,
        private GoalParticipantRepository $goalParticipantRepository,
        private GoalParticipantResultRepository $goalParticipantResultRepository,
        private UserRepository $userRepository,
        private FriendRepository $friendRepository,
        private FeedRepository $feedRepository,
        private Security $security,
    ) {
    }

    /**
     * @throws DateMalformedStringException
     */
    final public function create(GoalDto $dto): Uuid
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $feed = new Feed($user, null, null, ElementStatusEnum::Draft);

        $this->feedRepository->save($feed);

        $goal = new Goal(
            $feed,
            $user,
            new DateTimeImmutable($dto->startedAt),
            new DateTimeImmutable($dto->endedAt),
            $dto->text,
            $dto->link,
            DisciplineEnum::from($dto->discipline),
            $dto->distance,
            $dto->time,
            GoalStatusEnum::Active,
        );

        $this->goalRepository->save($goal);

        $goalParticipant = new GoalParticipant($goal, $user, SaveStatusEnum::Accepted);

        $this->goalParticipantRepository->save($goalParticipant);

        /** @var string $userId */
        foreach ($dto->participants as $userId) {
            $participantUser = $this->userRepository->findById(Uuid::fromString($userId));

            if (! $participantUser) {
                throw new ValidatorException('User not found: ' . $userId);
            }

            if ($this->friendRepository->isFriend($user->id, $participantUser->id)) {
                throw new ValidatorException('User is not friend: ' . $userId);
            }

            $goalParticipant = new GoalParticipant($goal, $participantUser, SaveStatusEnum::Pending);

            $this->goalParticipantRepository->save($goalParticipant);
        }

        return $goal->id;
    }

    /**
     * @throws DateMalformedStringException
     */
    final public function update(Uuid $goalId, GoalDto $dto): Uuid
    {
        $goal = $this->goalRepository->findById($goalId);

        if (! $goal) {
            throw new ValidatorException('Goal not found.');
        }

        $goal->startedAt = new DateTimeImmutable($dto->startedAt);
        $goal->endedAt = new DateTimeImmutable($dto->endedAt);
        $goal->text = $dto->text;
        $goal->link = $dto->link;
        $goal->discipline = DisciplineEnum::from($dto->discipline);
        $goal->distance = $dto->distance;
        $goal->time = $dto->time;

        $currentParticipants = array_map(
            fn (GoalParticipant $participant) => $participant->user->id->toString(),
            $goal->participants->toArray(),
        );
        $participantsToAdd = array_diff($dto->participants, $currentParticipants);
        $participantsToRemove = array_diff($currentParticipants, $dto->participants);

        /** @var User $user */
        $user = $this->security->getUser();

        /** @var GoalParticipant $participant */
        foreach ($goal->participants as $participant) {
            if ($participant->user->id->toString() !== $user->id->toString() && in_array($participant->user->id->toString(), $participantsToRemove, true)) {
                $participant->softDelete();
                $this->goalParticipantRepository->save($participant);
            }
        }

        /** @var string $userId */
        foreach ($participantsToAdd as $userId) {
            $participantUser = $this->userRepository->findById(Uuid::fromString($userId));

            if (! $participantUser) {
                throw new ValidatorException('User not found: ' . $userId);
            }

            if ($this->friendRepository->isFriend($user->id, $participantUser->id)) {
                throw new ValidatorException('User is not friend: ' . $userId);
            }

            $participantEntity = new GoalParticipant($goal, $participantUser, SaveStatusEnum::Pending);
            $this->goalParticipantRepository->save($participantEntity);
        }

        $this->goalRepository->save($goal);

        return $goal->id;
    }

    final public function updateStatus(Uuid $goalId, GoalStatusDto $dto): Uuid
    {
        $goal = $this->goalRepository->findById($goalId);

        if (! $goal) {
            throw new ValidatorException('Goal not found.');
        }

        $goal->status = GoalStatusEnum::from($dto->status);
        $this->goalRepository->save($goal);

        return $goal->id;
    }

    final public function delete(Uuid $goalId): Uuid
    {
        $goal = $this->goalRepository->findById($goalId);

        if (! $goal) {
            throw new ValidatorException('Goal not found.');
        }

        $goal->softDelete();
        $this->goalRepository->save($goal);

        return $goal->id;
    }

    final public function index(GoalIndexDto $dto): array
    {
        return $this->goalRepository->findGoals($dto);
    }

    final public function details(Uuid $goalId, GoalDetailsQueryDto $dto): Goal
    {
        if (in_array($dto::GOAL_PARTICIPANTS, $dto->include)) {
            $goal = $this->goalRepository->findWithParticipants($goalId);
        } elseif (in_array($dto::GOAL_PARTICIPANT_RESULTS, $dto->include)) {
            $goal = $this->goalRepository->findWithParticipantResults($goalId);
        } else {
            $goal = $this->goalRepository->findById($goalId);
        }

        if (! $goal) {
            throw new ValidatorException('Goal not found.');
        }

        return $goal;
    }

    final public function updateParticipantStatus(Uuid $goalParticipantId, SaveStatusDto $dto): Uuid
    {
        $goalParticipant = $this->goalParticipantRepository->findById($goalParticipantId);

        if (! $goalParticipant) {
            throw new ValidatorException('GoalParticipant not found.');
        }

        $goalParticipant->status = SaveStatusEnum::from($dto->status);
        $this->goalParticipantRepository->save($goalParticipant);

        return $goalParticipant->id;
    }

    final public function updateParticipantResultStatus(Uuid $goalParticipantResultId, SaveStatusDto $dto): Uuid
    {
        $goalParticipantResult = $this->goalParticipantResultRepository->findById($goalParticipantResultId);

        if (! $goalParticipantResult) {
            throw new ValidatorException('GoalParticipantResult not found.');
        }

        $goalParticipantResult->status = SaveStatusEnum::from($dto->status);
        $this->goalParticipantResultRepository->save($goalParticipantResult);

        return $goalParticipantResult->id;
    }
}
