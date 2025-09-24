<script lang="ts">
let count: number = $state(0)
const increment = () => {
	count += 1
}
</script>

<button class="bg-blue-500 text-white p-2 rounded-md" onclick={increment}>
  count is {count}
</button>
