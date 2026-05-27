<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{FriendStatusEnum, RoleEnum};
use Tests\Factory\{FriendFactory, UserFactory};

class FriendIndexTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('friends');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testUnauthorized(): void
    {
        $result = $this->get('/api/friends');
        $this->assertEquals(401, $result['status']);
    }

    final public function testValidationFailedMissingUserIds(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->get('/api/friends', $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('filter.userIds', $result['json']['errors']);
    }

    final public function testFiltersAndSorting(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $targetUser = UserFactory::make(em: $this->em);

        FriendFactory::make(
            ['senderUser' => $user, 'receiverUser' => $targetUser, 'status' => FriendStatusEnum::Pending],
            $this->em,
        );
        FriendFactory::make(
            ['senderUser' => $targetUser, 'receiverUser' => $user, 'status' => FriendStatusEnum::Accepted],
            $this->em,
        );

        $resultAll = $this->get("/api/friends?filter[userIds][]={$targetUser->id->toString()}", $user);
        $this->assertEquals(200, $resultAll['status']);
        $this->assertCount(2, $resultAll['json']);

        $resultStatus = $this->get(
            "/api/friends?filter[userIds][]={$targetUser->id->toString()}&filter[status]=" . FriendStatusEnum::Accepted->value,
            $user,
        );
        $this->assertEquals(200, $resultStatus['status']);
        $this->assertCount(1, $resultStatus['json']);
        $this->assertEquals(FriendStatusEnum::Accepted->value, $resultStatus['json'][0]['status']);
    }

    final public function testPagination(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $targetUser = UserFactory::make(em: $this->em);

        for ($i = 0; $i < 15; $i++) {
            FriendFactory::make(
                ['senderUser' => $user, 'receiverUser' => $targetUser, 'status' => FriendStatusEnum::Accepted],
                $this->em,
            );
        }

        $result = $this->get("/api/friends?filter[userIds][]={$targetUser->id->toString()}&page=2&limit=5", $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(5, $result['json']);
    }
}
