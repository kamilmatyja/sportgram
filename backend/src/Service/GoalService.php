<?php

namespace App\Service;

use App\Dto\{GoalDto, GoalIndexDto, GoalStatusDto, SaveStatusDto};
use App\Entity\{Feed, Goal, GoalParticipant, User};
use App\Enum\{DisciplineEnum, ElementStatusEnum, GoalStatusEnum, NotificationTypeEnum, SaveStatusEnum};
use App\Event\NotificationEvent;
use App\Repository\{FeedRepository,
    FriendRepository,
    GoalParticipantRepository,
    GoalParticipantResultRepository,
    GoalRepository,
    UserRepository};
use DateMalformedStringException;
use DateTimeImmutable;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
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
        private EventDispatcherInterface $eventDispatcher,
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

        if (! in_array($user->id->toString(), $dto->participants, true)) {
            $dto->participants[] = $user->id->toString();
        }

        foreach ($dto->participants as $userId) {
            $participantUser = $this->userRepository->findById(Uuid::fromString($userId));

            if (! $this->friendRepository->isFriend($user->id, $participantUser->id) && ! $user->id->equals(
                $participantUser->id,
            )) {
                throw new ValidatorException('User is not friend.');
            }

            $status = $userId === $user->id->toString() ? SaveStatusEnum::Accepted : SaveStatusEnum::Pending;

            $goalParticipant = new GoalParticipant($goal, $participantUser, $status);

            $this->goalParticipantRepository->save($goalParticipant);

            $this->eventDispatcher->dispatch(
                new NotificationEvent(
                    $participantUser,
                    NotificationTypeEnum::GoalParticipant,
                    $goal->text,
                    '/goals/' . $goal->link,
                ),
            );
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

        if (! in_array($user->id->toString(), $dto->participants, true)) {
            $dto->participants[] = $user->id->toString();
        }

        $currentIds = array_map(
            fn (GoalParticipant $p) => $p->user->id->toString(),
            $goal->participants->toArray(),
        );

        $toAdd = array_diff($dto->participants, $currentIds);
        $toRemove = array_diff($currentIds, $dto->participants);

        foreach ($goal->participants as $participant) {
            if (in_array($participant->user->id->toString(), $toRemove, true)) {
                if ($participant->results->count() > 0) {
                    throw new ValidatorException('Cannot delete goal participant with results.');
                }

                $this->goalParticipantRepository->delete($participant);
            }
        }

        foreach ($toAdd as $userId) {
            $participantUser = $this->userRepository->findById(Uuid::fromString($userId));

            if (! $this->friendRepository->isFriend($user->id, $participantUser->id) && ! $user->id->equals(
                $participantUser->id,
            )) {
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

        foreach ($goal->participants as $participant) {
            $this->eventDispatcher->dispatch(
                new NotificationEvent(
                    $participant->user,
                    NotificationTypeEnum::GoalStatus,
                    $goal->text,
                    '/goals/' . $goal->link,
                ),
            );
        }

        return $goal->id;
    }

    final public function delete(Uuid $goalId): Uuid
    {
        $goal = $this->goalRepository->findById($goalId);

        if ($goal->participants->count() > 0) {
            throw new ValidatorException('Cannot delete goal with participants.');
        }

        $this->goalRepository->delete($goal);

        return $goalId;
    }

    /** @return Goal[] */
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

        $goal = $goalParticipant->goal;

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $goalParticipant->user,
                NotificationTypeEnum::GoalParticipantStatus,
                $goal->text,
                '/goals/' . $goal->link,
            ),
        );

        return $goalParticipant->id;
    }

    final public function updateParticipantResultStatus(Uuid $goalParticipantResultId, SaveStatusDto $dto): Uuid
    {
        $goalParticipantResult = $this->goalParticipantResultRepository->findById($goalParticipantResultId);

        $goalParticipantResult->status = SaveStatusEnum::from($dto->status);
        $this->goalParticipantResultRepository->save($goalParticipantResult);

        $goal = $goalParticipantResult->goalParticipant->goal;

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $goalParticipantResult->goalParticipant->user,
                NotificationTypeEnum::GoalResultStatus,
                $goal->text,
                '/goals/' . $goal->link,
            ),
        );

        return $goalParticipantResult->id;
    }
}
