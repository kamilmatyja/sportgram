<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Dto\NotificationIndexDto;
use App\Entity\{Notification, User};
use App\Enum\NotificationStatusEnum;
use App\Repository\NotificationRepository;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{NotificationFactory, UserFactory};

class NotificationRepositoryTest extends RepositoryTestCase
{
    private NotificationRepository $notificationRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('notifications', 'users');
        $this->notificationRepository = $this->repository(NotificationRepository::class);
    }

    final public function testSavePersistsNotification(): void
    {
        $user = $this->user();
        $notification = NotificationFactory::make([
            'user' => $user,
            'text' => 'Hello',
            'link' => '/feeds/1',
            'status' => NotificationStatusEnum::NotSent,
        ]);

        $this->notificationRepository->save($notification);
        $this->clear();

        $found = $this->notificationRepository->findById(self::id($notification));
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertSame('Hello', $found->text);
        $this->assertSame('/feeds/1', $found->link);
        $this->assertSame(NotificationStatusEnum::NotSent, $found->status);
        $this->assertNotNull($found->createdAt);
    }

    final public function testSavePersistsNotificationWithoutLink(): void
    {
        $notification = NotificationFactory::make(['user' => $this->user(), 'link' => null]);

        $this->notificationRepository->save($notification);
        $this->clear();

        $this->assertNull($this->notificationRepository->findById(self::id($notification))->link);
    }

    final public function testSaveUpdatesExistingNotification(): void
    {
        $notification = $this->notification(status: NotificationStatusEnum::Sent);

        $notification->status = NotificationStatusEnum::Read;
        $this->notificationRepository->save($notification);
        $this->clear();

        $this->assertSame(NotificationStatusEnum::Read, $this->notificationRepository->findById(self::id($notification))->status);
        $this->assertSame(1, $this->notificationRepository->count());
    }

    final public function testDeleteRemovesNotification(): void
    {
        $notification = $this->notification();
        $other = $this->notification();
        $id = self::id($notification);

        $this->notificationRepository->delete($notification);
        $this->clear();

        $this->assertNull($this->notificationRepository->find($id));
        $this->assertNotNull($this->notificationRepository->find(self::id($other)));
    }

    final public function testFindByIdReturnsNotification(): void
    {
        $notification = $this->notification();
        $this->notification();
        $this->clear();

        $this->assertSame((string) $notification->id, (string) $this->notificationRepository->findById(self::id($notification))->id);
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->notificationRepository->findById(Uuid::v7());
    }

    final public function testFindNotificationsReturnsOnlyUsersNotifications(): void
    {
        $user = $this->user();
        $first = $this->notification($user, createdAt: '2026-01-01 10:00:00');
        $second = $this->notification($user, createdAt: '2026-01-02 10:00:00');
        $this->notification($this->user());

        $page = $this->notificationRepository->findNotifications(self::id($user), $this->indexDto());

        $this->assertSame(self::ids([$second, $first]), self::ids($page->getItems()));
        $this->assertSame(2, $page->getTotalCount());
    }

    final public function testFindNotificationsFiltersByTextSubstring(): void
    {
        $user = $this->user();
        $first = $this->notification($user, 'New friend request', createdAt: '2026-01-01 10:00:00');
        $second = $this->notification($user, 'friend', createdAt: '2026-01-02 10:00:00');
        $this->notification($user, 'New comment');
        $this->notification($this->user(), 'New friend request');

        $page = $this->notificationRepository->findNotifications(self::id($user), $this->indexDto('friend', sort: 'createdAt:asc'));

        $this->assertSame(self::ids([$first, $second]), self::ids($page->getItems()));
    }

    final public function testFindNotificationsTextFilterIsCaseSensitive(): void
    {
        $user = $this->user();
        $this->notification($user, 'Friend request');

        $page = $this->notificationRepository->findNotifications(self::id($user), $this->indexDto('friend'));

        $this->assertSame([], $page->getItems());
    }

    #[DataProvider('statusProvider')]
    final public function testFindNotificationsFiltersByStatus(NotificationStatusEnum $status): void
    {
        $user = $this->user();
        $notifications = [];

        foreach (NotificationStatusEnum::cases() as $case) {
            $notifications[$case->name] = $this->notification($user, status: $case);
            $this->notification($this->user(), status: $case);
        }

        $page = $this->notificationRepository->findNotifications(self::id($user), $this->indexDto(status: $status));

        $this->assertSame(self::ids([$notifications[$status->name]]), self::ids($page->getItems()));
    }

    public static function statusProvider(): iterable
    {
        foreach (NotificationStatusEnum::cases() as $status) {
            yield $status->name => [$status];
        }
    }

    final public function testFindNotificationsCombinesFilters(): void
    {
        $user = $this->user();
        $match = $this->notification($user, 'New like', NotificationStatusEnum::Sent);
        $this->notification($user, 'New like', NotificationStatusEnum::Read);
        $this->notification($user, 'New comment', NotificationStatusEnum::Sent);
        $this->notification($this->user(), 'New like', NotificationStatusEnum::Sent);

        $page = $this->notificationRepository->findNotifications(
            self::id($user),
            $this->indexDto('like', NotificationStatusEnum::Sent),
        );

        $this->assertSame(self::ids([$match]), self::ids($page->getItems()));
        $this->assertSame(1, $page->getTotalCount());
    }

    final public function testFindNotificationsReturnsEmptyPageForUserWithoutNotifications(): void
    {
        $this->notification();

        $page = $this->notificationRepository->findNotifications(self::id($this->user()), $this->indexDto());

        $this->assertSame([], $page->getItems());
        $this->assertSame(0, $page->getTotalCount());
        $this->assertFalse($page->hasNextPage());
    }

    #[DataProvider('sortProvider')]
    final public function testFindNotificationsSorts(string $sort, array $expectedOrder): void
    {
        $user = $this->user();
        $notifications = [
            $this->notification($user, 'b', NotificationStatusEnum::Sent, '2026-01-02 10:00:00'),
            $this->notification($user, 'c', NotificationStatusEnum::Read, '2026-01-03 10:00:00'),
            $this->notification($user, 'a', NotificationStatusEnum::NotSent, '2026-01-01 10:00:00'),
        ];

        $page = $this->notificationRepository->findNotifications(self::id($user), $this->indexDto(sort: $sort));

        $this->assertSame(
            self::ids(array_map(static fn (int $i): Notification => $notifications[$i], $expectedOrder)),
            self::ids($page->getItems()),
        );
    }

    public static function sortProvider(): iterable
    {
        yield 'text asc' => ['text:asc', [2, 0, 1]];
        yield 'text desc' => ['text:desc', [1, 0, 2]];
        yield 'status asc' => ['status:asc', [2, 0, 1]];
        yield 'status desc' => ['status:desc', [1, 0, 2]];
        yield 'createdAt asc' => ['createdAt:asc', [2, 0, 1]];
        yield 'createdAt desc' => ['createdAt:desc', [1, 0, 2]];
    }

    #[DataProvider('paginationProvider')]
    final public function testFindNotificationsPaginates(int $pageNumber, int $limit, array $expectedIndexes, bool $hasNextPage): void
    {
        $user = $this->user();
        $notifications = [];

        for ($i = 0; $i < 5; ++$i) {
            $notifications[] = $this->notification($user, createdAt: sprintf('2026-01-0%d 10:00:00', $i + 1));
        }

        $this->notification();

        $dto = $this->indexDto(sort: 'createdAt:asc');
        $dto->page = $pageNumber;
        $dto->limit = $limit;

        $page = $this->notificationRepository->findNotifications(self::id($user), $dto);

        $this->assertSame(
            self::ids(array_map(static fn (int $i): Notification => $notifications[$i], $expectedIndexes)),
            self::ids($page->getItems()),
        );
        $this->assertSame(5, $page->getTotalCount());
        $this->assertSame($pageNumber, $page->getPageNumber());
        $this->assertSame($hasNextPage, $page->hasNextPage());
    }

    public static function paginationProvider(): iterable
    {
        yield 'first page' => [1, 2, [0, 1], true];
        yield 'middle page' => [2, 2, [2, 3], true];
        yield 'last partial page' => [3, 2, [4], false];
        yield 'beyond last page' => [4, 2, [], false];
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function notification(
        ?User $user = null,
        ?string $text = null,
        ?NotificationStatusEnum $status = null,
        ?string $createdAt = null,
    ): Notification {
        $notification = NotificationFactory::make(array_filter([
            'user' => $user ?? $this->user(),
            'text' => $text,
            'status' => $status,
        ]), $this->em);

        if ($createdAt !== null) {
            $this->em->getConnection()->executeStatement(
                'UPDATE notifications SET created_at = :createdAt WHERE id = :id',
                ['createdAt' => $createdAt, 'id' => (string) $notification->id],
            );
        }

        return $notification;
    }

    private function indexDto(
        ?string $text = null,
        ?NotificationStatusEnum $status = null,
        string $sort = 'createdAt:desc',
    ): NotificationIndexDto {
        $dto = new NotificationIndexDto();
        $dto->filter->text = $text;
        $dto->filter->status = $status;
        $dto->sort = $sort;

        return $dto;
    }
}
