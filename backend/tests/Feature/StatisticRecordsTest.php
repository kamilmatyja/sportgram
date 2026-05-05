<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{DisciplineEnum, ElementStatusEnum, RoleEnum, SaveStatusEnum};
use Tests\Factory\{EventDisciplineDistanceFactory,
    EventDisciplineFactory,
    EventDisciplineListFactory,
    EventDisciplineResultFactory,
    EventFactory,
    PageFactory,
    PageParticipantFactory,
    TrainingDisciplineDistanceFactory,
    TrainingDisciplineFactory,
    TrainingFactory,
    UserFactory};

class StatisticRecordsTest extends ApiTestCase
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
        $result = $this->get('/api/statistics/records');
        $this->assertEquals(401, $result['status']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testValidationFailedMissingUserIds(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        // Parametr `userIds` w DTO dla StatisticFilterDto jest wymagany i nie może być pusty
        $result = $this->get('/api/statistics/records', $user);

        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('filter.userIds', $result['json']['errors']);
    }

    final public function testSuccessAndSorting(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $targetUser = UserFactory::make(em: $this->em);

        // Dodajemy trening: Dyscyplina 1, Dystans 100, Czas 50
        $training = TrainingFactory::make(['user' => $targetUser, 'status' => ElementStatusEnum::Active], $this->em);
        $tDisc = TrainingDisciplineFactory::make(
            ['training' => $training, 'discipline' => DisciplineEnum::Running],
            $this->em,
        );
        TrainingDisciplineDistanceFactory::make(
            ['trainingDiscipline' => $tDisc, 'distance' => 100, 'time' => 50],
            $this->em,
        );

        // Dodajemy event_result: Dyscyplina 1, Dystans 100, Czas 40 (lepszy czas)
        $page = PageFactory::make(['user' => $user], $this->em);
        $pageParticipant = PageParticipantFactory::make(['page' => $page, 'user' => $targetUser], $this->em);
        $event = EventFactory::make(['pageParticipant' => $pageParticipant], $this->em);
        $eDisc = EventDisciplineFactory::make(['event' => $event, 'discipline' => DisciplineEnum::Running], $this->em);
        $eDist = EventDisciplineDistanceFactory::make(['eventDiscipline' => $eDisc, 'distance' => 100], $this->em);
        $list = EventDisciplineListFactory::make(
            ['eventDisciplineDistance' => $eDist, 'user' => $targetUser, 'status' => SaveStatusEnum::Accepted],
            $this->em,
        );
        EventDisciplineResultFactory::make(
            ['eventDisciplineList' => $list, 'user' => $targetUser, 'time' => 40],
            $this->em,
        );

        // Zapytanie o rekordy targetUser z filtrowaniem
        $result = $this->get(
            "/api/statistics/records?filter[userIds][]={$targetUser->id->toString()}&filter[discipline]=" . DisciplineEnum::Running->value . '&sort=time:asc',
            $user,
        );

        $this->assertEquals(200, $result['status']);

        // Zgodnie z zapytaniem SQL dla 'records', otrzymujemy najlepszy czas (DISTINCT ON user, discipline, distance - sortowanie od najmniejszego czasu załatwiamy domyślnie lub w sort: time:asc)
        $this->assertIsArray($result['json']);
        $this->assertGreaterThanOrEqual(1, count($result['json']));

        // Czas powinien być najlepszy z tych dwóch, czyli 40
        $this->assertEquals(40, $result['json'][0]['time']);
        $this->assertEquals(100, $result['json'][0]['distance']);
        $this->assertEquals(DisciplineEnum::Running->value, $result['json'][0]['discipline']);
    }

    final public function testPagination(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $targetUser = UserFactory::make(em: $this->em);

        // Tworzymy kilkanaście osobnych wpisów dla paginacji (różne dystanse, by DISTINCT ON się nie nałożyło na jeden wiersz)
        for ($i = 1; $i <= 15; $i++) {
            $training = TrainingFactory::make(['user' => $targetUser], $this->em);
            $tDisc = TrainingDisciplineFactory::make(
                ['training' => $training, 'discipline' => DisciplineEnum::Running],
                $this->em,
            );
            TrainingDisciplineDistanceFactory::make(
                ['trainingDiscipline' => $tDisc, 'distance' => $i * 100, 'time' => 50],
                $this->em,
            );
        }

        $result = $this->get(
            "/api/statistics/records?filter[userIds][]={$targetUser->id->toString()}&page=2&limit=5",
            $user,
        );

        $this->assertEquals(200, $result['status']);
        $this->assertCount(5, $result['json']);
    }
}
