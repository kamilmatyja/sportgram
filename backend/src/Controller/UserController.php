<?php

namespace App\Controller;

use App\Dto\{UserCreateDto, UserCreateNanoDto, UserDetailsQueryDto, UserIndexDto, UserStatusDto, UserUpdateDto};
use App\Enum\RoleEnum;
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Collection, Conflict, Created, Forbidden, Includes, Item, Ok, Unauthorized};
use App\Resource\UserResource;
use App\Security\Voter\UserVoter;
use App\Service\UserService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\{JsonResponse};
use Symfony\Component\HttpKernel\Attribute\{MapQueryString, MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

class UserController extends AbstractController
{
    #[Route('/api/users', name: 'user_create', methods: ['POST'])]
    #[IsGranted(RoleEnum::ROLE_ADMINISTRATOR)]
    #[OA\Post(
        summary: 'Create user',
        requestBody: new Body('UserCreateDto'),
        responses: [new Created(), new BadRequest(), new Unauthorized(), new Forbidden()],
    )]
    final public function create(
        #[MapRequestPayload]
        UserCreateDto $dto,
        UserService $userService,
    ): JsonResponse {
        $userId = $userService->create($dto);

        return ApiResponse::created($userId);
    }

    #[Route('/api/users/nano', name: 'user_create_nano', methods: ['POST'])]
    #[IsGranted('IS_ANONYMOUS')]
    #[OA\Post(
        summary: 'Create user nano',
        requestBody: new Body('UserCreateNanoDto'),
        responses: [new Created(), new BadRequest()],
    )]
    final public function createNano(
        #[MapRequestPayload]
        UserCreateNanoDto $dto,
        UserService $userService,
    ): JsonResponse {
        $userId = $userService->createNano($dto);

        return ApiResponse::created($userId);
    }

    #[Route('/api/users/{id}', name: 'user_update', methods: ['PUT'])]
    #[IsGranted(UserVoter::USER, subject: 'id')]
    #[OA\Put(
        summary: 'Update user',
        requestBody: new Body('UserUpdateDto'),
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function update(
        Uuid $id,
        #[MapRequestPayload]
        UserUpdateDto $dto,
        UserService $userService,
    ): JsonResponse {
        $userId = $userService->update($id, $dto);

        return ApiResponse::ok($userId);
    }

    #[Route('/api/users/{id}/status', name: 'user_update_status', methods: ['PATCH'])]
    #[IsGranted(RoleEnum::ROLE_ADMINISTRATOR)]
    #[OA\Patch(
        summary: 'Update user status',
        requestBody: new Body('UserStatusDto'),
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateStatus(
        Uuid $id,
        #[MapRequestPayload]
        UserStatusDto $dto,
        UserService $userService,
    ): JsonResponse {
        $userId = $userService->updateStatus($id, $dto);

        return ApiResponse::ok($userId);
    }

    #[Route('/api/users/{id}', name: 'user_delete', methods: ['DELETE'])]
    #[IsGranted(UserVoter::USER, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete user',
        responses: [new Ok(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function delete(
        Uuid $id,
        UserService $userService,
    ): JsonResponse {
        $userId = $userService->delete($id);

        return ApiResponse::ok($userId);
    }

    #[Route('/api/users', name: 'user_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of users',
        responses: [new Collection('UserResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function index(
        #[MapQueryString(validationFailedStatusCode: 400)]
        UserIndexDto $dto,
        UserService $service,
    ): JsonResponse {
        $users = $service->index($dto);

        $data = UserResource::fromEntityCollection($users);

        return ApiResponse::elements($data);
    }

    #[Route('/api/users/{id}', name: 'user_details', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Details of users',
        parameters: [new Includes([UserDetailsQueryDto::USER_DISCIPLINES])],
        responses: [new Item('UserResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function details(
        Uuid $id,
        #[MapQueryString(validationFailedStatusCode: 400)]
        UserDetailsQueryDto $dto,
        UserService $service,
    ): JsonResponse {
        $user = $service->details($id, $dto);

        $data = UserResource::fromEntity($user, $dto);

        return ApiResponse::elements($data);
    }
}
