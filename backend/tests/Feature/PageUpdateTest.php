<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{RoleEnum};
use Tests\Factory\{EventFactory, PageFactory, PageParticipantFactory};

class PageUpdateTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('page_follows');
        $this->truncate('events');
        $this->truncate('page_participants');
        $this->truncate('pages');
        $this->truncate('friends');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testForbiddenForOtherUser(): void
    {
        $pageOwner = self::createUser(RoleEnum::Organizer);
        $otherUser = self::createUser(RoleEnum::Organizer);

        $page = PageFactory::make(['user' => $pageOwner], $this->em);

        $payload = [
            'title' => 'Updated Page',
            'description' => 'Description',
            'link' => 'updated-page',
            'profilePhoto' => base64_encode('photo'),
            'backgroundPhoto' => base64_encode('bg'),
            'color' => 1,
        ];

        $result = $this->put("/api/pages/{$page->id->toString()}", $payload, $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testCannotRemoveParticipantWithEvents(): void
    {
        $owner = self::createUser(RoleEnum::Organizer);
        $participantUser = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $owner], $this->em);

        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $participantUser], $this->em);
        EventFactory::make(['pageParticipant' => $participant], $this->em);

        $payload = [
            'title' => 'Updated Page',
            'description' => 'Description',
            'link' => 'updated-page',
            'profilePhoto' => base64_encode('photo'),
            'backgroundPhoto' => base64_encode('bg'),
            'color' => 1,
            'participants' => [$owner->id->toString()],
        ];

        $result = $this->put("/api/pages/{$page->id->toString()}", $payload, $owner);

        $this->assertEquals(409, $result['status']);
        $this->assertEquals('Cannot delete page participant with events.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Organizer);
        $page = PageFactory::make(['user' => $user], $this->em);

        $payload = [
            'title' => 'Updated Page',
            'description' => 'Description',
            'link' => 'updated-page',
            'profilePhoto' => base64_encode('photo'),
            'backgroundPhoto' => base64_encode('bg'),
            'color' => 2,
            'participants' => [$user->id->toString()],
        ];

        $result = $this->put("/api/pages/{$page->id->toString()}", $payload, $user);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
