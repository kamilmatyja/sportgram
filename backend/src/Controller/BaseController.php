<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class BaseController extends AbstractController
{
    #[Route('/api/doc', name: 'swagger_ui', methods: ['GET'])]
    final public function swagger(): Response
    {
        return $this->forward('nelmio_api_doc.controller.swagger_ui');
    }

    #[Route('/api/doc.json', name: 'swagger_json', methods: ['GET'])]
    final public function swaggerJson(): Response
    {
        return $this->forward('nelmio_api_doc.controller.swagger_json');
    }
}
