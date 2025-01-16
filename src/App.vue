<template>
  <div>
    <router-view :key="$route.fullPath" />
  </div>
</template>

<script lang="ts">
export default {
  name: 'App',
}
</script>
