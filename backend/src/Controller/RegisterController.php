<?php

namespace App\Controller;

use App\Dto\{UserRegisterConfirmDto, UserRegisterDto};
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Conflict, Created, Ok};
use App\Service\RegisterService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\{JsonResponse};
use Symfony\Component\HttpKernel\Attribute\{MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class RegisterController extends AbstractController
{
    #[Route('/api/registers', name: 'user_register', methods: ['POST'])]
    #[IsGranted('IS_ANONYMOUS')]
    #[OA\Post(
        summary: 'Register user',
        requestBody: new Body('UserRegisterDto'),
        responses: [new Created(), new BadRequest(), new Conflict()],
    )]
    final public function register(
        #[MapRequestPayload]
        UserRegisterDto $dto,
        RegisterService $registerService,
    ): JsonResponse {
        $userSignId = $registerService->registerUser($dto);

        return ApiResponse::created($userSignId);
    }

    #[Route('/api/registers/{id}/confirm', name: 'user_register_confirm', methods: ['PATCH'])]
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
        RegisterService $registerService,
    ): JsonResponse {
        $userId = $registerService->registerUserConfirm($id, $dto);

        return ApiResponse::ok($userId);
    }

    #[Route('/api/registers/{id}/resend', name: 'user_register_resend', methods: ['POST'])]
    #[IsGranted('IS_ANONYMOUS')]
    #[OA\Post(
        summary: 'Resend user register',
        responses: [new Ok(), new Conflict()],
    )]
    final public function resendRegister(
        string $id,
        RegisterService $registerService,
    ): JsonResponse {
        $userId = $registerService->registerUserResend($id);

        return ApiResponse::ok($userId);
    }
}
