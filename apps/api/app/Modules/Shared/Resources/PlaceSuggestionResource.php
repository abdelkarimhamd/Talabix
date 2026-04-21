<?php

namespace App\Modules\Shared\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlaceSuggestionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource['id'],
            'title' => $this->resource['title'],
            'label' => $this->resource['label'],
            'line_1' => $this->resource['line_1'],
            'line_2' => $this->resource['line_2'],
            'building' => $this->resource['building'],
            'landmark' => $this->resource['landmark'],
            'city' => $this->resource['city'],
            'latitude' => (float) $this->resource['latitude'],
            'longitude' => (float) $this->resource['longitude'],
        ];
    }
}
