<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\UserRole;
use App\Enum\RoleEnum;
use App\Repository\UserRoleRepository;
use Tests\Factory\{UserFactory, UserRoleFactory};

class UserRoleRepositoryTest extends RepositoryTestCase
{
    private UserRoleRepository $userRoleRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('user_roles', 'users');
        $this->userRoleRepository = $this->repository(UserRoleRepository::class);
    }

    final public function testSavePersistsUserRole(): void
    {
        $user = UserFactory::make(em: $this->em);
        $role = UserRoleFactory::make(['user' => $user, 'role' => RoleEnum::Organizer]);

        $this->userRoleRepository->save($role);
        $this->clear();

        $found = $this->userRoleRepository->find(self::id($role));
        $this->assertInstanceOf(UserRole::class, $found);
        $this->assertSame(RoleEnum::Organizer, $found->role);
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertNotNull($found->createdAt);
    }

    final public function testSaveUpdatesExistingUserRole(): void
    {
        $role = $this->role(RoleEnum::Participant);

        $role->role = RoleEnum::Administrator;
        $this->userRoleRepository->save($role);
        $this->clear();

        $this->assertSame(RoleEnum::Administrator, $this->userRoleRepository->find(self::id($role))->role);
    }

    final public function testDeleteRemovesUserRole(): void
    {
        $role = $this->role();
        $other = $this->role();
        $id = self::id($role);

        $this->userRoleRepository->delete($role);
        $this->clear();

        $this->assertNull($this->userRoleRepository->find($id));
        $this->assertNotNull($this->userRoleRepository->find(self::id($other)));
    }

    private function role(?RoleEnum $role = null): UserRole
    {
        return UserRoleFactory::make(array_filter(['role' => $role]), $this->em);
    }
}
