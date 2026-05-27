<?php

namespace App\Controller;

use App\Dto\{PushSubscriptionDto, PushSubscriptionIndexDto};
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Collection, Conflict, Created, Forbidden, Item, Ok, Unauthorized};
use App\Resource\PushSubscriptionResource;
use App\Security\Voter\PushSubscriptionVoter;
use App\Service\PushSubscriptionService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\{MapQueryString, MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

class PushSubscriptionController extends AbstractController
{
    #[Route('/api/push-subscriptions', name: 'push_subscription_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Post(
        summary: 'Create push subscription',
        requestBody: new Body(PushSubscriptionDto::class),
        tags: ['push subscriptions'],
        responses: [new Created(), new BadRequest(), new Unauthorized()],
    )]
    final public function create(
        #[MapRequestPayload]
        PushSubscriptionDto $dto,
        PushSubscriptionService $service,
    ): JsonResponse {
        $pushSubscriptionId = $service->create($dto);

        return ApiResponse::created($pushSubscriptionId);
    }

    #[Route('/api/push-subscriptions/{id}', name: 'push_subscription_update', methods: ['PUT'])]
    #[IsGranted(PushSubscriptionVoter::PUSH_SUBSCRIPTION, subject: 'id')]
    #[OA\Put(
        summary: 'Update push subscription',
        requestBody: new Body(PushSubscriptionDto::class),
        tags: ['push subscriptions'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function update(
        Uuid $id,
        #[MapRequestPayload]
        PushSubscriptionDto $dto,
        PushSubscriptionService $service,
    ): JsonResponse {
        $pushSubscriptionId = $service->update($id, $dto);

        return ApiResponse::ok($pushSubscriptionId);
    }

    #[Route('/api/push-subscriptions/{id}', name: 'push_subscription_delete', methods: ['DELETE'])]
    #[IsGranted(PushSubscriptionVoter::PUSH_SUBSCRIPTION, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete push subscription',
        tags: ['push subscriptions'],
        responses: [new Ok(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function delete(
        Uuid $id,
        PushSubscriptionService $service,
    ): JsonResponse {
        $pushSubscriptionId = $service->delete($id);

        return ApiResponse::ok($pushSubscriptionId);
    }

    #[Route('/api/push-subscriptions', name: 'push_subscription_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of push subscriptions',
        tags: ['push subscriptions'],
        responses: [new Collection(PushSubscriptionResource::class), new BadRequest(), new Unauthorized()],
    )]
    final public function index(
        #[MapQueryString(validationFailedStatusCode: 400)]
        PushSubscriptionIndexDto $dto,
        PushSubscriptionService $service,
    ): JsonResponse {
        $pushSubscriptions = $service->index($dto);

        $data = PushSubscriptionResource::fromEntityCollection($pushSubscriptions);

        return ApiResponse::elements($data);
    }

    #[Route('/api/push-subscriptions/{id}', name: 'push_subscription_details', methods: ['GET'])]
    #[IsGranted(PushSubscriptionVoter::PUSH_SUBSCRIPTION, subject: 'id')]
    #[OA\Get(
        summary: 'Details of push subscription',
        tags: ['push subscriptions'],
        responses: [new Item(PushSubscriptionResource::class), new BadRequest(), new Unauthorized()],
    )]
    final public function details(
        Uuid $id,
        PushSubscriptionService $service,
    ): JsonResponse {
        $notification = $service->details($id);

        $data = PushSubscriptionResource::fromEntity($notification);

        return ApiResponse::elements($data);
    }
}
