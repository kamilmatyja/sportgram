<?php

namespace App\Controller;

use App\Dto\{UserSignConfirmDto, UserSignDto};
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Conflict, Created, Ok, Token};
use App\Service\SignService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\{JsonResponse};
use Symfony\Component\HttpKernel\Attribute\{MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class SignController extends AbstractController
{
    #[Route('/api/signs', name: 'user_sign', methods: ['POST'])]
    #[IsGranted('IS_ANONYMOUS')]
    #[OA\Post(
        summary: 'Sign user',
        requestBody: new Body('UserSignDto'),
        responses: [new Created(), new BadRequest(), new Conflict()],
    )]
    final public function sign(
        #[MapRequestPayload]
        UserSignDto $dto,
        SignService $signService,
    ): JsonResponse {
        $userSignId = $signService->signUser($dto);

        return ApiResponse::created($userSignId);
    }

    #[Route('/api/signs/{id}/confirm', name: 'user_sign_confirm', methods: ['PATCH'])]
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
        SignService $signService,
    ): JsonResponse {
        $token = $signService->signUserConfirm($id, $dto);

        return ApiResponse::token($token);
    }

    #[Route('/api/signs/{id}/resend', name: 'user_sign_resend', methods: ['POST'])]
    #[IsGranted('IS_ANONYMOUS')]
    #[OA\Post(
        summary: 'Resend user sign',
        responses: [new Ok(), new Conflict()],
    )]
    final public function resendSign(
        string $id,
        SignService $signService,
    ): JsonResponse {
        $userId = $signService->signUserResend($id);

        return ApiResponse::ok($userId);
    }
}
