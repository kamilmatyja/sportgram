<?php

namespace App\Controller;

use App\Dto\{UserCodeDto, UserEmailDto};
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Conflict, Created, Ok};
use App\Service\RegisterService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\{JsonResponse};
use Symfony\Component\HttpKernel\Attribute\{MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

class RegisterController extends AbstractController
{
    #[Route('/api/registers', name: 'user_register', methods: ['POST'])]
    #[IsGranted('IS_ANONYMOUS')]
    #[OA\Post(
        summary: 'Register user',
        requestBody: new Body('UserEmailDto'),
        tags: ['registers'],
        responses: [new Created(), new BadRequest(), new Conflict()],
    )]
    final public function register(
        #[MapRequestPayload]
        UserEmailDto $dto,
        RegisterService $registerService,
    ): JsonResponse {
        $userRegisterId = $registerService->register($dto);

        return ApiResponse::created($userRegisterId);
    }

    #[Route('/api/registers/{id}/confirm', name: 'user_register_confirm', methods: ['PATCH'])]
    #[IsGranted('IS_ANONYMOUS')]
    #[OA\Patch(
        summary: 'Confirm register user',
        requestBody: new Body('UserCodeDto'),
        tags: ['registers'],
        responses: [new Ok(), new BadRequest(), new Conflict()],
    )]
    final public function confirm(
        Uuid $id,
        #[MapRequestPayload]
        UserCodeDto $dto,
        RegisterService $registerService,
    ): JsonResponse {
        $userRegisterId = $registerService->confirm($id, $dto);

        return ApiResponse::ok($userRegisterId);
    }

    #[Route('/api/registers/{id}/resend', name: 'user_register_resend', methods: ['POST'])]
    #[IsGranted('IS_ANONYMOUS')]
    #[OA\Post(
        summary: 'Resend register user',
        tags: ['registers'],
        responses: [new Ok(), new Conflict()],
    )]
    final public function resend(
        Uuid $id,
        RegisterService $registerService,
    ): JsonResponse {
        $userRegisterId = $registerService->resend($id);

        return ApiResponse::ok($userRegisterId);
    }
}
