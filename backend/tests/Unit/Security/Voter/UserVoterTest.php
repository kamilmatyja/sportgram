<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Enum\RoleEnum;
use App\Security\Voter\UserVoter;
use PHPUnit\Framework\Attributes\DataProvider;
use stdClass;
use Symfony\Component\Uid\Uuid;

class UserVoterTest extends VoterTestCase
{
    private UserVoter $voter;

    protected function setUp(): void
    {
        $this->voter = new UserVoter();
    }

    #[DataProvider('roleProvider')]
    final public function testGrantsUserActingOnThemselves(RoleEnum $role): void
    {
        $user = self::user($role);

        $this->assertGranted($this->voter, $user, self::idOf($user), UserVoter::USER);
    }

    public static function roleProvider(): iterable
    {
        yield 'participant' => [RoleEnum::Participant];
        yield 'organizer' => [RoleEnum::Organizer];
        yield 'administrator' => [RoleEnum::Administrator];
    }

    final public function testDeniesOtherUser(): void
    {
        $other = self::user(RoleEnum::Participant);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($other), UserVoter::USER);
    }

    final public function testDeniesAdministratorActingOnOtherUser(): void
    {
        $other = self::user(RoleEnum::Participant);

        $this->assertDenied($this->voter, self::admin(), self::idOf($other), UserVoter::USER);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, UserVoter::USER);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
        yield 'object' => [new stdClass()];
    }

    final public function testDeniesOwnIdPassedAsString(): void
    {
        $user = self::user(RoleEnum::Participant);

        $this->assertDenied($this->voter, $user, (string) $user->id, UserVoter::USER);
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->assertDenied($this->voter, null, Uuid::v7(), UserVoter::USER);
    }

    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $user = self::user(RoleEnum::Participant);

        $this->assertAbstains($this->voter, $user, self::idOf($user), 'OTHER');
        $this->assertAbstains($this->voter, $user, null, UserVoter::USER);
    }
}
