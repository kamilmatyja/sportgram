<?php

namespace App\Service;

use App\Dto\{GoalDto, GoalIndexDto, GoalStatusDto, SaveStatusDto};
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

            if ($this->friendRepository->isFriend($user->id, $participantUser->id)) {
                throw new ValidatorException('User is not friend.');
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

        $goal->startedAt = new DateTimeImmutable($dto->startedAt);
        $goal->endedAt = new DateTimeImmutable($dto->endedAt);
        $goal->text = $dto->text;
        $goal->link = $dto->link;
        $goal->discipline = DisciplineEnum::from($dto->discipline);
        $goal->distance = $dto->distance;
        $goal->time = $dto->time;

        /** @var User $user */
        $user = $this->security->getUser();

        $currentIds = array_map(
            fn (GoalParticipant $p) => $p->user->id->toString(),
            $goal->participants->toArray(),
        );

        $toAdd = array_diff($dto->participants, $currentIds);
        $toRemove = array_diff($currentIds, $dto->participants);

        foreach ($goal->participants as $participant) {
            $pid = $participant->user->id->toString();
            if ($pid !== $user->id->toString() && in_array($pid, $toRemove, true)) {
                $participant->softDelete();
                $this->goalParticipantRepository->save($participant);
            }
        }

        foreach ($toAdd as $userId) {
            $participantUser = $this->userRepository->findById(Uuid::fromString($userId));
            if ($this->friendRepository->isFriend($user->id, $participantUser->id)) {
                throw new ValidatorException('User is not friend.');
            }

            $this->goalParticipantRepository->save(
                new GoalParticipant($goal, $participantUser, SaveStatusEnum::Pending),
            );
        }

        $this->goalRepository->save($goal);

        return $goal->id;
    }

    final public function updateStatus(Uuid $goalId, GoalStatusDto $dto): Uuid
    {
        $goal = $this->goalRepository->findById($goalId);

        $goal->status = GoalStatusEnum::from($dto->status);
        $this->goalRepository->save($goal);

        return $goal->id;
    }

    final public function delete(Uuid $goalId): Uuid
    {
        $goal = $this->goalRepository->findById($goalId);

        $goal->softDelete();
        $this->goalRepository->save($goal);

        return $goal->id;
    }

    final public function index(GoalIndexDto $dto): array
    {
        return $this->goalRepository->findGoals($dto);
    }

    final public function details(Uuid $goalId): Goal
    {
        return $this->goalRepository->findById($goalId);
    }

    final public function updateParticipantStatus(Uuid $goalParticipantId, SaveStatusDto $dto): Uuid
    {
        $goalParticipant = $this->goalParticipantRepository->findById($goalParticipantId);

        $goalParticipant->status = SaveStatusEnum::from($dto->status);
        $this->goalParticipantRepository->save($goalParticipant);

        return $goalParticipant->id;
    }

    final public function updateParticipantResultStatus(Uuid $goalParticipantResultId, SaveStatusDto $dto): Uuid
    {
        $goalParticipantResult = $this->goalParticipantResultRepository->findById($goalParticipantResultId);

        $goalParticipantResult->status = SaveStatusEnum::from($dto->status);
        $this->goalParticipantResultRepository->save($goalParticipantResult);

        return $goalParticipantResult->id;
    }
}
