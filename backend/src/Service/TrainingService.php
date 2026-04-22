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
use App\Enum\{DisciplineEnum, ElementStatusEnum, SaveStatusEnum};
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

        $trainingParticipant = new TrainingParticipant($training, $user, SaveStatusEnum::Accepted);

        foreach ($dto->disciplines as $discipline) {
            $trainingDiscipline = new TrainingDiscipline(
                $trainingParticipant,
                DisciplineEnum::from($discipline->discipline),
            );

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

        /** @var string $userId */
        foreach ($dto->participants as $userId) {
            $participantUser = $this->userRepository->findById(Uuid::fromString($userId));

            if ($this->friendRepository->isFriend($user->id, $participantUser->id)) {
                throw new ValidatorException('User is not friend.');
            }

            $trainingParticipant = new TrainingParticipant($training, $participantUser, SaveStatusEnum::Pending);

            $this->trainingParticipantRepository->save($trainingParticipant);
        }

        return $training->id;
    }

    /**
     * @throws DateMalformedStringException
     */
    final public function update(Uuid $id, TrainingDto $dto): Uuid
    {
        $training = $this->trainingRepository->findById($id);

        $training->startedAt = new DateTimeImmutable($dto->startedAt);
        $training->endedAt = new DateTimeImmutable($dto->endedAt);
        $training->title = $dto->title;
        $training->description = $dto->description;
        $training->link = $dto->link;
        $training->location = $dto->location;

        /** @var User $user */
        $user = $this->security->getUser();

        /** @var TrainingParticipant $trainingParticipant */
        $trainingParticipant = $training->participants->findFirst(
            fn (TrainingParticipant $participant) => $participant->user->id->toString() === $user->id->toString(),
        );

        foreach ($trainingParticipant->disciplines as $discipline) {
            $discipline->softDelete();
            $this->trainingDisciplineRepository->save($discipline);

            foreach ($discipline->distances as $distance) {
                $distance->softDelete();
                $this->trainingDisciplineDistanceRepository->save($distance);

                foreach ($distance->subDistances as $subDistance) {
                    $subDistance->softDelete();
                    $this->trainingDisciplineSubDistanceRepository->save($subDistance);
                }
            }
        }

        foreach ($dto->disciplines as $discipline) {
            $trainingDiscipline = new TrainingDiscipline(
                $trainingParticipant,
                DisciplineEnum::from($discipline->discipline),
            );

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

        $currentIds = array_map(
            fn (TrainingParticipant $p) => $p->user->id->toString(),
            $training->participants->toArray(),
        );

        $toAdd = array_diff($dto->participants, $currentIds);
        $toRemove = array_diff($currentIds, $dto->participants);

        foreach ($training->participants as $participant) {
            $pid = $participant->user->id->toString();
            if ($pid !== $user->id->toString() && in_array($pid, $toRemove, true)) {
                $participant->softDelete();
                $this->trainingParticipantRepository->save($participant);
            }
        }

        foreach ($toAdd as $userId) {
            $participantUser = $this->userRepository->findById(Uuid::fromString($userId));
            if ($this->friendRepository->isFriend($user->id, $participantUser->id)) {
                throw new ValidatorException('User is not friend.');
            }

            $this->trainingParticipantRepository->save(
                new TrainingParticipant($training, $participantUser, SaveStatusEnum::Pending),
            );
        }

        $this->trainingRepository->save($training);

        return $training->id;
    }

    final public function updateStatus(Uuid $id, ElementStatusDto $dto): Uuid
    {
        $training = $this->trainingRepository->findById($id);

        $training->status = ElementStatusEnum::from($dto->status);
        $this->trainingRepository->save($training);

        return $training->id;
    }

    final public function delete(Uuid $id): Uuid
    {
        $training = $this->trainingRepository->findById($id);

        $training->softDelete();
        $this->trainingRepository->save($training);

        return $training->id;
    }

    final public function index(TrainingIndexDto $dto): array
    {
        return $this->trainingRepository->findTrainings($dto);
    }

    final public function details(Uuid $id): Training
    {
        return $this->trainingRepository->findById($id);
    }

    final public function updateParticipantStatus(Uuid $participantId, SaveStatusDto $dto): Uuid
    {
        $trainingParticipant = $this->trainingParticipantRepository->findById($participantId);

        $trainingParticipant->status = SaveStatusEnum::from($dto->status);
        $this->trainingParticipantRepository->save($trainingParticipant);

        return $trainingParticipant->id;
    }
}
