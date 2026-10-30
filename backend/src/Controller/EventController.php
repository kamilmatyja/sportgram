<?php

namespace App\Controller;

use App\Dto\{ElementStatusDto,
    EventDetailsQueryDto,
    EventDto,
    EventIndexDto,
    EventListDetailsQueryDto,
    EventListIndexDto,
    EventResultDto,
    SaveStatusDto};
use App\Enum\RoleEnum;
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Collection, Conflict, Created, Forbidden, Item, NotFound, Ok, Unauthorized};
use App\Resource\{EventDisciplineDistanceListResource, EventResource};
use App\Security\Voter\{EventCreatorVoter,
    EventListCreatorVoter,
    EventListVoter,
    EventResultVoter,
    EventUpdaterVoter,
    EventVoter};
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
    #[Route('/api/event-pages/{id}', name: 'event_create', methods: ['POST'])]
    #[IsGranted(EventCreatorVoter::EVENT_CREATOR, subject: 'id')]
    #[OA\Post(
        summary: 'Create event - endpoint for page participants',
        requestBody: new Body(EventDto::class),
        tags: ['events'],
        responses: [new Created(), new BadRequest(), new Conflict(), new NotFound(), new Unauthorized(), new Forbidden()],
    )]
    final public function create(
        Uuid $id,
        #[MapRequestPayload]
        EventDto $dto,
        EventService $service,
    ): JsonResponse {
        $eventId = $service->create($id, $dto);

        return ApiResponse::created($eventId);
    }

    #[Route('/api/events/{id}', name: 'event_update', methods: ['PUT'])]
    #[IsGranted(EventUpdaterVoter::EVENT_UPDATER, subject: 'id')]
    #[OA\Put(
        summary: 'Update event - endpoint for owner',
        requestBody: new Body(EventDto::class),
        tags: ['events'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new NotFound(), new Unauthorized(), new Forbidden()],
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
        summary: 'Update event status - endpoint for owner or user with administrator role',
        requestBody: new Body(ElementStatusDto::class),
        tags: ['events'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new NotFound(), new Unauthorized(), new Forbidden()],
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
    #[IsGranted(EventUpdaterVoter::EVENT_UPDATER, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete event - endpoint for owner',
        tags: ['events'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new NotFound(), new Unauthorized(), new Forbidden()],
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
        summary: 'Index of events - endpoint for authenticated user',
        tags: ['events'],
        responses: [new Collection(EventResource::class), new BadRequest(), new Unauthorized()],
    )]
    final public function index(
        #[MapQueryString(validationFailedStatusCode: 400)]
        EventIndexDto $dto,
        #[MapQueryString(validationFailedStatusCode: 400)]
        EventDetailsQueryDto $include,
        EventService $service,
    ): JsonResponse {
        $window = $service->index($dto);

        $data = EventResource::fromEntityCollection($window->getItems(), $include);

        return ApiResponse::elements($data, $window);
    }

    #[Route('/api/events/{id}', name: 'event_details', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Details of event - endpoint for authenticated user',
        tags: ['events'],
        responses: [new Item(EventResource::class), new BadRequest(), new Conflict(), new NotFound(), new Unauthorized()],
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

    #[Route('/api/event-discipline-distances/{id}', name: 'event_discipline_distance_list_create', methods: ['POST'])]
    #[IsGranted(RoleEnum::ROLE_PARTICIPANT)]
    #[OA\Post(
        summary: 'Create event discipline distance list - endpoint for user with participant role',
        tags: ['events'],
        responses: [new Created(), new BadRequest(), new Conflict(), new NotFound(), new Unauthorized(), new Forbidden()],
    )]
    final public function createList(
        Uuid $id,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineListId = $service->createList($id);

        return ApiResponse::created($eventDisciplineListId);
    }

    #[Route('/api/event-discipline-distance-lists/{id}/status', name: 'event_discipline_distance_list_update_status', methods: ['PATCH'])]
    #[IsGranted(EventListVoter::EVENT_LIST, subject: 'id')]
    #[OA\Patch(
        summary: 'Update event discipline distance list status - endpoint for owner, user with participant role or user with administrator role',
        requestBody: new Body(SaveStatusDto::class),
        tags: ['events'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new NotFound(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateListStatus(
        Uuid $id,
        #[MapRequestPayload]
        SaveStatusDto $dto,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineListId = $service->updateListStatus($id, $dto);

        return ApiResponse::ok($eventDisciplineListId);
    }

    #[Route('/api/event-discipline-distance-lists/{id}', name: 'event_discipline_distance_list_delete', methods: ['DELETE'])]
    #[IsGranted(EventListCreatorVoter::EVENT_LIST_CREATOR, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete event discipline distance list - endpoint for owner',
        tags: ['events'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new NotFound(), new Unauthorized(), new Forbidden()],
    )]
    final public function deleteList(
        Uuid $id,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineListId = $service->deleteList($id);

        return ApiResponse::ok($eventDisciplineListId);
    }

    #[Route('/api/event-discipline-distances/{id}', name: 'event_discipline_distance_list_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of event discipline distance lists - endpoint for authenticated user',
        tags: ['events'],
        responses: [new Collection(EventDisciplineDistanceListResource::class), new BadRequest(), new Conflict(), new NotFound(), new Unauthorized()],
    )]
    final public function indexList(
        Uuid $id,
        #[MapQueryString(validationFailedStatusCode: 400)]
        EventListIndexDto $dto,
        #[MapQueryString(validationFailedStatusCode: 400)]
        EventListDetailsQueryDto $include,
        EventService $service,
    ): JsonResponse {
        $window = $service->indexList($id, $dto);

        $data = EventDisciplineDistanceListResource::fromEntityCollection($window->getItems(), $include);

        return ApiResponse::elements($data, $window);
    }

    #[Route('/api/event-discipline-distance-lists/{id}', name: 'event_discipline_distance_list_details', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Details of event discipline distance list - endpoint for authenticated user',
        tags: ['events'],
        responses: [new Item(EventDisciplineDistanceListResource::class), new BadRequest(), new Conflict(), new NotFound(), new Unauthorized()],
    )]
    final public function detailsList(
        Uuid $id,
        #[MapQueryString(validationFailedStatusCode: 400)]
        EventListDetailsQueryDto $dto,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineDistanceList = $service->detailsList($id);

        $data = EventDisciplineDistanceListResource::fromEntity($eventDisciplineDistanceList, $dto);

        return ApiResponse::elements($data);
    }

    #[Route('/api/event-discipline-distance-lists/{id}', name: 'event_discipline_distance_result_create', methods: ['POST'])]
    #[IsGranted(EventListCreatorVoter::EVENT_LIST_CREATOR, subject: 'id')]
    #[OA\Post(
        summary: 'Create event discipline distance result - endpoint for owner',
        requestBody: new Body(EventResultDto::class),
        tags: ['events'],
        responses: [new Created(), new BadRequest(), new Conflict(), new NotFound(), new Unauthorized(), new Forbidden()],
    )]
    final public function createResult(
        Uuid $id,
        #[MapRequestPayload]
        EventResultDto $dto,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineResultId = $service->createResult($id, $dto);

        return ApiResponse::created($eventDisciplineResultId);
    }

    #[Route('/api/event-discipline-distance-results/{id}', name: 'event_discipline_distance_result_update', methods: ['PUT'])]
    #[IsGranted(EventResultVoter::EVENT_RESULT, subject: 'id')]
    #[OA\Put(
        summary: 'Update event discipline distance result - endpoint for owner',
        requestBody: new Body(EventResultDto::class),
        tags: ['events'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new NotFound(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateResult(
        Uuid $id,
        #[MapRequestPayload]
        EventResultDto $dto,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineResultId = $service->updateResult($id, $dto);

        return ApiResponse::ok($eventDisciplineResultId);
    }

    #[Route('/api/event-discipline-distance-results/{id}', name: 'event_discipline_distance_result_delete', methods: ['DELETE'])]
    #[IsGranted(EventResultVoter::EVENT_RESULT, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete event discipline distance result - endpoint for owner',
        tags: ['events'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new NotFound(), new Unauthorized(), new Forbidden()],
    )]
    final public function deleteResult(
        Uuid $id,
        EventService $service,
    ): JsonResponse {
        $eventDisciplineResultId = $service->deleteResult($id);

        return ApiResponse::ok($eventDisciplineResultId);
    }
}
