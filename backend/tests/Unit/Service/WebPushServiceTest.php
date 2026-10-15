<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Service\WebPushService;
use ErrorException;
use Generator;
use Minishlink\WebPush\{MessageSentReport, Subscription, VAPID, WebPush};
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use ReflectionProperty;

#[AllowMockObjectsWithoutExpectations]
class WebPushServiceTest extends ServiceTestCase
{
    private const string ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc';

    private const string P256DH = 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4';

    private const string AUTH = 'BTBZMqHH6r4Tts7J_aSIgg';

    private WebPush&MockObject $webPush;

    private WebPushService $service;

    protected function setUp(): void
    {
        $keys = VAPID::createVapidKeys();
        $this->service = new WebPushService('mailto:admin@sportgram.test', $keys['publicKey'], $keys['privateKey']);
        $this->webPush = $this->createMock(WebPush::class);
        new ReflectionProperty(WebPushService::class, 'webPush')->setValue($this->service, $this->webPush);
    }

    final public function testConstructorConfiguresVapid(): void
    {
        $keys = VAPID::createVapidKeys();

        $service = new WebPushService('mailto:admin@sportgram.test', $keys['publicKey'], $keys['privateKey']);

        $webPush = new ReflectionProperty(WebPushService::class, 'webPush')->getValue($service);
        $this->assertInstanceOf(WebPush::class, $webPush);
        $auth = new ReflectionProperty(WebPush::class, 'auth')->getValue($webPush);
        $this->assertSame('mailto:admin@sportgram.test', $auth['VAPID']['subject']);
        $this->assertSame(0, $webPush->countPendingNotifications());
    }

    final public function testConstructorRejectsInvalidVapidKeys(): void
    {
        $this->expectException(ErrorException::class);
        $this->expectExceptionMessage('[VAPID] Public key should be 65 bytes long when decoded.');

        new WebPushService('mailto:admin@sportgram.test', 'AAAA', 'AAAA');
    }

    final public function testSendNotificationQueuesSubscriptionAndFlushes(): void
    {
        $calls = [];
        $this->webPush->expects($this->once())
            ->method('queueNotification')
            ->with(
                $this->callback(static fn (Subscription $subscription): bool => self::ENDPOINT === $subscription->getEndpoint()
                    && self::P256DH === $subscription->getPublicKey()
                    && self::AUTH === $subscription->getAuthToken()
                    && 'aesgcm' === $subscription->getContentEncoding()),
                '{"title":"Hi"}',
            )
            ->willReturnCallback(static function () use (&$calls): void {
                $calls[] = 'queue';
            });
        $this->webPush->expects($this->once())
            ->method('flush')
            ->willReturnCallback(static function () use (&$calls): Generator {
                $calls[] = 'flush';

                return (static fn (): Generator => yield from [])();
            });

        $this->service->sendNotification(self::ENDPOINT, self::P256DH, self::AUTH, '{"title":"Hi"}');

        $this->assertSame(['queue', 'flush'], $calls);
    }

    #[DataProvider('reportsProvider')]
    final public function testSendNotificationConsumesFlushAndReportsSuccess(array $results, bool $expected): void
    {
        $iterated = 0;
        $this->webPush->method('flush')->willReturnCallback(function () use ($results, &$iterated): Generator {
            foreach ($results as $success) {
                $report = $this->createStub(MessageSentReport::class);
                $report->method('isSuccess')->willReturn($success);
                ++$iterated;

                yield $report;
            }
        });

        $this->assertSame($expected, $this->service->sendNotification(self::ENDPOINT, self::P256DH, self::AUTH, 'payload'));
        $this->assertSame(count($results), $iterated);
    }

    public static function reportsProvider(): iterable
    {
        yield 'delivered' => [[true], true];
        yield 'rejected, e.g. expired subscription' => [[false], false];
        yield 'one of several rejected' => [[true, false, true], false];
        yield 'nothing to send' => [[], true];
    }

    final public function testSendNotificationPropagatesQueueErrors(): void
    {
        $this->webPush->method('queueNotification')->willThrowException(new ErrorException('Payload too large'));
        $this->webPush->expects($this->never())->method('flush');

        $this->expectException(ErrorException::class);
        $this->expectExceptionMessage('Payload too large');

        $this->service->sendNotification(self::ENDPOINT, self::P256DH, self::AUTH, 'payload');
    }
}
