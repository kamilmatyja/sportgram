<?php

namespace App\Service;

use ErrorException;
use Minishlink\WebPush\{Subscription, WebPush};
use Random\RandomException;

class WebPushService
{
    private WebPush $webPush;

    /**
     * @throws ErrorException
     */
    public function __construct(string $vapidSubject, string $vapidPublicKey, string $vapidPrivateKey)
    {
        $this->webPush = new WebPush([
            'VAPID' => [
                'subject' => $vapidSubject,
                'publicKey' => $vapidPublicKey,
                'privateKey' => $vapidPrivateKey,
            ],
        ]);
    }

    /**
     * @throws RandomException
     * @throws ErrorException
     */
    final public function sendNotification(string $endpoint, string $p256dh, string $auth, string $payload): void
    {
        $subscription = Subscription::create([
            'endpoint' => $endpoint,
            'publicKey' => $p256dh,
            'authToken' => $auth,
        ]);
        $this->webPush->queueNotification($subscription, $payload);
        $this->webPush->flush();
    }
}
