<?php

namespace App\Controller;

use App\Dto\{UserCreateNanoDto,
    UserDto,
    UserListDto,
    UserRegisterConfirmDto,
    UserRegisterDto,
    UserSignConfirmDto,
    UserSignDto,
    UserUpdateStatusDto};
use App\Enum\RoleEnum;
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Conflict, Created, Forbidden, Ok, Token, Unauthorized};
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
        requestBody: new Body('UserDto'),
        responses: [new Created(), new BadRequest(), new Unauthorized(), new Forbidden()],
    )]
    final public function create(
        #[MapRequestPayload]
        UserDto $dto,
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
        requestBody: new Body('UserDto'),
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function update(
        string $id,
        #[MapRequestPayload]
        UserDto $dto,
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
        responses: [
            new OA\Response(
                response: 200,
                description: 'OK',
                content: new OA\JsonContent(
                    type: 'array',
                    items: new OA\Items(ref: '#/components/schemas/UserResource'),
                ),
            ),
            new BadRequest(),
        ],
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
        responses: [
            new OA\Response(
                response: 200,
                description: 'OK',
                content: new OA\JsonContent(ref: '#/components/schemas/UserResource'),
            ),
            new BadRequest(),
        ],
    )]
    final public function details(
        string $id,
        UserService $service,
    ): JsonResponse {
        $user = $service->detailsUser($id);

        $data = UserResource::fromEntity($user);

        return ApiResponse::list($data);
    }

    #[Route('/api/users/registers', name: 'user_register', methods: ['POST'])]
    #[IsGranted('IS_ANONYMOUS')]
    #[OA\Post(
        summary: 'Register user',
        requestBody: new Body('UserRegisterDto'),
        responses: [new Created(), new BadRequest(), new Conflict()],
    )]
    final public function register(
        #[MapRequestPayload]
        UserRegisterDto $dto,
        UserService $userService,
    ): JsonResponse {
        $userSignId = $userService->registerUser($dto);

        return ApiResponse::created($userSignId);
    }

    #[Route('/api/users/registers/{id}/confirm', name: 'user_register_confirm', methods: ['PATCH'])]
    #[IsGranted('IS_ANONYMOUS')]
    #[OA\Patch(
        summary: 'Confirm user register',
        requestBody: new Body('UserRegisterConfirmDto'),
        responses: [new Ok(), new BadRequest(), new Conflict()],
    )]
    final public function confirmRegister(
        string $id,
        #[MapRequestPayload]
        UserRegisterConfirmDto $dto,
        UserService $userService,
    ): JsonResponse {
        $userId = $userService->registerUserConfirm($id, $dto);

        return ApiResponse::ok($userId);
    }

    #[Route('/api/users/registers/{id}/resend', name: 'user_register_resend', methods: ['POST'])]
    #[IsGranted('IS_ANONYMOUS')]
    #[OA\Post(
        summary: 'Resend user register',
        responses: [new Ok(), new Conflict()],
    )]
    final public function resendRegister(
        string $id,
        UserService $userService,
    ): JsonResponse {
        $userId = $userService->registerUserResend($id);

        return ApiResponse::ok($userId);
    }

    #[Route('/api/users/signs', name: 'user_sign', methods: ['POST'])]
    #[IsGranted('IS_ANONYMOUS')]
    #[OA\Post(
        summary: 'Sign user',
        requestBody: new Body('UserSignDto'),
        responses: [new Created(), new BadRequest(), new Conflict()],
    )]
    final public function sign(
        #[MapRequestPayload]
        UserSignDto $dto,
        UserService $userService,
    ): JsonResponse {
        $userSignId = $userService->signUser($dto);

        return ApiResponse::created($userSignId);
    }

    #[Route('/api/users/signs/{id}/confirm', name: 'user_sign_confirm', methods: ['PATCH'])]
    #[IsGranted('IS_ANONYMOUS')]
    #[OA\Patch(
        summary: 'Confirm user sign',
        requestBody: new Body('UserSignConfirmDto'),
        responses: [new Token(), new BadRequest(), new Conflict()],
    )]
    final public function confirmSign(
        string $id,
        #[MapRequestPayload]
        UserSignConfirmDto $dto,
        UserService $userService,
    ): JsonResponse {
        $token = $userService->signUserConfirm($id, $dto);

        return ApiResponse::token($token);
    }

    #[Route('/api/users/signs/{id}/resend', name: 'user_sign_resend', methods: ['POST'])]
    #[IsGranted('IS_ANONYMOUS')]
    #[OA\Post(
        summary: 'Resend user sign',
        responses: [new Ok(), new Conflict()],
    )]
    final public function resendSign(
        string $id,
        UserService $userService,
    ): JsonResponse {
        $userId = $userService->signUserResend($id);

        return ApiResponse::ok($userId);
    }
}
