<?php

namespace App\EventSubscriber;

use App\Entity\Feed;
use App\Entity\GoalParticipantResult;
use App\Enum\ElementStatusEnum;
use App\Enum\SaveStatusEnum;
use App\Event\EventProcessedEvent;
use App\Event\TrainingProcessedEvent;
use App\Repository\FeedRepository;
use App\Repository\GoalParticipantRepository;
use App\Repository\GoalParticipantResultRepository;
use App\Repository\GoalRepository;
use DateTimeImmutable;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

readonly class GoalProgressSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private GoalRepository $goalRepository,
        private GoalParticipantRepository $goalParticipantRepository,
        private GoalParticipantResultRepository $goalParticipantResultRepository,
        private FeedRepository $feedRepository,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            TrainingProcessedEvent::class => 'onTrainingProcessed',
            EventProcessedEvent::class => 'onEventProcessed',
        ];
    }

    final public function onTrainingProcessed(TrainingProcessedEvent $event): void
    {
        $user = $event->getUser();
        $result = $event->getResult();
        $userId = $user->id;
        $discipline = $result->trainingDiscipline->discipline;
        $distance = $result->distance;
        $time = $result->time;

        $goals = $this->goalRepository->findActiveByDiscipline($userId, $discipline, new DateTimeImmutable());

        foreach ($goals as $goal) {
            if ($goal->time && $goal->time < $time) {
                continue;
            }

            $goalParticipant = $this->goalParticipantRepository->findByUserId($goal->id, $userId);

            if (!$goalParticipant) {
                continue;
            }

            $feed = new Feed($user, null, null, ElementStatusEnum::Draft);
            $this->feedRepository->save($feed);

            $goalParticipantResult = new GoalParticipantResult(
                $goalParticipant,
                $feed,
                $distance,
                $time,
                SaveStatusEnum::Pending,
            );

            $this->goalParticipantResultRepository->save($goalParticipantResult);
        }
    }

    final public function onEventProcessed(EventProcessedEvent $event): void
    {
        $result = $event->getResult();
        $user = $result->eventDisciplineList->user;
        $userId = $user->id;
        $discipline = $result->eventDisciplineList->eventDisciplineDistance->eventDiscipline->discipline;
        $distance = $result->eventDisciplineList->eventDisciplineDistance->distance;
        $time = $result->time;

        $goals = $this->goalRepository->findActiveByDiscipline($userId, $discipline, new DateTimeImmutable());

        foreach ($goals as $goal) {
            if ($goal->time && $goal->time < $time) {
                continue;
            }

            $goalParticipant = $this->goalParticipantRepository->findByUserId($goal->id, $userId);

            if (!$goalParticipant) {
                continue;
            }

            $feed = new Feed($user, null, null, ElementStatusEnum::Draft);
            $this->feedRepository->save($feed);

            $goalParticipantResult = new GoalParticipantResult(
                $goalParticipant,
                $feed,
                $distance,
                $time,
                SaveStatusEnum::Pending,
            );

            $this->goalParticipantResultRepository->save($goalParticipantResult);
        }
    }
}

