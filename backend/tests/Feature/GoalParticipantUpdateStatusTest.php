<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{RoleEnum, SaveStatusEnum};
use Tests\Factory\{GoalFactory, GoalParticipantFactory};

class GoalParticipantUpdateStatusTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('goal_participants');
        $this->truncate('goals');
        $this->truncate('feeds');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testForbiddenForOtherUser(): void
    {
        $goalOwner = self::createUser(RoleEnum::Participant);
        $participantUser = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $goal = GoalFactory::make(['user' => $goalOwner], $this->em);
        $participant = GoalParticipantFactory::make(
            ['goal' => $goal, 'user' => $participantUser, 'status' => SaveStatusEnum::Pending],
            $this->em,
        );

        $result = $this->patch(
            "/api/goal-participants/{$participant->id->toString()}/status",
            ['status' => 2],
            $otherUser,
        );
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccessAsParticipant(): void
    {
        $goalOwner = self::createUser(RoleEnum::Participant);
        $participantUser = self::createUser(RoleEnum::Participant);

        $goal = GoalFactory::make(['user' => $goalOwner], $this->em);
        $participant = GoalParticipantFactory::make(
            ['goal' => $goal, 'user' => $participantUser, 'status' => SaveStatusEnum::Pending],
            $this->em,
        );

        $result = $this->patch(
            "/api/goal-participants/{$participant->id->toString()}/status",
            ['status' => 2],
            $participantUser,
        );
        $this->assertEquals(200, $result['status']);
    }
}
