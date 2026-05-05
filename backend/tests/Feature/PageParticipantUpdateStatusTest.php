<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{RoleEnum, SaveStatusEnum};
use Tests\Factory\{PageFactory, PageParticipantFactory};

class PageParticipantUpdateStatusTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('page_participants');
        $this->truncate('pages');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testForbiddenForOtherUser(): void
    {
        $owner = self::createUser(RoleEnum::Organizer);
        $participantUser = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $owner], $this->em);
        $participant = PageParticipantFactory::make(
            ['page' => $page, 'user' => $participantUser, 'status' => SaveStatusEnum::Pending],
            $this->em,
        );

        $result = $this->patch(
            "/api/page-participants/{$participant->id->toString()}/status",
            ['status' => 2],
            $otherUser,
        );
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccessAsParticipant(): void
    {
        $owner = self::createUser(RoleEnum::Organizer);
        $participantUser = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $owner], $this->em);
        $participant = PageParticipantFactory::make(
            ['page' => $page, 'user' => $participantUser, 'status' => SaveStatusEnum::Pending],
            $this->em,
        );

        $result = $this->patch(
            "/api/page-participants/{$participant->id->toString()}/status",
            ['status' => 2],
            $participantUser,
        );
        $this->assertEquals(200, $result['status']);
    }
}
