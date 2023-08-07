<?php

namespace App\Orchid\Layouts;

use App\Models\Service;
use App\Models\SystemMessage;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Actions\DropDown;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Layouts\Table;
use Orchid\Screen\TD;

class SystemMessageListLayout extends Table {
	/**
	 * Data source.
	 *
	 * The name of the key to fetch it from the query.
	 * The results of which will be elements of the table.
	 *
	 * @var string
	 */
	protected $target = 'system_messages';

	/**
	 * Get the table cells to be displayed.
	 *
	 * @return TD[]
	 */
	protected function columns(): iterable {
		return [
			TD::make('id', 'ID')
				->render(function ($item) {
					return $item->getAttribute('id');
				}),
			TD::make('content', 'Content')->width('70%'),
			TD::make('service_id', 'Service')
				->render(function ($item) {
					$service = Service::find($item->service_id);
					return $service ? $service->name : 'Unknown Service';
				}),
			TD::make(__('Actions'))
				->align(TD::ALIGN_CENTER)
				->width('100px')
				->render(fn(SystemMessage $systemMessage) => DropDown::make()
						->icon('bs.three-dots-vertical')
						->list([
							Button::make(__('View'))
								->method('view', [
									'id' => $systemMessage->id,
								])
								->icon('bs.pencil'),
							Link::make(__('Edit'))
								->route('platform.systems.system-message.edit', $systemMessage->id)
								->icon('bs.pencil'),

							Button::make(__('Delete'))
								->icon('bs.trash3')
								->confirm(__('Once the account is deleted, all of its resources and data will be permanently deleted. Before deleting your account, please download any data or information that you wish to retain.'))
								->method('remove', [
									'id' => $systemMessage->id,
								]),
						])),
		];
	}
}
