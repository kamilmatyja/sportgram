<?php

namespace App\Service;

use App\Dto\{ElementStatusDto, SaveStatusDto, TrainingDto, TrainingIndexDto};
use App\Entity\{Feed,
    Training,
    TrainingDiscipline,
    TrainingDisciplineDistance,
    TrainingDisciplineSubDistance,
    TrainingParticipant,
    User};
use App\Enum\{DisciplineEnum, ElementStatusEnum, NotificationTypeEnum, SaveStatusEnum};
use App\Event\{NotificationEvent, TrainingProcessedEvent};
use App\Repository\{FeedRepository,
    FriendRepository,
    TrainingDisciplineDistanceRepository,
    TrainingDisciplineRepository,
    TrainingDisciplineSubDistanceRepository,
    TrainingParticipantRepository,
    TrainingRepository,
    UserRepository};
use DateMalformedStringException;
use DateTimeImmutable;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;

readonly class TrainingService
{
    public function __construct(
        private TrainingRepository $trainingRepository,
        private TrainingParticipantRepository $trainingParticipantRepository,
        private TrainingDisciplineRepository $trainingDisciplineRepository,
        private TrainingDisciplineDistanceRepository $trainingDisciplineDistanceRepository,
        private TrainingDisciplineSubDistanceRepository $trainingDisciplineSubDistanceRepository,
        private UserRepository $userRepository,
        private FeedRepository $feedRepository,
        private FriendRepository $friendRepository,
        private EventDispatcherInterface $eventDispatcher,
        private Security $security,
    ) {
    }

    /**
     * @throws DateMalformedStringException
     */
    final public function create(TrainingDto $dto): Uuid
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $feed = new Feed($user, null, null, ElementStatusEnum::Draft);

        $this->feedRepository->save($feed);

        $training = new Training(
            $feed,
            $user,
            new DateTimeImmutable($dto->startedAt),
            new DateTimeImmutable($dto->endedAt),
            $dto->title,
            $dto->description,
            $dto->link,
            $dto->location,
            ElementStatusEnum::Active,
        );

        $this->trainingRepository->save($training);

        /** @var TrainingDisciplineDistance[] $trainingDistances */
        $trainingDistances = [];

        foreach ($dto->disciplines as $discipline) {
            $trainingDiscipline = new TrainingDiscipline($training, DisciplineEnum::from($discipline->discipline));

            $this->trainingDisciplineRepository->save($trainingDiscipline);

            foreach ($discipline->distances as $distance) {
                $trainingDisciplineDistance = new TrainingDisciplineDistance(
                    $trainingDiscipline,
                    $distance->distance,
                    $distance->time,
                );

                $this->trainingDisciplineDistanceRepository->save($trainingDisciplineDistance);

                foreach ($distance->subDistances as $subDistance) {
                    $trainingDisciplineSubDistance = new TrainingDisciplineSubDistance(
                        $trainingDisciplineDistance,
                        $subDistance->subDistance,
                        $subDistance->time,
                        $subDistance->lat,
                        $subDistance->lng,
                        $subDistance->accuracy,
                        $subDistance->speed,
                    );

                    $this->trainingDisciplineSubDistanceRepository->save($trainingDisciplineSubDistance);
                }

                $trainingDistances[] = $trainingDisciplineDistance;
            }
        }

        if (! in_array($user->id->toString(), $dto->participants, true)) {
            $dto->participants[] = $user->id->toString();
        }

        foreach ($dto->participants as $userId) {
            $participantUser = $this->userRepository->findById(Uuid::fromString($userId));

            if ($participantUser->id->toString() !== $user->id->toString() && $this->friendRepository->isFriend($user->id, $participantUser->id)) {
                throw new ValidatorException('User is not friend.');
            }

            $status = $userId === $user->id->toString() ? SaveStatusEnum::Accepted : SaveStatusEnum::Pending;

            $trainingParticipant = new TrainingParticipant($training, $participantUser, $status);

            $this->trainingParticipantRepository->save($trainingParticipant);

            foreach ($trainingDistances as $trainingDisciplineDistance) {
                $this->eventDispatcher->dispatch(
                    new TrainingProcessedEvent($participantUser, $trainingDisciplineDistance),
                );
            }

            $this->eventDispatcher->dispatch(
                new NotificationEvent(
                    $participantUser,
                    NotificationTypeEnum::TrainingParticipant,
                    $training->title,
                    '/trainings/' . $training->link,
                ),
            );
        }

        return $training->id;
    }

    /**
     * @throws DateMalformedStringException
     */
    final public function update(Uuid $trainingId, TrainingDto $dto): Uuid
    {
        $training = $this->trainingRepository->findById($trainingId);

        $training->startedAt = new DateTimeImmutable($dto->startedAt);
        $training->endedAt = new DateTimeImmutable($dto->endedAt);
        $training->title = $dto->title;
        $training->description = $dto->description;
        $training->link = $dto->link;
        $training->location = $dto->location;

        foreach ($training->disciplines as $discipline) {
            foreach ($discipline->distances as $distance) {
                foreach ($distance->subDistances as $subDistance) {
                    $this->trainingDisciplineSubDistanceRepository->delete($subDistance);
                }

                $this->trainingDisciplineDistanceRepository->delete($distance);
            }

            $this->trainingDisciplineRepository->delete($discipline);
        }

        foreach ($dto->disciplines as $discipline) {
            $trainingDiscipline = new TrainingDiscipline($training, DisciplineEnum::from($discipline->discipline));

            $this->trainingDisciplineRepository->save($trainingDiscipline);

            foreach ($discipline->distances as $distance) {
                $trainingDisciplineDistance = new TrainingDisciplineDistance(
                    $trainingDiscipline,
                    $distance->distance,
                    $distance->time,
                );

                $this->trainingDisciplineDistanceRepository->save($trainingDisciplineDistance);

                foreach ($distance->subDistances as $subDistance) {
                    $trainingDisciplineSubDistance = new TrainingDisciplineSubDistance(
                        $trainingDisciplineDistance,
                        $subDistance->subDistance,
                        $subDistance->time,
                        $subDistance->lat,
                        $subDistance->lng,
                        $subDistance->accuracy,
                        $subDistance->speed,
                    );

                    $this->trainingDisciplineSubDistanceRepository->save($trainingDisciplineSubDistance);
                }
            }
        }

        if (! in_array($training->user->id->toString(), $dto->participants, true)) {
            $dto->participants[] = $training->user->id->toString();
        }

        $currentIds = array_map(
            fn (TrainingParticipant $p) => $p->user->id->toString(),
            $training->participants->toArray(),
        );

        $toAdd = array_diff($dto->participants, $currentIds);
        $toRemove = array_diff($currentIds, $dto->participants);

        foreach ($training->participants as $participant) {
            if (in_array($participant->user->id->toString(), $toRemove, true)) {
                $this->trainingParticipantRepository->delete($participant);
            }
        }

        /** @var User $user */
        $user = $this->security->getUser();

        foreach ($toAdd as $userId) {
            $participantUser = $this->userRepository->findById(Uuid::fromString($userId));

            if ($participantUser->id->toString() !== $user->id->toString() && ! $this->friendRepository->isFriend($user->id, $participantUser->id)) {
                throw new ValidatorException('User is not friend.');
            }

            $this->trainingParticipantRepository->save(
                new TrainingParticipant($training, $participantUser, SaveStatusEnum::Pending),
            );
        }

        $this->trainingRepository->save($training);

        return $training->id;
    }

    final public function updateStatus(Uuid $trainingId, ElementStatusDto $dto): Uuid
    {
        $training = $this->trainingRepository->findById($trainingId);

        $training->status = ElementStatusEnum::from($dto->status);
        $this->trainingRepository->save($training);

        foreach ($training->participants as $participant) {
            $this->eventDispatcher->dispatch(
                new NotificationEvent(
                    $participant,
                    NotificationTypeEnum::TrainingStatus,
                    $training->title,
                    '/trainings/' . $training->link,
                ),
            );
        }

        return $training->id;
    }

    final public function delete(Uuid $trainingId): Uuid
    {
        $training = $this->trainingRepository->findById($trainingId);

        if ($training->participants->count() > 0) {
            throw new ValidatorException('Cannot delete training with participants.');
        }

        $this->trainingRepository->delete($training);

        return $trainingId;
    }

    final public function index(TrainingIndexDto $dto): array
    {
        return $this->trainingRepository->findTrainings($dto);
    }

    final public function details(Uuid $trainingId): Training
    {
        return $this->trainingRepository->findById($trainingId);
    }

    final public function updateParticipantStatus(Uuid $participantId, SaveStatusDto $dto): Uuid
    {
        $trainingParticipant = $this->trainingParticipantRepository->findById($participantId);

        $trainingParticipant->status = SaveStatusEnum::from($dto->status);
        $this->trainingParticipantRepository->save($trainingParticipant);

        $training = $trainingParticipant->training;

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $trainingParticipant->user,
                NotificationTypeEnum::TrainingParticipantStatus,
                $training->title,
                '/trainings/' . $training->link,
            ),
        );

        return $trainingParticipant->id;
    }
}
