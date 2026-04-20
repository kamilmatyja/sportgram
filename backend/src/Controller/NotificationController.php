<?php

namespace App\Controller;

use App\Dto\{NotificationIndexDto, NotificationStatusDto};
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Collection, Conflict, Forbidden, Item, Ok, Unauthorized};
use App\Resource\NotificationResource;
use App\Security\Voter\NotificationVoter;
use App\Service\NotificationService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\{MapQueryString, MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

class NotificationController extends AbstractController
{
    #[Route('/api/stories/{id}/status', name: 'notification_update_status', methods: ['PATCH'])]
    #[IsGranted(NotificationVoter::NOTIFICATION, subject: 'id')]
    #[OA\Patch(
        summary: 'Update notification status',
        requestBody: new Body('NotificationStatusDto'),
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateStatus(
        Uuid $id,
        #[MapRequestPayload]
        NotificationStatusDto $dto,
        NotificationService $notificationService,
    ): JsonResponse {
        $notificationId = $notificationService->updateStatus($id, $dto);

        return ApiResponse::ok($notificationId);
    }

    #[Route('/api/notifications/{id}', name: 'notification_delete', methods: ['DELETE'])]
    #[IsGranted(NotificationVoter::NOTIFICATION, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete notification',
        responses: [new Ok(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function delete(
        Uuid $id,
        NotificationService $notificationService,
    ): JsonResponse {
        $notificationId = $notificationService->delete($id);

        return ApiResponse::ok($notificationId);
    }

    #[Route('/api/notifications', name: 'notification_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of notifications',
        responses: [new Collection('NotificationResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function index(
        #[MapQueryString(validationFailedStatusCode: 400)]
        NotificationIndexDto $dto,
        NotificationService $service,
    ): JsonResponse {
        $notifications = $service->index($dto);

        $data = NotificationResource::fromEntityCollection($notifications);

        return ApiResponse::elements($data);
    }

    #[Route('/api/notifications/{id}', name: 'notification_details', methods: ['GET'])]
    #[IsGranted(NotificationVoter::NOTIFICATION, subject: 'id')]
    #[OA\Get(
        summary: 'Details of notification',
        responses: [new Item('NotificationResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function details(
        Uuid $id,
        NotificationService $service,
    ): JsonResponse {
        $notification = $service->details($id);

        $data = NotificationResource::fromEntity($notification);

        return ApiResponse::elements($data);
    }
}
