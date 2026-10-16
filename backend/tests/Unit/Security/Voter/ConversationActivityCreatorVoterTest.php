<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Enum\RoleEnum;
use App\Security\Voter\ConversationActivityCreatorVoter;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class ConversationActivityCreatorVoterTest extends VoterTestCase
{
    private ConversationActivityCreatorVoter $voter;

    protected function setUp(): void
    {
        $this->voter = new ConversationActivityCreatorVoter();
    }

    final public function testGrantsUserForAnotherReceiver(): void
    {
        $receiver = self::user(RoleEnum::Participant);

        $this->assertGranted(
            $this->voter,
            self::user(RoleEnum::Participant),
            self::idOf($receiver),
            ConversationActivityCreatorVoter::CONVERSATION_ACTIVITY_CREATOR,
        );
    }

    final public function testDeniesUserTargetingThemselves(): void
    {
        $user = self::user(RoleEnum::Participant);

        $this->assertDenied(
            $this->voter,
            $user,
            self::idOf($user),
            ConversationActivityCreatorVoter::CONVERSATION_ACTIVITY_CREATOR,
        );
    }

    final public function testDeniesAdministratorTargetingThemselves(): void
    {
        $admin = self::admin();

        $this->assertDenied(
            $this->voter,
            $admin,
            self::idOf($admin),
            ConversationActivityCreatorVoter::CONVERSATION_ACTIVITY_CREATOR,
        );
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->assertDenied(
            $this->voter,
            self::user(RoleEnum::Participant),
            $subject,
            ConversationActivityCreatorVoter::CONVERSATION_ACTIVITY_CREATOR,
        );
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->assertDenied(
            $this->voter,
            null,
            Uuid::v4(),
            ConversationActivityCreatorVoter::CONVERSATION_ACTIVITY_CREATOR,
        );
    }

    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v4(), 'OTHER');
        $this->assertAbstains(
            $this->voter,
            self::admin(),
            null,
            ConversationActivityCreatorVoter::CONVERSATION_ACTIVITY_CREATOR,
        );
    }
}
