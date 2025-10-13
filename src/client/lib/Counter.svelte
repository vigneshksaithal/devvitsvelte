<script lang="ts">
import { onMount } from 'svelte'

let count: number = $state(0)
let message: string = $state('')

const increment = () => {
	count += 1
}

onMount(async () => {
	const res = await fetch('/api/test', { method: 'GET' })
	const data = await res.json()
	console.log(data)
	message = data
})
</script>

Message: {message}
<button class="bg-blue-500 text-white p-2 rounded-md" onclick={increment}>
	count is {count}
</button>
