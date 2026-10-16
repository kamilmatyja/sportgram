<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use App\Controller\FriendController;
use App\Dto\{FriendDto, FriendIndexDto, FriendStatusDto};
use App\Entity\Friend;
use App\Enum\FriendStatusEnum;
use App\Resource\FriendResource;
use App\Security\Voter\{FriendSenderVoter, FriendVoter};
use App\Service\FriendService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\FriendFactory;

class FriendControllerTest extends ControllerTestCase
{
    private FriendService&MockObject $service;

    private FriendController $controller;

    protected function setUp(): void
    {
        $this->controller = new FriendController();
    }

    #[DataProvider('routeProvider')]
    final public function testRouting(string $action, string $path, string $method, string $name, string $attribute, ?string $subject): void
    {
        $this->assertRoute([FriendController::class, $action], $path, [$method], $name);
        $this->assertGrantedBy([FriendController::class, $action], $attribute, $subject);
    }

    public static function routeProvider(): iterable
    {
        yield 'create' => ['create', '/api/friends', 'POST', 'friend_create', 'IS_AUTHENTICATED_FULLY', null];
        yield 'updateStatus' => ['updateStatus', '/api/friends/{id}/status', 'PATCH', 'friend_update_status', FriendVoter::FRIEND, 'id'];
        yield 'delete' => ['delete', '/api/friends/{id}', 'DELETE', 'friend_delete', FriendSenderVoter::FRIEND_SENDER, 'id'];
        yield 'index' => ['index', '/api/friends', 'GET', 'friend_index', 'IS_AUTHENTICATED_FULLY', null];
        yield 'details' => ['details', '/api/friends/{id}', 'GET', 'friend_details', FriendVoter::FRIEND, 'id'];
    }

    final public function testRoutesAreAllCovered(): void
    {
        $this->assertCoversAllRoutes(FriendController::class, array_keys(iterator_to_array(self::routeProvider())));
    }

    final public function testRequestMapping(): void
    {
        $this->assertMapsRequestPayload([FriendController::class, 'create'], 'dto');
        $this->assertMapsRequestPayload([FriendController::class, 'updateStatus'], 'dto');
        $this->assertMapsQueryString([FriendController::class, 'index'], 'dto');
    }

    final public function testCreate(): void
    {
        $dto = new FriendDto();
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('create')->with($dto)->willReturn($id);

        $response = $this->controller->create($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $id], $response);
    }

    final public function testUpdateStatus(): void
    {
        $id = Uuid::v4();
        $dto = new FriendStatusDto();
        $dto->status = FriendStatusEnum::Accepted;
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
        $dto = new FriendIndexDto();
        $friends = [$this->friend(), $this->friend()];
        $window = self::window($friends, total: 12, page: 1, limit: 2);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, [
            'data' => FriendResource::fromEntityCollection($friends),
            'pagination' => self::pagination($window),
        ], $response);
    }

    final public function testIndexWithoutResults(): void
    {
        $dto = new FriendIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('index')->willReturn($window);

        $response = $this->controller->index($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    final public function testDetails(): void
    {
        $friend = $this->friend();
        $this->service()->expects($this->once())->method('details')->with($friend->id)->willReturn($friend);

        $response = $this->controller->details($friend->id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => FriendResource::fromEntity($friend)], $response);
    }

    private function service(): FriendService&MockObject
    {
        return $this->service ??= $this->createMock(FriendService::class);
    }

    private function friend(): Friend
    {
        $friend = FriendFactory::make();
        $friend->id = Uuid::v4();
        $friend->onPrePersist();

        return $friend;
    }
}
