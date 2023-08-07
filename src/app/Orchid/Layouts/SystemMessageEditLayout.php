<?php

namespace App\Orchid\Layouts;

use App\Models\Service;
use Orchid\Screen\Field;
use Orchid\Screen\Fields\Select;
use Orchid\Screen\Fields\TextArea;
use Orchid\Screen\Layouts\Rows;

class SystemMessageEditLayout extends Rows {
	/**
	 * Used to create the title of a group of form elements.
	 *
	 * @var string|null
	 */
	protected $title;

	/**
	 * Get the fields elements to be displayed.
	 *
	 * @return Field[]
	 */
	protected function fields(): iterable {
		$options = [];
		foreach (Service::all() as $service) {
			$options[$service->id] = $service->name;
		}

		return [
			TextArea::make('content')
				->title('Content')
				->rows(5),
			Select::make('service_id')
				->options($options)
				->title('Select service'),
		];
	}

}
