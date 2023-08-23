{{-- This file is used for menu items by any Backpack v6 theme --}}
<li class="nav-item"><a class="nav-link" href="{{ backpack_url('dashboard') }}"><i class="las la-home nav-icon"></i> {{ trans('backpack::base.dashboard') }}</a></li>

<x-backpack::menu-dropdown title="Resources" icon="las la-group">
	<x-backpack::menu-dropdown-item title="Users" icon="las la-users" :link="backpack_url('user')" />
	<x-backpack::menu-dropdown-item title="System messages" icon="las la-envelope" :link="backpack_url('system-message')" />
	<x-backpack::menu-dropdown-item title="User Questions" icon="las la-question-circle" :link="backpack_url('question')" />
	<x-backpack::menu-dropdown-item title="Options" icon="las la-cog" :link="backpack_url('option')" />
	<x-backpack::menu-dropdown-item title="Services" icon="las la-wrench" :link="backpack_url('service')" />
	<x-backpack::menu-dropdown-item title="Subscription tiers" icon="las la-layer-group" :link="backpack_url('subscription-tier')" />
	{{-- <x-backpack::menu-dropdown-item title="Answers" icon="las la-question-circle" :link="backpack_url('answer')" /> --}}

	<x-backpack::menu-dropdown-item title="Preferences" icon="las la-sliders-h" :link="backpack_url('preference')" />
</x-backpack::menu-dropdown>
