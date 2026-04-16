<?php

declare(strict_types=1);

namespace Tests\Feature;

use Doctrine\DBAL\{Connection, Exception};
use Doctrine\DBAL\Platforms\AbstractPlatform;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

abstract class ApiTestCase extends WebTestCase
{
    private KernelBrowser $client;
    private Connection $connection;
    private AbstractPlatform $platform;

    /**
     * @throws Exception
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->client = static::createClient();
        $container = static::getContainer();
        $em = $container->get('doctrine')->getManager();
        $this->connection = $em->getConnection();
        $this->platform = $this->connection->getDatabasePlatform();
    }

    protected function post(string $uri, array $data): array
    {
        $this->client->request('POST', $uri, [], [], ['CONTENT_TYPE' => 'application/json'], json_encode($data));

        return [
            'status' => $this->client->getResponse()->getStatusCode(),
            'json' => json_decode($this->client->getResponse()->getContent(), true),
        ];
    }

    /**
     * @throws Exception
     */
    protected function truncate(string $name): void
    {
        $this->connection->executeStatement($this->platform->getTruncateTableSQL($name, true));
    }
}
