<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use App\Controller\FeedController;
use App\Dto\{ElementStatusDto, FeedCommentDto, FeedDetailsQueryDto, FeedDto, FeedIndexDto, FeedReactionDto};
use App\Entity\Feed;
use App\Enum\ElementStatusEnum;
use App\Resource\FeedResource;
use App\Security\Voter\{FeedCommentCreatorVoter,
    FeedCommentVoter,
    FeedCreatorVoter,
    FeedReactionCreatorVoter,
    FeedReactionVoter,
    FeedVoter};
use App\Service\FeedService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{FeedCommentFactory, FeedFactory, FeedReactionFactory};

class FeedControllerTest extends ControllerTestCase
{
    private FeedService&MockObject $service;

    private FeedController $controller;

    protected function setUp(): void
    {
        $this->controller = new FeedController();
    }

    #[DataProvider('routeProvider')]
    final public function testRouting(string $action, string $path, string $method, string $name, string $attribute, ?string $subject): void
    {
        $this->assertRoute([FeedController::class, $action], $path, [$method], $name);
        $this->assertGrantedBy([FeedController::class, $action], $attribute, $subject);
    }

    public static function routeProvider(): iterable
    {
        yield 'create' => ['create', '/api/feeds', 'POST', 'feed_create', 'IS_AUTHENTICATED_FULLY', null];
        yield 'update' => ['update', '/api/feeds/{id}', 'PUT', 'feed_update', FeedCreatorVoter::FEED_CREATOR, 'id'];
        yield 'updateStatus' => ['updateStatus', '/api/feeds/{id}/status', 'PATCH', 'feed_update_status', FeedVoter::FEED, 'id'];
        yield 'delete' => ['delete', '/api/feeds/{id}', 'DELETE', 'feed_delete', FeedCreatorVoter::FEED_CREATOR, 'id'];
        yield 'index' => ['index', '/api/feeds', 'GET', 'feed_index', 'IS_AUTHENTICATED_FULLY', null];
        yield 'details' => ['details', '/api/feeds/{id}', 'GET', 'feed_details', 'IS_AUTHENTICATED_FULLY', null];
        yield 'createComment' => ['createComment', '/api/feeds/{id}/comments', 'POST', 'feed_comment_create', 'IS_AUTHENTICATED_FULLY', null];
        yield 'updateComment' => ['updateComment', '/api/feed-comments/{id}', 'PUT', 'feed_comment_update', FeedCommentCreatorVoter::FEED_COMMENT_CREATOR, 'id'];
        yield 'updateCommentStatus' => ['updateCommentStatus', '/api/feed-comments/{id}/status', 'PATCH', 'feed_comment_update_status', FeedCommentVoter::FEED_COMMENT, 'id'];
        yield 'deleteComment' => ['deleteComment', '/api/feed-comments/{id}', 'DELETE', 'feed_comment_delete', FeedCommentCreatorVoter::FEED_COMMENT_CREATOR, 'id'];
        yield 'createReaction' => ['createReaction', '/api/feeds/{id}/reactions', 'POST', 'feed_reaction_create', 'IS_AUTHENTICATED_FULLY', null];
        yield 'updateReaction' => ['updateReaction', '/api/feed-reactions/{id}', 'PUT', 'feed_reaction_update', FeedReactionCreatorVoter::FEED_REACTION_CREATOR, 'id'];
        yield 'updateReactionStatus' => ['updateReactionStatus', '/api/feed-reactions/{id}/status', 'PATCH', 'feed_reaction_update_status', FeedReactionVoter::FEED_REACTION, 'id'];
        yield 'deleteReaction' => ['deleteReaction', '/api/feed-reactions/{id}', 'DELETE', 'feed_reaction_delete', FeedReactionCreatorVoter::FEED_REACTION_CREATOR, 'id'];
    }

    final public function testRoutesAreAllCovered(): void
    {
        $this->assertCoversAllRoutes(FeedController::class, array_keys(iterator_to_array(self::routeProvider())));
    }

    final public function testRequestMapping(): void
    {
        $this->assertMapsRequestPayload([FeedController::class, 'create'], 'dto');
        $this->assertMapsRequestPayload([FeedController::class, 'update'], 'dto');
        $this->assertMapsRequestPayload([FeedController::class, 'updateStatus'], 'dto');
        $this->assertMapsQueryString([FeedController::class, 'index'], 'dto');
        $this->assertMapsQueryString([FeedController::class, 'index'], 'include');
        $this->assertMapsQueryString([FeedController::class, 'details'], 'dto');
        $this->assertMapsRequestPayload([FeedController::class, 'createComment'], 'dto');
        $this->assertMapsRequestPayload([FeedController::class, 'updateComment'], 'dto');
        $this->assertMapsRequestPayload([FeedController::class, 'updateCommentStatus'], 'dto');
        $this->assertMapsRequestPayload([FeedController::class, 'createReaction'], 'dto');
        $this->assertMapsRequestPayload([FeedController::class, 'updateReaction'], 'dto');
        $this->assertMapsRequestPayload([FeedController::class, 'updateReactionStatus'], 'dto');
    }

