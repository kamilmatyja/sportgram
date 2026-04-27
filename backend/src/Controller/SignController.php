<?php

namespace App\Controller;

use App\Dto\{UserCodeDto, UserSignDto};
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Conflict, Created, Ok, Token};
use App\Service\SignService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\{JsonResponse};
use Symfony\Component\HttpKernel\Attribute\{MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

class SignController extends AbstractController
{
    #[Route('/api/signs', name: 'user_sign', methods: ['POST'])]
    #[IsGranted('PUBLIC_ACCESS')]
    #[OA\Post(
        summary: 'Sign user',
        requestBody: new Body('UserSignDto'),
        tags: ['signs'],
        responses: [new Created(), new BadRequest(), new Conflict()],
    )]
    final public function sign(
        #[MapRequestPayload]
        UserSignDto $dto,
        SignService $signService,
    ): JsonResponse {
        $userSignId = $signService->sign($dto);

        return ApiResponse::created($userSignId);
    }

    #[Route('/api/signs/{id}/confirm', name: 'user_sign_confirm', methods: ['PATCH'])]
    #[IsGranted('PUBLIC_ACCESS')]
    #[OA\Patch(
        summary: 'Confirm sign user',
        requestBody: new Body('UserCodeDto'),
        tags: ['signs'],
        responses: [new Token(), new BadRequest(), new Conflict()],
    )]
    final public function confirm(
        Uuid $id,
        #[MapRequestPayload]
        UserCodeDto $dto,
        SignService $signService,
    ): JsonResponse {
        $token = $signService->confirm($id, $dto);

        return ApiResponse::token($token);
    }

    #[Route('/api/signs/{id}/resend', name: 'user_sign_resend', methods: ['POST'])]
    #[IsGranted('PUBLIC_ACCESS')]
    #[OA\Post(
        summary: 'Resend sign user',
        tags: ['signs'],
        responses: [new Ok(), new Conflict()],
    )]
    final public function resend(
        Uuid $id,
        SignService $signService,
    ): JsonResponse {
        $userSignId = $signService->resend($id);

        return ApiResponse::ok($userSignId);
    }

    #[Route('/api/signs/{id}/refresh', name: 'user_sign_refresh', methods: ['POST'])]
    #[OA\Post(
        summary: 'Refresh sign user',
        tags: ['signs'],
        responses: [new Token(), new Conflict()],
    )]
    final public function refresh(
        Uuid $id,
        SignService $signService,
    ): JsonResponse {
        $token = $signService->refresh($id);

        return ApiResponse::token($token);
    }
}
