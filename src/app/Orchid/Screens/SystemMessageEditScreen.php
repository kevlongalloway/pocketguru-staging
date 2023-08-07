<?php

namespace App\Orchid\Screens;

use App\Models\SystemMessage;
use App\Orchid\Layouts\SystemMessageEditLayout;
use Illuminate\Http\Request;
use Orchid\Screen\Actions\Button;
use Orchid\Screen\Screen;
use Orchid\Support\Color;
use Orchid\Support\Facades\Layout;
use Orchid\Support\Facades\Toast;

class SystemMessageEditScreen extends Screen {

	public $systemMessage;

	/**
	 * Fetch data to be displayed on the screen.
	 *
	 * @return array
	 */
	public function query($system_message = null): iterable {
		$systemMessage = SystemMessage::find($system_message);
		return [
			'systemMessage' => $systemMessage,
		];
	}

	/**
	 * The name of the screen displayed in the header.
	 *
	 * @return string|null
	 */
	public function name(): ?string {
		return 'Edit System Message';
	}

	/**
	 * Button commands.
	 *
	 * @return Link[]
	 */
	public function commandBar(): array
	{
		return [
			Button::make('Remove')
				->icon('trash')
				->method('remove')
				->canSee($this->systemMessage ? $this->systemMessage->exists() : false),

		];
	}

	/**
	 * @param \Illuminate\Http\Request $request
	 *
	 * @return \Illuminate\Http\RedirectResponse
	 */
	public function createOrUpdate(Request $request) {
		$this->post->fill($request->get('post'))->save();

		Alert::info('You have successfully created a post.');

		return redirect()->route('platform.post.list');
	}

	/**
	 * The screen's layout elements.
	 *
	 * @return \Orchid\Screen\Layout[]|string[]
	 */
	public function layout(): iterable {
		return [
			Layout::block(SystemMessageEditLayout::class)
				->title(__('System Message Data'))
				->description(__('Update your account\'s profile information and email address.'))
				->commands(
					Button::make(__('Save'))
						->type(Color::BASIC)
						->icon('bs.check-circle')
						->method('save')
				),
		];
	}

	public function save(Request $request) {
		$systemMessage = $this->systemMessage ?? new SystemMessage();
		$request->validate([
			'service_id' => 'required',
			'content' => 'required',
		]);

		$systemMessage
			->fill($request->only(['content', 'service_id']))
			->save();

		Toast::info(__('System message was saved.'));

		return redirect()->route('platform.system-messages');
	}

}
