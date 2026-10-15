<?php

declare(strict_types=1);

namespace Tests\Unit\Event;

use App\Event\EventProcessedEvent;
use PHPUnit\Framework\TestCase;
use Symfony\Contracts\EventDispatcher\Event;
use Tests\Factory\EventDisciplineResultFactory;

class EventProcessedEventTest extends TestCase
{
    final public function testExposesResult(): void
    {
        $result = EventDisciplineResultFactory::make();

        $event = new EventProcessedEvent($result);

        $this->assertInstanceOf(Event::class, $event);
        $this->assertSame($result, $event->getResult());
        $this->assertFalse($event->isPropagationStopped());
    }
}
