<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Entity\Notification;
use App\Resource\NotificationResource;
use Tests\Factory\{NotificationFactory, UserFactory};

class NotificationResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $notification = $this->notification();

        $data = NotificationResource::fromEntity($notification);

        $this->assertSame([
            'id' => $notification->id,
            'userId' => $notification->user->id,
            'createdAt' => self::formatDate($notification->createdAt),
            'updatedAt' => self::formatDate($notification->updatedAt),
            'text' => $notification->text,
            'link' => $notification->link,
            'status' => $notification->status,
        ], $data);
        $this->assertMatchesSchema(NotificationResource::class, $data);
    }

    final public function testMapsMissingLinkToNull(): void
    {
        $data = NotificationResource::fromEntity($this->notification(['link' => null]));

        $this->assertArrayHasKey('link', $data);
        $this->assertNull($data['link']);
        $this->assertMatchesSchema(NotificationResource::class, $data);
    }

    final public function testMapsCollectionInOrder(): void
    {
        $notifications = [$this->notification(), $this->notification()];

        $data = NotificationResource::fromEntityCollection($notifications);

        $this->assertSame([
            NotificationResource::fromEntity($notifications[0]),
            NotificationResource::fromEntity($notifications[1]),
        ], $data);
        $this->assertSame([], NotificationResource::fromEntityCollection([]));
    }

    private function notification(array $overrides = []): Notification
    {
        return self::persisted(NotificationFactory::make([
            'user' => self::persisted(UserFactory::make()),
            ...$overrides,
        ]));
    }
}
