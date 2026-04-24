<?php

namespace App\Repository;

use App\Entity\TrainingParticipant;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class TrainingParticipantRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TrainingParticipant::class);
    }

    final public function save(TrainingParticipant $trainingParticipant): void
    {
        $em = $this->getEntityManager();
        $em->persist($trainingParticipant);
        $em->flush();
    }

    final public function delete(TrainingParticipant $trainingParticipant): void
    {
        $em = $this->getEntityManager();
        $em->remove($trainingParticipant);
        $em->flush();
    }

    final public function findById(Uuid $trainingParticipantId): TrainingParticipant
    {
        /** @var ?TrainingParticipant $trainingParticipant */
        $trainingParticipant = $this->findOrFail($trainingParticipantId);

        return $trainingParticipant;
    }
}
