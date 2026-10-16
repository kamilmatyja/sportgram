<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Dto\PageIndexDto;
use App\Entity\{Page, User};
use App\Enum\{ElementStatusEnum, SaveStatusEnum};
use App\Repository\PageRepository;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{PageFactory, PageParticipantFactory, UserFactory};

class PageRepositoryTest extends RepositoryTestCase
{
    private PageRepository $pageRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('page_participants', 'pages', 'users');
        $this->pageRepository = $this->repository(PageRepository::class);
    }

    final public function testSavePersistsPage(): void
    {
        $user = $this->user();
        $page = PageFactory::make([
            'user' => $user,
            'title' => 'Running club',
            'link' => 'running-club',
            'status' => ElementStatusEnum::Draft,
        ]);

        $this->pageRepository->save($page);
        $this->clear();

        $found = $this->pageRepository->findById(self::id($page));
        $this->assertSame('Running club', $found->title);
        $this->assertSame('running-club', $found->link);
        $this->assertSame(ElementStatusEnum::Draft, $found->status);
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertNotNull($found->createdAt);
    }

    final public function testSaveUpdatesExistingPage(): void
    {
        $page = $this->page(['status' => ElementStatusEnum::Draft]);

        $page->status = ElementStatusEnum::Active;
        $page->title = 'Changed';
        $this->pageRepository->save($page);
        $this->clear();

        $found = $this->pageRepository->findById(self::id($page));
        $this->assertSame(ElementStatusEnum::Active, $found->status);
        $this->assertSame('Changed', $found->title);
    }

    final public function testDeleteRemovesPage(): void
    {
        $page = $this->page();
        $other = $this->page();
        $id = self::id($page);

        $this->pageRepository->delete($page);
        $this->clear();

        $this->assertNull($this->pageRepository->find($id));
        $this->assertNotNull($this->pageRepository->find(self::id($other)));
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->pageRepository->findById(Uuid::v4());
    }

    final public function testFindPagesWithoutFiltersReturnsAll(): void
    {
        $pages = [$this->page(), $this->page(), $this->page()];

        $window = $this->pageRepository->findPages($this->indexDto());

        $this->assertEqualsCanonicalizing(self::ids($pages), self::ids($window->getItems()));
        $this->assertSame(3, $window->getTotalCount());
    }

    final public function testFindPagesReturnsEmptyWindowWithoutPages(): void
    {
        $window = $this->pageRepository->findPages($this->indexDto());

        $this->assertSame([], $window->getItems());
        $this->assertSame(0, $window->getTotalCount());
        $this->assertFalse($window->hasNextPage());
    }

    final public function testFindPagesFiltersByParticipantUser(): void
    {
        $user = $this->user();
        $first = $this->page(['title' => 'A']);
        $second = $this->page(['title' => 'B']);
        PageParticipantFactory::make(['page' => $first, 'user' => $user], $this->em);
        PageParticipantFactory::make(['page' => $second, 'user' => $user], $this->em);
        PageParticipantFactory::make(['page' => $first], $this->em);
        PageParticipantFactory::make(['page' => $this->page(['title' => 'C'])], $this->em);
        $this->page(['title' => 'D']);

        $dto = $this->indexDto('title:asc');
        $dto->filter->userId = self::id($user);

        $window = $this->pageRepository->findPages($dto);

        $this->assertSame(self::ids([$first, $second]), self::ids($window->getItems()));
        $this->assertSame(2, $window->getTotalCount());
    }

    final public function testFindPagesUserFilterUsesParticipantsNotOwner(): void
    {
        $owner = $this->user();
        $this->page(['user' => $owner]);

        $dto = $this->indexDto();
        $dto->filter->userId = self::id($owner);

        $this->assertSame([], $this->pageRepository->findPages($dto)->getItems());
    }

    final public function testFindPagesUserFilterIgnoresParticipantStatus(): void
    {
        $user = $this->user();
        $pages = [];

        foreach (SaveStatusEnum::cases() as $i => $status) {
            $pages[] = $page = $this->page(['title' => (string) $i]);
            PageParticipantFactory::make(['page' => $page, 'user' => $user, 'status' => $status], $this->em);
        }

        $dto = $this->indexDto('title:asc');
        $dto->filter->userId = self::id($user);

        $this->assertSame(self::ids($pages), self::ids($this->pageRepository->findPages($dto)->getItems()));
    }

    final public function testFindPagesUserFilterDoesNotDuplicatePagesWithSeveralParticipantRows(): void
    {
        $user = $this->user();
        $page = $this->page();
        PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);
        PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);

        $dto = $this->indexDto();
        $dto->filter->userId = self::id($user);

        $window = $this->pageRepository->findPages($dto);

        $this->assertSame(self::ids([$page]), self::ids($window->getItems()));
        $this->assertSame(1, $window->getTotalCount());
    }

    final public function testFindPagesFiltersByLinkExactly(): void
    {
        $page = $this->page(['link' => 'club']);
        $this->page(['link' => 'club-2']);

        $dto = $this->indexDto();
        $dto->filter->link = 'club';

        $this->assertSame(self::ids([$page]), self::ids($this->pageRepository->findPages($dto)->getItems()));

        $dto->filter->link = 'clu';
        $this->assertSame([], $this->pageRepository->findPages($dto)->getItems());
    }

    #[DataProvider('titleFilterProvider')]
    final public function testFindPagesFiltersByTitlePartially(string $title, bool $matches): void
    {
        $page = $this->page(['title' => 'Warsaw Runners']);
        $this->page(['title' => 'Cracow Cyclists']);

        $dto = $this->indexDto();
        $dto->filter->title = $title;

        $this->assertSame($matches ? self::ids([$page]) : [], self::ids($this->pageRepository->findPages($dto)->getItems()));
    }

    public static function titleFilterProvider(): iterable
    {
        yield 'exact' => ['Warsaw Runners', true];
        yield 'prefix' => ['Warsaw', true];
        yield 'infix' => ['saw Run', true];
        yield 'suffix' => ['Runners', true];
        yield 'different case is case sensitive' => ['warsaw', false];
        yield 'no match' => ['Berlin', false];
    }

    #[DataProvider('statusProvider')]
    final public function testFindPagesFiltersByStatus(ElementStatusEnum $status): void
    {
        $pages = [];

        foreach (ElementStatusEnum::cases() as $case) {
            $pages[$case->name] = $this->page(['status' => $case]);
        }

        $dto = $this->indexDto();
        $dto->filter->status = $status;

        $this->assertSame(self::ids([$pages[$status->name]]), self::ids($this->pageRepository->findPages($dto)->getItems()));
    }

    public static function statusProvider(): iterable
    {
        foreach (ElementStatusEnum::cases() as $status) {
            yield $status->name => [$status];
        }
    }

    final public function testFindPagesCombinesFilters(): void
    {
        $user = $this->user();
        $match = $this->page(['title' => 'Run club', 'link' => 'run-club', 'status' => ElementStatusEnum::Active]);
        $wrongStatus = $this->page(['title' => 'Run club 2', 'status' => ElementStatusEnum::Draft]);
        $wrongTitle = $this->page(['title' => 'Swim club', 'status' => ElementStatusEnum::Active]);
        $this->page(['title' => 'Run club 3', 'status' => ElementStatusEnum::Active]);

        foreach ([$match, $wrongStatus, $wrongTitle] as $page) {
            PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);
        }

        $dto = $this->indexDto();
        $dto->filter->userId = self::id($user);
        $dto->filter->title = 'Run';
        $dto->filter->status = ElementStatusEnum::Active;

        $this->assertSame(self::ids([$match]), self::ids($this->pageRepository->findPages($dto)->getItems()));

        $dto->filter->link = 'run-club';
        $this->assertSame(self::ids([$match]), self::ids($this->pageRepository->findPages($dto)->getItems()));

        $dto->filter->link = 'other';
        $this->assertSame([], $this->pageRepository->findPages($dto)->getItems());
    }

    /** @param list<mixed> $ascendingValues */
    #[DataProvider('sortProvider')]
    final public function testFindPagesSorts(string $field, array $ascendingValues, string $direction): void
    {
        $pages = [];

        foreach ([1, 2, 0] as $index) {
            $value = $ascendingValues[$index];

            if ('createdAt' === $field) {
                $page = $this->page();
                $this->storeCreatedAt($page, $value);
            } else {
                $page = $this->page([$field => $value]);
            }

            $pages[$index] = $page;
        }

        ksort($pages);
        $expected = 'asc' === $direction ? array_values($pages) : array_reverse(array_values($pages));

        $window = $this->pageRepository->findPages($this->indexDto("$field:$direction"));

        $this->assertSame(self::ids($expected), self::ids($window->getItems()));
    }

    public static function sortProvider(): iterable
    {
        $fields = [
            'title' => ['Alpha', 'Bravo', 'Charlie'],
            'status' => [ElementStatusEnum::Draft, ElementStatusEnum::Active, ElementStatusEnum::Rejected],
            'createdAt' => ['2020-01-01 10:00:00', '2021-01-01 10:00:00', '2022-01-01 10:00:00'],
        ];

        foreach ($fields as $field => $values) {
            yield "$field asc" => [$field, $values, 'asc'];
            yield "$field desc" => [$field, $values, 'desc'];
        }
    }

    final public function testFindPagesDefaultsToCreatedAtDesc(): void
    {
        $old = $this->page();
        $new = $this->page();
        $middle = $this->page();
        $this->storeCreatedAt($old, '2020-01-01 00:00:00');
        $this->storeCreatedAt($middle, '2021-01-01 00:00:00');
        $this->storeCreatedAt($new, '2022-01-01 00:00:00');

        $window = $this->pageRepository->findPages(new PageIndexDto());

        $this->assertSame(self::ids([$new, $middle, $old]), self::ids($window->getItems()));
    }

    #[DataProvider('paginationProvider')]
    final public function testFindPagesPaginates(int $page, int $limit, array $expectedIndexes, bool $hasNextPage): void
    {
        $pages = [];

        foreach (['E', 'C', 'A', 'D', 'B'] as $title) {
            $pages[$title] = $this->page(['title' => $title]);
        }

        ksort($pages);
        $sorted = array_values($pages);

        $dto = $this->indexDto('title:asc');
        $dto->page = $page;
        $dto->limit = $limit;

        $window = $this->pageRepository->findPages($dto);

        $this->assertSame(
            self::ids(array_map(static fn (int $i): Page => $sorted[$i], $expectedIndexes)),
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
        yield 'beyond last page' => [4, 2, [], false];
        yield 'exact fit' => [1, 5, [0, 1, 2, 3, 4], false];
    }

    final public function testFindPagesPaginatesWithJoinedUserFilter(): void
    {
        $user = $this->user();
        $pages = [];

        foreach (['A', 'B', 'C'] as $title) {
            $pages[] = $page = $this->page(['title' => $title]);
            PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);
            PageParticipantFactory::make(['page' => $page], $this->em);
        }

        $dto = $this->indexDto('title:asc');
        $dto->filter->userId = self::id($user);
        $dto->limit = 2;

        $window = $this->pageRepository->findPages($dto);

        $this->assertSame(self::ids([$pages[0], $pages[1]]), self::ids($window->getItems()));
        $this->assertSame(3, $window->getTotalCount());
        $this->assertTrue($window->hasNextPage());
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function page(array $overrides = []): Page
    {
        return PageFactory::make($overrides, $this->em);
    }

    private function indexDto(string $sort = 'createdAt:desc'): PageIndexDto
    {
        $dto = new PageIndexDto();
        $dto->sort = $sort;

        return $dto;
    }
}