    final public function testCreate(): void
    {
        $dto = new FeedDto();
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('create')->with($dto)->willReturn($id);

        $response = $this->controller->create($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $id], $response);
    }

    final public function testUpdate(): void
    {
        $id = Uuid::v4();
        $dto = new FeedDto();
        $this->service()->expects($this->once())->method('update')->with($id, $dto)->willReturn($id);

        $response = $this->controller->update($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testUpdateStatus(): void
    {
        $id = Uuid::v4();
        $dto = self::elementStatus();
        $this->service()->expects($this->once())->method('updateStatus')->with($id, $dto)->willReturn($id);

        $response = $this->controller->updateStatus($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testDelete(): void
    {
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('delete')->with($id)->willReturn($id);

        $response = $this->controller->delete($id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testIndex(): void
    {
        $dto = new FeedIndexDto();
        $include = new FeedDetailsQueryDto();
        $include->include = [FeedDetailsQueryDto::FEED_COMMENTS, FeedDetailsQueryDto::FEED_REACTIONS];
        $feeds = [$this->feedWithRelations(), $this->feed()];
        $window = self::window($feeds, total: 12, page: 1, limit: 2);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, $include, $this->service());

        $expected = FeedResource::fromEntityCollection($feeds, $include);
        $this->assertCount(1, $expected[0]['comments']);
        $this->assertCount(1, $expected[0]['reactions']);
        $this->assertJsonResponse(Response::HTTP_OK, [
            'data' => $expected,
            'pagination' => self::pagination($window),
        ], $response);
    }

    final public function testIndexWithoutResults(): void
    {
        $dto = new FeedIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, new FeedDetailsQueryDto(), $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    final public function testDetails(): void
    {
        $feed = $this->feedWithRelations();
        $dto = new FeedDetailsQueryDto();
        $dto->include = [FeedDetailsQueryDto::FEED_COMMENTS, FeedDetailsQueryDto::FEED_REACTIONS];
        $this->service()->expects($this->once())->method('details')->with($feed->id)->willReturn($feed);

        $response = $this->controller->details($feed->id, $dto, $this->service());

        $expected = FeedResource::fromEntity($feed, $dto);
        $this->assertArrayHasKey('comments', $expected);
        $this->assertArrayHasKey('reactions', $expected);
        $this->assertJsonResponse(Response::HTTP_OK, ['data' => $expected], $response);
    }

    final public function testDetailsWithoutIncludes(): void
    {
        $feed = $this->feedWithRelations();
        $this->service()->expects($this->once())->method('details')->with($feed->id)->willReturn($feed);

        $response = $this->controller->details($feed->id, new FeedDetailsQueryDto(), $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => FeedResource::fromEntity($feed)], $response);
    }

    final public function testCreateComment(): void
    {
        $feedId = Uuid::v4();
        $commentId = Uuid::v4();
        $dto = new FeedCommentDto();
        $this->service()->expects($this->once())->method('createComment')->with($feedId, $dto)->willReturn($commentId);

        $response = $this->controller->createComment($feedId, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $commentId], $response);
    }

    final public function testUpdateComment(): void
    {
        $id = Uuid::v4();
        $dto = new FeedCommentDto();
        $this->service()->expects($this->once())->method('updateComment')->with($id, $dto)->willReturn($id);

        $response = $this->controller->updateComment($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testUpdateCommentStatus(): void
    {
        $id = Uuid::v4();
        $dto = self::elementStatus();
        $this->service()->expects($this->once())->method('updateCommentStatus')->with($id, $dto)->willReturn($id);

        $response = $this->controller->updateCommentStatus($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testDeleteComment(): void
    {
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('deleteComment')->with($id)->willReturn($id);

        $response = $this->controller->deleteComment($id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testCreateReaction(): void
    {
        $feedId = Uuid::v4();
        $reactionId = Uuid::v4();
        $dto = new FeedReactionDto();
        $this->service()->expects($this->once())->method('createReaction')->with($feedId, $dto)->willReturn($reactionId);

        $response = $this->controller->createReaction($feedId, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $reactionId], $response);
    }

    final public function testUpdateReaction(): void
    {
        $id = Uuid::v4();
        $dto = new FeedReactionDto();
        $this->service()->expects($this->once())->method('updateReaction')->with($id, $dto)->willReturn($id);

        $response = $this->controller->updateReaction($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testUpdateReactionStatus(): void
    {
        $id = Uuid::v4();
        $dto = self::elementStatus();
        $this->service()->expects($this->once())->method('updateReactionStatus')->with($id, $dto)->willReturn($id);

        $response = $this->controller->updateReactionStatus($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testDeleteReaction(): void
    {
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('deleteReaction')->with($id)->willReturn($id);

        $response = $this->controller->deleteReaction($id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    private function service(): FeedService&MockObject
    {
        return $this->service ??= $this->createMock(FeedService::class);
    }

    private static function elementStatus(): ElementStatusDto
    {
        $dto = new ElementStatusDto();
        $dto->status = ElementStatusEnum::Active;

        return $dto;
    }

    private function feed(): Feed
    {
        $feed = FeedFactory::make();
        $feed->id = Uuid::v4();
        $feed->onPrePersist();

        return $feed;
    }

    private function feedWithRelations(): Feed
    {
        $feed = $this->feed();

        $comment = FeedCommentFactory::make(['feed' => $feed]);
        $comment->id = Uuid::v4();
        $comment->onPrePersist();
        $feed->comments->add($comment);

        $reaction = FeedReactionFactory::make(['feed' => $feed]);
        $reaction->id = Uuid::v4();
        $reaction->onPrePersist();
        $feed->reactions->add($reaction);

        return $feed;
    }
}
