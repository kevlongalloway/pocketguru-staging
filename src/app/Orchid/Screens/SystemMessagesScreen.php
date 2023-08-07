<?php

namespace App\Orchid\Screens;

use App\Models\SystemMessage;
use App\Orchid\Layouts\SystemMessageListLayout;
use Illuminate\Http\Request;
use Orchid\Screen\Actions\Link;
use Orchid\Screen\Screen;
use Orchid\Support\Facades\Layout;
use Orchid\Support\Facades\Toast;

class SystemMessagesScreen extends Screen {
	/**
	 * Display header name.
	 *
	 * @var string
	 */
	public $name = 'System Messages';

	/**
	 * Display header description.
	 *
	 * @var string
	 */
	public $description = 'Manage system messages';

	/**
	 * Query data.
	 *
	 * @return array
	 */
	public function query(): array
	{
		return [
			'system_messages' => SystemMessage::all(),
		];
	}

	/**
	 * The screen's action buttons.
	 *
	 * @return \Orchid\Screen\Action[]
	 */
	public function commandBar(): iterable {
		return [
			Link::make(__('Add'))
				->icon('bs.plus-circle')
				->route('platform.systems.system-message.create'),
		];
	}

/**
 * Set up the layout.
 *
 * @return array
 */
	public function layout(): array
	{
		return [
			SystemMessageListLayout::class,
		];
	}

	public function remove(Request $request): void {
		SystemMessage::findOrFail($request->get('id'))->delete();

		Toast::info(__('System Message was removed'));
	}

}
