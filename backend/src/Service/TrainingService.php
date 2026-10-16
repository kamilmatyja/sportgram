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
use App\Enum\{ElementStatusEnum, NotificationTypeEnum, SaveStatusEnum};
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
use Doctrine\ORM\Tools\Pagination\WindowPage;
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
            $dto->startedAt,
            $dto->endedAt,
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
            $trainingDiscipline = new TrainingDiscipline($training, $discipline->discipline);

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

            $trainingParticipant = new TrainingParticipant($training, $participantUser, $status);

            $this->trainingParticipantRepository->save($trainingParticipant);

            foreach ($trainingDistances as $trainingDisciplineDistance) {
                $this->eventDispatcher->dispatch(
                    new TrainingProcessedEvent($participantUser, $trainingDisciplineDistance),
                );
            }

            if (! $participantUser->id->equals($user->id)) {
                $this->eventDispatcher->dispatch(
                    new NotificationEvent(
                        $participantUser,
                        NotificationTypeEnum::TrainingParticipant,
                        $training->title,
                        '/trainings/' . $training->link,
                    ),
                );
            }
        }

        return $training->id;
    }

    /**
     * @throws DateMalformedStringException
     */
    final public function update(Uuid $trainingId, TrainingDto $dto): Uuid
    {
        $training = $this->trainingRepository->findById($trainingId);

        $training->startedAt = $dto->startedAt;
        $training->endedAt = $dto->endedAt;
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
            $trainingDiscipline = new TrainingDiscipline($training, $discipline->discipline);

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

        if (! in_array($training->user->id, $dto->userIds)) {
            $dto->userIds[] = $training->user->id;
        }

        $currentIds = array_map(
            fn (TrainingParticipant $p) => $p->user->id,
            $training->participants->toArray(),
        );

        $toAdd = array_diff($dto->userIds, $currentIds);
        $toRemove = array_diff($currentIds, $dto->userIds);

        foreach ($training->participants as $participant) {
            if (in_array($participant->user->id, $toRemove)) {
                $this->trainingParticipantRepository->delete($participant);
            }
        }

        /** @var User $user */
        $user = $this->security->getUser();

        foreach ($toAdd as $userId) {
            $participantUser = $this->userRepository->findById($userId);

            if (! $this->friendRepository->isFriend($user->id, $participantUser->id) && ! $user->id->equals(
                $participantUser->id,
            )) {
                throw new ValidatorException('User is not friend.');
            }

            $this->trainingParticipantRepository->save(
                new TrainingParticipant($training, $participantUser, SaveStatusEnum::Pending),
            );

            if (! $participantUser->id->equals($user->id)) {
                $this->eventDispatcher->dispatch(
                    new NotificationEvent(
                        $participantUser,
                        NotificationTypeEnum::TrainingParticipant,
                        $training->title,
                        '/trainings/' . $training->link,
                    ),
                );
            }
        }

        $this->trainingRepository->save($training);

        return $training->id;
    }

    final public function updateStatus(Uuid $trainingId, ElementStatusDto $dto): Uuid
    {
        $training = $this->trainingRepository->findById($trainingId);

        $training->status = $dto->status;
        $this->trainingRepository->save($training);

        foreach ($training->participants as $participant) {
            $this->eventDispatcher->dispatch(
                new NotificationEvent(
                    $participant->user,
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
        /** @var User $user */
        $user = $this->security->getUser();

        $training = $this->trainingRepository->findById($trainingId);

        foreach ($training->participants as $participant) {
            if (! $participant->user->id->equals($user->id)) {
                throw new ValidatorException('Cannot delete training with participants.');
            }
        }

        $this->trainingRepository->delete($training);

        return $trainingId;
    }

    final public function index(TrainingIndexDto $dto): WindowPage
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

        $trainingParticipant->status = $dto->status;
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
