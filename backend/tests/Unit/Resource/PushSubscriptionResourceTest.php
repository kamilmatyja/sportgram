<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Entity\PushSubscription;
use App\Resource\PushSubscriptionResource;
use Tests\Factory\{PushSubscriptionFactory, UserFactory};

class PushSubscriptionResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $subscription = $this->subscription();

        $data = PushSubscriptionResource::fromEntity($subscription);

        $this->assertSame([
            'id' => $subscription->id,
            'userId' => $subscription->user->id,
            'createdAt' => self::formatDate($subscription->createdAt),
            'updatedAt' => self::formatDate($subscription->updatedAt),
            'endpoint' => $subscription->endpoint,
            'p256dh' => $subscription->p256dh,
            'auth' => $subscription->auth,
            'userAgent' => $subscription->userAgent,
            'status' => $subscription->status,
        ], $data);
        $this->assertMatchesSchema(PushSubscriptionResource::class, $data);
    }

    final public function testMapsMissingUserAgentToNull(): void
    {
        $data = PushSubscriptionResource::fromEntity($this->subscription(['userAgent' => null]));

        $this->assertArrayHasKey('userAgent', $data);
        $this->assertNull($data['userAgent']);
        $this->assertMatchesSchema(PushSubscriptionResource::class, $data);
    }

    final public function testMapsCollectionInOrder(): void
    {
        $subscriptions = [$this->subscription(), $this->subscription()];

        $data = PushSubscriptionResource::fromEntityCollection($subscriptions);

        $this->assertSame(
            [
                PushSubscriptionResource::fromEntity($subscriptions[0]),
                PushSubscriptionResource::fromEntity($subscriptions[1]),
            ],
            $data,
        );
        $this->assertSame([], PushSubscriptionResource::fromEntityCollection([]));
    }

    private function subscription(array $overrides = []): PushSubscription
    {
        return self::persisted(PushSubscriptionFactory::make(['user' => self::persisted(UserFactory::make())] + $overrides));
    }
}
