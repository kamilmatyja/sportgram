<?php

namespace App\Repository;

use App\Entity\GoalParticipant;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class GoalParticipantRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, GoalParticipant::class);
    }

    final public function save(GoalParticipant $goalParticipant): void
    {
        $em = $this->getEntityManager();
        $em->persist($goalParticipant);
        $em->flush();
    }

    final public function delete(GoalParticipant $goalParticipant): void
    {
        $em = $this->getEntityManager();
        $em->remove($goalParticipant);
        $em->flush();
    }

    final public function findById(Uuid $goalParticipantId): GoalParticipant
    {
        /** @var ?GoalParticipant $goalParticipant */
        $goalParticipant = $this->findOrFail($goalParticipantId);

        return $goalParticipant;
    }
}
