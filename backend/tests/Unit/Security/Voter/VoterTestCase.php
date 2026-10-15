<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\User;
use App\Enum\RoleEnum;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Authentication\Token\{NullToken, TokenInterface, UsernamePasswordToken};
use Symfony\Component\Security\Core\Authorization\Voter\VoterInterface;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{UserFactory, UserRoleFactory};

abstract class VoterTestCase extends TestCase
{
    final protected static function user(RoleEnum ...$roles): User
    {
        $user = UserFactory::make();
        $user->id = Uuid::v7();

        foreach ($roles as $role) {
            $user->roles->add(UserRoleFactory::make(['user' => $user, 'role' => $role]));
        }

        return $user;
    }

    final protected static function admin(): User
    {
        return self::user(RoleEnum::Administrator);
    }

    final protected static function idOf(object $entity): Uuid
    {
        return Uuid::fromString((string) $entity->id);
    }

    final protected static function reloaded(User $user): User
    {
        $copy = clone $user;
        $copy->id = self::idOf($user);

        return $copy;
    }

    final protected static function token(?User $user): TokenInterface
    {
        return $user ? new UsernamePasswordToken($user, 'api', $user->getRoles()) : new NullToken();
    }

    final protected function assertGranted(VoterInterface $voter, ?User $user, mixed $subject, string $attribute): void
    {
        $this->assertSame(VoterInterface::ACCESS_GRANTED, $voter->vote(self::token($user), $subject, [$attribute]));
    }

    final protected function assertDenied(VoterInterface $voter, ?User $user, mixed $subject, string $attribute): void
    {
        $this->assertSame(VoterInterface::ACCESS_DENIED, $voter->vote(self::token($user), $subject, [$attribute]));
    }

    final protected function assertAbstains(VoterInterface $voter, ?User $user, mixed $subject, string $attribute): void
    {
        $this->assertSame(VoterInterface::ACCESS_ABSTAIN, $voter->vote(self::token($user), $subject, [$attribute]));
    }
}
