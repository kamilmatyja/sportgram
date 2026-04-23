<?php

namespace App\Service;

use App\Dto\{ElementStatusDto,
    EventDto,
    EventIndexDto,
    EventListDto,
    EventListIndexDto,
    EventResultDto,
    EventResultIndexDto,
    SaveStatusDto};
use App\Entity\{Event,
    EventDiscipline,
    EventDisciplineDistance,
    EventDisciplineList,
    EventDisciplineResult,
    EventDisciplineSubDistance,
    EventDisciplineSubResult,
    Feed,
    User};
use App\Enum\{DisciplineEnum, ElementStatusEnum, SaveStatusEnum};
use App\Repository\{EventDisciplineDistanceRepository,
    EventDisciplineListRepository,
    EventDisciplineRepository,
    EventDisciplineResultRepository,
    EventDisciplineSubDistanceRepository,
    EventDisciplineSubResultRepository,
    EventRepository,
    FeedRepository,
    PageRepository,
    UserRepository};
use DateMalformedStringException;
use DateTimeImmutable;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Uid\Uuid;

readonly class EventService
{
    public function __construct(
        private EventRepository $eventRepository,
        private EventDisciplineRepository $eventDisciplineRepository,
        private EventDisciplineDistanceRepository $eventDisciplineDistanceRepository,
        private EventDisciplineSubDistanceRepository $eventDisciplineSubDistanceRepository,
        private EventDisciplineListRepository $eventDisciplineListRepository,
        private EventDisciplineResultRepository $eventDisciplineResultRepository,
        private EventDisciplineSubResultRepository $eventDisciplineSubResultRepository,
        private FeedRepository $feedRepository,
        private PageRepository $pageRepository,
        private UserRepository $userRepository,
        private Security $security,
    ) {
    }

    /**
     * @throws DateMalformedStringException
     */
    final public function create(Uuid $pageId, EventDto $dto): Uuid
    {
        $page = $this->pageRepository->findById($pageId);

        /** @var User $user */
        $user = $this->security->getUser();

        $feed = new Feed($user, null, null, ElementStatusEnum::Draft);
        $this->feedRepository->save($feed);

        $pageParticipant = $page->participants->findFirst(
            fn ($participant) => $participant->user->id->toString() === $user->id->toString(),
        );

        $event = new Event(
            $pageParticipant,
            new DateTimeImmutable($dto->startedAt),
            new DateTimeImmutable($dto->endedAt),
            $dto->title,
            $dto->description,
            $dto->link,
            $dto->rules,
            $dto->photo,
            $dto->location,
            ElementStatusEnum::Active,
        );

        $this->eventRepository->save($event);

        foreach ($dto->disciplines as $discipline) {
            $eventDiscipline = new EventDiscipline($event, DisciplineEnum::from($discipline->discipline));

            $this->eventDisciplineRepository->save($eventDiscipline);

            foreach ($discipline->distances as $distance) {
                $eventDisciplineDistance = new EventDisciplineDistance($eventDiscipline, $distance->distance);

                $this->eventDisciplineDistanceRepository->save($eventDisciplineDistance);

                foreach ($distance->subDistances as $subDistance) {
                    $eventDisciplineSubDistance = new EventDisciplineSubDistance(
                        $eventDisciplineDistance,
                        $subDistance->subDistance,
                    );

                    $this->eventDisciplineSubDistanceRepository->save($eventDisciplineSubDistance);
                }
            }
        }

        return $event->id;
    }

    /**
     * @throws DateMalformedStringException
     */
    final public function update(Uuid $eventId, EventDto $dto): Uuid
    {
        $event = $this->eventRepository->findById($eventId);

        $event->startedAt = new DateTimeImmutable($dto->startedAt);
        $event->endedAt = new DateTimeImmutable($dto->endedAt);
        $event->title = $dto->title;
        $event->description = $dto->description;
        $event->link = $dto->link;
        $event->rules = $dto->rules;
        $event->photo = $dto->photo;
        $event->location = $dto->location;

        /** @var EventDiscipline $discipline */
        foreach ($event->disciplines as $discipline) {
            $discipline->softDelete();
            $this->eventDisciplineRepository->save($discipline);

            /** @var EventDisciplineDistance $distance */
            foreach ($discipline->distances as $distance) {
                $distance->softDelete();
                $this->eventDisciplineDistanceRepository->save($distance);

                /** @var EventDisciplineSubDistance $subDistance */
                foreach ($distance->subDistances as $subDistance) {
                    $subDistance->softDelete();
                    $this->eventDisciplineSubDistanceRepository->save($subDistance);
                }
            }
        }

        foreach ($dto->disciplines as $discipline) {
            $eventDiscipline = new EventDiscipline($event, DisciplineEnum::from($discipline->discipline));

            $this->eventDisciplineRepository->save($eventDiscipline);

            foreach ($discipline->distances as $distance) {
                $eventDisciplineDistance = new EventDisciplineDistance($eventDiscipline, $distance->distance);

                $this->eventDisciplineDistanceRepository->save($eventDisciplineDistance);

                foreach ($distance->subDistances as $subDistance) {
                    $eventDisciplineSubDistance = new EventDisciplineSubDistance(
                        $eventDisciplineDistance,
                        $subDistance->subDistance,
                    );

                    $this->eventDisciplineSubDistanceRepository->save($eventDisciplineSubDistance);
                }
            }
        }

        $this->eventRepository->save($event);

        return $event->id;
    }

    final public function updateStatus(Uuid $eventId, ElementStatusDto $dto): Uuid
    {
        $event = $this->eventRepository->findById($eventId);

        $event->status = ElementStatusEnum::from($dto->status);
        $this->eventRepository->save($event);

        return $event->id;
    }

    final public function delete(Uuid $eventId): Uuid
    {
        $event = $this->eventRepository->findById($eventId);

        $event->softDelete();
        $this->eventRepository->save($event);

        return $event->id;
    }

    final public function index(EventIndexDto $dto): array
    {
        return $this->eventRepository->findEvents($dto);
    }

    final public function details(Uuid $eventId): Event
    {
        return $this->eventRepository->findById($eventId);
    }

    final public function createList(Uuid $eventDisciplineDistanceId, EventListDto $dto): Uuid
    {
        $eventDisciplineDistance = $this->eventDisciplineDistanceRepository->findById($eventDisciplineDistanceId);

        $user = $this->userRepository->findById(Uuid::fromString($dto->userId));

        $feed = new Feed($user, null, null, ElementStatusEnum::Draft);

        $this->feedRepository->save($feed);

        $eventDisciplineList = new EventDisciplineList($eventDisciplineDistance, $feed, $user, SaveStatusEnum::Pending);

        $this->eventDisciplineListRepository->save($eventDisciplineList);

        return $eventDisciplineList->id;
    }

    final public function updateList(Uuid $eventDisciplineListId, EventListDto $dto): Uuid
    {
        $eventDisciplineList = $this->eventDisciplineListRepository->findById($eventDisciplineListId);

        $user = $this->userRepository->findById(Uuid::fromString($dto->userId));

        $eventDisciplineList->user = $user;
        $this->eventDisciplineListRepository->save($eventDisciplineList);

        return $eventDisciplineList->id;
    }

    final public function updateListStatus(Uuid $eventDisciplineListId, SaveStatusDto $dto): Uuid
    {
        $eventDisciplineList = $this->eventDisciplineListRepository->findById($eventDisciplineListId);

        $eventDisciplineList->status = SaveStatusEnum::from($dto->status);
        $this->eventDisciplineListRepository->save($eventDisciplineList);

        return $eventDisciplineList->id;
    }

    final public function deleteList(Uuid $eventDisciplineListId): Uuid
    {
        $eventDisciplineList = $this->eventDisciplineListRepository->findById($eventDisciplineListId);

        $eventDisciplineList->softDelete();
        $this->eventDisciplineListRepository->save($eventDisciplineList);

        return $eventDisciplineList->id;
    }

    final public function indexList(Uuid $eventDisciplineDistanceId, EventListIndexDto $dto): array
    {
        return $this->eventDisciplineListRepository->findLists($eventDisciplineDistanceId, $dto);
    }

    final public function detailsList(Uuid $eventDisciplineListId): EventDisciplineList
    {
        return $this->eventDisciplineListRepository->findById($eventDisciplineListId);
    }

    final public function createResult(Uuid $eventDisciplineDistanceId, EventResultDto $dto): Uuid
    {
        $eventDisciplineDistance = $this->eventDisciplineDistanceRepository->findById($eventDisciplineDistanceId);

        $user = $this->userRepository->findById(Uuid::fromString($dto->userId));

        $feed = new Feed($user, null, null, ElementStatusEnum::Draft);

        $this->feedRepository->save($feed);

        $eventDisciplineResult = new EventDisciplineResult($eventDisciplineDistance, $feed, $user, $dto->time);

        $this->eventDisciplineResultRepository->save($eventDisciplineResult);

        foreach ($dto->subResults as $subResult) {
            $eventDisciplineSubDistance = $this->eventDisciplineSubDistanceRepository->findById(
                Uuid::fromString($subResult->eventDisciplineSubDistanceId),
            );

            $eventDisciplineSubResult = new EventDisciplineSubResult(
                $eventDisciplineSubDistance,
                $user,
                $subResult->time,
            );

            $this->eventDisciplineSubResultRepository->save($eventDisciplineSubResult);
        }

        return $eventDisciplineResult->id;
    }

    final public function updateResult(Uuid $eventDisciplineResultId, EventResultDto $dto): Uuid
    {
        $eventDisciplineResult = $this->eventDisciplineResultRepository->findById($eventDisciplineResultId);

        $user = $this->userRepository->findById(Uuid::fromString($dto->userId));

        $eventDisciplineResult->user = $user;
        $eventDisciplineResult->time = $dto->time;

        /** @var EventDisciplineSubDistance $subDistance */
        foreach ($eventDisciplineResult->eventDisciplineDistance->subDistances->toArray() as $subDistance) {
            /** @var EventDisciplineSubResult $subResult */
            foreach ($subDistance->subResults as $subResult) {
                if ($subResult->user->id->toString() === $user->id->toString()) {
                    $subResult->softDelete();
                    $this->eventDisciplineSubResultRepository->save($subResult);
                }
            }
        }

        foreach ($dto->subResults as $subResult) {
            $eventDisciplineSubDistance = $this->eventDisciplineSubDistanceRepository->findById(
                Uuid::fromString($subResult->eventDisciplineSubDistanceId),
            );
            $eventDisciplineSubResult = new EventDisciplineSubResult(
                $eventDisciplineSubDistance,
                $user,
                $subResult->time,
            );

            $this->eventDisciplineSubResultRepository->save($eventDisciplineSubResult);
        }

        $this->eventDisciplineResultRepository->save($eventDisciplineResult);

        return $eventDisciplineResult->id;
    }

    final public function deleteResult(Uuid $eventDisciplineResultId): Uuid
    {
        $eventDisciplineResult = $this->eventDisciplineResultRepository->findById($eventDisciplineResultId);

        $eventDisciplineResult->softDelete();
        $this->eventDisciplineResultRepository->save($eventDisciplineResult);

        return $eventDisciplineResult->id;
    }

    final public function indexResult(Uuid $eventDisciplineDistanceId, EventResultIndexDto $dto): array
    {
        return $this->eventDisciplineResultRepository->findResults($eventDisciplineDistanceId, $dto);
    }

    final public function detailsResult(Uuid $eventDisciplineResultId): EventDisciplineResult
    {
        return $this->eventDisciplineResultRepository->findById($eventDisciplineResultId);
    }
}
