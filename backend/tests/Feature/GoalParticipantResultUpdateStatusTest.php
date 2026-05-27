<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{RoleEnum, SaveStatusEnum};
use Tests\Factory\{GoalFactory, GoalParticipantFactory, GoalParticipantResultFactory};

class GoalParticipantResultUpdateStatusTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('goal_participant_results');
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
        $participant = GoalParticipantFactory::make(['goal' => $goal, 'user' => $participantUser], $this->em);
        $resultEntity = GoalParticipantResultFactory::make(
            ['goalParticipant' => $participant, 'status' => SaveStatusEnum::Pending],
            $this->em,
        );

        $result = $this->patch(
            "/api/goal-participant-results/{$resultEntity->id->toString()}/status",
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
        $participant = GoalParticipantFactory::make(['goal' => $goal, 'user' => $participantUser], $this->em);
        $resultEntity = GoalParticipantResultFactory::make(
            ['goalParticipant' => $participant, 'status' => SaveStatusEnum::Pending],
            $this->em,
        );

        $result = $this->patch(
            "/api/goal-participant-results/{$resultEntity->id->toString()}/status",
            ['status' => 2],
            $participantUser,
        );
        $this->assertEquals(200, $result['status']);
    }
}
