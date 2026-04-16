<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{User, UserRegister};
use App\Enum\UnauthorizedStatusEnum;
use PHPUnit\Framework\TestCase;

class UserRegisterTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $user = $this->createMock(User::class);
        $code = 123456;
        $attempt = 1;
        $status = UnauthorizedStatusEnum::Sent;
        $entity = new UserRegister($user, $code, $attempt, $status);
        $this->assertInstanceOf(UserRegister::class, $entity);
        $this->assertSame($user, $entity->user);
        $this->assertSame($code, $entity->code);
        $this->assertSame($attempt, $entity->attempt);
        $this->assertSame($status, $entity->status);
    }
}
