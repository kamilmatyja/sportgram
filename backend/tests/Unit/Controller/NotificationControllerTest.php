<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use App\Controller\NotificationController;
use App\Dto\{NotificationIndexDto, NotificationStatusDto};
use App\Entity\Notification;
use App\Enum\NotificationStatusEnum;
use App\Resource\NotificationResource;
use App\Security\Voter\NotificationVoter;
use App\Service\NotificationService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\NotificationFactory;

class NotificationControllerTest extends ControllerTestCase
{
    private NotificationService&MockObject $service;

    private NotificationController $controller;

    protected function setUp(): void
    {
        $this->controller = new NotificationController();
    }

    #[DataProvider('routeProvider')]
    final public function testRouting(string $action, string $path, string $method, string $name, string $attribute, ?string $subject): void
    {
        $this->assertRoute([NotificationController::class, $action], $path, [$method], $name);
        $this->assertGrantedBy([NotificationController::class, $action], $attribute, $subject);
    }

    public static function routeProvider(): iterable
    {
        yield 'updateStatus' => ['updateStatus', '/api/notifications/{id}/status', 'PATCH', 'notification_update_status', NotificationVoter::NOTIFICATION, 'id'];
        yield 'delete' => ['delete', '/api/notifications/{id}', 'DELETE', 'notification_delete', NotificationVoter::NOTIFICATION, 'id'];
        yield 'index' => ['index', '/api/notifications', 'GET', 'notification_index', 'IS_AUTHENTICATED_FULLY', null];
        yield 'details' => ['details', '/api/notifications/{id}', 'GET', 'notification_details', NotificationVoter::NOTIFICATION, 'id'];
    }

    final public function testRoutesAreAllCovered(): void
    {
        $this->assertCoversAllRoutes(NotificationController::class, array_keys(iterator_to_array(self::routeProvider())));
    }

    final public function testRequestMapping(): void
    {
        $this->assertMapsRequestPayload([NotificationController::class, 'updateStatus'], 'dto');
        $this->assertMapsQueryString([NotificationController::class, 'index'], 'dto');
    }

    final public function testUpdateStatus(): void
    {
        $id = Uuid::v7();
        $dto = new NotificationStatusDto();
        $dto->status = NotificationStatusEnum::Read;
        $this->service()->expects($this->once())->method('updateStatus')->with($id, $dto)->willReturn($id);

        $response = $this->controller->updateStatus($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testDelete(): void
    {
        $id = Uuid::v7();
        $this->service()->expects($this->once())->method('delete')->with($id)->willReturn($id);

        $response = $this->controller->delete($id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testIndex(): void
    {
        $dto = new NotificationIndexDto();
        $notifications = [$this->notification(), $this->notification()];
        $window = self::window($notifications, total: 12, page: 1, limit: 2);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, [
            'data' => NotificationResource::fromEntityCollection($notifications),
            'pagination' => self::pagination($window),
        ], $response);
    }

    final public function testIndexWithoutResults(): void
    {
        $dto = new NotificationIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    final public function testDetails(): void
    {
        $notification = $this->notification();
        $this->service()->expects($this->once())->method('details')->with($notification->id)->willReturn($notification);

        $response = $this->controller->details($notification->id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => NotificationResource::fromEntity($notification)], $response);
    }

    private function service(): NotificationService&MockObject
    {
        return $this->service ??= $this->createMock(NotificationService::class);
    }

    private function notification(): Notification
    {
        $notification = NotificationFactory::make();
        $notification->id = Uuid::v7();
        $notification->onPrePersist();

        return $notification;
    }
}
