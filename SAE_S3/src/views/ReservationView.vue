<template>
  <div class="reservation">
    <h1>Réservation</h1>
  </div>
</template>

<script>
export default {
  name: 'ReservationView'
}
</script>

<style scoped>
.reservation {
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
}

.reservation h1 {
  color: #FCDC1E;
  font-size: 3rem;
}
</style>
