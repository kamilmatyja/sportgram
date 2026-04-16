<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{User, UserPasswordReset};
use App\Enum\UnauthorizedStatusEnum;
use PHPUnit\Framework\TestCase;

class UserPasswordResetTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $user = $this->createMock(User::class);
        $code = 123456;
        $attempt = 2;
        $status = UnauthorizedStatusEnum::Sent;
        $entity = new UserPasswordReset($user, $code, $attempt, $status);
        $this->assertInstanceOf(UserPasswordReset::class, $entity);
        $this->assertSame($user, $entity->user);
        $this->assertSame($code, $entity->code);
        $this->assertSame($attempt, $entity->attempt);
        $this->assertSame($status, $entity->status);
    }
}
