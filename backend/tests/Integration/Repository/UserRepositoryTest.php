<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Dto\UserIndexDto;
use App\Entity\User;
use App\Enum\{CountryEnum, GenderEnum, RoleEnum, UserStatusEnum};
use App\Repository\UserRepository;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{UserFactory, UserRoleFactory, UserSignFactory};

class UserRepositoryTest extends RepositoryTestCase
{
    private UserRepository $userRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('user_signs', 'user_roles', 'users');
        $this->userRepository = $this->repository(UserRepository::class);
    }

    final public function testSavePersistsUser(): void
    {
        $user = UserFactory::make([
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'email' => 'jan@example.com',
            'status' => UserStatusEnum::Pending,
        ]);

        $this->userRepository->save($user);
        $this->clear();

        $found = $this->userRepository->findById(self::id($user));
        $this->assertSame('Jan', $found->firstName);
        $this->assertSame('Kowalski', $found->lastName);
        $this->assertSame('jan@example.com', $found->email);
        $this->assertSame(UserStatusEnum::Pending, $found->status);
        $this->assertSame($user->password, $found->password);
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingUser(): void
    {
        $user = $this->user(['status' => UserStatusEnum::Pending]);

        $user->status = UserStatusEnum::Accepted;
        $user->firstName = 'Changed';
        $this->userRepository->save($user);
        $this->clear();

        $found = $this->userRepository->findById(self::id($user));
        $this->assertSame(UserStatusEnum::Accepted, $found->status);
        $this->assertSame('Changed', $found->firstName);
    }

    final public function testDeleteRemovesUser(): void
    {
        $user = $this->user();
        $other = $this->user();
        $id = self::id($user);

        $this->userRepository->delete($user);
        $this->clear();

        $this->assertNull($this->userRepository->find($id));
        $this->assertNotNull($this->userRepository->find(self::id($other)));
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->userRepository->findById(Uuid::v4());
    }

    final public function testFindByIdLoadsRolesForSecurity(): void
    {
        $user = $this->user();
        UserRoleFactory::make(['user' => $user, 'role' => RoleEnum::Participant], $this->em);
        UserRoleFactory::make(['user' => $user, 'role' => RoleEnum::Administrator], $this->em);
        UserRoleFactory::make(['user' => $this->user(), 'role' => RoleEnum::Organizer], $this->em);
        $this->clear();

        $found = $this->userRepository->findById(self::id($user));

        $roles = $found->getRoles();
        sort($roles);
        $expected = [RoleEnum::Participant->getLabel(), RoleEnum::Administrator->getLabel()];
        sort($expected);
        $this->assertSame($expected, $roles);
        $this->assertSame($user->email, $found->getUserIdentifier());
    }

    final public function testFindByEmailReturnsMatchingUser(): void
    {
        $user = $this->user(['email' => 'match@example.com']);
        $this->user(['email' => 'other@example.com']);
        $this->clear();

        $found = $this->userRepository->findByEmail('match@example.com');

        $this->assertNotNull($found);
        $this->assertTrue($found->id->equals($user->id));
    }

    #[DataProvider('findByEmailMissProvider')]
    final public function testFindByEmailReturnsNullWithoutExactMatch(string $email): void
    {
        $this->user(['email' => 'match@example.com']);
        $this->clear();

        $this->assertNull($this->userRepository->findByEmail($email));
    }

    public static function findByEmailMissProvider(): iterable
    {
        yield 'unknown' => ['unknown@example.com'];
        yield 'different case' => ['MATCH@example.com'];
        yield 'partial' => ['match@example'];
        yield 'empty' => [''];
    }

    final public function testFindUsersWithoutFiltersReturnsEveryone(): void
    {
        $users = [$this->user(), $this->user(), $this->user()];

        $window = $this->userRepository->findUsers($this->indexDto());

        $this->assertEqualsCanonicalizing(self::ids($users), self::ids($window->getItems()));
        $this->assertSame(3, $window->getTotalCount());
    }

    final public function testFindUsersReturnsEmptyWindowWhenNothingMatches(): void
    {
        $this->user(['firstName' => 'Alice']);

        $dto = $this->indexDto();
        $dto->filter->firstName = 'Nobody';

        $window = $this->userRepository->findUsers($dto);

        $this->assertSame([], $window->getItems());
        $this->assertSame(0, $window->getTotalCount());
        $this->assertFalse($window->hasNextPage());
    }

    #[DataProvider('nameFilterProvider')]
    final public function testFindUsersFiltersByNamePartially(string $field, string $value, bool $matches): void
    {
        $user = $this->user([$field => 'Krzysztof']);
        $this->user([$field => 'Anna']);

        $dto = $this->indexDto();
        $dto->filter->{$field} = $value;

        $window = $this->userRepository->findUsers($dto);

        $this->assertSame($matches ? self::ids([$user]) : [], self::ids($window->getItems()));
    }

    public static function nameFilterProvider(): iterable
    {
        foreach (['firstName', 'lastName'] as $field) {
            yield "$field exact" => [$field, 'Krzysztof', true];
            yield "$field prefix" => [$field, 'Krzy', true];
            yield "$field infix" => [$field, 'zysz', true];
            yield "$field suffix" => [$field, 'tof', true];
            yield "$field different case is case sensitive" => [$field, 'krzysztof', false];
            yield "$field longer than value" => [$field, 'Krzysztofa', false];
        }
    }

    final public function testFindUsersNameFilterDoesNotEscapeLikeWildcards(): void
    {
        $first = $this->user(['firstName' => 'Anna']);
        $second = $this->user(['firstName' => 'Olga']);

        $dto = $this->indexDto('firstName:asc');
        $dto->filter->firstName = '%';

        $window = $this->userRepository->findUsers($dto);

        $this->assertSame(self::ids([$first, $second]), self::ids($window->getItems()));
    }

    final public function testFindUsersFiltersByGender(): void
    {
        $male = $this->user(['gender' => GenderEnum::Male]);
        $this->user(['gender' => GenderEnum::Female]);

        $dto = $this->indexDto();
        $dto->filter->gender = GenderEnum::Male;

        $this->assertSame(self::ids([$male]), self::ids($this->userRepository->findUsers($dto)->getItems()));
    }

    final public function testFindUsersFiltersByEmailExactly(): void
    {
        $user = $this->user(['email' => 'jan@example.com']);
        $this->user(['email' => 'jan@example.com.pl']);
        $this->user(['email' => 'anna@example.com']);

        $dto = $this->indexDto();
        $dto->filter->email = 'jan@example.com';

        $this->assertSame(self::ids([$user]), self::ids($this->userRepository->findUsers($dto)->getItems()));

        $dto->filter->email = 'jan@example';
        $this->assertSame([], $this->userRepository->findUsers($dto)->getItems());
    }

    final public function testFindUsersFiltersByCountry(): void
    {
        $user = $this->user(['country' => CountryEnum::Albania]);
        $this->user(['country' => CountryEnum::Andorra]);

        $dto = $this->indexDto();
        $dto->filter->country = CountryEnum::Albania;

        $this->assertSame(self::ids([$user]), self::ids($this->userRepository->findUsers($dto)->getItems()));
    }

    #[DataProvider('statusProvider')]
    final public function testFindUsersFiltersByStatus(UserStatusEnum $status): void
    {
        $users = [];

        foreach (UserStatusEnum::cases() as $case) {
            $users[$case->name] = $this->user(['status' => $case]);
        }

        $dto = $this->indexDto();
        $dto->filter->status = $status;

        $this->assertSame(self::ids([$users[$status->name]]), self::ids($this->userRepository->findUsers($dto)->getItems()));
    }

    public static function statusProvider(): iterable
    {
        foreach (UserStatusEnum::cases() as $status) {
            yield $status->name => [$status];
        }
    }

    final public function testFindUsersFiltersByUserIds(): void
    {
        $first = $this->user(['firstName' => 'A']);
        $second = $this->user(['firstName' => 'B']);
        $this->user(['firstName' => 'C']);

        $dto = $this->indexDto('firstName:asc');
        $dto->filter->userIds = [self::id($second), self::id($first)];

        $this->assertSame(self::ids([$first, $second]), self::ids($this->userRepository->findUsers($dto)->getItems()));
    }

    final public function testFindUsersWithUnknownUserIdsReturnsNothing(): void
    {
        $this->user();

        $dto = $this->indexDto();
        $dto->filter->userIds = [Uuid::v4()];

        $this->assertSame([], $this->userRepository->findUsers($dto)->getItems());
    }

    final public function testFindUsersFiltersByLinkExactly(): void
    {
        $user = $this->user(['link' => 'jan-kowalski']);
        $this->user(['link' => 'jan-kowalski-2']);

        $dto = $this->indexDto();
        $dto->filter->link = 'jan-kowalski';

        $this->assertSame(self::ids([$user]), self::ids($this->userRepository->findUsers($dto)->getItems()));

        $dto->filter->link = 'jan';
        $this->assertSame([], $this->userRepository->findUsers($dto)->getItems());
    }

    final public function testFindUsersFiltersBySignId(): void
    {
        $user = $this->user();
        UserSignFactory::make(['user' => $user], $this->em);
        $sign = UserSignFactory::make(['user' => $user], $this->em);
        $other = $this->user();
        UserSignFactory::make(['user' => $other], $this->em);

        $dto = $this->indexDto();
        $dto->filter->signId = self::id($sign);

        $window = $this->userRepository->findUsers($dto);

        $this->assertSame(self::ids([$user]), self::ids($window->getItems()));
        $this->assertSame(1, $window->getTotalCount());
    }

    final public function testFindUsersWithUnknownSignIdReturnsNothing(): void
    {
        UserSignFactory::make(['user' => $this->user()], $this->em);

        $dto = $this->indexDto();
        $dto->filter->signId = Uuid::v4();

        $this->assertSame([], $this->userRepository->findUsers($dto)->getItems());
    }

    final public function testFindUsersCombinesFilters(): void
    {
        $match = $this->user([
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => GenderEnum::Male,
            'country' => CountryEnum::Albania,
            'status' => UserStatusEnum::Accepted,
            'email' => 'jan@example.com',
            'link' => 'jan',
        ]);
        $sign = UserSignFactory::make(['user' => $match], $this->em);
        $this->user(['firstName' => 'Jan', 'lastName' => 'Kowalski', 'gender' => GenderEnum::Female, 'country' => CountryEnum::Albania, 'status' => UserStatusEnum::Accepted]);
        $this->user(['firstName' => 'Jan', 'lastName' => 'Kowalski', 'gender' => GenderEnum::Male, 'country' => CountryEnum::Andorra, 'status' => UserStatusEnum::Accepted]);
        $this->user(['firstName' => 'Jan', 'lastName' => 'Kowalski', 'gender' => GenderEnum::Male, 'country' => CountryEnum::Albania, 'status' => UserStatusEnum::Banned]);
        $this->user(['firstName' => 'Jan', 'lastName' => 'Nowak', 'gender' => GenderEnum::Male, 'country' => CountryEnum::Albania, 'status' => UserStatusEnum::Accepted]);
        $this->user(['firstName' => 'Adam', 'lastName' => 'Kowalski', 'gender' => GenderEnum::Male, 'country' => CountryEnum::Albania, 'status' => UserStatusEnum::Accepted]);

        $dto = $this->indexDto();
        $dto->filter->firstName = 'Ja';
        $dto->filter->lastName = 'Kowal';
        $dto->filter->gender = GenderEnum::Male;
        $dto->filter->country = CountryEnum::Albania;
        $dto->filter->status = UserStatusEnum::Accepted;

        $this->assertSame(self::ids([$match]), self::ids($this->userRepository->findUsers($dto)->getItems()));

        $dto->filter->email = 'jan@example.com';
        $dto->filter->link = 'jan';
        $dto->filter->userIds = [self::id($match)];
        $dto->filter->signId = self::id($sign);

        $this->assertSame(self::ids([$match]), self::ids($this->userRepository->findUsers($dto)->getItems()));

        $dto->filter->link = 'other';
        $this->assertSame([], $this->userRepository->findUsers($dto)->getItems());
    }

    /** @param list<mixed> $ascendingValues */
    #[DataProvider('sortProvider')]
    final public function testFindUsersSorts(string $field, array $ascendingValues, string $direction): void
    {
        $users = [];

        foreach ([1, 2, 0] as $index) {
            if (! array_key_exists($index, $ascendingValues)) {
                continue;
            }

            $value = $ascendingValues[$index];

            if ('createdAt' === $field) {
                $user = $this->user();
                $this->storeCreatedAt($user, $value);
            } else {
                $user = $this->user([$field => $value]);
            }

            $users[$index] = $user;
        }

        ksort($users);
        $expected = 'asc' === $direction ? array_values($users) : array_reverse(array_values($users));

        $window = $this->userRepository->findUsers($this->indexDto("$field:$direction"));

        $this->assertSame(self::ids($expected), self::ids($window->getItems()));
    }

    public static function sortProvider(): iterable
    {
        $fields = [
            'firstName' => ['Adam', 'Bartosz', 'Celina'],
            'lastName' => ['Adamski', 'Borowski', 'Czarnecki'],
            'gender' => [GenderEnum::Male, GenderEnum::Female],
            'country' => [CountryEnum::Albania, CountryEnum::Andorra, CountryEnum::Austria],
            'birthAt' => [new DateTimeImmutable('1980-01-01'), new DateTimeImmutable('1990-01-01'), new DateTimeImmutable('2000-01-01')],
            'status' => [UserStatusEnum::Pending, UserStatusEnum::Accepted, UserStatusEnum::Banned],
            'createdAt' => ['2020-01-01 10:00:00', '2021-01-01 10:00:00', '2022-01-01 10:00:00'],
        ];

        foreach ($fields as $field => $values) {
            yield "$field asc" => [$field, $values, 'asc'];
            yield "$field desc" => [$field, $values, 'desc'];
        }
    }

    final public function testFindUsersDefaultsToCreatedAtDesc(): void
    {
        $old = $this->user();
        $new = $this->user();
        $middle = $this->user();
        $this->storeCreatedAt($old, '2020-01-01 00:00:00');
        $this->storeCreatedAt($middle, '2021-01-01 00:00:00');
        $this->storeCreatedAt($new, '2022-01-01 00:00:00');

        $window = $this->userRepository->findUsers(new UserIndexDto());

        $this->assertSame(self::ids([$new, $middle, $old]), self::ids($window->getItems()));
    }

    #[DataProvider('paginationProvider')]
    final public function testFindUsersPaginates(int $page, int $limit, array $expectedIndexes, bool $hasNextPage): void
    {
        $users = [];

        foreach (['E', 'C', 'A', 'D', 'B'] as $name) {
            $users[$name] = $this->user(['firstName' => $name]);
        }

        ksort($users);
        $sorted = array_values($users);

        $dto = $this->indexDto('firstName:asc');
        $dto->page = $page;
        $dto->limit = $limit;

        $window = $this->userRepository->findUsers($dto);

        $this->assertSame(
            self::ids(array_map(static fn (int $i): User => $sorted[$i], $expectedIndexes)),
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
        yield 'limit one' => [5, 1, [4], false];
    }

    final public function testFindUsersPaginatesFilteredTotal(): void
    {
        $accepted = [];

        foreach (['A', 'B', 'C'] as $name) {
            $accepted[] = $this->user(['firstName' => $name, 'status' => UserStatusEnum::Accepted]);
            $this->user(['firstName' => $name, 'status' => UserStatusEnum::Banned]);
        }

        $dto = $this->indexDto('firstName:asc');
        $dto->filter->status = UserStatusEnum::Accepted;
        $dto->limit = 2;

        $window = $this->userRepository->findUsers($dto);

        $this->assertSame(self::ids([$accepted[0], $accepted[1]]), self::ids($window->getItems()));
        $this->assertSame(3, $window->getTotalCount());
        $this->assertTrue($window->hasNextPage());
    }

    private function user(array $overrides = []): User
    {
        return UserFactory::make($overrides, $this->em);
    }

    private function indexDto(string $sort = 'createdAt:desc'): UserIndexDto
    {
        $dto = new UserIndexDto();
        $dto->sort = $sort;

        return $dto;
    }
}
