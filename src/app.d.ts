// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}

		// custom title and description properties
		interface PageData {
			title: string;
			description: string;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
