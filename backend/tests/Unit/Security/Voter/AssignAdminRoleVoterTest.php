<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Dto\UserUpdateDto;
use App\Enum\RoleEnum;
use App\Security\Voter\AssignAdminRoleVoter;
use PHPUnit\Framework\Attributes\DataProvider;
use stdClass;
use Symfony\Component\Uid\Uuid;

class AssignAdminRoleVoterTest extends VoterTestCase
{
    private AssignAdminRoleVoter $voter;

    protected function setUp(): void
    {
        $this->voter = new AssignAdminRoleVoter();
    }

    #[DataProvider('adminRolesProvider')]
    final public function testGrantsAdministratorAssigningAdministratorRole(array $roles): void
    {
        $this->assertGranted($this->voter, self::admin(), self::dto(...$roles), AssignAdminRoleVoter::ASSIGN_ADMIN_ROLE);
    }

    #[DataProvider('adminRolesProvider')]
    final public function testGrantsAdministratorWithAdditionalRolesAssigningAdministratorRole(array $roles): void
    {
        $user = self::user(RoleEnum::Participant, RoleEnum::Administrator);

        $this->assertGranted($this->voter, $user, self::dto(...$roles), AssignAdminRoleVoter::ASSIGN_ADMIN_ROLE);
    }

    #[DataProvider('adminRolesProvider')]
    final public function testDeniesNonAdministratorAssigningAdministratorRole(array $roles): void
    {
        $user = self::user(RoleEnum::Participant, RoleEnum::Organizer);

        $this->assertDenied($this->voter, $user, self::dto(...$roles), AssignAdminRoleVoter::ASSIGN_ADMIN_ROLE);
    }

    public static function adminRolesProvider(): iterable
    {
        yield 'administrator only' => [[RoleEnum::Administrator]];
        yield 'administrator among others' => [[RoleEnum::Participant, RoleEnum::Administrator]];
    }

    final public function testDeniesUserWithoutRolesAssigningAdministratorRole(): void
    {
        $this->assertDenied(
            $this->voter,
            self::user(),
            self::dto(RoleEnum::Administrator),
            AssignAdminRoleVoter::ASSIGN_ADMIN_ROLE,
        );
    }

    #[DataProvider('nonAdminRolesProvider')]
    final public function testGrantsAnyUserAssigningNonAdministratorRoles(array $roles): void
    {
        $user = self::user(RoleEnum::Participant);

        $this->assertGranted($this->voter, $user, self::dto(...$roles), AssignAdminRoleVoter::ASSIGN_ADMIN_ROLE);
    }

    public static function nonAdminRolesProvider(): iterable
    {
        yield 'participant' => [[RoleEnum::Participant]];
        yield 'organizer' => [[RoleEnum::Organizer]];
        yield 'participant and organizer' => [[RoleEnum::Participant, RoleEnum::Organizer]];
        yield 'no roles' => [[]];
    }

    final public function testGrantsAdministratorAssigningNonAdministratorRoles(): void
    {
        $this->assertGranted(
            $this->voter,
            self::admin(),
            self::dto(RoleEnum::Participant),
            AssignAdminRoleVoter::ASSIGN_ADMIN_ROLE,
        );
    }

    #[DataProvider('dtoProvider')]
    final public function testDeniesAnonymousUser(UserUpdateDto $dto): void
    {
        $this->assertDenied($this->voter, null, $dto, AssignAdminRoleVoter::ASSIGN_ADMIN_ROLE);
    }

    public static function dtoProvider(): iterable
    {
        yield 'administrator role' => [self::dto(RoleEnum::Administrator)];
        yield 'participant role' => [self::dto(RoleEnum::Participant)];
    }

    #[DataProvider('unsupportedSubjectProvider')]
    final public function testAbstainsOnSubjectOtherThanDto(mixed $subject): void
    {
        $this->assertAbstains($this->voter, self::admin(), $subject, AssignAdminRoleVoter::ASSIGN_ADMIN_ROLE);
    }

    public static function unsupportedSubjectProvider(): iterable
    {
        yield 'null' => [null];
        yield 'uuid' => [Uuid::v4()];
        yield 'array of roles' => [[RoleEnum::Administrator]];
        yield 'object' => [new stdClass()];
    }

    final public function testAbstainsOnOtherAttribute(): void
    {
        $this->assertAbstains($this->voter, self::admin(), self::dto(RoleEnum::Administrator), 'OTHER');
    }

    private static function dto(RoleEnum ...$roles): UserUpdateDto
    {
        $dto = new UserUpdateDto();

        foreach ($roles as $role) {
            $dto->addRole($role);
        }

        return $dto;
    }
}
