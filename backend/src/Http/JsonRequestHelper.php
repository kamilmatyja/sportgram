<?php

namespace App\Http;

use InvalidArgumentException;
use Symfony\Component\HttpFoundation\Request;

class JsonRequestHelper
{
    public static function getJsonData(Request $request): array
    {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            throw new InvalidArgumentException('Invalid JSON');
        }

        return $data;
    }
}

