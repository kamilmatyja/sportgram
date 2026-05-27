<?php

namespace App\Controller;

use App\Dto\StatisticIndexDto;
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Collection, Unauthorized};
use App\Resource\{StatisticResource};
use App\Service\StatisticService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class StatisticController extends AbstractController
{
    #[Route('/api/statistics/records', name: 'statistic_record_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of statistic records',
        tags: ['statistics'],
        responses: [new Collection(StatisticResource::class), new BadRequest(), new Unauthorized()],
    )]
    final public function indexRecords(
        #[MapQueryString(validationFailedStatusCode: 400)]
        StatisticIndexDto $dto,
        StatisticService $statisticService,
    ): JsonResponse {
        $statistics = $statisticService->indexRecords($dto);

        $data = StatisticResource::fromEntityCollection($statistics);

        return ApiResponse::elements($data);
    }

    #[Route('/api/statistics/progress', name: 'statistic_progres_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of statistic progress',
        tags: ['statistics'],
        responses: [new Collection(StatisticResource::class), new BadRequest(), new Unauthorized()],
    )]
    final public function indexProgress(
        #[MapQueryString(validationFailedStatusCode: 400)]
        StatisticIndexDto $dto,
        StatisticService $statisticService,
    ): JsonResponse {
        $statistics = $statisticService->indexProgress($dto);

        $data = StatisticResource::fromEntityCollection($statistics);

        return ApiResponse::elements($data);
    }
}
