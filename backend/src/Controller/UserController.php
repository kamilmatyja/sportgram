<?php

namespace App\Controller;

use App\Dto\{UserCreateDto, UserRegisterConfirmDto, UserSignConfirmDto, UserSignDto};
use App\Http\ApiResponse;
use App\Service\UserService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\{JsonResponse};
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class UserController extends AbstractController
{
    #[Route('/api/users', name: 'user_create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMINISTRATOR')]
    #[OA\Post(
        summary: 'Create user',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/UserCreateDto'),
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Created',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'id',
                            type: 'string',
                            example: 'b3b6c1e2-8e2a-4c1a-9e2a-8e2a4c1a9e2a',
                        ),
                    ],
                    type: 'object',
                ),
            ),
            new OA\Response(
                response: 400,
                description: 'Bad request',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'errors',
                            type: 'object',
                            example: [
                                'email' => ['This value is already used.'],
                                'password' => ['This value is too short.'],
                            ],
                        ),
                    ],
                    type: 'object',
                ),
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorized',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'error',
                            type: 'object',
                            example: [
                                'Full authentication is required to access this resource.',
                            ],
                        ),
                    ],
                    type: 'object',
                ),
            ),
            new OA\Response(
                response: 403,
                description: 'Forbidden',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'error',
                            type: 'object',
                            example: [
                                'You do not have permission to access this resource.',
                            ],
                        ),
                    ],
                    type: 'object',
                ),
            ),
        ],
    )]
    final public function create(
        #[MapRequestPayload]
        UserCreateDto $dto,
        UserService $userService,
    ): JsonResponse {
        $userId = $userService->createUser($dto);

        return ApiResponse::created($userId);
    }

    #[Route('/api/users/registers/confirm', name: 'user_register_confirm', methods: ['PATCH'])]
    #[OA\Patch(
        summary: 'Confirm user register',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/UserRegisterConfirmDto'),
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Ok',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'id',
                            type: 'string',
                            example: 'b3b6c1e2-8e2a-4c1a-9e2a-8e2a4c1a9e2a',
                        ),
                    ],
                    type: 'object',
                ),
            ),
            new OA\Response(
                response: 400,
                description: 'Bad request',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'errors',
                            type: 'object',
                            example: [
                                'email' => ['This value is already used.'],
                            ],
                        ),
                    ],
                    type: 'object',
                ),
            ),
            new OA\Response(
                response: 409,
                description: 'Conflict',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'error',
                            type: 'object',
                            example: [
                                'User is banned.',
                            ],
                        ),
                    ],
                    type: 'object',
                ),
            ),
        ],
    )]
    public function confirmRegister(
        #[MapRequestPayload]
        UserRegisterConfirmDto $dto,
        UserService $userService,
    ): JsonResponse {
        $userId = $userService->registerUserConfirm($dto);

        return ApiResponse::updated($userId);
    }

    #[Route('/api/users/signs', name: 'user_sign', methods: ['POST'])]
    #[OA\Post(
        summary: 'Sign user',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/UserSignDto'),
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Created',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'id',
                            type: 'string',
                            example: 'b3b6c1e2-8e2a-4c1a-9e2a-8e2a4c1a9e2a',
                        ),
                    ],
                    type: 'object',
                ),
            ),
            new OA\Response(
                response: 400,
                description: 'Bad request',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'errors',
                            type: 'object',
                            example: [
                                'email' => ['This value is already used.'],
                            ],
                        ),
                    ],
                    type: 'object',
                ),
            ),
            new OA\Response(
                response: 409,
                description: 'Conflict',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'error',
                            type: 'object',
                            example: [
                                'User is banned.',
                            ],
                        ),
                    ],
                    type: 'object',
                ),
            ),
        ],
    )]
    public function sign(
        #[MapRequestPayload]
        UserSignDto $dto,
        UserService $userService,
    ): JsonResponse {
        $userSignId = $userService->signUser($dto);

        return ApiResponse::created($userSignId);
    }

    #[Route('/api/users/signs/{id}/confirm', name: 'user_sign_confirm', methods: ['PATCH'])]
    #[OA\Patch(
        summary: 'Confirm user sign',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/UserSignConfirmDto'),
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Ok',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'token',
                            type: 'string',
                            example: 'token',
                        ),
                    ],
                    type: 'object',
                ),
            ),
            new OA\Response(
                response: 400,
                description: 'Bad request',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'errors',
                            type: 'object',
                            example: [
                                'email' => ['This value is already used.'],
                            ],
                        ),
                    ],
                    type: 'object',
                ),
            ),
            new OA\Response(
                response: 409,
                description: 'Conflict',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'error',
                            type: 'object',
                            example: [
                                'User is banned.',
                            ],
                        ),
                    ],
                    type: 'object',
                ),
            ),
        ],
    )]
    public function confirmSign(
        string $id,
        #[MapRequestPayload]
        UserSignConfirmDto $dto,
        UserService $userService,
    ): JsonResponse {
        $token = $userService->signUserConfirm($id, $dto);

        return ApiResponse::token($token);
    }
}
