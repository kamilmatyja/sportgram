<?php

namespace App\Service;

use App\Dto\{ElementStatusDto, EventDto, EventIndexDto, EventListIndexDto, EventResultDto, SaveStatusDto};
use App\Entity\{Event,
    EventDiscipline,
    EventDisciplineDistance,
    EventDisciplineList,
    EventDisciplineResult,
    EventDisciplineSubDistance,
    EventDisciplineSubResult,
    Feed,
    PageParticipant,
    User};
use App\Enum\{DisciplineEnum, ElementStatusEnum, NotificationTypeEnum, SaveStatusEnum};
use App\Event\{EventProcessedEvent, NotificationEvent};
use App\Repository\{EventDisciplineDistanceRepository,
    EventDisciplineListRepository,
    EventDisciplineRepository,
    EventDisciplineResultRepository,
    EventDisciplineSubDistanceRepository,
    EventDisciplineSubResultRepository,
    EventRepository,
    FeedRepository,
    PageRepository};
use DateMalformedStringException;
use DateTimeImmutable;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;

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
        private EventDispatcherInterface $eventDispatcher,
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

        $pageParticipant = $page->participants->filter(fn (PageParticipant $participant) => $participant->user->id === $user->id)->first();

        $event = new Event(
            $pageParticipant,
            new DateTimeImmutable($dto->startedAt),
            new DateTimeImmutable($dto->endedAt),
            $dto->title,
            $dto->description,
            $dto->link,
            $dto->rules,
            base64_decode($dto->photo),
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

        foreach ($page->follows as $follow) {
            $this->eventDispatcher->dispatch(
                new NotificationEvent($follow->user, NotificationTypeEnum::Event, $event->title, '/events/' . $event->link),
            );
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
        $event->photo = base64_decode($dto->photo);
        $event->location = $dto->location;

        foreach ($event->disciplines as $discipline) {
            foreach ($discipline->distances as $distance) {
                if ($distance->lists->count() > 0) {
                    throw new ValidatorException('Cannot delete event discipline distance with lists.');
                }

                foreach ($distance->subDistances as $subDistance) {
                    $this->eventDisciplineSubDistanceRepository->delete($subDistance);
                }

                $this->eventDisciplineDistanceRepository->delete($distance);
            }

            $this->eventDisciplineRepository->delete($discipline);
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

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $event->pageParticipant->user,
                NotificationTypeEnum::EventStatus,
                $event->title,
                '/events/' . $event->link,
            ),
        );

        return $event->id;
    }

    final public function delete(Uuid $eventId): Uuid
    {
        $event = $this->eventRepository->findById($eventId);

        foreach ($event->disciplines as $discipline) {
            foreach ($discipline->distances as $distance) {
                if ($distance->lists->count() > 0) {
                    throw new ValidatorException('Cannot delete event with lists.');
                }
            }
        }

        $this->eventRepository->delete($event);

        return $eventId;
    }

    /** @return Event[] */
    final public function index(EventIndexDto $dto): array
    {
        return $this->eventRepository->findEvents($dto);
    }

    final public function details(Uuid $eventId): Event
    {
        return $this->eventRepository->findById($eventId);
    }

    final public function createList(Uuid $eventDisciplineDistanceId): Uuid
    {
        $eventDisciplineDistance = $this->eventDisciplineDistanceRepository->findById($eventDisciplineDistanceId);

        /** @var User $user */
        $user = $this->security->getUser();

        $feed = new Feed($user, null, null, ElementStatusEnum::Draft);

        $this->feedRepository->save($feed);

        $eventDisciplineList = new EventDisciplineList($eventDisciplineDistance, $feed, $user, SaveStatusEnum::Pending);

        $this->eventDisciplineListRepository->save($eventDisciplineList);

        $eventDiscipline = $eventDisciplineDistance->eventDiscipline;
        $event = $eventDiscipline->event;

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $event->pageParticipant->user,
                NotificationTypeEnum::EventList,
                $event->title,
                '/events/' . $event->link,
            ),
        );

        return $eventDisciplineList->id;
    }

    final public function updateListStatus(Uuid $eventDisciplineListId, SaveStatusDto $dto): Uuid
    {
        $eventDisciplineList = $this->eventDisciplineListRepository->findById($eventDisciplineListId);

        $eventDisciplineList->status = SaveStatusEnum::from($dto->status);
        $this->eventDisciplineListRepository->save($eventDisciplineList);

        $eventDisciplineDistance = $eventDisciplineList->eventDisciplineDistance;
        $eventDiscipline = $eventDisciplineDistance->eventDiscipline;
        $event = $eventDiscipline->event;

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $event->pageParticipant->user,
                NotificationTypeEnum::EventListStatus,
                $event->title,
                '/events/' . $event->link,
            ),
        );

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $eventDisciplineList->user,
                NotificationTypeEnum::EventListStatus,
                $event->title,
                '/events/' . $event->link,
            ),
        );

        return $eventDisciplineList->id;
    }

    final public function deleteList(Uuid $eventDisciplineListId): Uuid
    {
        $eventDisciplineList = $this->eventDisciplineListRepository->findById($eventDisciplineListId);

        $this->eventDisciplineListRepository->delete($eventDisciplineList);

        return $eventDisciplineListId;
    }

    /** @return EventDisciplineList[] */
    final public function indexList(Uuid $eventDisciplineDistanceId, EventListIndexDto $dto): array
    {
        return $this->eventDisciplineListRepository->findLists($eventDisciplineDistanceId, $dto);
    }

    final public function detailsList(Uuid $eventDisciplineListId): EventDisciplineList
    {
        return $this->eventDisciplineListRepository->findById($eventDisciplineListId);
    }

    final public function createResult(Uuid $eventDisciplineListId, EventResultDto $dto): Uuid
    {
        $eventDisciplineList = $this->eventDisciplineListRepository->findById($eventDisciplineListId);

        if ($eventDisciplineList->status !== SaveStatusEnum::Accepted) {
            throw new ValidatorException('Results can only be added to accepted lists.');
        }

        $feed = new Feed($eventDisciplineList->user, null, null, ElementStatusEnum::Draft);

        $this->feedRepository->save($feed);

        $eventDisciplineResult = new EventDisciplineResult(
            $eventDisciplineList,
            $feed,
            $eventDisciplineList->user,
            $dto->time,
        );

        $this->eventDisciplineResultRepository->save($eventDisciplineResult);

        foreach ($dto->subResults as $subResult) {
            $eventDisciplineSubDistance = $this->eventDisciplineSubDistanceRepository->findById(
                Uuid::fromString($subResult->eventDisciplineSubDistanceId),
            );

            $eventDisciplineSubResult = new EventDisciplineSubResult(
                $eventDisciplineSubDistance,
                $eventDisciplineResult,
                $eventDisciplineList->user,
                $subResult->time,
            );

            $this->eventDisciplineSubResultRepository->save($eventDisciplineSubResult);
        }

        $this->eventDispatcher->dispatch(new EventProcessedEvent($eventDisciplineResult));

        $eventDisciplineDistance = $eventDisciplineList->eventDisciplineDistance;
        $eventDiscipline = $eventDisciplineDistance->eventDiscipline;
        $event = $eventDiscipline->event;

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $eventDisciplineList->user,
                NotificationTypeEnum::EventResult,
                $event->title,
                '/events/' . $event->link,
            ),
        );

        return $eventDisciplineResult->id;
    }

    final public function updateResult(Uuid $eventDisciplineResultId, EventResultDto $dto): Uuid
    {
        $eventDisciplineResult = $this->eventDisciplineResultRepository->findById($eventDisciplineResultId);

        $eventDisciplineResult->time = $dto->time;

        foreach ($eventDisciplineResult->subResults as $subResult) {
            $this->eventDisciplineSubResultRepository->delete($subResult);
        }

        foreach ($dto->subResults as $subResult) {
            $eventDisciplineSubDistance = $this->eventDisciplineSubDistanceRepository->findById(
                Uuid::fromString($subResult->eventDisciplineSubDistanceId),
            );
            $eventDisciplineSubResult = new EventDisciplineSubResult(
                $eventDisciplineSubDistance,
                $eventDisciplineResult,
                $eventDisciplineResult->user,
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

        $this->eventDisciplineResultRepository->delete($eventDisciplineResult);

        return $eventDisciplineResultId;
    }
}
