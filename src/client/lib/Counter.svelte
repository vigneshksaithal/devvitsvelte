<script lang="ts">
let count: number = $state(0)

const increment = () => {
  count += 1
}
</script>

<p class="text-sm text-gray-500">Click the button to increment the counter.</p>
<button class="mt-2 bg-blue-500 text-white px-3 py-2 rounded-md" onclick={increment}>
	Count: {count}
</button>
