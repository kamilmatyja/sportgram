<?php

namespace App\Controller;

use App\Dto\{UserCodeDto, UserEmailDto};
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Conflict, Created, Ok};
use App\Service\PasswordResetService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\{JsonResponse};
use Symfony\Component\HttpKernel\Attribute\{MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class PasswordResetController extends AbstractController
{
    #[Route('/api/password-resets', name: 'user_password_reset', methods: ['POST'])]
    #[IsGranted('IS_ANONYMOUS')]
    #[OA\Post(
        summary: 'Reset user password',
        requestBody: new Body('UserEmailDto'),
        responses: [new Created(), new BadRequest(), new Conflict()],
    )]
    final public function passwordReset(
        #[MapRequestPayload]
        UserEmailDto $dto,
        PasswordResetService $passwordResetService,
    ): JsonResponse {
        $userPasswordResetId = $passwordResetService->passwordReset($dto);

        return ApiResponse::created($userPasswordResetId);
    }

    #[Route('/api/password-resets/{id}/confirm', name: 'user_password_reset_confirm', methods: ['PATCH'])]
    #[IsGranted('IS_ANONYMOUS')]
    #[OA\Patch(
        summary: 'Confirm reset user password',
        requestBody: new Body('UserCodeDto'),
        responses: [new Ok(), new BadRequest(), new Conflict()],
    )]
    final public function confirm(
        string $id,
        #[MapRequestPayload]
        UserCodeDto $dto,
        PasswordResetService $passwordResetService,
    ): JsonResponse {
        $userPasswordResetId = $passwordResetService->confirm($id, $dto);

        return ApiResponse::ok($userPasswordResetId);
    }

    #[Route('/api/password-resets/{id}/resend', name: 'user_password_reset_resend', methods: ['POST'])]
    #[IsGranted('IS_ANONYMOUS')]
    #[OA\Post(
        summary: 'Resend reset user password',
        responses: [new Ok(), new Conflict()],
    )]
    final public function resend(
        string $id,
        PasswordResetService $passwordResetService,
    ): JsonResponse {
        $userPasswordResetId = $passwordResetService->resend($id);

        return ApiResponse::ok($userPasswordResetId);
    }
}
