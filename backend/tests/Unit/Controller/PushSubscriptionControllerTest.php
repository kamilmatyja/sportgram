<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use App\Controller\PushSubscriptionController;
use App\Dto\{PushSubscriptionDto, PushSubscriptionIndexDto};
use App\Entity\PushSubscription;
use App\Resource\PushSubscriptionResource;
use App\Security\Voter\PushSubscriptionVoter;
use App\Service\PushSubscriptionService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\PushSubscriptionFactory;

class PushSubscriptionControllerTest extends ControllerTestCase
{
    private PushSubscriptionService&MockObject $service;

    private PushSubscriptionController $controller;

    protected function setUp(): void
    {
        $this->controller = new PushSubscriptionController();
    }

    #[DataProvider('routeProvider')]
    final public function testRouting(string $action, string $path, string $method, string $name, string $attribute, ?string $subject): void
    {
        $this->assertRoute([PushSubscriptionController::class, $action], $path, [$method], $name);
        $this->assertGrantedBy([PushSubscriptionController::class, $action], $attribute, $subject);
    }

    public static function routeProvider(): iterable
    {
        yield 'create' => ['create', '/api/push-subscriptions', 'POST', 'push_subscription_create', 'IS_AUTHENTICATED_FULLY', null];
        yield 'update' => ['update', '/api/push-subscriptions/{id}', 'PUT', 'push_subscription_update', PushSubscriptionVoter::PUSH_SUBSCRIPTION, 'id'];
        yield 'delete' => ['delete', '/api/push-subscriptions/{id}', 'DELETE', 'push_subscription_delete', PushSubscriptionVoter::PUSH_SUBSCRIPTION, 'id'];
        yield 'index' => ['index', '/api/push-subscriptions', 'GET', 'push_subscription_index', 'IS_AUTHENTICATED_FULLY', null];
        yield 'details' => ['details', '/api/push-subscriptions/{id}', 'GET', 'push_subscription_details', PushSubscriptionVoter::PUSH_SUBSCRIPTION, 'id'];
    }

    final public function testRoutesAreAllCovered(): void
    {
        $this->assertCoversAllRoutes(PushSubscriptionController::class, array_keys(iterator_to_array(self::routeProvider())));
    }

    final public function testRequestMapping(): void
    {
        $this->assertMapsRequestPayload([PushSubscriptionController::class, 'create'], 'dto');
        $this->assertMapsRequestPayload([PushSubscriptionController::class, 'update'], 'dto');
        $this->assertMapsQueryString([PushSubscriptionController::class, 'index'], 'dto');
    }

    final public function testCreate(): void
    {
        $dto = new PushSubscriptionDto();
        $id = Uuid::v7();
        $this->service()->expects($this->once())->method('create')->with($dto)->willReturn($id);

        $response = $this->controller->create($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $id], $response);
    }

    final public function testUpdate(): void
    {
        $id = Uuid::v7();
        $dto = new PushSubscriptionDto();
        $this->service()->expects($this->once())->method('update')->with($id, $dto)->willReturn($id);

        $response = $this->controller->update($id, $dto, $this->service());

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
        $dto = new PushSubscriptionIndexDto();
        $subscriptions = [$this->pushSubscription(), $this->pushSubscription()];
        $window = self::window($subscriptions, total: 12, page: 1, limit: 2);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, [
            'data' => PushSubscriptionResource::fromEntityCollection($subscriptions),
            'pagination' => self::pagination($window),
        ], $response);
    }

    final public function testIndexWithoutResults(): void
    {
        $dto = new PushSubscriptionIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    final public function testDetails(): void
    {
        $subscription = $this->pushSubscription();
        $this->service()->expects($this->once())->method('details')->with($subscription->id)->willReturn($subscription);

        $response = $this->controller->details($subscription->id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => PushSubscriptionResource::fromEntity($subscription)], $response);
        $this->assertStringNotContainsString($subscription->user->password, $response->getContent());
    }

    private function service(): PushSubscriptionService&MockObject
    {
        return $this->service ??= $this->createMock(PushSubscriptionService::class);
    }

    private function pushSubscription(): PushSubscription
    {
        $subscription = PushSubscriptionFactory::make();
        $subscription->id = Uuid::v7();
        $subscription->onPrePersist();
        $subscription->user->id = Uuid::v7();
        $subscription->user->onPrePersist();

        return $subscription;
    }
}
