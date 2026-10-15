<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use App\Controller\EventController;
use App\Dto\{ElementStatusDto,
    EventDetailsQueryDto,
    EventDto,
    EventIndexDto,
    EventListDetailsQueryDto,
    EventListIndexDto,
    EventResultDto,
    SaveStatusDto};
use App\Entity\{Event, EventDisciplineList};
use App\Enum\{ElementStatusEnum, RoleEnum, SaveStatusEnum};
use App\Resource\{EventDisciplineDistanceListResource, EventResource};
use App\Security\Voter\{EventCreatorVoter,
    EventListCreatorVoter,
    EventListVoter,
    EventResultVoter,
    EventUpdaterVoter,
    EventVoter};
use App\Service\EventService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{EventDisciplineFactory, EventDisciplineListFactory, EventDisciplineResultFactory, EventFactory};

class EventControllerTest extends ControllerTestCase
{
    private EventService&MockObject $service;

    private EventController $controller;

    protected function setUp(): void
    {
        $this->controller = new EventController();
    }

    #[DataProvider('routeProvider')]
    final public function testRouting(string $action, string $path, string $method, string $name, string $attribute, ?string $subject): void
    {
        $this->assertRoute([EventController::class, $action], $path, [$method], $name);
        $this->assertGrantedBy([EventController::class, $action], $attribute, $subject);
    }

    public static function routeProvider(): iterable
    {
        yield 'create' => ['create', '/api/event-pages/{id}', 'POST', 'event_create', EventCreatorVoter::EVENT_CREATOR, 'id'];
        yield 'update' => ['update', '/api/events/{id}', 'PUT', 'event_update', EventUpdaterVoter::EVENT_UPDATER, 'id'];
        yield 'updateStatus' => ['updateStatus', '/api/events/{id}/status', 'PATCH', 'event_update_status', EventVoter::EVENT, 'id'];
        yield 'delete' => ['delete', '/api/events/{id}', 'DELETE', 'event_delete', EventUpdaterVoter::EVENT_UPDATER, 'id'];
        yield 'index' => ['index', '/api/events', 'GET', 'event_index', 'IS_AUTHENTICATED_FULLY', null];
        yield 'details' => ['details', '/api/events/{id}', 'GET', 'event_details', 'IS_AUTHENTICATED_FULLY', null];
        yield 'createList' => ['createList', '/api/event-discipline-distances/{id}', 'POST', 'event_discipline_distance_list_create', RoleEnum::ROLE_PARTICIPANT, null];
        yield 'updateListStatus' => ['updateListStatus', '/api/event-discipline-distance-lists/{id}/status', 'PATCH', 'event_discipline_distance_list_update_status', EventListVoter::EVENT_LIST, 'id'];
        yield 'deleteList' => ['deleteList', '/api/event-discipline-distance-lists/{id}', 'DELETE', 'event_discipline_distance_list_delete', EventListCreatorVoter::EVENT_LIST_CREATOR, 'id'];
        yield 'indexList' => ['indexList', '/api/event-discipline-distances/{id}', 'GET', 'event_discipline_distance_list_index', 'IS_AUTHENTICATED_FULLY', null];
        yield 'detailsList' => ['detailsList', '/api/event-discipline-distance-lists/{id}', 'GET', 'event_discipline_distance_list_details', 'IS_AUTHENTICATED_FULLY', null];
        yield 'createResult' => ['createResult', '/api/event-discipline-distance-lists/{id}', 'POST', 'event_discipline_distance_result_create', EventListCreatorVoter::EVENT_LIST_CREATOR, 'id'];
        yield 'updateResult' => ['updateResult', '/api/event-discipline-distance-results/{id}', 'PUT', 'event_discipline_distance_result_update', EventResultVoter::EVENT_RESULT, 'id'];
        yield 'deleteResult' => ['deleteResult', '/api/event-discipline-distance-results/{id}', 'DELETE', 'event_discipline_distance_result_delete', EventResultVoter::EVENT_RESULT, 'id'];
    }

