<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Dto\PageFollowIndexDto;
use App\Entity\{Page, PageFollow, User};
use App\Enum\PageFollowStatusEnum;
use App\Repository\PageFollowRepository;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{PageFactory, PageFollowFactory, UserFactory};

class PageFollowRepositoryTest extends RepositoryTestCase
{
    private PageFollowRepository $pageFollowRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('page_follows', 'pages', 'users');
        $this->pageFollowRepository = $this->repository(PageFollowRepository::class);
    }

    final public function testSavePersistsPageFollow(): void
    {
        $page = $this->page();
        $user = $this->user();
        $pageFollow = PageFollowFactory::make([
            'page' => $page,
            'user' => $user,
            'status' => PageFollowStatusEnum::Pending,
        ]);

        $this->pageFollowRepository->save($pageFollow);
        $this->clear();

        $found = $this->pageFollowRepository->findById(self::id($pageFollow));
        $this->assertSame(PageFollowStatusEnum::Pending, $found->status);
        $this->assertTrue($found->page->id->equals($page->id));
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingPageFollow(): void
    {
        $pageFollow = $this->pageFollow($this->user(), $this->page(), PageFollowStatusEnum::Pending);

        $pageFollow->status = PageFollowStatusEnum::Accepted;
        $this->pageFollowRepository->save($pageFollow);
        $this->clear();

        $this->assertSame(PageFollowStatusEnum::Accepted, $this->pageFollowRepository->findById(self::id($pageFollow))->status);
        $this->assertSame(1, $this->pageFollowRepository->count());
    }

    final public function testDeleteRemovesPageFollow(): void
    {
        $user = $this->user();
        $pageFollow = $this->pageFollow($user, $this->page());
        $other = $this->pageFollow($user, $this->page());
        $id = self::id($pageFollow);

        $this->pageFollowRepository->delete($pageFollow);
        $this->clear();

        $this->assertNull($this->pageFollowRepository->find($id));
        $this->assertNotNull($this->pageFollowRepository->find(self::id($other)));
    }

    final public function testFindByIdReturnsPageFollow(): void
    {
        $pageFollow = $this->pageFollow($this->user(), $this->page());
        $this->clear();

        $this->assertSame((string) $pageFollow->id, (string) $this->pageFollowRepository->findById(self::id($pageFollow))->id);
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->pageFollowRepository->findById(Uuid::v4());
    }

    final public function testFindPageFollowsReturnsOnlyFollowsOfUser(): void
    {
        $user = $this->user();
        $first = $this->pageFollow($user, $this->page(), createdAt: '2026-01-01 10:00:00');
        $second = $this->pageFollow($user, $this->page(), createdAt: '2026-01-01 11:00:00');
        $this->pageFollow($this->user(), $this->page());
        $this->clear();

        $window = $this->pageFollowRepository->findPageFollows($this->indexDto($user, sort: 'createdAt:asc'));

        $this->assertSame(self::ids([$first, $second]), self::ids($window->getItems()));
        $this->assertSame(2, $window->getTotalCount());
    }

    #[DataProvider('statusProvider')]
    final public function testFindPageFollowsFiltersByStatus(PageFollowStatusEnum $status): void
    {
        $user = $this->user();
        $expected = null;

        foreach (PageFollowStatusEnum::cases() as $case) {
            $pageFollow = $this->pageFollow($user, $this->page(), $case);

            if ($case === $status) {
                $expected = $pageFollow;
            }
        }

        $this->pageFollow($this->user(), $this->page(), $status);
        $this->clear();

        $window = $this->pageFollowRepository->findPageFollows($this->indexDto($user, status: $status));

        $this->assertSame(self::ids([$expected]), self::ids($window->getItems()));
        $this->assertSame(1, $window->getTotalCount());
    }

    public static function statusProvider(): iterable
    {
        foreach (PageFollowStatusEnum::cases() as $status) {
            yield $status->name => [$status];
        }
    }

    final public function testFindPageFollowsFiltersByPageIds(): void
    {
        $user = $this->user();
        $page1 = $this->page();
        $page2 = $this->page();
        $first = $this->pageFollow($user, $page1, createdAt: '2026-01-01 10:00:00');
        $second = $this->pageFollow($user, $page2, createdAt: '2026-01-01 11:00:00');
        $this->pageFollow($user, $this->page());
        $this->pageFollow($this->user(), $page1);
        $this->clear();

        $window = $this->pageFollowRepository->findPageFollows($this->indexDto($user, [$page1, $page2], sort: 'createdAt:asc'));

        $this->assertSame(self::ids([$first, $second]), self::ids($window->getItems()));
        $this->assertSame(2, $window->getTotalCount());
    }

    final public function testFindPageFollowsCombinesPageIdsAndStatus(): void
    {
        $user = $this->user();
        $page1 = $this->page();
        $page2 = $this->page();
        $match = $this->pageFollow($user, $page1, PageFollowStatusEnum::Accepted);
        $this->pageFollow($user, $page2, PageFollowStatusEnum::Pending);
        $this->pageFollow($user, $this->page(), PageFollowStatusEnum::Accepted);
        $this->pageFollow($this->user(), $page1, PageFollowStatusEnum::Accepted);
        $this->clear();

        $window = $this->pageFollowRepository->findPageFollows(
            $this->indexDto($user, [$page1, $page2], PageFollowStatusEnum::Accepted),
        );

        $this->assertSame(self::ids([$match]), self::ids($window->getItems()));
    }

    final public function testFindPageFollowsReturnsEmptyWindow(): void
    {
        $user = $this->user();
        $this->pageFollow($this->user(), $this->page());
        $this->clear();

        $window = $this->pageFollowRepository->findPageFollows($this->indexDto($user));

        $this->assertSame([], self::ids($window->getItems()));
        $this->assertSame(0, $window->getTotalCount());
        $this->assertFalse($window->hasNextPage());
    }

    #[DataProvider('sortProvider')]
    final public function testFindPageFollowsSorts(string $sort, array $expectedOrder): void
    {
        $user = $this->user();
        $pageFollows = [
            'a' => $this->pageFollow($user, $this->page(), PageFollowStatusEnum::Rejected, '2026-01-01 10:00:00'),
            'b' => $this->pageFollow($user, $this->page(), PageFollowStatusEnum::Pending, '2026-01-02 10:00:00'),
            'c' => $this->pageFollow($user, $this->page(), PageFollowStatusEnum::Unfollowed, '2026-01-03 10:00:00'),
        ];
        $this->clear();

        $window = $this->pageFollowRepository->findPageFollows($this->indexDto($user, sort: $sort));

        $this->assertSame(
            self::ids(array_map(static fn (string $key): PageFollow => $pageFollows[$key], $expectedOrder)),
            self::ids($window->getItems()),
        );
    }

    public static function sortProvider(): iterable
    {
        yield 'createdAt asc' => ['createdAt:asc', ['a', 'b', 'c']];
        yield 'createdAt desc' => ['createdAt:desc', ['c', 'b', 'a']];
        yield 'status asc' => ['status:asc', ['b', 'a', 'c']];
        yield 'status desc' => ['status:desc', ['c', 'a', 'b']];
    }

    #[DataProvider('paginationProvider')]
    final public function testFindPageFollowsPaginates(int $page, int $limit, array $expectedIndexes, bool $hasNextPage): void
    {
        $user = $this->user();
        $pageFollows = [];

        for ($i = 0; $i < 5; ++$i) {
            $pageFollows[] = $this->pageFollow($user, $this->page(), createdAt: sprintf('2026-01-01 10:00:%02d', $i));
        }

        $this->clear();

        $dto = $this->indexDto($user, sort: 'createdAt:asc');
        $dto->page = $page;
        $dto->limit = $limit;

        $window = $this->pageFollowRepository->findPageFollows($dto);

        $this->assertSame(
            self::ids(array_map(static fn (int $i): PageFollow => $pageFollows[$i], $expectedIndexes)),
            self::ids($window->getItems()),
        );
        $this->assertSame(5, $window->getTotalCount());
        $this->assertSame($page, $window->getPageNumber());
        $this->assertSame($hasNextPage, $window->hasNextPage());
    }

    public static function paginationProvider(): iterable
    {
        yield 'first page' => [1, 2, [0, 1], true];
        yield 'middle page' => [2, 2, [2, 3], true];
        yield 'last partial page' => [3, 2, [4], false];
        yield 'exact fit' => [1, 5, [0, 1, 2, 3, 4], false];
        yield 'beyond last page' => [4, 2, [], false];
    }

    #[DataProvider('hasRowProvider')]
    final public function testHasRowIgnoresStatus(PageFollowStatusEnum $status): void
    {
        $user = $this->user();
        $page = $this->page();
        $this->pageFollow($user, $page, $status);
        $this->clear();

        $this->assertTrue($this->pageFollowRepository->hasRow(self::id($user), self::id($page)));
    }

    public static function hasRowProvider(): iterable
    {
        foreach (PageFollowStatusEnum::cases() as $status) {
            yield $status->name => [$status];
        }
    }

    final public function testHasRowIsFalseForOtherUserOrPage(): void
    {
        $user = $this->user();
        $other = $this->user();
        $page = $this->page();
        $otherPage = $this->page();
        $this->pageFollow($user, $page);
        $this->pageFollow($other, $otherPage);
        $this->clear();

        $this->assertFalse($this->pageFollowRepository->hasRow(self::id($user), self::id($otherPage)));
        $this->assertFalse($this->pageFollowRepository->hasRow(self::id($other), self::id($page)));
        $this->assertFalse($this->pageFollowRepository->hasRow(self::id($this->user()), self::id($this->page())));
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function page(): Page
    {
        return PageFactory::make(em: $this->em);
    }

    private function pageFollow(
        User $user,
        Page $page,
        ?PageFollowStatusEnum $status = null,
        ?string $createdAt = null,
    ): PageFollow {
        $pageFollow = PageFollowFactory::make(array_filter([
            'user' => $user,
            'page' => $page,
            'status' => $status,
        ]), $this->em);

        if ($createdAt !== null) {
            $this->em->getConnection()->executeStatement(
                'UPDATE page_follows SET created_at = :createdAt WHERE id = :id',
                ['createdAt' => $createdAt, 'id' => (string) $pageFollow->id],
            );
        }

        return $pageFollow;
    }

    /** @param Page[] $pages */
    private function indexDto(
        User $user,
        array $pages = [],
        ?PageFollowStatusEnum $status = null,
        string $sort = 'createdAt:desc',
    ): PageFollowIndexDto {
        $dto = new PageFollowIndexDto();
        $dto->filter->userId = self::id($user);
        $dto->filter->pageIds = array_map(self::id(...), $pages);
        $dto->filter->status = $status;
        $dto->sort = $sort;

        return $dto;
    }
}
