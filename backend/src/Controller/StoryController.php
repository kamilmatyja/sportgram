<?php

namespace App\Controller;

use App\Dto\{ElementStatusDto, StoryDto, StoryIndexDto};
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Collection, Conflict, Created, Forbidden, Item, Ok, Unauthorized};
use App\Resource\StoryResource;
use App\Security\Voter\{StoryCreatorVoter, StoryVoter};
use App\Service\StoryService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\{JsonResponse};
use Symfony\Component\HttpKernel\Attribute\{MapQueryString, MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

class StoryController extends AbstractController
{
    #[Route('/api/stories', name: 'story_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Post(
        summary: 'Create story',
        requestBody: new Body(StoryDto::class),
        tags: ['stories'],
        responses: [new Created(), new BadRequest(), new Unauthorized(), new Forbidden()],
    )]
    final public function create(
        #[MapRequestPayload]
        StoryDto $dto,
        StoryService $storyService,
    ): JsonResponse {
        $storyId = $storyService->create($dto);

        return ApiResponse::created($storyId);
    }

    #[Route('/api/stories/{id}', name: 'story_update', methods: ['PUT'])]
    #[IsGranted(StoryCreatorVoter::STORY_CREATOR, subject: 'id')]
    #[OA\Put(
        summary: 'Update story',
        requestBody: new Body(StoryDto::class),
        tags: ['stories'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function update(
        Uuid $id,
        #[MapRequestPayload]
        StoryDto $dto,
        StoryService $storyService,
    ): JsonResponse {
        $storyId = $storyService->update($id, $dto);

        return ApiResponse::ok($storyId);
    }

    #[Route('/api/stories/{id}/status', name: 'story_update_status', methods: ['PATCH'])]
    #[IsGranted(StoryVoter::STORY, subject: 'id')]
    #[OA\Patch(
        summary: 'Update story status',
        requestBody: new Body(ElementStatusDto::class),
        tags: ['stories'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateStatus(
        Uuid $id,
        #[MapRequestPayload]
        ElementStatusDto $dto,
        StoryService $storyService,
    ): JsonResponse {
        $storyId = $storyService->updateStatus($id, $dto);

        return ApiResponse::ok($storyId);
    }

    #[Route('/api/stories/{id}', name: 'story_delete', methods: ['DELETE'])]
    #[IsGranted(StoryCreatorVoter::STORY_CREATOR, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete story',
        tags: ['stories'],
        responses: [new Ok(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function delete(
        Uuid $id,
        StoryService $storyService,
    ): JsonResponse {
        $storyId = $storyService->delete($id);

        return ApiResponse::ok($storyId);
    }

    #[Route('/api/stories', name: 'story_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of stories',
        tags: ['stories'],
        responses: [new Collection(StoryResource::class), new BadRequest(), new Unauthorized()],
    )]
    final public function index(
        #[MapQueryString(validationFailedStatusCode: 400)]
        StoryIndexDto $dto,
        StoryService $service,
    ): JsonResponse {
        $stories = $service->index($dto);

        $data = StoryResource::fromEntityCollection($stories);

        return ApiResponse::elements($data);
    }

    #[Route('/api/stories/{id}', name: 'story_details', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Details of stories',
        tags: ['stories'],
        responses: [new Item(StoryResource::class), new BadRequest(), new Unauthorized()],
    )]
    final public function details(
        Uuid $id,
        StoryService $service,
    ): JsonResponse {
        $story = $service->details($id);

        $data = StoryResource::fromEntity($story);

        return ApiResponse::elements($data);
    }
}
