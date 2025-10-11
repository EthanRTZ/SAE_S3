<template>
  <div class="information">
    <h1>Information</h1>
  </div>
</template>

<script>
export default {
  name: 'InformationView'
}
</script>

<style scoped>
.information {
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
}

.information h1 {
  color: #FCDC1E;
  font-size: 3rem;
}
</style>
