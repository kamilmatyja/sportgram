<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Dto\PushSubscriptionIndexDto;
use App\Entity\{PushSubscription, User};
use App\Enum\PushSubscriptionStatusEnum;
use App\Repository\PushSubscriptionRepository;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{PushSubscriptionFactory, UserFactory};

class PushSubscriptionRepositoryTest extends RepositoryTestCase
{
    private PushSubscriptionRepository $pushSubscriptionRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('push_subscriptions', 'users');
        $this->pushSubscriptionRepository = $this->repository(PushSubscriptionRepository::class);
    }

    final public function testSavePersistsPushSubscription(): void
    {
        $user = $this->user();
        $subscription = PushSubscriptionFactory::make([
            'user' => $user,
            'endpoint' => 'https://push.example/1',
            'p256dh' => 'key',
            'auth' => 'secret',
            'userAgent' => 'Firefox',
            'status' => PushSubscriptionStatusEnum::Active,
        ]);

        $this->pushSubscriptionRepository->save($subscription);
        $this->clear();

        $found = $this->pushSubscriptionRepository->findById(self::id($subscription));
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertSame('https://push.example/1', $found->endpoint);
        $this->assertSame('key', $found->p256dh);
        $this->assertSame('secret', $found->auth);
        $this->assertSame('Firefox', $found->userAgent);
        $this->assertSame(PushSubscriptionStatusEnum::Active, $found->status);
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingPushSubscription(): void
    {
        $subscription = $this->subscription($this->user(), ['status' => PushSubscriptionStatusEnum::Active]);

        $subscription->status = PushSubscriptionStatusEnum::Revoked;
        $this->pushSubscriptionRepository->save($subscription);
        $this->clear();

        $this->assertSame(
            PushSubscriptionStatusEnum::Revoked,
            $this->pushSubscriptionRepository->findById(self::id($subscription))->status,
        );
    }

    final public function testDeleteRemovesPushSubscription(): void
    {
        $subscription = $this->subscription($this->user());
        $id = self::id($subscription);

        $this->pushSubscriptionRepository->delete($subscription);
        $this->clear();

        $this->assertNull($this->pushSubscriptionRepository->find($id));
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->pushSubscriptionRepository->findById(Uuid::v7());
    }

    final public function testFindActiveByUserIdReturnsOnlyActiveSubscriptionsOfUser(): void
    {
        $user = $this->user();
        $active1 = $this->subscription($user, ['status' => PushSubscriptionStatusEnum::Active]);
        $active2 = $this->subscription($user, ['status' => PushSubscriptionStatusEnum::Active]);
        $this->subscription($user, ['status' => PushSubscriptionStatusEnum::Inactive]);
        $this->subscription($user, ['status' => PushSubscriptionStatusEnum::Revoked]);
        $this->subscription($this->user(), ['status' => PushSubscriptionStatusEnum::Active]);

        $window = $this->pushSubscriptionRepository->findActiveByUserId(self::id($user));

        $this->assertEqualsCanonicalizing(self::ids([$active1, $active2]), self::ids($window->getItems()));
        $this->assertSame(2, $window->getTotalCount());
        $this->assertFalse($window->hasNextPage());
    }

    final public function testFindActiveByUserIdReturnsEmptyWindow(): void
    {
        $user = $this->user();
        $this->subscription($user, ['status' => PushSubscriptionStatusEnum::Revoked]);

        $window = $this->pushSubscriptionRepository->findActiveByUserId(self::id($user));

        $this->assertSame([], $window->getItems());
        $this->assertSame(0, $window->getTotalCount());
    }

    final public function testFindPushSubscriptionsReturnsOnlySubscriptionsOfUserInAnyStatus(): void
    {
        $user = $this->user();
        $own = [];

        foreach (PushSubscriptionStatusEnum::cases() as $status) {
            $own[] = $this->subscription($user, ['status' => $status]);
        }

        $this->subscription($this->user());

        $window = $this->pushSubscriptionRepository->findPushSubscriptions(self::id($user), $this->indexDto());

        $this->assertEqualsCanonicalizing(self::ids($own), self::ids($window->getItems()));
        $this->assertSame(3, $window->getTotalCount());
    }

    final public function testFindPushSubscriptionsReturnsEmptyWindow(): void
    {
        $this->subscription($this->user());

        $window = $this->pushSubscriptionRepository->findPushSubscriptions(self::id($this->user()), $this->indexDto());

        $this->assertSame([], $window->getItems());
        $this->assertSame(0, $window->getTotalCount());
    }

    #[DataProvider('filterProvider')]
    final public function testFindPushSubscriptionsFiltersByField(string $field): void
    {
        $user = $this->user();
        $matching = $this->subscription($user, [$field => 'wanted']);
        $this->subscription($user, [$field => 'wanted-not']);
        $this->subscription($this->user(), [$field => 'wanted']);

        $dto = $this->indexDto();
        $dto->filter->{$field} = 'wanted';

        $window = $this->pushSubscriptionRepository->findPushSubscriptions(self::id($user), $dto);

        $this->assertSame(self::ids([$matching]), self::ids($window->getItems()));
    }

    public static function filterProvider(): iterable
    {
        yield 'endpoint' => ['endpoint'];
        yield 'p256dh' => ['p256dh'];
        yield 'auth' => ['auth'];
    }

    final public function testFindPushSubscriptionsCombinesFilters(): void
    {
        $user = $this->user();
        $values = ['endpoint' => 'e', 'p256dh' => 'p', 'auth' => 'a'];
        $matching = $this->subscription($user, $values);
        $this->subscription($user, ['endpoint' => 'x'] + $values);
        $this->subscription($user, ['p256dh' => 'x'] + $values);
        $this->subscription($user, ['auth' => 'x'] + $values);

        $dto = $this->indexDto();
        $dto->filter->endpoint = 'e';
        $dto->filter->p256dh = 'p';
        $dto->filter->auth = 'a';

        $window = $this->pushSubscriptionRepository->findPushSubscriptions(self::id($user), $dto);

        $this->assertSame(self::ids([$matching]), self::ids($window->getItems()));
    }

    #[DataProvider('sortProvider')]
    final public function testFindPushSubscriptionsSorts(string $sort, array $expectedOrder): void
    {
        $user = $this->user();
        $subscriptions = [
            'a' => $this->subscription($user, ['endpoint' => 'https://b']),
            'b' => $this->subscription($user, ['endpoint' => 'https://c']),
            'c' => $this->subscription($user, ['endpoint' => 'https://a']),
        ];
        $this->storeCreatedAt($subscriptions['a'], '2026-01-03 00:00:00');
        $this->storeCreatedAt($subscriptions['b'], '2026-01-01 00:00:00');
        $this->storeCreatedAt($subscriptions['c'], '2026-01-02 00:00:00');

        $dto = $this->indexDto();
        $dto->sort = $sort;

        $this->assertSame(
            self::ids(array_map(static fn (string $key): PushSubscription => $subscriptions[$key], $expectedOrder)),
            self::ids($this->pushSubscriptionRepository->findPushSubscriptions(self::id($user), $dto)->getItems()),
        );
    }

    public static function sortProvider(): iterable
    {
        yield 'endpoint asc' => ['endpoint:asc', ['c', 'a', 'b']];
        yield 'endpoint desc' => ['endpoint:desc', ['b', 'a', 'c']];
        yield 'createdAt asc' => ['createdAt:asc', ['b', 'c', 'a']];
        yield 'createdAt desc' => ['createdAt:desc', ['a', 'c', 'b']];
    }

    final public function testFindPushSubscriptionsPaginates(): void
    {
        $user = $this->user();
        $subscriptions = [];

        for ($i = 0; $i < 5; ++$i) {
            $subscriptions[] = $subscription = $this->subscription($user);
            $this->storeCreatedAt($subscription, sprintf('2026-01-0%d 00:00:00', $i + 1));
        }

        $dto = $this->indexDto();
        $dto->sort = 'createdAt:asc';
        $dto->page = 2;
        $dto->limit = 2;

        $window = $this->pushSubscriptionRepository->findPushSubscriptions(self::id($user), $dto);

        $this->assertSame(self::ids([$subscriptions[2], $subscriptions[3]]), self::ids($window->getItems()));
        $this->assertSame(5, $window->getTotalCount());
        $this->assertSame(2, $window->getPageNumber());
        $this->assertTrue($window->hasNextPage());

        $dto->page = 3;
        $window = $this->pushSubscriptionRepository->findPushSubscriptions(self::id($user), $dto);

        $this->assertSame(self::ids([$subscriptions[4]]), self::ids($window->getItems()));
        $this->assertFalse($window->hasNextPage());
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function subscription(User $user, array $overrides = []): PushSubscription
    {
        return PushSubscriptionFactory::make(['user' => $user] + $overrides, $this->em);
    }

    private function indexDto(): PushSubscriptionIndexDto
    {
        return new PushSubscriptionIndexDto();
    }
}
