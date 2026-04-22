<?php

namespace App\Repository;

use App\Entity\GoalParticipantResult;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class GoalParticipantResultRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, GoalParticipantResult::class);
    }

    final public function save(GoalParticipantResult $goalParticipantResult): void
    {
        $em = $this->getEntityManager();
        $em->persist($goalParticipantResult);
        $em->flush();
    }

    final public function findById(Uuid $goalParticipantResultId): GoalParticipantResult
    {
        /** @var ?GoalParticipantResult $goalParticipantResult */
        $goalParticipantResult = $this->findOrFail($goalParticipantResultId);

        return $goalParticipantResult;
    }
}
