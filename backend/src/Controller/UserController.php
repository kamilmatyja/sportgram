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

class UserController extends AbstractController
{
    #[Route('/api/users', name: 'create_user', methods: ['POST'])]
    #[OA\Post(
        summary: 'Create user',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/UserCreateDto')
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
                            example: 'b3b6c1e2-8e2a-4c1a-9e2a-8e2a4c1a9e2a'
                        )
                    ],
                    type: 'object'
                )
            ),
            new OA\Response(
                response: 400,
                description: 'Error',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'errors',
                            type: 'object',
                            example: [
                                'email' => ['This value is already used.'],
                                'password' => ['This value is too short.']
                            ]
                        )
                    ],
                    type: 'object'
                )
            )
        ]
    )]
    public function create(
        #[MapRequestPayload] UserCreateDto $dto,
        UserService $userService
    ): JsonResponse {
        $userId = $userService->createUser($dto);

        return ApiResponse::created($userId);
    }
}
