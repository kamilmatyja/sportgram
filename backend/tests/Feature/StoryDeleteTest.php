<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Tests\Factory\StoryFactory;

class StoryDeleteTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('stories');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testForbiddenForOtherUser(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $story = StoryFactory::make(['user' => $owner], $this->em);

        $result = $this->delete("/api/stories/{$story->id->toString()}", $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $story = StoryFactory::make(['user' => $user], $this->em);

        $result = $this->delete("/api/stories/{$story->id->toString()}", $user);
        $this->assertEquals(200, $result['status']);
    }
}
