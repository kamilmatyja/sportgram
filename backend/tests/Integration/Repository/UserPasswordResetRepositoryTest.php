<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\{User, UserPasswordReset};
use App\Enum\UnauthorizedStatusEnum;
use App\Repository\UserPasswordResetRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{UserFactory, UserPasswordResetFactory};

class UserPasswordResetRepositoryTest extends RepositoryTestCase
{
    private UserPasswordResetRepository $userPasswordResetRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('user_password_resets', 'users');
        $this->userPasswordResetRepository = $this->repository(UserPasswordResetRepository::class);
    }

    final public function testSavePersistsUserPasswordReset(): void
    {
        $user = $this->user();
        $reset = UserPasswordResetFactory::make([
            'user' => $user,
            'code' => 123456,
            'attempt' => 2,
            'status' => UnauthorizedStatusEnum::Sent,
        ]);

        $this->userPasswordResetRepository->save($reset);
        $this->clear();

        $found = $this->userPasswordResetRepository->findById(self::id($reset));
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertSame(123456, $found->code);
        $this->assertSame(2, $found->attempt);
        $this->assertSame(UnauthorizedStatusEnum::Sent, $found->status);
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingUserPasswordReset(): void
    {
        $reset = $this->reset($this->user(), ['attempt' => 1, 'status' => UnauthorizedStatusEnum::Sent]);

        $reset->attempt = 2;
        $reset->status = UnauthorizedStatusEnum::Incorrect;
        $this->userPasswordResetRepository->save($reset);
        $this->clear();

        $found = $this->userPasswordResetRepository->findById(self::id($reset));
        $this->assertSame(2, $found->attempt);
        $this->assertSame(UnauthorizedStatusEnum::Incorrect, $found->status);
    }

    final public function testDeleteRemovesUserPasswordReset(): void
    {
        $reset = $this->reset($this->user());
        $id = self::id($reset);

        $this->userPasswordResetRepository->delete($reset);
        $this->clear();

        $this->assertNull($this->userPasswordResetRepository->find($id));
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->userPasswordResetRepository->findById(Uuid::v7());
    }

    final public function testFindLastByUserIdReturnsNewestResetOfUser(): void
    {
        $user = $this->user();
        $older = $this->reset($user);
        $newest = $this->reset($user);
        $middle = $this->reset($user);
        $other = $this->reset($this->user());
        $this->storeCreatedAt($older, '2026-01-01 00:00:00');
        $this->storeCreatedAt($newest, '2026-01-03 00:00:00');
        $this->storeCreatedAt($middle, '2026-01-02 00:00:00');
        $this->storeCreatedAt($other, '2026-01-04 00:00:00');
        $this->clear();

        $found = $this->userPasswordResetRepository->findLastByUserId(self::id($user));

        $this->assertNotNull($found);
        $this->assertSame((string) $newest->id, (string) $found->id);
    }

    final public function testFindLastByUserIdReturnsNullWithoutResets(): void
    {
        $this->reset($this->user());

        $this->assertNull($this->userPasswordResetRepository->findLastByUserId(self::id($this->user())));
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function reset(User $user, array $overrides = []): UserPasswordReset
    {
        return UserPasswordResetFactory::make(['user' => $user] + $overrides, $this->em);
    }
}
