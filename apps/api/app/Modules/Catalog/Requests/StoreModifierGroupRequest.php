<?php

namespace App\Modules\Catalog\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreModifierGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'selection_type' => ['required', 'in:single,multiple'],
            'min_selected' => ['nullable', 'integer', 'min:0'],
            'max_selected' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'options' => ['required', 'array', 'min:1'],
            'options.*.uuid' => ['nullable', 'uuid'],
            'options.*.name' => ['required', 'string', 'max:255'],
            'options.*.description' => ['nullable', 'string'],
            'options.*.price_delta_minor' => ['required', 'integer', 'min:0'],
            'options.*.is_default' => ['sometimes', 'boolean'],
            'options.*.is_active' => ['sometimes', 'boolean'],
            'options.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $selectionType = $this->input('selection_type');
            $minSelected = (int) ($this->input('min_selected') ?? 0);
            $maxSelected = $this->input('max_selected');
            /** @var array<int, array<string, mixed>> $options */
            $options = $this->input('options', []);

            $defaultCount = collect($options)
                ->filter(fn (array $option) => (bool) ($option['is_default'] ?? false))
                ->count();

            if ($selectionType === 'single' && ! is_null($maxSelected) && (int) $maxSelected > 1) {
                $validator->errors()->add('max_selected', 'Single-select groups can only allow one option.');
            }

            if ($selectionType === 'single' && $minSelected > 1) {
                $validator->errors()->add('min_selected', 'Single-select groups can require at most one option.');
            }

            if (! is_null($maxSelected) && (int) $maxSelected < $minSelected) {
                $validator->errors()->add('max_selected', 'The maximum selected count must be greater than or equal to the minimum.');
            }

            if ($selectionType === 'single' && $defaultCount > 1) {
                $validator->errors()->add('options', 'Single-select groups can only mark one option as default.');
            }

            if (! is_null($maxSelected) && $defaultCount > (int) $maxSelected) {
                $validator->errors()->add('options', 'Default options cannot exceed the maximum selected count.');
            }
        });
    }
}
