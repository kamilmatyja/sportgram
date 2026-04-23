<?php

namespace App\Service;

use App\Dto\{ElementStatusDto, EventDto, EventIndexDto, EventListDto, EventResultDto};
use App\Entity\{Event, EventDisciplineList, EventDisciplineResult};
use App\Enum\ElementStatusEnum;
use App\Repository\{EventDisciplineListRepository, EventDisciplineResultRepository, EventRepository};
use DateTimeImmutable;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Uid\Uuid;

readonly class EventService
{
    public function __construct(
        private EventRepository $eventRepository,
        private EventDisciplineListRepository $eventDisciplineListRepository,
        private EventDisciplineResultRepository $eventDisciplineResultRepository,
        private Security $security,
    ) {
    }

    final public function create(EventDto $dto): Uuid
    {
        // TODO: Pobierz pageParticipant z kontekstu lub DTO
        $pageParticipant = null; // <- poprawić na właściwy obiekt
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

        return $event->id;
    }

    final public function update(Uuid $id, EventDto $dto): Uuid
    {
        $event = $this->eventRepository->findById($id);
        $event->startedAt = new DateTimeImmutable($dto->startedAt);
        $event->endedAt = new DateTimeImmutable($dto->endedAt);
        $event->title = $dto->title;
        $event->description = $dto->description;
        $event->link = $dto->link;
        $event->rules = $dto->rules;
        $event->photo = $dto->photo;
        $event->location = $dto->location;
        $this->eventRepository->save($event);

        return $event->id;
    }

    final public function updateStatus(Uuid $id, ElementStatusDto $dto): Uuid
    {
        $event = $this->eventRepository->findById($id);
        $event->status = ElementStatusEnum::from($dto->status);
        $this->eventRepository->save($event);

        return $event->id;
    }

    final public function delete(Uuid $id): Uuid
    {
        $event = $this->eventRepository->findById($id);
        $event->softDelete();
        $this->eventRepository->save($event);

        return $event->id;
    }

    final public function index(EventIndexDto $dto): array
    {
        // TODO: Implement filtering, sorting, pagination
        return $this->eventRepository->findAll();
    }

    final public function details(Uuid $id): Event
    {
        return $this->eventRepository->findById($id);
    }

    // Event List CRUD
    final public function createList(EventListDto $dto): Uuid
    {
        // TODO: Pobierz eventDisciplineDistance, feed, user z kontekstu lub DTO
        $eventDisciplineDistance = null;
        $feed = null;
        $user = null;
        $list = new EventDisciplineList($eventDisciplineDistance, $feed, $user, SaveStatusEnum::Pending);
        $this->eventDisciplineListRepository->save($list);

        return $list->id;
    }

    final public function updateList(Uuid $id, EventListDto $dto): Uuid
    {
        $list = $this->eventDisciplineListRepository->findById($id);
        // TODO: Zaktualizuj właściwości listy
        $this->eventDisciplineListRepository->save($list);

        return $list->id;
    }

    final public function updateListStatus(Uuid $id, ElementStatusDto $dto): Uuid
    {
        $list = $this->eventDisciplineListRepository->findById($id);
        $list->status = SaveStatusEnum::from($dto->status);
        $this->eventDisciplineListRepository->save($list);

        return $list->id;
    }

    final public function deleteList(Uuid $id): Uuid
    {
        $list = $this->eventDisciplineListRepository->findById($id);
        $list->softDelete();
        $this->eventDisciplineListRepository->save($list);

        return $list->id;
    }

    final public function indexList(): array
    {
        return $this->eventDisciplineListRepository->findAll();
    }

    final public function detailsList(Uuid $id): EventDisciplineList
    {
        return $this->eventDisciplineListRepository->findById($id);
    }

    // Event Results CRUD
    final public function createResult(EventResultDto $dto): Uuid
    {
        // TODO: Pobierz eventDisciplineDistance, feed, user z kontekstu lub DTO
        $eventDisciplineDistance = null;
        $feed = null;
        $user = null;
        $result = new EventDisciplineResult($eventDisciplineDistance, $feed, $user, (int)$dto->result);
        $this->eventDisciplineResultRepository->save($result);

        return $result->id;
    }

    final public function updateResult(Uuid $id, EventResultDto $dto): Uuid
    {
        $result = $this->eventDisciplineResultRepository->findById($id);
        $result->time = (int)$dto->result;
        $this->eventDisciplineResultRepository->save($result);

        return $result->id;
    }

    final public function deleteResult(Uuid $id): Uuid
    {
        $result = $this->eventDisciplineResultRepository->findById($id);
        $result->softDelete();
        $this->eventDisciplineResultRepository->save($result);

        return $result->id;
    }

    final public function indexResult(): array
    {
        return $this->eventDisciplineResultRepository->findAll();
    }

    final public function detailsResult(Uuid $id): EventDisciplineResult
    {
        return $this->eventDisciplineResultRepository->findById($id);
    }
}
