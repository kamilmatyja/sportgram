<?php

namespace App\Controller;

use App\Http\ApiResponse;
use App\OpenApi\{Ok};
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

class BaseController extends AbstractController
{
    #[Route('/api/doc', name: 'swagger_ui', methods: ['GET'])]
    #[IsGranted('PUBLIC_ACCESS')]
    final public function swagger(): Response
    {
        return $this->forward('nelmio_api_doc.controller.swagger_ui');
    }

    #[Route('/api/doc.json', name: 'swagger_json', methods: ['GET'])]
    #[IsGranted('PUBLIC_ACCESS')]
    final public function swaggerJson(): Response
    {
        return $this->forward('nelmio_api_doc.controller.swagger_json');
    }

    #[Route('/api/health', name: 'health', methods: ['GET'])]
    #[IsGranted('PUBLIC_ACCESS')]
    #[OA\Get(
        summary: 'Health check',
        tags: ['health'],
        responses: [new Ok()],
    )]
    final public function health(): Response
    {
        return ApiResponse::ok(Uuid::v4());
    }
}
