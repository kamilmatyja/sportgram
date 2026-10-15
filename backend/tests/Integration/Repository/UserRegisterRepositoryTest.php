<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\{User, UserRegister};
use App\Enum\UnauthorizedStatusEnum;
use App\Repository\UserRegisterRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{UserFactory, UserRegisterFactory};

class UserRegisterRepositoryTest extends RepositoryTestCase
{
    private UserRegisterRepository $userRegisterRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('user_registers', 'users');
        $this->userRegisterRepository = $this->repository(UserRegisterRepository::class);
    }

    final public function testSavePersistsUserRegister(): void
    {
        $user = $this->user();
        $userRegister = UserRegisterFactory::make([
            'user' => $user,
            'code' => 123456,
            'attempt' => 0,
            'status' => UnauthorizedStatusEnum::NotSent,
        ]);

        $this->userRegisterRepository->save($userRegister);
        $this->clear();

        $found = $this->userRegisterRepository->findById(self::id($userRegister));
        $this->assertSame(123456, $found->code);
        $this->assertSame(0, $found->attempt);
        $this->assertSame(UnauthorizedStatusEnum::NotSent, $found->status);
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingUserRegister(): void
    {
        $userRegister = $this->userRegister($this->user());

        $userRegister->attempt = 3;
        $userRegister->status = UnauthorizedStatusEnum::Incorrect;
        $this->userRegisterRepository->save($userRegister);
        $this->clear();

        $found = $this->userRegisterRepository->findById(self::id($userRegister));
        $this->assertSame(3, $found->attempt);
        $this->assertSame(UnauthorizedStatusEnum::Incorrect, $found->status);
        $this->assertSame(1, $this->userRegisterRepository->count());
    }

    final public function testDeleteRemovesUserRegister(): void
    {
        $user = $this->user();
        $userRegister = $this->userRegister($user);
        $other = $this->userRegister($user);
        $id = self::id($userRegister);

        $this->userRegisterRepository->delete($userRegister);
        $this->clear();

        $this->assertNull($this->userRegisterRepository->find($id));
        $this->assertNotNull($this->userRegisterRepository->find(self::id($other)));
    }

    final public function testFindByIdReturnsUserRegister(): void
    {
        $userRegister = $this->userRegister($this->user());
        $this->userRegister($this->user());
        $this->clear();

        $this->assertSame((string) $userRegister->id, (string) $this->userRegisterRepository->findById(self::id($userRegister))->id);
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->userRegisterRepository->findById(Uuid::v7());
    }

    final public function testFindLastByUserIdReturnsNewestRegisterOfUser(): void
    {
        $user = $this->user();
        $other = $this->user();
        $this->userRegister($user, '2026-01-01 10:00:00');
        $newest = $this->userRegister($user, '2026-01-03 10:00:00');
        $this->userRegister($user, '2026-01-02 10:00:00');
        $this->userRegister($other, '2026-02-01 10:00:00');
        $this->clear();

        $found = $this->userRegisterRepository->findLastByUserId(self::id($user));

        $this->assertNotNull($found);
        $this->assertSame((string) $newest->id, (string) $found->id);
    }

    final public function testFindLastByUserIdDistinguishesOneSecond(): void
    {
        $user = $this->user();
        $newest = $this->userRegister($user, '2026-01-01 10:00:01');
        $this->userRegister($user, '2026-01-01 10:00:00');
        $this->clear();

        $this->assertSame((string) $newest->id, (string) $this->userRegisterRepository->findLastByUserId(self::id($user))?->id);
    }

    final public function testFindLastByUserIdReturnsNullWithoutRegisters(): void
    {
        $user = $this->user();
        $this->userRegister($this->user());
        $this->clear();

        $this->assertNull($this->userRegisterRepository->findLastByUserId(self::id($user)));
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function userRegister(User $user, ?string $createdAt = null): UserRegister
    {
        $userRegister = UserRegisterFactory::make(['user' => $user], $this->em);

        if ($createdAt !== null) {
            $this->em->getConnection()->executeStatement(
                'UPDATE user_registers SET created_at = :createdAt WHERE id = :id',
                ['createdAt' => $createdAt, 'id' => (string) $userRegister->id],
            );
        }

        return $userRegister;
    }
}
