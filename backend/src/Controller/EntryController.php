<?php

namespace App\Controller;

use App\Dto\{EntryDto, EntryIndexDto};
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Collection, Created, Forbidden, Item, Unauthorized};
use App\Resource\EntryResource;
use App\Service\EntryService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\{MapQueryString, MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

class EntryController extends AbstractController
{
    #[Route('/api/entries', name: 'entry_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Post(
        summary: 'Create entry',
        requestBody: new Body('EntryDto'),
        tags: ['entries'],
        responses: [new Created(), new BadRequest(), new Unauthorized(), new Forbidden()],
    )]
    final public function create(
        #[MapRequestPayload]
        EntryDto $dto,
        EntryService $service,
    ): JsonResponse {
        $entryId = $service->create($dto);

        return ApiResponse::created($entryId);
    }

    #[Route('/api/entries', name: 'entry_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of entries',
        tags: ['entries'],
        responses: [new Collection('EntryResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function index(
        #[MapQueryString(validationFailedStatusCode: 400)]
        EntryIndexDto $dto,
        EntryService $service,
    ): JsonResponse {
        $entries = $service->index($dto);

        $data = EntryResource::fromEntityCollection($entries);

        return ApiResponse::elements($data);
    }

    #[Route('/api/entries/{id}', name: 'entry_details', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Details of entry',
        tags: ['entries'],
        responses: [new Item('EntryResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function details(
        Uuid $id,
        EntryService $service,
    ): JsonResponse {
        $entry = $service->details($id);

        $data = EntryResource::fromEntity($entry);

        return ApiResponse::elements($data);
    }
}
