<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\{User, UserDiscipline};
use App\Enum\DisciplineEnum;
use App\Repository\UserDisciplineRepository;
use Tests\Factory\{UserDisciplineFactory, UserFactory};

class UserDisciplineRepositoryTest extends RepositoryTestCase
{
    private UserDisciplineRepository $userDisciplineRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('user_disciplines', 'users');
        $this->userDisciplineRepository = $this->repository(UserDisciplineRepository::class);
    }

    final public function testSavePersistsUserDiscipline(): void
    {
        $user = $this->user();
        $userDiscipline = UserDisciplineFactory::make([
            'user' => $user,
            'discipline' => DisciplineEnum::Running,
        ]);

        $this->userDisciplineRepository->save($userDiscipline);
        $this->clear();

        $found = $this->userDisciplineRepository->find(self::id($userDiscipline));
        $this->assertInstanceOf(UserDiscipline::class, $found);
        $this->assertSame(DisciplineEnum::Running, $found->discipline);
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingUserDiscipline(): void
    {
        $userDiscipline = $this->userDiscipline(DisciplineEnum::Running);

        $userDiscipline->discipline = DisciplineEnum::Swimming;
        $this->userDisciplineRepository->save($userDiscipline);
        $this->clear();

        $this->assertSame(DisciplineEnum::Swimming, $this->userDisciplineRepository->find(self::id($userDiscipline))->discipline);
        $this->assertSame(1, $this->userDisciplineRepository->count());
    }

    final public function testDeleteRemovesUserDiscipline(): void
    {
        $user = $this->user();
        $userDiscipline = $this->userDiscipline(DisciplineEnum::Running, $user);
        $other = $this->userDiscipline(DisciplineEnum::Cycling, $user);
        $id = self::id($userDiscipline);

        $this->userDisciplineRepository->delete($userDiscipline);
        $this->clear();

        $this->assertNull($this->userDisciplineRepository->find($id));
        $this->assertNotNull($this->userDisciplineRepository->find(self::id($other)));
    }

    final public function testRepositoryIsResolvableThroughEntityManager(): void
    {
        $this->assertInstanceOf(UserDisciplineRepository::class, $this->em->getRepository(UserDiscipline::class));
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function userDiscipline(DisciplineEnum $discipline, ?User $user = null): UserDiscipline
    {
        return UserDisciplineFactory::make(['user' => $user ?? $this->user(), 'discipline' => $discipline], $this->em);
    }
}
