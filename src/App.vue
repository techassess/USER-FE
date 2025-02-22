<template>
  <Header v-if="!$route.meta.hideHeader" />
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import Header from "@/layouts/header.vue";
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100vh;
}
</style>
