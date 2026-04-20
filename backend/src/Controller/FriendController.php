<?php

namespace App\Controller;

use App\Dto\{FriendDto, FriendIndexDto, FriendStatusDto};
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Collection, Conflict, Created, Forbidden, Item, Ok, Unauthorized};
use App\Resource\FriendResource;
use App\Security\Voter\FriendVoter;
use App\Service\FriendService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\{MapQueryString, MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

class FriendController extends AbstractController
{
    #[Route('/api/friends', name: 'friend_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Post(
        summary: 'Create friend',
        requestBody: new Body('FriendDto'),
        responses: [new Created(), new BadRequest(), new Unauthorized(), new Forbidden()],
    )]
    final public function create(
        #[MapRequestPayload]
        FriendDto $dto,
        FriendService $friendService,
    ): JsonResponse {
        $friendId = $friendService->create($dto);

        return ApiResponse::created($friendId);
    }

    #[Route('/api/friends/{id}/status', name: 'friend_update_status', methods: ['PATCH'])]
    #[IsGranted(FriendVoter::FRIEND, subject: 'id')]
    #[OA\Patch(
        summary: 'Update friend status',
        requestBody: new Body('FriendStatusDto'),
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateStatus(
        Uuid $id,
        #[MapRequestPayload]
        FriendStatusDto $dto,
        FriendService $friendService,
    ): JsonResponse {
        $friendId = $friendService->updateStatus($id, $dto);

        return ApiResponse::ok($friendId);
    }

    #[Route('/api/friends/{id}', name: 'friend_delete', methods: ['DELETE'])]
    #[IsGranted(FriendVoter::FRIEND, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete friend',
        responses: [new Ok(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function delete(
        Uuid $id,
        FriendService $friendService,
    ): JsonResponse {
        $friendId = $friendService->delete($id);

        return ApiResponse::ok($friendId);
    }

    #[Route('/api/friends', name: 'friend_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of friends',
        responses: [new Collection('FriendResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function index(
        #[MapQueryString(validationFailedStatusCode: 400)]
        FriendIndexDto $dto,
        FriendService $service,
    ): JsonResponse {
        $friends = $service->index($dto);

        $data = FriendResource::fromEntityCollection($friends);

        return ApiResponse::elements($data);
    }

    #[Route('/api/friends/{id}', name: 'friend_details', methods: ['GET'])]
    #[IsGranted(FriendVoter::FRIEND, subject: 'id')]
    #[OA\Get(
        summary: 'Details of friend',
        responses: [new Item('FriendResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function details(
        Uuid $id,
        FriendService $service,
    ): JsonResponse {
        $friend = $service->details($id);

        $data = FriendResource::fromEntity($friend);

        return ApiResponse::elements($data);
    }
}
