<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    private const SUPPORTED_LOCALES = ['en', 'ar'];

    public function handle(Request $request, Closure $next): Response
    {
        app()->setLocale($this->resolveLocale($request));

        return $next($request);
    }

    private function resolveLocale(Request $request): string
    {
        $explicit = $request->header('X-Talabix-Locale') ?: $request->header('X-Locale');

        if ($explicit) {
            return $this->normalize($explicit);
        }

        $accepted = $request->header('Accept-Language');

        if (! $accepted) {
            return config('app.fallback_locale', 'en');
        }

        foreach (explode(',', $accepted) as $localePart) {
            $locale = trim(explode(';', $localePart)[0] ?? '');

            if ($locale !== '') {
                $normalized = $this->normalize($locale);

                if (in_array($normalized, self::SUPPORTED_LOCALES, true)) {
                    return $normalized;
                }
            }
        }

        return config('app.fallback_locale', 'en');
    }

    private function normalize(string $locale): string
    {
        $baseLocale = strtolower(str_replace('_', '-', trim($locale)));
        $language = explode('-', $baseLocale)[0] ?? '';

        return in_array($language, self::SUPPORTED_LOCALES, true)
            ? $language
            : config('app.fallback_locale', 'en');
    }
}
