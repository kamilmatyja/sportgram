<?php

namespace App\Controller;

use App\Dto\{ElementStatusDto, FeedCommentDto, FeedDetailsQueryDto, FeedDto, FeedIndexDto, FeedReactionDto};
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Collection, Conflict, Created, Forbidden, Item, Ok, Unauthorized};
use App\Resource\FeedResource;
use App\Security\Voter\{FeedCommentCreatorVoter,
    FeedCommentVoter,
    FeedCreatorVoter,
    FeedReactionCreatorVoter,
    FeedReactionVoter,
    FeedVoter};
use App\Service\FeedService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\{MapQueryString, MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

class FeedController extends AbstractController
{
    #[Route('/api/feeds', name: 'feed_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Post(
        summary: 'Create feed',
        requestBody: new Body(FeedDto::class),
        tags: ['feeds'],
        responses: [new Created(), new BadRequest(), new Unauthorized(), new Forbidden()],
    )]
    final public function create(
        #[MapRequestPayload]
        FeedDto $dto,
        FeedService $service,
    ): JsonResponse {
        $feedId = $service->create($dto);

        return ApiResponse::created($feedId);
    }

    #[Route('/api/feeds/{id}', name: 'feed_update', methods: ['PUT'])]
    #[IsGranted(FeedCreatorVoter::FEED_CREATOR, subject: 'id')]
    #[OA\Put(
        summary: 'Update feed',
        requestBody: new Body(FeedDto::class),
        tags: ['feeds'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function update(
        Uuid $id,
        #[MapRequestPayload]
        FeedDto $dto,
        FeedService $service,
    ): JsonResponse {
        $feedId = $service->update($id, $dto);

        return ApiResponse::ok($feedId);
    }

    #[Route('/api/feeds/{id}/status', name: 'feed_update_status', methods: ['PATCH'])]
    #[IsGranted(FeedVoter::FEED, subject: 'id')]
    #[OA\Patch(
        summary: 'Update feed status',
        requestBody: new Body(ElementStatusDto::class),
        tags: ['feeds'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateStatus(
        Uuid $id,
        #[MapRequestPayload]
        ElementStatusDto $dto,
        FeedService $service,
    ): JsonResponse {
        $feedId = $service->updateStatus($id, $dto);

        return ApiResponse::ok($feedId);
    }

    #[Route('/api/feeds/{id}', name: 'feed_delete', methods: ['DELETE'])]
    #[IsGranted(FeedCreatorVoter::FEED_CREATOR, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete feed',
        tags: ['feeds'],
        responses: [new Ok(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function delete(
        Uuid $id,
        FeedService $service,
    ): JsonResponse {
        $feedId = $service->delete($id);

        return ApiResponse::ok($feedId);
    }

    #[Route('/api/feeds', name: 'feed_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of feeds',
        tags: ['feeds'],
        responses: [new Collection(FeedResource::class), new BadRequest(), new Unauthorized()],
    )]
    final public function index(
        #[MapQueryString(validationFailedStatusCode: 400)]
        FeedIndexDto $dto,
        #[MapQueryString(validationFailedStatusCode: 400)]
        FeedDetailsQueryDto $include,
        FeedService $service,
    ): JsonResponse {
        $feeds = $service->index($dto);

        $data = FeedResource::fromEntityCollection($feeds, $include);

        return ApiResponse::elements($data);
    }

    #[Route('/api/feeds/{id}', name: 'feed_details', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Details of feed',
        tags: ['feeds'],
        responses: [new Item(FeedResource::class), new BadRequest(), new Unauthorized()],
    )]
    final public function details(
        Uuid $id,
        #[MapQueryString(validationFailedStatusCode: 400)]
        FeedDetailsQueryDto $dto,
        FeedService $service,
    ): JsonResponse {
        $feed = $service->details($id);

        $data = FeedResource::fromEntity($feed, $dto);

        return ApiResponse::elements($data);
    }

    #[Route('/api/feeds/{id}/comments', name: 'feed_comment_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Post(
        summary: 'Create feed comment',
        requestBody: new Body(FeedCommentDto::class),
        tags: ['feeds'],
        responses: [new Created(), new BadRequest(), new Unauthorized(), new Forbidden()],
    )]
    final public function createComment(
        Uuid $id,
        #[MapRequestPayload]
        FeedCommentDto $dto,
        FeedService $service,
    ): JsonResponse {
        $feedCommentId = $service->createComment($id, $dto);

        return ApiResponse::created($feedCommentId);
    }

    #[Route('/api/feed-comments/{id}', name: 'feed_comment_update', methods: ['PUT'])]
    #[IsGranted(FeedCommentCreatorVoter::FEED_COMMENT_CREATOR, subject: 'id')]
    #[OA\Put(
        summary: 'Update feed comment',
        requestBody: new Body(FeedCommentDto::class),
        tags: ['feeds'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateComment(
        Uuid $id,
        #[MapRequestPayload]
        FeedCommentDto $dto,
        FeedService $service,
    ): JsonResponse {
        $feedCommentId = $service->updateComment($id, $dto);

        return ApiResponse::ok($feedCommentId);
    }

    #[Route('/api/feed-comments/{id}/status', name: 'feed_comment_update_status', methods: ['PATCH'])]
    #[IsGranted(FeedCommentVoter::FEED_COMMENT, subject: 'id')]
    #[OA\Patch(
        summary: 'Update feed comment status',
        requestBody: new Body(ElementStatusDto::class),
        tags: ['feeds'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateCommentStatus(
        Uuid $id,
        #[MapRequestPayload]
        ElementStatusDto $dto,
        FeedService $service,
    ): JsonResponse {
        $feedCommentId = $service->updateCommentStatus($id, $dto);

        return ApiResponse::ok($feedCommentId);
    }

    #[Route('/api/feed-comments/{id}', name: 'feed_comment_delete', methods: ['DELETE'])]
    #[IsGranted(FeedCommentCreatorVoter::FEED_COMMENT_CREATOR, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete feed comment',
        tags: ['feeds'],
        responses: [new Ok(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function deleteComment(
        Uuid $id,
        FeedService $service,
    ): JsonResponse {
        $feedCommentId = $service->deleteComment($id);

        return ApiResponse::ok($feedCommentId);
    }

    #[Route('/api/feeds/{id}/reactions', name: 'feed_reaction_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Post(
        summary: 'Create feed reaction',
        requestBody: new Body(FeedReactionDto::class),
        tags: ['feeds'],
        responses: [new Created(), new BadRequest(), new Unauthorized(), new Forbidden()],
    )]
    final public function createReaction(
        Uuid $id,
        #[MapRequestPayload]
        FeedReactionDto $dto,
        FeedService $service,
    ): JsonResponse {
        $feedReactionId = $service->createReaction($id, $dto);

        return ApiResponse::created($feedReactionId);
    }

    #[Route('/api/feed-reactions/{id}', name: 'feed_reaction_update', methods: ['PUT'])]
    #[IsGranted(FeedReactionCreatorVoter::FEED_REACTION_CREATOR, subject: 'id')]
    #[OA\Put(
        summary: 'Update feed reaction',
        requestBody: new Body(FeedReactionDto::class),
        tags: ['feeds'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateReaction(
        Uuid $id,
        #[MapRequestPayload]
        FeedReactionDto $dto,
        FeedService $service,
    ): JsonResponse {
        $feedReactionId = $service->updateReaction($id, $dto);

        return ApiResponse::ok($feedReactionId);
    }

    #[Route('/api/feed-reactions/{id}/status', name: 'feed_reaction_update_status', methods: ['PATCH'])]
    #[IsGranted(FeedReactionVoter::FEED_REACTION, subject: 'id')]
    #[OA\Patch(
        summary: 'Update feed reaction status',
        requestBody: new Body(ElementStatusDto::class),
        tags: ['feeds'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateReactionStatus(
        Uuid $id,
        #[MapRequestPayload]
        ElementStatusDto $dto,
        FeedService $service,
    ): JsonResponse {
        $feedReactionId = $service->updateReactionStatus($id, $dto);

        return ApiResponse::ok($feedReactionId);
    }

    #[Route('/api/feed-reactions/{id}', name: 'feed_reaction_delete', methods: ['DELETE'])]
    #[IsGranted(FeedReactionCreatorVoter::FEED_REACTION_CREATOR, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete feed reaction',
        tags: ['feeds'],
        responses: [new Ok(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function deleteReaction(
        Uuid $id,
        FeedService $service,
    ): JsonResponse {
        $feedReactionId = $service->deleteReaction($id);

        return ApiResponse::ok($feedReactionId);
    }
}
