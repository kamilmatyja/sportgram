<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Entity\ConversationActivity;
use App\Resource\ConversationActivityResource;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Factory\{ConversationActivityFactory, UserFactory};

class ConversationActivityResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $activity = $this->activity();

        $data = ConversationActivityResource::fromEntity($activity);

        $this->assertSame([
            'id' => $activity->id,
            'senderUserId' => $activity->senderUser->id,
            'receiverUserId' => $activity->receiverUser->id,
            'createdAt' => self::formatDate($activity->createdAt),
            'updatedAt' => self::formatDate($activity->updatedAt),
            'isWriting' => true,
        ], $data);
        $this->assertMatchesSchema(ConversationActivityResource::class, $data);
    }

    #[DataProvider('isWritingProvider')]
    final public function testIsWritingDependsOnLastUpdate(string $updatedAt, bool $isWriting): void
    {
        $activity = $this->activity();
        $activity->updatedAt = new DateTimeImmutable($updatedAt);

        $this->assertSame($isWriting, ConversationActivityResource::fromEntity($activity)['isWriting']);
    }

    public static function isWritingProvider(): iterable
    {
        yield 'just updated' => ['now', true];
        yield 'updated 3 seconds ago' => ['-3 seconds', true];
        yield 'updated 10 seconds ago' => ['-10 seconds', false];
        yield 'updated an hour ago' => ['-1 hour', false];
    }

    final public function testMapsCollectionInOrder(): void
    {
        $activities = [$this->activity(), $this->activity()];

        $data = ConversationActivityResource::fromEntityCollection($activities);

        $this->assertSame([
            ConversationActivityResource::fromEntity($activities[0]),
            ConversationActivityResource::fromEntity($activities[1]),
        ], $data);
        $this->assertSame([], ConversationActivityResource::fromEntityCollection([]));
    }

    private function activity(): ConversationActivity
    {
        return self::persisted(ConversationActivityFactory::make([
            'senderUser' => self::persisted(UserFactory::make()),
            'receiverUser' => self::persisted(UserFactory::make()),
        ]));
    }
}
