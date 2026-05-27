<?php

namespace App\Controller;

use App\Dto\{ConversationActivityIndexDto, ConversationDto, ConversationIndexDto, ConversationStatusDto};
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Collection, Conflict, Created, Forbidden, Item, Ok, Unauthorized};
use App\Resource\{ConversationActivityResource, ConversationResource};
use App\Security\Voter\{ConversationActivityCreatorVoter,
    ConversationActivityVoter,
    ConversationSenderVoter,
    ConversationVoter};
use App\Service\ConversationService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\{MapQueryString, MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

class ConversationController extends AbstractController
{
    #[Route('/api/conversation-users/{id}', name: 'conversation_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Post(
        summary: 'Create conversation',
        requestBody: new Body(ConversationDto::class),
        tags: ['conversations'],
        responses: [new Created(), new BadRequest(), new Unauthorized(), new Forbidden()],
    )]
    final public function create(
        Uuid $id,
        #[MapRequestPayload]
        ConversationDto $dto,
        ConversationService $service,
    ): JsonResponse {
        $conversationId = $service->create($id, $dto);

        return ApiResponse::created($conversationId);
    }

    #[Route('/api/conversations/{id}', name: 'conversation_update', methods: ['PUT'])]
    #[IsGranted(ConversationSenderVoter::CONVERSATION_SENDER, subject: 'id')]
    #[OA\Put(
        summary: 'Update conversation',
        requestBody: new Body(ConversationDto::class),
        tags: ['conversations'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function update(
        Uuid $id,
        #[MapRequestPayload]
        ConversationDto $dto,
        ConversationService $service,
    ): JsonResponse {
        $conversationId = $service->update($id, $dto);

        return ApiResponse::ok($conversationId);
    }

    #[Route('/api/conversations/{id}/status', name: 'conversation_update_status', methods: ['PATCH'])]
    #[IsGranted(ConversationVoter::CONVERSATION, subject: 'id')]
    #[OA\Patch(
        summary: 'Update conversation status',
        requestBody: new Body(ConversationStatusDto::class),
        tags: ['conversations'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateStatus(
        Uuid $id,
        #[MapRequestPayload]
        ConversationStatusDto $dto,
        ConversationService $service,
    ): JsonResponse {
        $conversationId = $service->updateStatus($id, $dto);

        return ApiResponse::ok($conversationId);
    }

    #[Route('/api/conversations/{id}', name: 'conversation_delete', methods: ['DELETE'])]
    #[IsGranted(ConversationSenderVoter::CONVERSATION_SENDER, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete conversation',
        tags: ['conversations'],
        responses: [new Ok(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function delete(
        Uuid $id,
        ConversationService $service,
    ): JsonResponse {
        $conversationId = $service->delete($id);

        return ApiResponse::ok($conversationId);
    }

    #[Route('/api/conversations', name: 'conversation_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of conversations',
        tags: ['conversations'],
        responses: [new Collection(ConversationResource::class), new BadRequest(), new Unauthorized()],
    )]
    final public function index(
        #[MapQueryString(validationFailedStatusCode: 400)]
        ConversationIndexDto $dto,
        ConversationService $service,
    ): JsonResponse {
        $conversations = $service->index($dto);

        $data = ConversationResource::fromEntityCollection($conversations);

        return ApiResponse::elements($data);
    }

    #[Route('/api/conversations/{id}', name: 'conversation_details', methods: ['GET'])]
    #[IsGranted(ConversationVoter::CONVERSATION, subject: 'id')]
    #[OA\Get(
        summary: 'Details of conversation',
        tags: ['conversations'],
        responses: [new Item(ConversationResource::class), new BadRequest(), new Unauthorized()],
    )]
    final public function details(
        Uuid $id,
        ConversationService $service,
    ): JsonResponse {
        $conversation = $service->details($id);

        $data = ConversationResource::fromEntity($conversation);

        return ApiResponse::elements($data);
    }

    #[Route('/api/conversation-activitiy-users/{id}/updated-at', name: 'conversation_activity_update_updated_at', methods: ['PATCH'])]
    #[IsGranted(ConversationActivityCreatorVoter::CONVERSATION_ACTIVITY_CREATOR, subject: 'id')]
    #[OA\Patch(
        summary: 'Update conversation activity updated_at',
        tags: ['conversations'],
        responses: [new Ok(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateActivityUpdatedAt(
        Uuid $id,
        ConversationService $service,
    ): JsonResponse {
        $conversationActivityId = $service->updateActivityUpdatedAt($id);

        return ApiResponse::ok($conversationActivityId);
    }

    #[Route('/api/conversation-activities', name: 'conversation_activity_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of conversation activities',
        tags: ['conversations'],
        responses: [new Collection(ConversationActivityResource::class), new BadRequest(), new Unauthorized()],
    )]
    final public function indexActivity(
        #[MapQueryString(validationFailedStatusCode: 400)]
        ConversationActivityIndexDto $dto,
        ConversationService $service,
    ): JsonResponse {
        $conversationActivities = $service->indexActivity($dto);

        $data = ConversationActivityResource::fromEntityCollection($conversationActivities);

        return ApiResponse::elements($data);
    }

    #[Route('/api/conversation-activity-users/{id}', name: 'conversation_activity_details', methods: ['GET'])]
    #[IsGranted(ConversationActivityVoter::CONVERSATION_ACTIVITY, subject: 'id')]
    #[OA\Get(
        summary: 'Details of conversation activity',
        tags: ['conversations'],
        responses: [new Item(ConversationActivityResource::class), new BadRequest(), new Unauthorized()],
    )]
    final public function detailsActivity(
        Uuid $id,
        ConversationService $service,
    ): JsonResponse {
        $conversationActivity = $service->detailsActivity($id);

        $data = ConversationActivityResource::fromEntity($conversationActivity);

        return ApiResponse::elements($data);
    }
}
