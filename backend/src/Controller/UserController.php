<?php

namespace App\Controller;

use App\Dto\{UserCreateDto, UserCreateNanoDto, UserListDto, UserUpdateDto, UserUpdateStatusDto};
use App\Enum\RoleEnum;
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Collection, Conflict, Created, Forbidden, Item, Ok, Unauthorized};
use App\Resource\UserResource;
use App\Security\Voter\UserVoter;
use App\Service\UserService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\{JsonResponse};
use Symfony\Component\HttpKernel\Attribute\{MapQueryString, MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

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
        $userId = $userService->createUser($dto);

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
        $userId = $userService->createUserNano($dto);

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
        string $id,
        #[MapRequestPayload]
        UserUpdateDto $dto,
        UserService $userService,
    ): JsonResponse {
        $userId = $userService->updateUser($id, $dto);

        return ApiResponse::ok($userId);
    }

    #[Route('/api/users/{id}/status', name: 'user_update_status', methods: ['PATCH'])]
    #[IsGranted(RoleEnum::ROLE_ADMINISTRATOR)]
    #[OA\Patch(
        summary: 'Update user status',
        requestBody: new Body('UserUpdateStatusDto'),
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateStatus(
        string $id,
        #[MapRequestPayload]
        UserUpdateStatusDto $dto,
        UserService $userService,
    ): JsonResponse {
        $userId = $userService->updateUserStatus($id, $dto);

        return ApiResponse::ok($userId);
    }

    #[Route('/api/users/{id}', name: 'user_delete', methods: ['DELETE'])]
    #[IsGranted(UserVoter::USER, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete user',
        responses: [new Ok(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function delete(
        string $id,
        UserService $userService,
    ): JsonResponse {
        $userId = $userService->deleteUser($id);

        return ApiResponse::ok($userId);
    }

    #[Route('/api/users', name: 'user_list', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'List of users',
        responses: [new Collection('UserResource'), new BadRequest()],
    )]
    final public function list(
        #[MapQueryString(validationFailedStatusCode: 400)]
        UserListDto $dto,
        UserService $service,
    ): JsonResponse {
        $users = $service->listUsers($dto);

        $data = UserResource::fromEntityCollection($users);

        return ApiResponse::list($data);
    }

    #[Route('/api/users/{id}', name: 'user_details', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Details of users',
        responses: [new Item('UserResource'), new BadRequest()],
    )]
    final public function details(
        string $id,
        UserService $service,
    ): JsonResponse {
        $user = $service->detailsUser($id);

        $data = UserResource::fromEntity($user);

        return ApiResponse::list($data);
    }
}
