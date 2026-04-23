<?php

namespace App\Controller;

use App\Dto\{ElementStatusDto, EventDetailsQueryDto, EventDto, EventIndexDto, EventListDto, EventResultDto};
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Collection, Conflict, Created, Forbidden, Item, Ok, Unauthorized};
use App\Resource\{EventDisciplineDistanceListResource, EventDisciplineDistanceResultResource, EventResource};
use App\Security\Voter\{EventCreatorVoter, EventListCreatorVoter, EventListVoter, EventResultVoter, EventVoter};
use App\Service\EventService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\{MapQueryString, MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

class EventController extends AbstractController
{
    #[Route('/api/events', name: 'event_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Post(
        summary: 'Create event',
        requestBody: new Body('EventDto'),
        tags: ['events'],
        responses: [new Created(), new BadRequest(), new Unauthorized(), new Forbidden()],
    )]
    final public function create(
        #[MapRequestPayload]
        EventDto $dto,
        EventService $service,
    ): JsonResponse {
        $eventId = $service->create($dto);

        return ApiResponse::created($eventId);
    }

    #[Route('/api/events/{id}', name: 'event_update', methods: ['PUT'])]
    #[IsGranted(EventCreatorVoter::EVENT_CREATOR, subject: 'id')]
    #[OA\Put(
        summary: 'Update event',
        requestBody: new Body('EventDto'),
        tags: ['events'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function update(
        Uuid $id,
        #[MapRequestPayload]
        EventDto $dto,
        EventService $service,
    ): JsonResponse {
        $eventId = $service->update($id, $dto);

        return ApiResponse::ok($eventId);
    }

    #[Route('/api/events/{id}/status', name: 'event_update_status', methods: ['PATCH'])]
    #[IsGranted(EventVoter::EVENT, subject: 'id')]
    #[OA\Patch(
        summary: 'Update event status',
        requestBody: new Body('ElementStatusDto'),
        tags: ['events'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateStatus(
        Uuid $id,
        #[MapRequestPayload]
        ElementStatusDto $dto,
        EventService $service,
    ): JsonResponse {
        $eventId = $service->updateStatus($id, $dto);

        return ApiResponse::ok($eventId);
    }

    #[Route('/api/events/{id}', name: 'event_delete', methods: ['DELETE'])]
    #[IsGranted(EventCreatorVoter::EVENT_CREATOR, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete event',
        tags: ['events'],
        responses: [new Ok(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function delete(
        Uuid $id,
        EventService $service,
    ): JsonResponse {
        $eventId = $service->delete($id);

        return ApiResponse::ok($eventId);
    }

    #[Route('/api/events', name: 'event_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of events',
        tags: ['events'],
        responses: [new Collection('EventResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function index(
        #[MapQueryString(validationFailedStatusCode: 400)]
        EventIndexDto $dto,
        EventService $service,
    ): JsonResponse {
        $events = $service->index($dto);

        $data = EventResource::fromEntityCollection($events);

        return ApiResponse::elements($data);
    }

    #[Route('/api/events/{id}', name: 'event_details', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Details of event',
        tags: ['events'],
        responses: [new Item('EventResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function details(
        Uuid $id,
        #[MapQueryString(validationFailedStatusCode: 400)]
        EventDetailsQueryDto $dto,
        EventService $service,
    ): JsonResponse {
        $event = $service->details($id);

        $data = EventResource::fromEntity($event, $dto);

        return ApiResponse::elements($data);
    }

    #[Route('/api/event-discipline-distances/{id}/list', name: 'event_discipline_distance_list_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Post(
        summary: 'Create event discipline distance list',
        requestBody: new Body('EventListDto'),
        tags: ['events'],
        responses: [new Created(), new BadRequest(), new Unauthorized(), new Forbidden()],
    )]
    final public function createList(
        Uuid $id,
        #[MapRequestPayload]
        EventListDto $dto,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineDistanceListId = $service->createList($id, $dto);

        return ApiResponse::created($eventDisciplineDistanceListId);
    }

    #[Route('/api/event-discipline-distance-lists/{id}', name: 'event_discipline_distance_list_update', methods: ['PUT'])]
    #[IsGranted(EventListCreatorVoter::EVENT_LIST_CREATOR, subject: 'id')]
    #[OA\Put(
        summary: 'Update event discipline distance list',
        requestBody: new Body('EventListDto'),
        tags: ['events'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateList(
        Uuid $id,
        #[MapRequestPayload]
        EventListDto $dto,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineDistanceListId = $service->updateList($id, $dto);

        return ApiResponse::ok($eventDisciplineDistanceListId);
    }

    #[Route('/api/event-discipline-distance-lists/{id}', name: 'event_discipline_distance_list_update_status', methods: ['PATCH'])]
    #[IsGranted(EventListVoter::EVENT_LIST, subject: 'id')]
    #[OA\Patch(
        summary: 'Update event discipline distance list status',
        requestBody: new Body('ElementStatusDto'),
        tags: ['events'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateListStatus(
        Uuid $id,
        #[MapRequestPayload]
        ElementStatusDto $dto,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineDistanceListId = $service->updateListStatus($id, $dto);

        return ApiResponse::ok($eventDisciplineDistanceListId);
    }

    #[Route('/api/event-discipline-distance-lists/{id}', name: 'event_discipline_distance_list_delete', methods: ['DELETE'])]
    #[IsGranted(EventListCreatorVoter::EVENT_LIST_CREATOR, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete event discipline distance list',
        tags: ['events'],
        responses: [new Ok(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function deleteList(
        Uuid $id,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineDistanceListId = $service->deleteList($id);

        return ApiResponse::ok($eventDisciplineDistanceListId);
    }

    #[Route('/api/event-discipline-distances/{id}/list', name: 'event_discipline_distance_list_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of event discipline distance lists',
        tags: ['events'],
        responses: [new Collection('EventDisciplineDistanceListResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function indexList(
        Uuid $id,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineDistanceLists = $service->indexList($id);

        $data = EventDisciplineDistanceListResource::fromEntityCollection($eventDisciplineDistanceLists);

        return ApiResponse::elements($data);
    }

    #[Route('/api/event-discipline-distance-lists/{id}', name: 'event_discipline_distance_list_details', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Details of event discipline distance list',
        tags: ['events'],
        responses: [new Item('EventDisciplineDistanceListResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function detailsList(
        Uuid $id,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineDistanceList = $service->detailsList($id);

        $data = EventDisciplineDistanceListResource::fromEntity($eventDisciplineDistanceList);

        return ApiResponse::elements($data);
    }

    #[Route('/api/event-discipline-distances/{id}/result', name: 'event_discipline_distance_result_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Post(
        summary: 'Create event discipline distance result',
        requestBody: new Body('EventResultDto'),
        tags: ['events'],
        responses: [new Created(), new BadRequest(), new Unauthorized(), new Forbidden()],
    )]
    final public function createResult(
        Uuid $id,
        #[MapRequestPayload]
        EventResultDto $dto,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineDistanceResultId = $service->createResult($id, $dto);

        return ApiResponse::created($eventDisciplineDistanceResultId);
    }

    #[Route('/api/event-discipline-distance-results/{id}', name: 'event_discipline_distance_result_update', methods: ['PUT'])]
    #[IsGranted(EventResultVoter::EVENT_RESULT, subject: 'id')]
    #[OA\Put(
        summary: 'Update event discipline distance result',
        requestBody: new Body('EventResultDto'),
        tags: ['events'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateResult(
        Uuid $id,
        #[MapRequestPayload]
        EventResultDto $dto,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineDistanceResultId = $service->updateResult($id, $dto);

        return ApiResponse::ok($eventDisciplineDistanceResultId);
    }

    #[Route('/api/event-discipline-distance-results/{id}', name: 'event_discipline_distance_result_delete', methods: ['DELETE'])]
    #[IsGranted(EventResultVoter::EVENT_RESULT, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete event discipline distance result',
        tags: ['events'],
        responses: [new Ok(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function deleteResult(
        Uuid $id,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineDistanceResultId = $service->deleteResult($id);

        return ApiResponse::ok($eventDisciplineDistanceResultId);
    }

    #[Route('/api/event-discipline-distances/{id}/result', name: 'event_discipline_distance_result_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of event discipline distance results',
        tags: ['events'],
        responses: [new Collection('EventDisciplineDistanceResultResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function indexResult(
        Uuid $id,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineDistanceResults = $service->indexResult();

        $data = EventDisciplineDistanceResultResource::fromEntityCollection($eventDisciplineDistanceResults);

        return ApiResponse::elements($data);
    }

    #[Route('/api/event-discipline-distance-results/{id}', name: 'event_discipline_distance_result_details', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Details of event discipline distance result',
        tags: ['events'],
        responses: [new Item('EventDisciplineDistanceResultResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function detailsResult(
        Uuid $id,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineDistanceResult = $service->detailsResult($id);

        $data = EventDisciplineDistanceResultResource::fromEntity($eventDisciplineDistanceResult);

        return ApiResponse::elements($data);
    }
}
