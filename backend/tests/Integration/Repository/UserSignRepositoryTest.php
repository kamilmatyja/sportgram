<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\{User, UserSign};
use App\Enum\UnauthorizedStatusEnum;
use App\Repository\UserSignRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{UserFactory, UserSignFactory};

class UserSignRepositoryTest extends RepositoryTestCase
{
    private UserSignRepository $userSignRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('user_signs', 'users');
        $this->userSignRepository = $this->repository(UserSignRepository::class);
    }

    final public function testSavePersistsUserSign(): void
    {
        $user = $this->user();
        $sign = UserSignFactory::make([
            'user' => $user,
            'code' => 123456,
            'attempt' => 0,
            'status' => UnauthorizedStatusEnum::NotSent,
        ]);

        $this->userSignRepository->save($sign);
        $this->clear();

        $found = $this->userSignRepository->findById(self::id($sign));
        $this->assertSame(123456, $found->code);
        $this->assertSame(0, $found->attempt);
        $this->assertSame(UnauthorizedStatusEnum::NotSent, $found->status);
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertNotNull($found->createdAt);
    }

    final public function testSaveUpdatesExistingUserSign(): void
    {
        $sign = $this->sign($this->user(), ['attempt' => 1, 'status' => UnauthorizedStatusEnum::Sent]);

        $sign->attempt = 2;
        $sign->status = UnauthorizedStatusEnum::Correct;
        $this->userSignRepository->save($sign);
        $this->clear();

        $found = $this->userSignRepository->findById(self::id($sign));
        $this->assertSame(2, $found->attempt);
        $this->assertSame(UnauthorizedStatusEnum::Correct, $found->status);
    }

    final public function testDeleteRemovesUserSign(): void
    {
        $user = $this->user();
        $sign = $this->sign($user);
        $other = $this->sign($user);
        $id = self::id($sign);

        $this->userSignRepository->delete($sign);
        $this->clear();

        $this->assertNull($this->userSignRepository->find($id));
        $this->assertNotNull($this->userSignRepository->find(self::id($other)));
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->userSignRepository->findById(Uuid::v7());
    }

    final public function testFindLastByUserIdReturnsNewestSignOfThatUser(): void
    {
        $user = $this->user();
        $other = $this->user();
        $middle = $this->sign($user);
        $newest = $this->sign($user);
        $oldest = $this->sign($user);
        $otherNewer = $this->sign($other);
        $this->storeCreatedAt($oldest, '2020-01-01 00:00:00');
        $this->storeCreatedAt($middle, '2021-01-01 00:00:00');
        $this->storeCreatedAt($newest, '2022-01-01 00:00:00');
        $this->storeCreatedAt($otherNewer, '2023-01-01 00:00:00');
        $this->clear();

        $found = $this->userSignRepository->findLastByUserId(self::id($user));

        $this->assertNotNull($found);
        $this->assertTrue($found->id->equals($newest->id));
    }

    final public function testFindLastByUserIdIgnoresStatus(): void
    {
        $user = $this->user();
        $correct = $this->sign($user, ['status' => UnauthorizedStatusEnum::Correct]);
        $incorrect = $this->sign($user, ['status' => UnauthorizedStatusEnum::Incorrect]);
        $this->storeCreatedAt($correct, '2020-01-01 00:00:00');
        $this->storeCreatedAt($incorrect, '2021-01-01 00:00:00');
        $this->clear();

        $this->assertTrue($this->userSignRepository->findLastByUserId(self::id($user))->id->equals($incorrect->id));
    }

    final public function testFindLastByUserIdReturnsSingleSign(): void
    {
        $user = $this->user();
        $sign = $this->sign($user);
        $this->clear();

        $this->assertTrue($this->userSignRepository->findLastByUserId(self::id($user))->id->equals($sign->id));
    }

    final public function testFindLastByUserIdReturnsNullWhenUserHasNoSigns(): void
    {
        $this->sign($this->user());
        $user = $this->user();

        $this->assertNull($this->userSignRepository->findLastByUserId(self::id($user)));
        $this->assertNull($this->userSignRepository->findLastByUserId(Uuid::v7()));
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function sign(User $user, array $overrides = []): UserSign
    {
        return UserSignFactory::make(['user' => $user] + $overrides, $this->em);
    }
}