    final public function testRoutesAreAllCovered(): void
    {
        $this->assertCoversAllRoutes(EventController::class, array_keys(iterator_to_array(self::routeProvider())));
    }

    final public function testRequestMapping(): void
    {
        $this->assertMapsRequestPayload([EventController::class, 'create'], 'dto');
        $this->assertMapsRequestPayload([EventController::class, 'update'], 'dto');
        $this->assertMapsRequestPayload([EventController::class, 'updateStatus'], 'dto');
        $this->assertMapsQueryString([EventController::class, 'index'], 'dto');
        $this->assertMapsQueryString([EventController::class, 'index'], 'include');
        $this->assertMapsQueryString([EventController::class, 'details'], 'dto');
        $this->assertMapsRequestPayload([EventController::class, 'updateListStatus'], 'dto');
        $this->assertMapsQueryString([EventController::class, 'indexList'], 'dto');
        $this->assertMapsQueryString([EventController::class, 'indexList'], 'include');
        $this->assertMapsQueryString([EventController::class, 'detailsList'], 'dto');
        $this->assertMapsRequestPayload([EventController::class, 'createResult'], 'dto');
        $this->assertMapsRequestPayload([EventController::class, 'updateResult'], 'dto');
    }

    final public function testCreate(): void
    {
        $pageId = Uuid::v7();
        $dto = new EventDto();
        $id = Uuid::v7();
        $this->service()->expects($this->once())->method('create')->with($pageId, $dto)->willReturn($id);

        $response = $this->controller->create($pageId, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $id], $response);
    }

    final public function testUpdate(): void
    {
        $id = Uuid::v7();
        $dto = new EventDto();
        $this->service()->expects($this->once())->method('update')->with($id, $dto)->willReturn($id);

        $response = $this->controller->update($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testUpdateStatus(): void
    {
        $id = Uuid::v7();
        $dto = new ElementStatusDto();
        $dto->status = ElementStatusEnum::Active;
        $this->service()->expects($this->once())->method('updateStatus')->with($id, $dto)->willReturn($id);

        $response = $this->controller->updateStatus($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testDelete(): void
    {
        $id = Uuid::v7();
        $this->service()->expects($this->once())->method('delete')->with($id)->willReturn($id);

        $response = $this->controller->delete($id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testIndex(): void
    {
        $dto = new EventIndexDto();
        $include = new EventDetailsQueryDto();
        $include->include = [EventDetailsQueryDto::EVENT_DISCIPLINES];
        $events = [$this->eventWithDiscipline(), $this->eventWithDiscipline()];
        $window = self::window($events, total: 12, page: 1, limit: 2);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, $include, $this->service());

        $data = EventResource::fromEntityCollection($events, $include);
        $this->assertArrayHasKey('disciplines', $data[0]);
        $this->assertJsonResponse(Response::HTTP_OK, ['data' => $data, 'pagination' => self::pagination($window)], $response);
    }

    final public function testIndexWithoutResults(): void
    {
        $dto = new EventIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, new EventDetailsQueryDto(), $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    final public function testDetails(): void
    {
        $event = $this->eventWithDiscipline();
        $dto = new EventDetailsQueryDto();
        $dto->include = [EventDetailsQueryDto::EVENT_DISCIPLINES];
        $this->service()->expects($this->once())->method('details')->with($event->id)->willReturn($event);

        $response = $this->controller->details($event->id, $dto, $this->service());

        $data = EventResource::fromEntity($event, $dto);
        $this->assertArrayHasKey('disciplines', $data);
        $this->assertJsonResponse(Response::HTTP_OK, ['data' => $data], $response);
    }

    final public function testDetailsWithoutInclude(): void
    {
        $event = $this->event();
        $this->service()->expects($this->once())->method('details')->with($event->id)->willReturn($event);

        $response = $this->controller->details($event->id, new EventDetailsQueryDto(), $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => EventResource::fromEntity($event)], $response);
    }

    final public function testCreateList(): void
    {
        $distanceId = Uuid::v7();
        $id = Uuid::v7();
        $this->service()->expects($this->once())->method('createList')->with($distanceId)->willReturn($id);

        $response = $this->controller->createList($distanceId, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $id], $response);
    }

    final public function testUpdateListStatus(): void
    {
        $id = Uuid::v7();
        $dto = new SaveStatusDto();
        $dto->status = SaveStatusEnum::Accepted;
        $this->service()->expects($this->once())->method('updateListStatus')->with($id, $dto)->willReturn($id);

        $response = $this->controller->updateListStatus($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testDeleteList(): void
    {
        $id = Uuid::v7();
        $this->service()->expects($this->once())->method('deleteList')->with($id)->willReturn($id);

        $response = $this->controller->deleteList($id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testIndexList(): void
    {
        $distanceId = Uuid::v7();
        $dto = new EventListIndexDto();
        $include = new EventListDetailsQueryDto();
        $include->include = [EventListDetailsQueryDto::EVENT_LIST_RESULTS];
        $lists = [$this->listWithResult(), $this->listWithResult()];
        $window = self::window($lists, total: 7, page: 2, limit: 2);
        $this->service()->expects($this->once())->method('indexList')->with($distanceId, $dto)->willReturn($window);

        $response = $this->controller->indexList($distanceId, $dto, $include, $this->service());

        $data = EventDisciplineDistanceListResource::fromEntityCollection($lists, $include);
        $this->assertArrayHasKey('results', $data[0]);
        $this->assertJsonResponse(Response::HTTP_OK, ['data' => $data, 'pagination' => self::pagination($window)], $response);
    }

    final public function testIndexListWithoutResults(): void
    {
        $distanceId = Uuid::v7();
        $dto = new EventListIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('indexList')->with($distanceId, $dto)->willReturn($window);

        $response = $this->controller->indexList($distanceId, $dto, new EventListDetailsQueryDto(), $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    final public function testDetailsList(): void
    {
        $list = $this->listWithResult();
        $dto = new EventListDetailsQueryDto();
        $dto->include = [EventListDetailsQueryDto::EVENT_LIST_RESULTS];
        $this->service()->expects($this->once())->method('detailsList')->with($list->id)->willReturn($list);

        $response = $this->controller->detailsList($list->id, $dto, $this->service());

        $data = EventDisciplineDistanceListResource::fromEntity($list, $dto);
        $this->assertArrayHasKey('results', $data);
        $this->assertJsonResponse(Response::HTTP_OK, ['data' => $data], $response);
    }

    final public function testCreateResult(): void
    {
        $listId = Uuid::v7();
        $dto = new EventResultDto();
        $id = Uuid::v7();
        $this->service()->expects($this->once())->method('createResult')->with($listId, $dto)->willReturn($id);

        $response = $this->controller->createResult($listId, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $id], $response);
    }

    final public function testUpdateResult(): void
    {
        $id = Uuid::v7();
        $dto = new EventResultDto();
        $this->service()->expects($this->once())->method('updateResult')->with($id, $dto)->willReturn($id);

        $response = $this->controller->updateResult($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testDeleteResult(): void
    {
        $id = Uuid::v7();
        $this->service()->expects($this->once())->method('deleteResult')->with($id)->willReturn($id);

        $response = $this->controller->deleteResult($id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    private function service(): EventService&MockObject
    {
        return $this->service ??= $this->createMock(EventService::class);
    }

    private function event(): Event
    {
        $event = EventFactory::make();
        $event->id = Uuid::v7();
        $event->onPrePersist();

        return $event;
    }

    private function eventWithDiscipline(): Event
    {
        $event = $this->event();

        $discipline = EventDisciplineFactory::make(['event' => $event]);
        $discipline->id = Uuid::v7();
        $discipline->onPrePersist();
        $event->disciplines->add($discipline);

        return $event;
    }

    private function listWithResult(): EventDisciplineList
    {
        $list = EventDisciplineListFactory::make();
        $list->id = Uuid::v7();
        $list->onPrePersist();

        $result = EventDisciplineResultFactory::make(['eventDisciplineList' => $list]);
        $result->id = Uuid::v7();
        $result->onPrePersist();
        $list->results->add($result);

        return $list;
    }
}
