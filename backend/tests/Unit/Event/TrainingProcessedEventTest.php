<?php

declare(strict_types=1);

namespace Tests\Unit\Event;

use App\Event\TrainingProcessedEvent;
use PHPUnit\Framework\TestCase;
use Symfony\Contracts\EventDispatcher\Event;
use Tests\Factory\{TrainingDisciplineDistanceFactory, UserFactory};

class TrainingProcessedEventTest extends TestCase
{
    final public function testExposesUserAndResult(): void
    {
        $user = UserFactory::make();
        $result = TrainingDisciplineDistanceFactory::make();

        $event = new TrainingProcessedEvent($user, $result);

        $this->assertInstanceOf(Event::class, $event);
        $this->assertSame($user, $event->getUser());
        $this->assertSame($result, $event->getResult());
    }
}
