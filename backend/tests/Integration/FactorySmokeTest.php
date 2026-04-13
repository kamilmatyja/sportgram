<?php

declare(strict_types=1);

namespace Tests\Integration;

use Generator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Tests\Factory\ConversationActivityFactory;
use Tests\Factory\ConversationFactory;
use Tests\Factory\EntryFactory;
use Tests\Factory\EventDisciplineDistanceFactory;
use Tests\Factory\EventDisciplineFactory;
use Tests\Factory\EventDisciplineListFactory;
use Tests\Factory\EventDisciplineResultFactory;
use Tests\Factory\EventDisciplineSubDistanceFactory;
use Tests\Factory\EventDisciplineSubResultFactory;
use Tests\Factory\EventFactory;
use Tests\Factory\FeedCommentFactory;
use Tests\Factory\FeedFactory;
use Tests\Factory\FeedReactionFactory;
use Tests\Factory\FriendFactory;
use Tests\Factory\GoalFactory;
use Tests\Factory\GoalParticipantFactory;
use Tests\Factory\GoalParticipantResultFactory;
use Tests\Factory\NotificationFactory;
use Tests\Factory\PageFactory;
use Tests\Factory\PageFollowFactory;
use Tests\Factory\PageParticipantFactory;
use Tests\Factory\PushSubscriptionFactory;
use Tests\Factory\StoryFactory;
use Tests\Factory\TrainingDisciplineDistanceFactory;
use Tests\Factory\TrainingDisciplineFactory;
use Tests\Factory\TrainingDisciplineSubDistanceFactory;
use Tests\Factory\TrainingFactory;
use Tests\Factory\TrainingParticipantFactory;
use Tests\Factory\UserDisciplineFactory;
use Tests\Factory\UserFactory;
use Tests\Factory\UserPasswordResetFactory;
use Tests\Factory\UserRegisterFactory;
use Tests\Factory\UserRoleFactory;
use Tests\Factory\UserSignFactory;

class FactorySmokeTest extends TestCase
{
    #[DataProvider('factoryProvider')]
    /**
     * @template T
     * @param class-string<T> $factoryClass
     */
    final public function testFactoryMakeWorks(string $factoryClass): void
    {
        $entity = $factoryClass::make();
        $this->assertIsObject($entity, "Factory $factoryClass did not return an object");
    }

    public static function factoryProvider(): Generator
    {
        yield [ConversationActivityFactory::class];
        yield [ConversationFactory::class];
        yield [EntryFactory::class];
        yield [EventDisciplineDistanceFactory::class];
        yield [EventDisciplineFactory::class];
        yield [EventDisciplineListFactory::class];
        yield [EventDisciplineResultFactory::class];
        yield [EventDisciplineSubDistanceFactory::class];
        yield [EventDisciplineSubResultFactory::class];
        yield [EventFactory::class];
        yield [FeedCommentFactory::class];
        yield [FeedFactory::class];
        yield [FeedReactionFactory::class];
        yield [FriendFactory::class];
        yield [GoalFactory::class];
        yield [GoalParticipantFactory::class];
        yield [GoalParticipantResultFactory::class];
        yield [NotificationFactory::class];
        yield [PageFactory::class];
        yield [PageFollowFactory::class];
        yield [PageParticipantFactory::class];
        yield [PushSubscriptionFactory::class];
        yield [StoryFactory::class];
        yield [TrainingDisciplineDistanceFactory::class];
        yield [TrainingDisciplineFactory::class];
        yield [TrainingDisciplineSubDistanceFactory::class];
        yield [TrainingFactory::class];
        yield [TrainingParticipantFactory::class];
        yield [UserDisciplineFactory::class];
        yield [UserFactory::class];
        yield [UserPasswordResetFactory::class];
        yield [UserRegisterFactory::class];
        yield [UserRoleFactory::class];
        yield [UserSignFactory::class];
    }
}

