<?php

declare(strict_types=1);

namespace Tests\Factory;

use Generator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class FactorySmokeTest extends TestCase
{
    #[DataProvider('factoryProvider')]
    /**
     * @template T
     * @param class-string<T> $factoryClass
     */
    public function testFactoryMakeWorks(string $factoryClass): void
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
