<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{DisciplineEnum, ElementStatusEnum, RoleEnum};
use Tests\Factory\{TrainingDisciplineDistanceFactory, TrainingDisciplineFactory, TrainingFactory, UserFactory};

class StatisticProgressTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('event_discipline_results');
        $this->truncate('event_discipline_lists');
        $this->truncate('event_discipline_distances');
        $this->truncate('event_disciplines');
        $this->truncate('events');
        $this->truncate('page_participants');
        $this->truncate('pages');
        $this->truncate('training_discipline_distances');
        $this->truncate('training_disciplines');
        $this->truncate('trainings');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testUnauthorized(): void
    {
        $result = $this->get('/api/statistics/progress');
        $this->assertEquals(401, $result['status']);
    }

    final public function testValidationFailedMissingUserIds(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->get('/api/statistics/progress', $user);

        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('filter.userIds', $result['json']['errors']);
    }

    final public function testSuccessAndSorting(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $targetUser = UserFactory::make(em: $this->em);

        $training = TrainingFactory::make(['user' => $targetUser, 'status' => ElementStatusEnum::Active], $this->em);
        $tDisc = TrainingDisciplineFactory::make(
            ['training' => $training, 'discipline' => DisciplineEnum::Cycling],
            $this->em,
        );
        TrainingDisciplineDistanceFactory::make(
            ['trainingDiscipline' => $tDisc, 'distance' => 500, 'time' => 200],
            $this->em,
        );
        TrainingDisciplineDistanceFactory::make(
            ['trainingDiscipline' => $tDisc, 'distance' => 500, 'time' => 180],
            $this->em,
        );

        $result = $this->get(
            "/api/statistics/progress?filter[userIds][]={$targetUser->id->toString()}&filter[discipline]=" . DisciplineEnum::Cycling->value . "&filter[distance]=500&sort=time:desc",
            $user,
        );

        $this->assertEquals(200, $result['status']);

        $this->assertCount(2, $result['json']);

        $this->assertEquals(200, $result['json'][0]['time']);
        $this->assertEquals(180, $result['json'][1]['time']);
    }

    final public function testPagination(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $targetUser = UserFactory::make(em: $this->em);

        $training = TrainingFactory::make(['user' => $targetUser], $this->em);
        $tDisc = TrainingDisciplineFactory::make(
            ['training' => $training, 'discipline' => DisciplineEnum::Running],
            $this->em,
        );

        for ($i = 0; $i < 15; $i++) {
            TrainingDisciplineDistanceFactory::make(
                ['trainingDiscipline' => $tDisc, 'distance' => 100, 'time' => 50 + $i],
                $this->em,
            );
        }

        $result = $this->get(
            "/api/statistics/progress?filter[userIds][]={$targetUser->id->toString()}&page=2&limit=5",
            $user,
        );

        $this->assertEquals(200, $result['status']);
        $this->assertCount(5, $result['json']);
    }
}
