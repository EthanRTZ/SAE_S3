<template>
  <div class="carte">
    <h1>Carte</h1>
  </div>
</template>

<script>
export default {
  name: 'CarteView'
}
</script>

<style scoped>
.carte {
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
}

.carte h1 {
  color: #FCDC1E;
  font-size: 3rem;
}
</style>
