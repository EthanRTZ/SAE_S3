<template>
  <div class="carte">
    <h1>Carte</h1>
    <!-- Ajout de l'iframe Google Maps -->
    <iframe
      src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d2000!2d4.953846420901062!3d47.300545020206954!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sfr!2sfr!4v1762257421238!5m2!1sfr!2sfr"
      width="1400"
      height="1700"
      style="border:0;"
      allowfullscreen=""
      loading="eager"
      referrerpolicy="no-referrer-when-downgrade"
    ></iframe>
  </div>
</template>

<script>
export default {
  name: 'CarteView',
};
</script>

<style scoped>
.carte {
  min-height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background-color: white;
}

.carte h1 {
  color: #FCDC1E;
  font-size: 3rem;
  margin-bottom: 20px;
}

/* Ajout d'un style pour centrer l'iframe */
iframe {
  max-width: 100%;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}
</style>
