<?php

namespace App\Controller;

use App\Dto\UserCreateDto;
use App\Http\ApiResponse;
use App\Service\UserService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class UserController extends AbstractController
{
    #[Route('/api/users', name: 'create_user', methods: ['POST'])]
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
                            property: 'errors',
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
                            property: 'errors',
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
}
