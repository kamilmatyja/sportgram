<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{UnauthorizedStatusEnum, UserStatusEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{UserFactory, UserSignFactory};

class UserSignRefreshTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('user_signs');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('user_disciplines');
        $this->truncate('users');
    }

    final public function testNotExistElement(): void
    {
        $userSignId = Uuid::v4()->toString();

        $result = $this->post("/api/signs/{$userSignId}/refresh", []);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Element not found.', $result['json']['error']);
    }

    final public function testBannedUser(): void
    {
        $user = UserFactory::make([
            'email' => 'bannedrefresh@example.com',
            'status' => UserStatusEnum::Banned,
        ]);
        $this->save($user);

        $sign = UserSignFactory::make([
            'user' => $user,
            'code' => 123456,
            'attempt' => 0,
            'status' => UnauthorizedStatusEnum::Correct,
        ]);
        $this->save($sign);

        $result = $this->post("/api/signs/{$sign->id}/refresh", []);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('User is banned.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = UserFactory::make(['email' => 'refreshsign@example.com', 'status' => UserStatusEnum::Accepted]);
        $this->save($user);

        $sign = UserSignFactory::make([
            'user' => $user,
            'code' => 123456,
            'attempt' => 0,
            'status' => UnauthorizedStatusEnum::Correct,
        ]);
        $this->save($sign);

        $result = $this->post("/api/signs/{$sign->id}/refresh", []);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('token', $result['json']);
    }
}
