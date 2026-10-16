<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use App\Controller\ConversationController;
use App\Dto\{ConversationActivityIndexDto, ConversationDto, ConversationIndexDto, ConversationStatusDto};
use App\Entity\{Conversation, ConversationActivity};
use App\Enum\ConversationStatusEnum;
use App\Resource\{ConversationActivityResource, ConversationResource};
use App\Security\Voter\{ConversationActivityCreatorVoter,
    ConversationActivityVoter,
    ConversationSenderVoter,
    ConversationVoter};
use App\Service\ConversationService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{ConversationActivityFactory, ConversationFactory};

class ConversationControllerTest extends ControllerTestCase
{
    private ConversationService&MockObject $service;

    private ConversationController $controller;

    protected function setUp(): void
    {
        $this->controller = new ConversationController();
    }

    #[DataProvider('routeProvider')]
    final public function testRouting(string $action, string $path, string $method, string $name, string $attribute, ?string $subject): void
    {
        $this->assertRoute([ConversationController::class, $action], $path, [$method], $name);
        $this->assertGrantedBy([ConversationController::class, $action], $attribute, $subject);
    }

    public static function routeProvider(): iterable
    {
        yield 'create' => ['create', '/api/conversation-users/{id}', 'POST', 'conversation_create', 'IS_AUTHENTICATED_FULLY', null];
        yield 'update' => ['update', '/api/conversations/{id}', 'PUT', 'conversation_update', ConversationSenderVoter::CONVERSATION_SENDER, 'id'];
        yield 'updateStatus' => ['updateStatus', '/api/conversations/{id}/status', 'PATCH', 'conversation_update_status', ConversationVoter::CONVERSATION, 'id'];
        yield 'delete' => ['delete', '/api/conversations/{id}', 'DELETE', 'conversation_delete', ConversationSenderVoter::CONVERSATION_SENDER, 'id'];
        yield 'index' => ['index', '/api/conversations', 'GET', 'conversation_index', 'IS_AUTHENTICATED_FULLY', null];
        yield 'details' => ['details', '/api/conversations/{id}', 'GET', 'conversation_details', ConversationVoter::CONVERSATION, 'id'];
        yield 'updateActivityUpdatedAt' => ['updateActivityUpdatedAt', '/api/conversation-activity-users/{id}/updated-at', 'PATCH', 'conversation_activity_update_updated_at', ConversationActivityCreatorVoter::CONVERSATION_ACTIVITY_CREATOR, 'id'];
        yield 'indexActivity' => ['indexActivity', '/api/conversation-activities', 'GET', 'conversation_activity_index', 'IS_AUTHENTICATED_FULLY', null];
        yield 'detailsActivity' => ['detailsActivity', '/api/conversation-activity-users/{id}', 'GET', 'conversation_activity_details', ConversationActivityVoter::CONVERSATION_ACTIVITY, 'id'];
    }

    final public function testRoutesAreAllCovered(): void
    {
        $this->assertCoversAllRoutes(ConversationController::class, array_keys(iterator_to_array(self::routeProvider())));
    }

    final public function testRequestMapping(): void
    {
        $this->assertMapsRequestPayload([ConversationController::class, 'create'], 'dto');
        $this->assertMapsRequestPayload([ConversationController::class, 'update'], 'dto');
        $this->assertMapsRequestPayload([ConversationController::class, 'updateStatus'], 'dto');
        $this->assertMapsQueryString([ConversationController::class, 'index'], 'dto');
        $this->assertMapsQueryString([ConversationController::class, 'indexActivity'], 'dto');
    }

    final public function testCreate(): void
    {
        $userId = Uuid::v4();
        $dto = new ConversationDto();
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('create')->with($userId, $dto)->willReturn($id);

        $response = $this->controller->create($userId, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $id], $response);
    }

    final public function testUpdate(): void
    {
        $id = Uuid::v4();
        $dto = new ConversationDto();
        $this->service()->expects($this->once())->method('update')->with($id, $dto)->willReturn($id);

        $response = $this->controller->update($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testUpdateStatus(): void
    {
        $id = Uuid::v4();
        $dto = new ConversationStatusDto();
        $dto->status = ConversationStatusEnum::Read;
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
        $dto = new ConversationIndexDto();
        $conversations = [$this->conversation(), $this->conversation()];
        $window = self::window($conversations, total: 12, page: 1, limit: 2);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, [
            'data' => ConversationResource::fromEntityCollection($conversations),
            'pagination' => self::pagination($window),
        ], $response);
    }

    final public function testIndexWithoutResults(): void
    {
        $dto = new ConversationIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    final public function testDetails(): void
    {
        $conversation = $this->conversation();
        $this->service()->expects($this->once())->method('details')->with($conversation->id)->willReturn($conversation);

        $response = $this->controller->details($conversation->id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => ConversationResource::fromEntity($conversation)], $response);
    }

    final public function testUpdateActivityUpdatedAt(): void
    {
        $receiverUserId = Uuid::v4();
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('updateActivityUpdatedAt')->with($receiverUserId)->willReturn($id);

        $response = $this->controller->updateActivityUpdatedAt($receiverUserId, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testIndexActivity(): void
    {
        $dto = new ConversationActivityIndexDto();
        $activities = [$this->activity(), $this->activity()];
        $window = self::window($activities, total: 5, page: 2, limit: 2);
        $this->service()->expects($this->once())->method('indexActivity')->with($dto)->willReturn($window);

        $response = $this->controller->indexActivity($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, [
            'data' => ConversationActivityResource::fromEntityCollection($activities),
            'pagination' => self::pagination($window),
        ], $response);
    }

    final public function testIndexActivityWithoutResults(): void
    {
        $dto = new ConversationActivityIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('indexActivity')->with($dto)->willReturn($window);

        $response = $this->controller->indexActivity($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    final public function testDetailsActivity(): void
    {
        $senderUserId = Uuid::v4();
        $activity = $this->activity();
        $this->service()->expects($this->once())->method('detailsActivity')->with($senderUserId)->willReturn($activity);

        $response = $this->controller->detailsActivity($senderUserId, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => ConversationActivityResource::fromEntity($activity)], $response);
    }

    private function service(): ConversationService&MockObject
    {
        return $this->service ??= $this->createMock(ConversationService::class);
    }

    private function conversation(): Conversation
    {
        $conversation = ConversationFactory::make();
        $conversation->id = Uuid::v4();
        $conversation->onPrePersist();

        return $conversation;
    }

    private function activity(): ConversationActivity
    {
        $activity = ConversationActivityFactory::make();
        $activity->id = Uuid::v4();
        $activity->onPrePersist();

        return $activity;
    }
}
