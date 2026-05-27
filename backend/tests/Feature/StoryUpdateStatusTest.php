<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{ElementStatusEnum, RoleEnum};
use Tests\Factory\StoryFactory;

class StoryUpdateStatusTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('stories');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testForbiddenForOtherParticipant(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $story = StoryFactory::make(['user' => $owner, 'status' => ElementStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/stories/{$story->id->toString()}/status", ['status' => 2], $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccessAsAdmin(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $admin = self::createUser(RoleEnum::Administrator);

        $story = StoryFactory::make(['user' => $owner, 'status' => ElementStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/stories/{$story->id->toString()}/status", ['status' => 2], $admin);
        $this->assertEquals(200, $result['status']);
    }

    final public function testSuccessAsOwner(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $story = StoryFactory::make(['user' => $user, 'status' => ElementStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/stories/{$story->id->toString()}/status", ['status' => 2], $user);
        $this->assertEquals(200, $result['status']);
    }
}
